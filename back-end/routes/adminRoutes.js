const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin, uploadConfig } = require('../middleware/security');

// Endpoint Profil Admin
router.get('/profile', requireAuth, requireAdmin, adminController.getAdminProfile);
router.put('/profile', requireAuth, requireAdmin, adminController.updateAdminProfile);

// Endpoint Manajemen Produk (Dukungan upload hingga 5 gambar sekaligus menggunakan uploadConfig.array)
router.post('/produk', requireAuth, requireAdmin, uploadConfig.array('gambar_file', 5), adminController.createProduct);
router.put('/produk/:id', requireAuth, requireAdmin, uploadConfig.array('gambar_file', 5), adminController.updateProduct);
router.delete('/produk/:id', requireAuth, requireAdmin, adminController.deleteProduct);

// Endpoint Manajemen Pesanan
router.get('/pesanan', requireAuth, requireAdmin, adminController.getAllOrders);
router.put('/pesanan/:id/status', requireAuth, requireAdmin, adminController.updateOrderStatus);

// Endpoint Data Pelanggan (Baru)
router.get('/customers', requireAuth, requireAdmin, adminController.getAllCustomers);

module.exports = router;