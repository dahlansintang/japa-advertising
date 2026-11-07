
const db = require('../config/db');
const bcrypt = require('bcrypt');
const { isStrongPassword } = require('../middleware/security');

const {
    recordFailedLogin,
    resetLoginAttempts
} = require('../middleware/security');


// =====================================================
// HELPER VALIDASI
// =====================================================

const isNonEmptyString = (value) => {
    return typeof value === 'string' && value.trim().length > 0;
};

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};


// =====================================================
// LOGIN
// =====================================================

exports.login = async (req, res) => {
    const { email, password } = req.body || {};

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
        return res.status(400).json({
            status: 'error',
            message: 'Email dan password wajib diisi.'
        });
    }

    const emailNormalized = email.trim().toLowerCase();

    try {
        const [users] = await db.query(
            `SELECT
                id_user,
                nama_lengkap,
                email,
                password_hash,
                role
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [emailNormalized]
        );

        if (users.length === 0) {
            recordFailedLogin(req);

            return res.status(401).json({
                status: 'error',
                message: 'Email atau password salah.'
            });
        }

        const user = users[0];

        if (
            typeof user.password_hash !== 'string' ||
            !user.password_hash
        ) {
            recordFailedLogin(req);

            return res.status(401).json({
                status: 'error',
                message: 'Email atau password salah.'
            });
        }

        let passwordValid = false;

        const isBcryptHash = /^\$2[aby]\$/.test(user.password_hash);

        if (isBcryptHash) {
            passwordValid = await bcrypt.compare(
                password,
                user.password_hash
            );
        } else {
            
            passwordValid = password === user.password_hash;

            if (passwordValid) {
                const newHash = await bcrypt.hash(password, 10);

                await db.query(
                    'UPDATE users SET password_hash = ? WHERE id_user = ?',
                    [newHash, user.id_user]
                );
            }
        }

        if (!passwordValid) {
            recordFailedLogin(req);

            return res.status(401).json({
                status: 'error',
                message: 'Email atau password salah.'
            });
        }

        resetLoginAttempts(req);

        req.session.regenerate((regenerateError) => {
            if (regenerateError) {
                console.error(
                    'Gagal memperbarui sesi:',
                    regenerateError
                );

                return res.status(500).json({
                    status: 'error',
                    message: 'Gagal membuat sesi login.'
                });
            }

            req.session.userId = user.id_user;
            req.session.role = user.role;
            req.session.nama = user.nama_lengkap;

            req.session.save((saveError) => {
                if (saveError) {
                    console.error(
                        'Gagal menyimpan sesi:',
                        saveError
                    );

                    return res.status(500).json({
                        status: 'error',
                        message: 'Gagal menyimpan sesi di server.'
                    });
                }

                return res.json({
                    status: 'success',
                    message: 'Login berhasil!',
                    role: user.role
                });
            });
        });

    } catch (error) {
        console.error('Login gagal:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server.'
        });
    }
};


// =====================================================
// REGISTER
// =====================================================

exports.register = async (req, res) => {
    const {
        nama_lengkap,
        email,
        no_telp,
        alamat,
        password
    } = req.body || {};

    if (
        !isNonEmptyString(nama_lengkap) ||
        !isNonEmptyString(email) ||
        !isNonEmptyString(password)
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Nama lengkap, email, dan password wajib diisi.'
        });
    }

    const nama = nama_lengkap.trim();
    const emailNormalized = email.trim().toLowerCase();

    if (!isValidEmail(emailNormalized)) {
        return res.status(400).json({
            status: 'error',
            message: 'Format email tidak valid.'
        });
    }

    if (!isStrongPassword(password)) {
        return res.status(400).json({
            status: 'error',
            message: 'Password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, angka, serta karakter spesial.'
        });
    }

    if (
        no_telp !== undefined &&
        no_telp !== null &&
        typeof no_telp !== 'string'
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Format nomor telepon tidak valid.'
        });
    }

    if (
        alamat !== undefined &&
        alamat !== null &&
        typeof alamat !== 'string'
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Format alamat tidak valid.'
        });
    }

    try {
        const [existing] = await db.query(
            'SELECT id_user FROM users WHERE email = ? LIMIT 1',
            [emailNormalized]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                status: 'error',
                message: 'Email sudah terdaftar. Silakan gunakan email lain.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const role = 'pelanggan';

        await db.query(
            `INSERT INTO users
                (nama_lengkap, email, no_telp, alamat, password_hash, role)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                nama,
                emailNormalized,
                no_telp ? no_telp.trim() : null,
                alamat ? alamat.trim() : null,
                passwordHash,
                role
            ]
        );

        return res.status(201).json({
            status: 'success',
            message: 'Pendaftaran berhasil! Silakan masuk.'
        });

    } catch (error) {
        console.error('Gagal registrasi:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                status: 'error',
                message: 'Email sudah terdaftar.'
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server.'
        });
    }
};


