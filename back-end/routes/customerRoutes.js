'use strict';

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { requireAuth, requireCustomer } = require('../middleware/authMiddleware');

router.use(requireAuth, requireCustomer);
router.get('/profile', customerController.getProfile);
router.get('/orders', customerController.getCustomerOrders);

module.exports = router;
