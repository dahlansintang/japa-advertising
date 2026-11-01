const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authController = require('../controllers/authController'); // Pastikan authController di-import jika fungsi notifikasi ada di sana

router.get('/profile', customerController.getProfile);
router.get('/orders', customerController.getCustomerOrders);

module.exports = router;