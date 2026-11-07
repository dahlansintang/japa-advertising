
'use strict';

const express = require('express');
const router = express.Router();

/* =========================================================
   IMPORT CONTROLLER
========================================================= */

const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');

/* =========================================================
   IMPORT MIDDLEWARE
========================================================= */

const { requireAuth } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

const { uploadProductImages } = require('../middleware/uploadMiddleware');

const {
    validateUploadedImageSignatures
} = require('../middleware/security');

/* =========================================================
   DATABASE
   Menggunakan mysql2/promise
========================================================= */

const db = require('../config/db');


/* =========================================================
   MIDDLEWARE OTORISASI ADMIN
   Semua endpoint di router ini wajib:
   1. Memiliki sesi login.
   2. Memiliki role admin.
========================================================= */

router.use(requireAuth, requireAdmin);


/* =========================================================
   UTILITAS VALIDASI
========================================================= */

/**
 * Memastikan ID merupakan bilangan bulat positif.
 */
function parsePositiveId(value) {
    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return null;
    }

    return id;
}


/**
 * Penanganan error internal.
 * Detail error dicatat di server, tidak dibocorkan ke klien.
 */
function handleServerError(res, error, message) {
    console.error(message, error);

    return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server. Silakan coba kembali.'
    });
}


/* =========================================================
   ENDPOINT PROFIL ADMIN
========================================================= */

/**
 * GET /api/admin/profile
 * Mengambil profil admin yang sedang login.
 */
router.get(
    '/profile',
    adminController.getAdminProfile
);


/**
 * PUT /api/admin/profile
 * Memperbarui profil admin.
 * CSRF ditangani oleh middleware global.
 */
router.put(
    '/profile',
    adminController.updateAdminProfile
);


/* =========================================================
   ENDPOINT MANAJEMEN PRODUK
========================================================= */

/**
 * GET /api/admin/produk
 * Mengambil seluruh data produk.
 */
router.get(
    '/produk',
    productController.getAllProducts
);


/**
 * POST /api/admin/produk
 * Menambahkan produk baru.
 *
 * uploadProductImages:
 * - Mengelola upload gambar.
 *
 * validateUploadedImageSignatures:
 * - Memeriksa signature/magic bytes file gambar.
 *
 * CSRF ditangani oleh middleware global sebelum router.
 */
router.post(
    '/produk',
    uploadProductImages,
    validateUploadedImageSignatures,
    adminController.createProduct
);


/**
 * PUT /api/admin/produk/:id
 * Memperbarui produk.
 */
router.put(
    '/produk/:id',
    (req, res, next) => {
        const id = parsePositiveId(req.params.id);

        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'ID produk tidak valid.'
            });
        }

        req.params.id = String(id);
        next();
    },
    uploadProductImages,
    validateUploadedImageSignatures,
    adminController.updateProduct
);


/**
 * DELETE /api/admin/produk/:id
 * Menghapus produk.
 */
router.delete(
    '/produk/:id',
    (req, res, next) => {
        const id = parsePositiveId(req.params.id);

        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'ID produk tidak valid.'
            });
        }

        req.params.id = String(id);
        next();
    },
    adminController.deleteProduct
);


/* =========================================================
   ENDPOINT MANAJEMEN PESANAN
========================================================= */

/**
 * GET /api/admin/pesanan
 * Mengambil seluruh pesanan untuk dashboard admin.
 */
router.get(
    '/pesanan',
    adminController.getAllOrders
);


/**
 * PUT /api/admin/pesanan/:id/status
 *
 * Mengubah status pesanan.
 *
 * Menggunakan orderController.updateOrderStatus
 * sebagai satu sumber logika transisi status.
 *
 * Dengan demikian validasi status dan pembuatan notifikasi
 * tetap konsisten dengan proses perubahan status lainnya.
 */
router.put(
    '/pesanan/:id/status',
    (req, res, next) => {
        const id = parsePositiveId(req.params.id);

        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'ID pesanan tidak valid.'
            });
        }

        req.params.id = String(id);
        next();
    },
    orderController.updateOrderStatus
);


/* =========================================================
   ENDPOINT DATA PELANGGAN
========================================================= */

/**
 * GET /api/admin/customers
 * Mengambil data pelanggan.
 */
router.get(
    '/customers',
    adminController.getAllCustomers
);


/* =========================================================
   ENDPOINT NOTIFIKASI ADMIN
========================================================= */

/**
 * GET /api/admin/notifikasi
 *
 * Mengambil maksimal 20 notifikasi milik admin
 * yang sedang login.
 */
router.get('/notifikasi', async (req, res) => {
    try {
        const userId = parsePositiveId(req.session?.userId);

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Sesi pengguna tidak valid. Silakan login kembali.'
            });
        }

        const [rows] = await db.query(
            `SELECT *
             FROM notifikasi
             WHERE id_user = ?
             ORDER BY tanggal DESC
             LIMIT 20`,
            [userId]
        );

        return res.status(200).json({
            status: 'success',
            data: rows
        });

    } catch (error) {
        return handleServerError(
            res,
            error,
            'Gagal mengambil notifikasi admin:'
        );
    }
});


/**
 * PUT /api/admin/notifikasi/:id/read
 *
 * Menandai satu notifikasi sebagai sudah dibaca.
 *
 * Pembatasan id_user memastikan admin tidak dapat
 * mengubah notifikasi milik pengguna lain.
 */
router.put('/notifikasi/:id/read', async (req, res) => {
    try {
        const userId = parsePositiveId(req.session?.userId);
        const notifId = parsePositiveId(req.params.id);

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Sesi pengguna tidak valid.'
            });
        }

        if (!notifId) {
            return res.status(400).json({
                status: 'error',
                message: 'ID notifikasi tidak valid.'
            });
        }

        await db.query(
            `UPDATE notifikasi
             SET is_read = 1
             WHERE id_notifikasi = ?
             AND id_user = ?`,
            [notifId, userId]
        );

        return res.status(200).json({
            status: 'success',
            message: 'Notifikasi ditandai sudah dibaca.'
        });

    } catch (error) {
        return handleServerError(
            res,
            error,
            'Gagal memperbarui status notifikasi:'
        );
    }
});


/**
 * PUT /api/admin/notifikasi/read-all
 *
 * Menandai seluruh notifikasi milik admin
 * sebagai sudah dibaca.
 */
router.put('/notifikasi/read-all', async (req, res) => {
    try {
        const userId = parsePositiveId(req.session?.userId);

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Sesi pengguna tidak valid.'
            });
        }

        await db.query(
            `UPDATE notifikasi
             SET is_read = 1
             WHERE id_user = ?`,
            [userId]
        );

        return res.status(200).json({
            status: 'success',
            message: 'Semua notifikasi ditandai sudah dibaca.'
        });

    } catch (error) {
        return handleServerError(
            res,
            error,
            'Gagal memperbarui semua notifikasi:'
        );
    }
});


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;