'use strict';

const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// =====================================================
// HELPER: MEMERIKSA HAK AKSES ADMIN
// =====================================================
function requireAdmin(req, res) {
    if (!req.session || !req.session.userId) {
        res.status(401).json({
            status: 'error',
            message: 'Silakan login terlebih dahulu.'
        });
        return false;
    }

    if (req.session.role !== 'admin') {
        res.status(403).json({
            status: 'error',
            message: 'Akses ditolak. Halaman ini hanya untuk admin.'
        });
        return false;
    }

    return true;
}

function isValidId(id) {
    return Number.isSafeInteger(Number(id)) && Number(id) > 0;
}

function getUploadedImageUrl(req) {
    if (Array.isArray(req.files) && req.files.length > 0) {
        const filePaths = req.files.map(file => `images/${file.filename}`);
        return JSON.stringify(filePaths);
    }

    if (req.file && req.file.filename) {
        return `images/${req.file.filename}`;
    }

    return null;
}

async function cleanupUploadedFiles(req) {
    const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
    await Promise.all(files.map(file => file.path ? fs.promises.unlink(file.path).catch(() => {}) : Promise.resolve()));
}

// =====================================================
// 1. AMBIL PROFIL ADMIN YANG SEDANG LOGIN
// =====================================================
exports.getAdminProfile = async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const userId = req.session.userId;

    try {
        const [rows] = await db.query(
            `SELECT
                id_user,
                nama_lengkap,
                email,
                no_telp,
                alamat,
                created_at
             FROM users
             WHERE id_user = ? AND role = ?
             LIMIT 1`,
            [userId, 'admin']
        );

        if (rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Profil admin tidak ditemukan.'
            });
        }

        return res.json({
            status: 'success',
            data: rows[0]
        });
    } catch (error) {
        console.error('Error getAdminProfile:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Kesalahan saat mengambil profil admin.'
        });
    }
};

// =====================================================
// 2. PERBARUI PROFIL ADMIN
// =====================================================
exports.updateAdminProfile = async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const userId = req.session.userId;
    const { nama_lengkap, email, no_telp, alamat } = req.body || {};
    const emailNormalized = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (
        typeof nama_lengkap !== 'string' ||
        !nama_lengkap.trim() ||
        typeof email !== 'string' ||
        !emailNormalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized)
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Nama lengkap dan email wajib diisi.'
        });
    }

    try {
        const [result] = await db.query(
            `UPDATE users
             SET nama_lengkap = ?,
                 email = ?,
                 no_telp = ?,
                 alamat = ?
             WHERE id_user = ? AND role = ?`,
            [
                nama_lengkap.trim(),
                emailNormalized,
                typeof no_telp === 'string' && no_telp.trim() ? no_telp.trim() : null,
                typeof alamat === 'string' && alamat.trim() ? alamat.trim() : null,
                userId,
                'admin'
            ]
        );

        if (result.affectedRows === 0) {
            const [rows] = await db.query(
                `SELECT id_user FROM users WHERE id_user = ? AND role = ? LIMIT 1`,
                [userId, 'admin']
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Profil admin tidak ditemukan.'
                });
            }
        }

        req.session.nama = nama_lengkap.trim();

        return res.json({
            status: 'success',
            message: 'Profil admin berhasil diperbarui.'
        });
    } catch (error) {
        console.error('Error updateAdminProfile:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                status: 'error',
                message: 'Email sudah digunakan oleh akun lain.'
            });
        }
        return res.status(500).json({
            status: 'error',
            message: 'Gagal memperbarui profil admin.'
        });
    }
};

