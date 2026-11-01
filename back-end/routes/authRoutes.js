
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

const {
    customLoginLimiter,
    validateRegister,
    requireAuth,
    requireCustomer
} = require('../middleware/security');


// =====================================================
// AUTENTIKASI
// =====================================================

// Login: dibatasi menggunakan login limiter
router.post(
    '/login',
    customLoginLimiter,
    authController.login
);

// Registrasi: menggunakan validasi input
router.post(
    '/register',
    validateRegister,
    authController.register
);

// Pemeriksaan session
router.get(
    '/check',
    authController.checkSession
);

// Logout
router.post(
    '/logout',
    authController.logout
);


// =====================================================
// PROFIL PENGGUNA
// =====================================================

// Hanya pengguna yang sudah login
router.get(
    '/profile',
    requireAuth,
    authController.getProfile
);

router.put(
    '/profile',
    requireAuth,
    authController.updateProfile
);


// =====================================================
// NOTIFIKASI PELANGGAN
// =====================================================

// Hanya pelanggan yang sudah login
router.get(
    '/notifikasi/customer',
    requireAuth,
    requireCustomer,
    authController.getCustomerNotifications
);

router.put(
    '/notifikasi/read-all',
    requireAuth,
    requireCustomer,
    authController.markNotificationsAsRead
);

router.put(
    '/notifikasi/:id/read',
    requireAuth,
    requireCustomer,
    authController.markSingleNotificationAsRead
);


module.exports = router;
