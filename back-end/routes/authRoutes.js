const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/check', authController.checkSession);
router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);

// ==========================================
// RUTE NOTIFIKASI PELANGGAN
// ==========================================
router.get('/notifikasi/customer', authController.getCustomerNotifications);
router.put('/notifikasi/read-all', authController.markNotificationsAsRead);
router.put('/notifikasi/:id/read', authController.markSingleNotificationAsRead);

module.exports = router;