const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { requireAuth, requireCustomer } = require('../middleware/authMiddleware');

router.post('/cek-ongkir', requireAuth, requireCustomer, shippingController.cekOngkir);

module.exports = router;