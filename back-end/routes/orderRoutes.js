const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireAuth, requireAdmin, requireCustomer } = require('../middleware/security');

router.post('/', requireAuth, requireCustomer, orderController.buatPesanan);
router.get('/', requireAuth, requireAdmin, orderController.getAllOrders);
router.get('/customer/orders', requireAuth, requireCustomer, orderController.getRiwayatPesanan);
router.put('/:id/status', requireAuth, orderController.updateOrderStatus);
router.put('/:id', requireAuth, requireCustomer, orderController.updateOrder);

module.exports = router;
