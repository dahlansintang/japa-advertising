const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { requireAuth, requireCustomer } = require('../middleware/security');

router.post('/cek-ongkir', requireAuth, requireCustomer, shippingController.cekOngkir);

module.exports = router;