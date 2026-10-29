const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
        return res.status(400).json({ status: 'error', message: 'Email dan password wajib diisi.' });
    }

    try {
        const [users] = await db.query(
            'SELECT id_user, nama_lengkap, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
            [email.trim()]
        );

        if (users.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Email atau password salah.' });
        }

        const user = users[0];
        
        let passwordValid = false;
        if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
            passwordValid = await bcrypt.compare(password, user.password_hash);
        } else {
            passwordValid = (password === user.password_hash);
        }

        if (!passwordValid) {
            return res.status(401).json({ status: 'error', message: 'Email atau password salah.' });
        }

        req.session.regenerate((regenerateError) => {
            if (regenerateError) {
                console.error('Gagal memperbarui sesi:', regenerateError);
                return res.status(500).json({ status: 'error', message: 'Gagal membuat sesi login.' });
            }

            req.session.userId = user.id_user;
            req.session.role = user.role;
            req.session.nama = user.nama_lengkap;

            req.session.save((saveError) => {
                if (saveError) {
                    console.error('Gagal menyimpan sesi:', saveError);
                    return res.status(500).json({ status: 'error', message: 'Gagal menyimpan sesi di server.' });
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
        return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server.' });
    }
};

exports.register = async (req, res) => {
    // Menambahkan 'alamat' dari req.body
    const { nama_lengkap, email, no_telp, alamat, password } = req.body || {};

    if (!nama_lengkap || !email || !password) {
        return res.status(400).json({ status: 'error', message: 'Nama lengkap, email, dan password wajib diisi.' });
    }

    try {
        const [existing] = await db.query('SELECT id_user FROM users WHERE email = ? LIMIT 1', [email.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar. Silakan gunakan email lain.' });
        }

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        const role = 'pelanggan';

        // Menyimpan alamat ke dalam database
        await db.query(
            'INSERT INTO users (nama_lengkap, email, no_telp, alamat, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
            [
                nama_lengkap.trim(), 
                email.trim(), 
                no_telp ? no_telp.trim() : null, 
                alamat ? alamat.trim() : null, 
                password_hash, 
                role
            ]
        );

        return res.json({ status: 'success', message: 'Pendaftaran berhasil! Silakan masuk.' });
    } catch (error) {
        console.error('Gagal registrasi:', error);
        return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server.' });
    }
};

exports.checkSession = (req, res) => {
    if (req.session && req.session.userId) {
        return res.json({ status: 'success', data: { nama: req.session.nama, role: req.session.role } });
    }
    return res.status(401).json({ status: 'error', message: 'Sesi tidak ditemukan atau sudah berakhir.' });
};

exports.logout = (req, res) => {
    if (!req.session) {
        res.clearCookie('japa_session_cookie');
        return res.json({ status: 'success', message: 'Berhasil logout' });
    }

    req.session.destroy((err) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Gagal logout' });
        res.clearCookie('japa_session_cookie');
        return res.json({ status: 'success', message: 'Berhasil logout' });
    });
};

exports.getProfile = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    }

    try {
        const [users] = await db.query(
            'SELECT id_user, nama_lengkap, email, no_telp, alamat, role, created_at FROM users WHERE id_user = ? LIMIT 1',
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan.' });
        }

        res.json({ status: 'success', data: users[0] });
    } catch (error) {
        console.error('Gagal mengambil profil:', error);
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server.' });
    }
};

exports.updateProfile = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    }

    const { nama_lengkap, no_telp, alamat, password_baru } = req.body || {};

    if (!nama_lengkap) {
        return res.status(400).json({ status: 'error', message: 'Nama lengkap wajib diisi.' });
    }

    try {
        let query = 'UPDATE users SET nama_lengkap = ?, no_telp = ?, alamat = ?';
        let params = [
            nama_lengkap.trim(), 
            no_telp ? no_telp.trim() : null, 
            alamat ? alamat.trim() : null
        ];

        if (password_baru && password_baru.trim() !== '') {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password_baru, saltRounds);
            query += ', password_hash = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id_user = ?';
        params.push(req.session.userId);

        await db.query(query, params);
        req.session.nama = nama_lengkap.trim();

        res.json({ status: 'success', message: 'Profil dan alamat berhasil diperbarui!' });
    } catch (error) {
        console.error('Gagal memperbarui profil:', error);
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server.' });
    }
};

// ==========================================
// ENDPOINT NOTIFIKASI PELANGGAN
// ==========================================
exports.getCustomerNotifications = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    }

    const id_user = req.session.userId;

    try {
        const [rows] = await db.query(
            'SELECT * FROM notifikasi WHERE id_user = ? ORDER BY tanggal DESC',
            [id_user]
        );
        res.json({ status: 'success', data: rows });
    } catch (error) {
        console.error('Gagal mengambil notifikasi:', error);
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server.' });
    }
};

exports.markNotificationsAsRead = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    }

    const id_user = req.session.userId;

    try {
        await db.query('UPDATE notifikasi SET is_read = 1 WHERE id_user = ?', [id_user]);
        res.json({ status: 'success', message: 'Semua notifikasi ditandai sudah dibaca.' });
    } catch (error) {
        console.error('Gagal memperbarui status notifikasi:', error);
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server.' });
    }
};

exports.markSingleNotificationAsRead = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    }

    const { id } = req.params;
    const id_user = req.session.userId;

    try {
        await db.query(
            'UPDATE notifikasi SET is_read = 1 WHERE id_notifikasi = ? AND id_user = ?', 
            [id, id_user]
        );
        res.json({ status: 'success', message: 'Notifikasi ditandai sudah dibaca.' });
    } catch (error) {
        console.error('Gagal memperbarui notifikasi:', error);
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server.' });
    }
};