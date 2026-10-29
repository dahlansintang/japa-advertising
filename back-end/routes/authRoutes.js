const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/check', authController.checkSession);
router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);

// Rute Notifikasi Pelanggan
router.get('/notifikasi/customer', authController.getCustomerNotifications);
router.put('/notifikasi/read-all', authController.markNotificationsAsRead);
router.put('/notifikasi/:id/read', authController.markSingleNotificationAsRead); // <--- Rute untuk menandai satuan notifikasi sudah dibaca

module.exports = router;