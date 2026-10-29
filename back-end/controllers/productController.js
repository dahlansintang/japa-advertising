const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getAllProducts = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM produk ORDER BY id_produk DESC');
        res.json({ status: 'success', data: rows });
    } catch (error) {
        console.error('Gagal mengambil produk:', error);
        res.status(500).json({ status: 'error', message: 'Gagal mengambil data produk' });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM produk WHERE id_produk = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
        }
        res.json({ status: 'success', data: rows[0] });
    } catch (error) {
        console.error('Gagal mengambil produk:', error);
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { nama_produk, bahan, deskripsi, harga_estimasi } = req.body;
        
        let gambar_url = null;
        // Tangkap BANYAK file (array) dan ubah ke string JSON
        if (req.files && req.files.length > 0) {
            const filePaths = req.files.map(file => 'images/' + file.filename);
            gambar_url = JSON.stringify(filePaths);
        }

        if (!nama_produk || !harga_estimasi) {
            return res.status(400).json({ status: 'error', message: 'Nama dan harga wajib diisi' });
        }

        const query = 'INSERT INTO produk (nama_produk, deskripsi, bahan, harga_estimasi, gambar_url) VALUES (?, ?, ?, ?, ?)';
        await db.query(query, [nama_produk, deskripsi, bahan, harga_estimasi, gambar_url]);
        
        res.json({ status: 'success', message: 'Produk berhasil ditambahkan!' });
    } catch (error) {
        console.error('Gagal tambah produk:', error);
        res.status(500).json({ status: 'error', message: 'Gagal menyimpan produk ke database' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_produk, bahan, deskripsi, harga_estimasi } = req.body;
        
        if (!nama_produk || !harga_estimasi) {
            return res.status(400).json({ status: 'error', message: 'Nama dan harga wajib diisi' });
        }

        let gambarQuery = '';
        let queryParams = [nama_produk, deskripsi, bahan, harga_estimasi];

        if (req.files && req.files.length > 0) {
            gambarQuery = ', gambar_url = ?';
            const filePaths = req.files.map(file => 'images/' + file.filename);
            queryParams.push(JSON.stringify(filePaths));
            
            // Hapus semua gambar lama fisik
            const [oldProduk] = await db.query('SELECT gambar_url FROM produk WHERE id_produk = ?', [id]);
            if (oldProduk.length > 0 && oldProduk[0].gambar_url) {
                try {
                    const oldImages = JSON.parse(oldProduk[0].gambar_url);
                    if (Array.isArray(oldImages)) {
                        oldImages.forEach(img => {
                            const oldPath = path.join(__dirname, '../public', img); // Sesuaikan '../public' jika Anda pakai folder lain
                            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                        });
                    }
                } catch(e) {
                    // Fallback jika produk lama masih pakai string biasa
                    const oldPath = path.join(__dirname, '../public', oldProduk[0].gambar_url);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
            }
        }

        queryParams.push(id);

        const query = `UPDATE produk SET nama_produk = ?, deskripsi = ?, bahan = ?, harga_estimasi = ?${gambarQuery} WHERE id_produk = ?`;
        await db.query(query, queryParams);
        res.json({ status: 'success', message: 'Produk berhasil diperbarui!' });
    } catch (error) {
        console.error('Gagal update produk:', error);
        res.status(500).json({ status: 'error', message: 'Gagal memperbarui produk' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const [produk] = await db.query('SELECT gambar_url FROM produk WHERE id_produk = ?', [id]);
        if (produk.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan.' });
        }
        
        const gambarUrl = produk[0].gambar_url;
        await db.query('DELETE FROM produk WHERE id_produk = ?', [id]);

        if (gambarUrl) {
            try {
                const images = JSON.parse(gambarUrl);
                if (Array.isArray(images)) {
                    images.forEach(img => {
                        const filePath = path.join(__dirname, '../public', img);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    });
                }
            } catch(e) {
                const filePath = path.join(__dirname, '../public', gambarUrl);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        }
        res.json({ status: 'success', message: 'Produk dan gambar berhasil dihapus.' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(400).json({ status: 'error', message: 'Gagal! Produk ini tidak dapat dihapus karena sudah ada pelanggan yang memesannya.' });
        }
        res.status(500).json({ status: 'error', message: 'Gagal menghapus produk dari database.' });
    }
};