const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

// Endpoint untuk membuat pesanan baru (POST /api/pesanan)
router.post('/pesanan', checkoutController.buatPesanan);

// Endpoint untuk mengambil riwayat pesanan pelanggan (GET /api/customer/orders)
router.get('/customer/orders', checkoutController.getRiwayatPesanan);

module.exports = router;