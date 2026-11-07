
'use strict';

const express = require('express');
const router = express.Router();

/* =========================================================
   IMPORT CONTROLLER
========================================================= */

const authController = require('../controllers/authController');


/* =========================================================
   IMPORT MIDDLEWARE
========================================================= */

const {
    customLoginLimiter
} = require('../middleware/rateLimitMiddleware');

const {
    requireAuth,
    requireCustomer
} = require('../middleware/authMiddleware');

const {
    validateRegister
} = require('../middleware/validationMiddleware');


/* =========================================================
   UTILITAS VALIDASI
========================================================= */

/**
 * Memastikan ID berupa bilangan bulat positif.
 *
 * Digunakan untuk endpoint notifikasi pelanggan.
 */
function validateNotificationId(req, res, next) {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            status: 'error',
            message: 'ID notifikasi tidak valid.'
        });
    }

    req.params.id = String(id);

    next();
}


/* =========================================================
   AUTENTIKASI
========================================================= */

/**
 * POST /api/auth/login
 *
 * Login pengguna.
 *
 * customLoginLimiter:
 * Membatasi percobaan login berulang.
 *
 * CSRF:
 * Dilindungi oleh middleware CSRF global.
 */
router.post(
    '/login',
    customLoginLimiter,
    authController.login
);


/**
 * POST /api/auth/register
 *
 * Registrasi pengguna baru.
 *
 * validateRegister:
 * Memvalidasi input registrasi sebelum controller dijalankan.
 *
 * CSRF:
 * Dilindungi oleh middleware CSRF global.
 */
router.post(
    '/register',
    validateRegister,
    authController.register
);


/**
 * GET /api/auth/check
 *
 * Memeriksa status autentikasi pengguna.
 *
 * Endpoint publik karena diperlukan frontend
 * untuk menentukan apakah pengguna sudah login.
 */
router.get(
    '/check',
    authController.checkSession
);


/**
 * POST /api/auth/logout
 *
 * Mengakhiri sesi pengguna.
 *
 * Tidak menggunakan requireAuth agar proses logout
 * tetap dapat dipanggil ketika sesi sudah tidak valid.
 *
 * CSRF:
 * Tetap wajib melewati middleware CSRF global.
 */
router.post(
    '/logout',
    authController.logout
);


/* =========================================================
   PROFIL PENGGUNA
========================================================= */

/**
 * GET /api/auth/profile
 *
 * Mengambil profil pengguna yang sedang login.
 */
router.get(
    '/profile',
    requireAuth,
    authController.getProfile
);


/**
 * PUT /api/auth/profile
 *
 * Memperbarui profil pengguna.
 *
 * requireAuth:
 * Memastikan pengguna sudah login.
 *
 * CSRF:
 * Dilindungi oleh middleware CSRF global.
 */
router.put(
    '/profile',
    requireAuth,
    authController.updateProfile
);


/* =========================================================
   NOTIFIKASI PELANGGAN
========================================================= */

/**
 * GET /api/auth/notifikasi/customer
 *
 * Mengambil notifikasi milik pelanggan.
 *
 * Hanya pelanggan yang sudah login.
 */
router.get(
    '/notifikasi/customer',
    requireAuth,
    requireCustomer,
    authController.getCustomerNotifications
);


/**
 * PUT /api/auth/notifikasi/read-all
 *
 * Menandai seluruh notifikasi pelanggan
 * sebagai sudah dibaca.
 *
 * Hanya pelanggan yang sudah login.
 *
 * CSRF:
 * Dilindungi oleh middleware CSRF global.
 */
router.put(
    '/notifikasi/read-all',
    requireAuth,
    requireCustomer,
    authController.markNotificationsAsRead
);


/**
 * PUT /api/auth/notifikasi/:id/read
 *
 * Menandai satu notifikasi pelanggan
 * sebagai sudah dibaca.
 *
 * ID notifikasi divalidasi sebelum controller.
 *
 * Hanya pelanggan yang sudah login.
 *
 * CSRF:
 * Dilindungi oleh middleware CSRF global.
 */
router.put(
    '/notifikasi/:id/read',
    requireAuth,
    requireCustomer,
    validateNotificationId,
    authController.markSingleNotificationAsRead
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;