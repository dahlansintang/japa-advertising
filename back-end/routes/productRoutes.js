const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Tambahkan module fs (File System)

// Pastikan folder tujuan tersedia, jika tidak buat otomatis
const uploadDir = path.join(__dirname, '../../front-end/images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Multer untuk penyimpanan file gambar
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Menggunakan folder front-end/images yang sesuai dengan sistem Anda
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Buat nama file unik agar tidak tertimpa
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});

const upload = multer({ storage: storage });

// Rute mengambil semua data produk untuk katalog
router.get('/', productController.getAllProducts);

// Rute mengambil detail 1 produk berdasarkan ID
router.get('/:id', productController.getProductById);

// =========================================================================
// PERUBAHAN DI SINI: Gunakan upload.array untuk menerima lebih dari 1 file
// Angka 5 adalah batas maksimal gambar yang bisa diunggah dalam 1 kali form
// =========================================================================

// Rute menambah produk baru (Upload Multiple)
router.post('/', upload.array('gambar_file', 5), productController.createProduct);

// Rute EDIT produk (Upload Multiple opsional)
router.put('/:id', upload.array('gambar_file', 5), productController.updateProduct);

// Rute HAPUS produk
router.delete('/:id', productController.deleteProduct);

module.exports = router;