// =====================================================
// 3. TAMBAH PRODUK BARU DENGAN DUKUNGAN MULTI-GAMBAR
// =====================================================
exports.createProduct = async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const {
        nama_produk,
        deskripsi,
        bahan,
        harga_estimasi,
        berat
    } = req.body || {};

    if (typeof nama_produk !== 'string' || !nama_produk.trim()) {
        await cleanupUploadedFiles(req);
        return res.status(400).json({
            status: 'error',
            message: 'Nama produk wajib diisi.'
        });
    }

    const harga = Number(harga_estimasi ?? 0);

    const beratProduk = berat === undefined || berat === '' ? 1000 : Number(berat);
    if (!Number.isSafeInteger(beratProduk) || beratProduk < 1 || beratProduk > 100000) {
        await cleanupUploadedFiles(req);
        return res.status(400).json({ status: 'error', message: 'Berat produk harus bilangan bulat 1–100.000 gram.' });
    }

    if (!Number.isFinite(harga) || harga < 0) {
        await cleanupUploadedFiles(req);
        return res.status(400).json({
            status: 'error',
            message: 'Harga estimasi harus berupa angka nol atau lebih.'
        });
    }

    const gambarUrl = getUploadedImageUrl(req);

    try {
        const [result] = await db.query(
            `INSERT INTO produk
                (
                    nama_produk,
                    deskripsi,
                    bahan,
                    harga_estimasi,
                    gambar_url,
                    berat
                )
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                nama_produk.trim(),
                deskripsi || null,
                bahan || null,
                harga,
                gambarUrl,
                beratProduk
            ]
        );

        const newProductId = result.insertId;

        try {
            await db.query(
                `INSERT INTO notifikasi (id_user, pesan, tipe, link_tab, target_id, is_read)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [req.session.userId, `Produk baru "${nama_produk.trim()}" telah ditambahkan.`, 'success', 'produk', newProductId, 0]
            );
        } catch (notificationError) {
            console.error('Produk tersimpan, tetapi notifikasi gagal dibuat:', notificationError.message);
        }

        return res.status(201).json({
            status: 'success',
            message: 'Produk berhasil ditambahkan.',
            id_produk: newProductId
        });
    } catch (error) {
        await cleanupUploadedFiles(req);
        console.error('Error createProduct:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Gagal menambahkan produk ke database.'
        });
    }
};

// =====================================================
// 4. PERBARUI PRODUK TERMASUK GAMBAR (DENGAN PENGHAPUSAN GAMBAR LAMA)
// =====================================================
exports.updateProduct = async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const { id } = req.params;
    const {
        nama_produk,
        deskripsi,
        bahan,
        harga_estimasi,
        berat
    } = req.body || {};

    if (!isValidId(id)) {
        await cleanupUploadedFiles(req);
        return res.status(400).json({
            status: 'error',
            message: 'ID produk tidak valid.'
        });
    }

    if (typeof nama_produk !== 'string' || !nama_produk.trim()) {
        await cleanupUploadedFiles(req);
        return res.status(400).json({
            status: 'error',
            message: 'Nama produk wajib diisi.'
        });
    }

    const harga = Number(harga_estimasi);

    const beratProduk = berat === undefined || berat === '' ? 1000 : Number(berat);
    if (!Number.isSafeInteger(beratProduk) || beratProduk < 1 || beratProduk > 100000) {
        await cleanupUploadedFiles(req);
        return res.status(400).json({ status: 'error', message: 'Berat produk harus bilangan bulat 1–100.000 gram.' });
    }

    if (harga_estimasi === undefined || harga_estimasi === '' || !Number.isFinite(harga) || harga < 0) {
        await cleanupUploadedFiles(req);
        return res.status(400).json({
            status: 'error',
            message: 'Harga estimasi harus berupa angka nol atau lebih.'
        });
    }

    try {
        const [existingRows] = await db.query(
            `SELECT id_produk, gambar_url
             FROM produk
             WHERE id_produk = ?
             LIMIT 1`,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            await cleanupUploadedFiles(req);
            return res.status(404).json({
                status: 'error',
                message: 'Produk tidak ditemukan.'
            });
        }

        const produkLama = existingRows[0];
        let gambarUrl = produkLama.gambar_url;
        const uploadedImageUrl = getUploadedImageUrl(req);

        let oldImagePaths = [];
        if (uploadedImageUrl !== null) {
            if (gambarUrl) {
                try {
                    const parsed = gambarUrl.startsWith('[') ? JSON.parse(gambarUrl) : [gambarUrl];
                    if (Array.isArray(parsed)) oldImagePaths = parsed.filter(item => typeof item === 'string');
                } catch (parseError) {
                    console.error('Format gambar lama tidak valid; file lama tidak dihapus:', parseError.message);
                }
            }
            gambarUrl = uploadedImageUrl;
        }

        const [result] = await db.query(
            `UPDATE produk
             SET nama_produk = ?,
                 deskripsi = ?,
                 bahan = ?,
                 harga_estimasi = ?,
                 gambar_url = ?,
                 berat = ?
             WHERE id_produk = ?`,
            [
                nama_produk.trim(),
                deskripsi || null,
                bahan || null,
                harga,
                gambarUrl,
                beratProduk,
                Number(id)
            ]
        );

        if (uploadedImageUrl !== null) {
            const imageRoot = path.resolve(__dirname, '../../front-end/images');
            for (const oldPath of oldImagePaths) {
                const filename = path.basename(oldPath);
                const safePath = path.resolve(imageRoot, filename);
                if (safePath.startsWith(imageRoot + path.sep)) {
                    try {
                        await fs.promises.unlink(safePath);
                    } catch (unlinkError) {
                        if (unlinkError.code !== 'ENOENT') {
                            console.error('Gagal membersihkan gambar lama:', unlinkError.message);
                        }
                    }
                }
            }
        }

        try {
            await db.query(
                `INSERT INTO notifikasi (id_user, pesan, tipe, link_tab, target_id, is_read)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [req.session.userId, `Produk "${nama_produk.trim()}" telah diperbarui.`, 'success', 'produk', Number(id), 0]
            );
        } catch (notificationError) {
            console.error('Produk diperbarui, tetapi notifikasi gagal dibuat:', notificationError.message);
        }

        return res.json({
            status: 'success',
            message: 'Produk berhasil diperbarui.',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        await cleanupUploadedFiles(req);
        console.error('Error updateProduct:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Gagal memperbarui produk.'
        });
    }
};

// =====================================================
// 5. HAPUS PRODUK (DENGAN PENGHAPUSAN FILE GAMBAR FISIK)
// =====================================================
exports.deleteProduct = async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({
            status: 'error',
            message: 'ID produk tidak valid.'
        });
    }

    try {
        const [prodRows] = await db.query(
            'SELECT nama_produk, gambar_url FROM produk WHERE id_produk = ? LIMIT 1',
            [Number(id)]
        );

        if (prodRows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Produk tidak ditemukan.'
            });
        }

        const produk = prodRows[0];
        const namaProdukHapus = produk.nama_produk || `ID: ${id}`;
        const gambarUrl = produk.gambar_url;

        const [result] = await db.query(
            'DELETE FROM produk WHERE id_produk = ?',
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Produk tidak ditemukan.'
            });
        }

        if (gambarUrl) {
            try {
                let fileNames = [];
                if (gambarUrl.startsWith('[') && gambarUrl.endsWith(']')) {
                    fileNames = JSON.parse(gambarUrl);
                } else {
                    fileNames = [gambarUrl];
                }

                fileNames.forEach(item => {
                    const filename = path.basename(item);
                    const filePath = path.join(__dirname, '../../front-end/images', filename);

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log('File gambar fisik berhasil dihapus:', filePath);
                    }
                });
            } catch (err) {
                console.error('Gagal menghapus file gambar fisik:', err);
            }
        }

        try {
            await db.query(
                `INSERT INTO notifikasi (id_user, pesan, tipe, link_tab, target_id, is_read)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [req.session.userId, `Produk "${namaProdukHapus}" telah dihapus.`, 'info', 'produk', Number(id), 0]
            );
        } catch (notificationError) {
            console.error('Produk terhapus, tetapi notifikasi gagal dibuat:', notificationError.message);
        }

        return res.json({
            status: 'success',
            message: 'Produk dan file gambar berhasil dihapus.'
        });
    } catch (error) {
        console.error('Error deleteProduct:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(409).json({
                status: 'error',
                message: 'Produk tidak dapat dihapus karena masih terhubung dengan data pesanan.'
            });
        }
        return res.status(500).json({
            status: 'error',
            message: 'Gagal menghapus produk.'
        });
    }
};

