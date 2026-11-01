const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');

// Endpoint API Pengiriman & Wilayah
router.post('/cek-ongkir', shippingController.cekOngkir);

module.exports = router;