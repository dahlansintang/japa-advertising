const db = require('../config/db');

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

    if (
        typeof nama_lengkap !== 'string' ||
        !nama_lengkap.trim() ||
        typeof email !== 'string' ||
        !email.trim()
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
                email.trim(),
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
        return res.status(400).json({
            status: 'error',
            message: 'Nama produk wajib diisi.'
        });
    }

    const harga = Number(harga_estimasi ?? 0);
    
    // PERBAIKAN LOGIKA BERAT: Pastikan dikonversi ke angka yang valid
    let beratProduk = parseInt(berat, 10);
    if (isNaN(beratProduk) || beratProduk <= 0) {
        beratProduk = 1000; // Default 1Kg jika input tidak ada/tidak valid
    }

    if (!Number.isFinite(harga) || harga < 0) {
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

        return res.status(201).json({
            status: 'success',
            message: 'Produk berhasil ditambahkan.',
            id_produk: result.insertId
        });
    } catch (error) {
        console.error('Error createProduct:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Gagal menambahkan produk ke database.'
        });
    }
};

// =====================================================
// 4. PERBARUI PRODUK TERMASUK GAMBAR
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
        return res.status(400).json({
            status: 'error',
            message: 'ID produk tidak valid.'
        });
    }

    if (typeof nama_produk !== 'string' || !nama_produk.trim()) {
        return res.status(400).json({
            status: 'error',
            message: 'Nama produk wajib diisi.'
        });
    }

    const harga = Number(harga_estimasi);
    
    let beratProduk = parseInt(berat, 10);
    if (isNaN(beratProduk) || beratProduk <= 0) {
        beratProduk = 1000;
    }

    if (harga_estimasi === undefined || harga_estimasi === '' || !Number.isFinite(harga) || harga < 0) {
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
            return res.status(404).json({
                status: 'error',
                message: 'Produk tidak ditemukan.'
            });
        }

        let gambarUrl = existingRows[0].gambar_url;
        const uploadedImageUrl = getUploadedImageUrl(req);
        if (uploadedImageUrl !== null) {
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

        return res.json({
            status: 'success',
            message: 'Produk berhasil diperbarui.',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        console.error('Error updateProduct:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Gagal memperbarui produk.'
        });
    }
};

// =====================================================
// 5. HAPUS PRODUK
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

        return res.json({
            status: 'success',
            message: 'Produk berhasil dihapus.'
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
// 7. PERBARUI STATUS PESANAN
// =====================================================
exports.updateOrderStatus = async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const { id } = req.params;
    const { status } = req.body || {};

    const allowedStatus = ['Menunggu', 'Diproses', 'Selesai', 'Batal'];

    if (!isValidId(id)) {
        return res.status(400).json({
            status: 'error',
            message: 'ID pesanan tidak valid.'
        });
    }

    if (!allowedStatus.includes(status)) {
        return res.status(400).json({
            status: 'error',
            message: 'Status pesanan tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `UPDATE pesanan
             SET status = ?
             WHERE id_pesanan = ?`,
            [status, Number(id)]
        );

        if (result.affectedRows === 0) {
            const [rows] = await db.query(
                `SELECT id_pesanan FROM pesanan WHERE id_pesanan = ? LIMIT 1`,
                [Number(id)]
            );
            if (rows.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Pesanan tidak ditemukan.'
                });
            }
        }

        return res.json({
            status: 'success',
            message: `Status pesanan berhasil diubah menjadi ${status}.`
        });
    } catch (error) {
        console.error('Error updateOrderStatus:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Gagal memperbarui status pesanan.'
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