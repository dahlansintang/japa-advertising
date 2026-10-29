const db = require('../config/db');

exports.getProfile = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    }

    try {
        const [users] = await db.query(
            'SELECT id_user, nama_lengkap, email, no_telp, alamat, role, created_at FROM users WHERE id_user = ? LIMIT 1',
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan.' });
        }

        res.json({ status: 'success', data: users[0] });
    } catch (error) {
        console.error('Gagal mengambil profil:', error);
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server.' });
    }
};

exports.getCustomerOrders = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    }

    try {
        const query = `
            SELECT p.*, pr.nama_produk, pr.harga_estimasi
            FROM pesanan p
            JOIN produk pr ON p.id_produk = pr.id_produk
            WHERE p.id_user = ?
            ORDER BY p.tanggal_pesan DESC
        `;
        const [rows] = await db.query(query, [req.session.userId]);
        res.json({ status: 'success', data: rows });
    } catch (error) {
        console.error('Gagal memuat pesanan pelanggan:', error);
        res.status(500).json({ status: 'error', message: 'Gagal mengambil data pesanan.' });
    }
};