// =====================================================
// CHECK SESSION
// =====================================================

exports.checkSession = (req, res) => {
    if (req.session && req.session.userId) {
        return res.json({
            status: 'success',
            data: {
                nama: req.session.nama,
                role: req.session.role
            }
        });
    }

    return res.status(401).json({
        status: 'error',
        message: 'Sesi tidak ditemukan atau sudah berakhir.'
    });
};


// =====================================================
// LOGOUT
// =====================================================

exports.logout = (req, res) => {
    if (!req.session) {
        res.clearCookie('japa_session_cookie');

        return res.json({
            status: 'success',
            message: 'Berhasil logout.'
        });
    }

    req.session.destroy((error) => {
        if (error) {
            console.error('Gagal logout:', error);

            return res.status(500).json({
                status: 'error',
                message: 'Gagal logout.'
            });
        }

        res.clearCookie('japa_session_cookie');

        return res.json({
            status: 'success',
            message: 'Berhasil logout.'
        });
    });
};


// =====================================================
// GET PROFILE
// =====================================================

exports.getProfile = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Silakan login terlebih dahulu.'
        });
    }

    try {
        const [users] = await db.query(
            `SELECT
                id_user,
                nama_lengkap,
                email,
                no_telp,
                alamat,
                role,
                created_at
             FROM users
             WHERE id_user = ?
             LIMIT 1`,
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Pengguna tidak ditemukan.'
            });
        }

        return res.json({
            status: 'success',
            data: users[0]
        });

    } catch (error) {
        console.error('Gagal mengambil profil:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server.'
        });
    }
};


// =====================================================
// UPDATE PROFILE
// =====================================================

