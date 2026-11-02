const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authController = require('../controllers/authController');

router.get('/profile', customerController.getProfile);
router.get('/orders', customerController.getCustomerOrders);

module.exports = router;