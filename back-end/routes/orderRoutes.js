
const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');

const {
    requireAuth,
    requireAdmin,
    requireCustomer
} = require('../middleware/security');


// Membuat pesanan: khusus pelanggan yang sudah login
router.post(
    '/',
    requireAuth,
    requireCustomer,
    orderController.buatPesanan
);

// Melihat semua pesanan: khusus admin
router.get(
    '/',
    requireAuth,
    requireAdmin,
    orderController.getAllOrders
);

// Melihat riwayat pesanan: khusus pelanggan yang login
router.get(
    '/customer/orders',
    requireAuth,
    requireCustomer,
    orderController.getRiwayatPesanan
);

// Memperbarui status pesanan:
// controller memeriksa kepemilikan dan aturan perubahan status
router.put(
    '/:id/status',
    requireAuth,
    orderController.updateOrderStatus
);

// Memperbarui detail pesanan
router.put(
    '/:id',
    requireAuth,
    orderController.updateOrder
);

module.exports = router;