exports.updateProfile = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Silakan login terlebih dahulu.'
        });
    }

    const {
        nama_lengkap,
        no_telp,
        alamat,
        password_lama,
        password_baru
    } = req.body || {};

    if (!isNonEmptyString(nama_lengkap)) {
        return res.status(400).json({
            status: 'error',
            message: 'Nama lengkap wajib diisi.'
        });
    }

    if (
        no_telp !== undefined &&
        no_telp !== null &&
        typeof no_telp !== 'string'
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Format nomor telepon tidak valid.'
        });
    }

    if (
        alamat !== undefined &&
        alamat !== null &&
        typeof alamat !== 'string'
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Format alamat tidak valid.'
        });
    }

    const inginGantiPassword =
        password_baru !== undefined &&
        password_baru !== null &&
        password_baru !== '';

    if (inginGantiPassword) {
        if (!isNonEmptyString(password_lama)) {
            return res.status(400).json({
                status: 'error',
                message: 'Password lama wajib diisi untuk mengganti password.'
            });
        }

        if (!isNonEmptyString(password_baru)) {
            return res.status(400).json({
                status: 'error',
                message: 'Password baru tidak valid.'
            });
        }

        if (!isStrongPassword(password_baru)) {
            return res.status(400).json({
                status: 'error',
                message: 'Password baru minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, angka, serta karakter spesial.'
            });
        }
    }

    try {
        const [users] = await db.query(
            `SELECT id_user, password_hash
             FROM users
             WHERE id_user = ?
             LIMIT 1`,
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Pengguna tidak ditemukan.'
            });
        }

        const user = users[0];

        let query = `
            UPDATE users
            SET nama_lengkap = ?, no_telp = ?, alamat = ?
        `;

        const params = [
            nama_lengkap.trim(),
            no_telp ? no_telp.trim() : null,
            alamat ? alamat.trim() : null
        ];

        if (inginGantiPassword) {
            const isBcryptHash =
                typeof user.password_hash === 'string' &&
                /^\$2[aby]\$/.test(user.password_hash);

            let oldPasswordValid = false;

            if (isBcryptHash) {
                oldPasswordValid = await bcrypt.compare(
                    password_lama,
                    user.password_hash
                );
            } else {

                oldPasswordValid =
                    password_lama === user.password_hash;
            }

            if (!oldPasswordValid) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Password lama tidak sesuai.'
                });
            }

            const newPasswordHash = await bcrypt.hash(
                password_baru,
                10
            );

            query += ', password_hash = ?';
            params.push(newPasswordHash);
        }

        query += ' WHERE id_user = ?';
        params.push(req.session.userId);

        await db.query(query, params);

        // Perbarui nama pada session aktif.
        req.session.nama = nama_lengkap.trim();

        req.session.save((saveError) => {
            if (saveError) {
                console.error(
                    'Gagal memperbarui session profil:',
                    saveError
                );

                return res.status(500).json({
                    status: 'error',
                    message: 'Profil diperbarui, tetapi sesi gagal disimpan.'
                });
            }

            return res.json({
                status: 'success',
                message: inginGantiPassword
                    ? 'Profil dan password berhasil diperbarui!'
                    : 'Profil dan alamat berhasil diperbarui!'
            });
        });

    } catch (error) {
        console.error('Gagal memperbarui profil:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server.'
        });
    }
};


// =====================================================
// GET NOTIFIKASI PELANGGAN
// =====================================================

exports.getCustomerNotifications = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Silakan login terlebih dahulu.'
        });
    }

    try {
        const [rows] = await db.query(
            `SELECT *
             FROM notifikasi
             WHERE id_user = ?
             ORDER BY tanggal DESC`,
            [req.session.userId]
        );

        return res.json({
            status: 'success',
            data: rows
        });

    } catch (error) {
        console.error('Gagal mengambil notifikasi:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server.'
        });
    }
};


// =====================================================
// MENANDAI SEMUA NOTIFIKASI SUDAH DIBACA
// =====================================================

exports.markNotificationsAsRead = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Silakan login terlebih dahulu.'
        });
    }

    try {
        await db.query(
            `UPDATE notifikasi
             SET is_read = 1
             WHERE id_user = ?`,
            [req.session.userId]
        );

        return res.json({
            status: 'success',
            message: 'Semua notifikasi ditandai sudah dibaca.'
        });

    } catch (error) {
        console.error('Gagal memperbarui status notifikasi:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server.'
        });
    }
};


// =====================================================
// MENANDAI SATU NOTIFIKASI SUDAH DIBACA
// =====================================================

exports.markSingleNotificationAsRead = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Silakan login terlebih dahulu.'
        });
    }

    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({
            status: 'error',
            message: 'ID notifikasi tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `UPDATE notifikasi
             SET is_read = 1
             WHERE id_notifikasi = ?
             AND id_user = ?`,
            [id, req.session.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Notifikasi tidak ditemukan.'
            });
        }

        return res.json({
            status: 'success',
            message: 'Notifikasi ditandai sudah dibaca.'
        });

    } catch (error) {
        console.error('Gagal memperbarui notifikasi:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server.'
        });
    }
};
