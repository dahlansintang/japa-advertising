const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin, uploadConfig } = require('../middleware/security');
const db = require('../config/db');

// Endpoint Profil Admin
router.get('/profile', requireAuth, requireAdmin, adminController.getAdminProfile);
router.put('/profile', requireAuth, requireAdmin, adminController.updateAdminProfile);

// Endpoint Manajemen Produk
router.post('/produk', requireAuth, requireAdmin, uploadConfig.array('gambar_file', 5), adminController.createProduct);
router.put('/produk/:id', requireAuth, requireAdmin, uploadConfig.array('gambar_file', 5), adminController.updateProduct);
router.delete('/produk/:id', requireAuth, requireAdmin, adminController.deleteProduct);

// Endpoint Manajemen Pesanan
router.get('/pesanan', requireAuth, requireAdmin, adminController.getAllOrders);
router.put('/pesanan/:id/status', requireAuth, requireAdmin, adminController.updateOrderStatus);

// Endpoint Data Pelanggan
router.get('/customers', requireAuth, requireAdmin, adminController.getAllCustomers);

// ==========================================
// Endpoint Notifikasi Admin
// ==========================================
router.get('/notifikasi', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM notifikasi 
             WHERE id_user = ? 
             ORDER BY tanggal DESC LIMIT 20`,
            [req.session.userId]
        );
        return res.json({ status: 'success', data: rows });
    } catch (err) {
        console.error('Gagal mengambil notifikasi admin:', err);
        return res.status(500).json({ status: 'error', message: err.message });
    }
});

// Tandai satu notifikasi sudah dibaca
router.put('/notifikasi/:id/read', requireAuth, requireAdmin, async (req, res) => {
    try {
        const notifId = req.params.id;
        await db.query(
            `UPDATE notifikasi SET is_read = 1 WHERE id_notifikasi = ? AND id_user = ?`,
            [notifId, req.session.userId]
        );
        return res.json({ status: 'success', message: 'Notifikasi ditandai dibaca.' });
    } catch (err) {
        console.error('Gagal memperbarui status notifikasi:', err);
        return res.status(500).json({ status: 'error', message: err.message });
    }
});

// Tandai semua notifikasi admin sudah dibaca
router.put('/notifikasi/read-all', requireAuth, requireAdmin, async (req, res) => {
    try {
        await db.query(
            `UPDATE notifikasi SET is_read = 1 WHERE id_user = ?`,
            [req.session.userId]
        );
        return res.json({ status: 'success', message: 'Semua notifikasi ditandai dibaca.' });
    } catch (err) {
        console.error('Gagal memperbarui semua notifikasi:', err);
        return res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;