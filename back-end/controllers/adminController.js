const db = require('../config/db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// 1. Ambil Profil Admin yang Sedang Login
exports.getAdminProfile = (req, res) => {
    const userId = req.session.userId;
    
    const query = 'SELECT id_user, nama_lengkap, email, no_telp, alamat, created_at FROM users WHERE id_user = ? AND role = "admin"';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error getAdminProfile:', err);
            return res.status(500).json({ status: 'error', message: 'Kesalahan pada database' });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Profil admin tidak ditemukan' });
        }
        res.json({ status: 'success', data: results[0] });
    });
};

// 2. Perbarui Profil Admin (Nama, Email, No Telp, Alamat)
exports.updateAdminProfile = (req, res) => {
    const userId = req.session.userId;
    const { nama_lengkap, email, no_telp, alamat } = req.body;

    const query = 'UPDATE users SET nama_lengkap = ?, email = ?, no_telp = ?, alamat = ? WHERE id_user = ? AND role = "admin"';
    db.query(query, [nama_lengkap, email, no_telp, alamat, userId], (err, result) => {
        if (err) {
            console.error('Error updateAdminProfile:', err);
            return res.status(500).json({ status: 'error', message: 'Gagal memperbarui profil (Email mungkin sudah terdaftar)' });
        }
        res.json({ status: 'success', message: 'Profil admin berhasil diperbarui' });
    });
};

// 3. Tambah Produk Baru dengan Dukungan Multi-Gambar (Array JSON)
exports.createProduct = (req, res) => {
    const { nama_produk, deskripsi, bahan, harga_estimasi, berat } = req.body;
    
    // Tangani file yang diunggah melalui Multer (bisa banyak file)
    let gambarUrl = null;
    if (req.files && req.files.length > 0) {
        const filePaths = req.files.map(file => `images/${file.filename}`);
        // Simpan sebagai JSON String Array agar konsisten dengan struktur database
        gambarUrl = JSON.stringify(filePaths);
    } else if (req.file) {
        gambarUrl = `images/${req.file.filename}`;
    }

    const query = 'INSERT INTO produk (nama_produk, deskripsi, bahan, harga_estimasi, gambar_url, berat) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [nama_produk, deskripsi, bahan, harga_estimasi || 0, gambarUrl, berat || 1000], (err, result) => {
        if (err) {
            console.error('Error createProduct:', err);
            return res.status(500).json({ status: 'error', message: 'Gagal menambahkan produk ke database' });
        }
        res.status(201).json({ 
            status: 'success', 
            message: 'Produk berhasil ditambahkan', 
            id_produk: result.insertId 
        });
    });
};

// 4. Perbarui Produk (Termasuk Penggantian Multi-Gambar)
exports.updateProduct = (req, res) => {
    const { id } = req.params;
    const { nama_produk, deskripsi, bahan, harga_estimasi, berat } = req.body;

    // Ambil data produk lama terlebih dahulu untuk mengecek gambar
    db.query('SELECT gambar_url FROM produk WHERE id_produk = ?', [id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
        }

        let gambarUrl = results[0].gambar_url;

        // Jika ada file baru yang diunggah
        if (req.files && req.files.length > 0) {
            const filePaths = req.files.map(file => `images/${file.filename}`);
            gambarUrl = JSON.stringify(filePaths);
        }

        const query = 'UPDATE produk SET nama_produk = ?, deskripsi = ?, bahan = ?, harga_estimasi = ?, gambar_url = ?, berat = ? WHERE id_produk = ?';
        db.query(query, [nama_produk, deskripsi, bahan, harga_estimasi, gambarUrl, berat || 1000, id], (err, result) => {
            if (err) {
                console.error('Error updateProduct:', err);
                return res.status(500).json({ status: 'error', message: 'Gagal memperbarui produk' });
            }
            res.json({ status: 'success', message: 'Produk berhasil diperbarui' });
        });
    });
};

// 5. Hapus Produk
exports.deleteProduct = (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM produk WHERE id_produk = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleteProduct:', err);
            return res.status(500).json({ status: 'error', message: 'Gagal menghapus produk (Mungkin masih terikat dengan data pesanan)' });
        }
        res.json({ status: 'success', message: 'Produk berhasil dihapus' });
    });
};

// 6. Ambil Semua Pesanan Masuk (Untuk Dashboard Admin)
exports.getAllOrders = (req, res) => {
    const query = `
        SELECT p.*, u.nama_lengkap AS nama_pelanggan, u.email AS email_pelanggan, pr.nama_produk, pr.harga_estimasi 
        FROM pesanan p
        JOIN users u ON p.id_user = u.id_user
        JOIN produk pr ON p.id_produk = pr.id_produk
        ORDER BY p.tanggal_pesan DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error getAllOrders:', err);
            return res.status(500).json({ status: 'error', message: 'Gagal memuat daftar pesanan' });
        }
        res.json({ status: 'success', data: results });
    });
};

// 7. Perbarui Status Pesanan (Menunggu, Diproses, Selesai, Batal)
exports.updateOrderStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = ['Menunggu', 'Diproses', 'Selesai', 'Batal'];
    if (!allowedStatus.includes(status)) {
        return res.status(400).json({ status: 'error', message: 'Status pesanan tidak valid' });
    }

    const query = 'UPDATE pesanan SET status = ? WHERE id_pesanan = ?';
    db.query(query, [status, id], (err, result) => {
        if (err) {
            console.error('Error updateOrderStatus:', err);
            return res.status(500).json({ status: 'error', message: 'Gagal memperbarui status pesanan' });
        }
        res.json({ status: 'success', message: `Status pesanan berhasil diubah menjadi ${status}` });
    });
};

// 8. Ambil Semua Data Pelanggan Terdaftar (Untuk Menu Data Pelanggan Admin)
exports.getAllCustomers = async (req, res) => {
    if (!req.session || req.session.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Akses ditolak.' });
    }

    try {
        const [rows] = await db.query(
            "SELECT id_user, nama_lengkap, email, no_telp, alamat, created_at FROM users WHERE role = 'pelanggan' ORDER BY created_at DESC"
        );
        res.json({ status: 'success', data: rows });
    } catch (error) {
        console.error('Error getAllCustomers:', error);
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server.' });
    }
};