// =====================================================
// 6. AMBIL SEMUA PESANAN UNTUK DASHBOARD ADMIN
// =====================================================
exports.getAllOrders = async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const query = `
        SELECT
            p.*,
            u.nama_lengkap AS nama_pelanggan,
            u.email AS email_pelanggan,
            pr.nama_produk,
            pr.harga_estimasi
        FROM pesanan AS p
        INNER JOIN users AS u
            ON p.id_user = u.id_user
        INNER JOIN produk AS pr
            ON p.id_produk = pr.id_produk
        ORDER BY p.tanggal_pesan DESC
    `;

    try {
        const [rows] = await db.query(query);
        return res.json({
            status: 'success',
            data: rows
        });
    } catch (error) {
        console.error('Error getAllOrders:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Gagal memuat daftar pesanan.'
        });
    }
};

// =====================================================
// 8. AMBIL SEMUA DATA PELANGGAN
// =====================================================
exports.getAllCustomers = async (req, res) => {
    if (!requireAdmin(req, res)) return;

    try {
        const [rows] = await db.query(
            `SELECT
                id_user,
                nama_lengkap,
                email,
                no_telp,
                alamat,
                created_at
             FROM users
             WHERE role = ?
             ORDER BY created_at DESC`,
            ['pelanggan']
        );

        return res.json({
            status: 'success',
            data: rows
        });
    } catch (error) {
        console.error('Error getAllCustomers:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan saat mengambil data pelanggan.'
        });
    }
};