const db = require('../config/db');

// ==========================================
// 1. TAMBAH PRODUK KE KERANJANG
// ==========================================
exports.addToCart = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    }

    const id_user = req.session.userId;
    const { id_produk, jumlah, detail_ukuran } = req.body;
    const qty = Number(jumlah);

    if (!id_produk || !Number.isSafeInteger(qty) || qty < 1) {
        return res.status(400).json({ status: 'error', message: 'Produk atau jumlah pesanan tidak valid.' });
    }

    if (detail_ukuran !== undefined && detail_ukuran !== null && typeof detail_ukuran !== 'string') {
        return res.status(400).json({ status: 'error', message: 'Detail ukuran tidak valid.' });
    }

    try {
        const [produk] = await db.query(`SELECT id_produk FROM produk WHERE id_produk = ?`, [id_produk]);
        if (produk.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan.' });
        }

        const detail = detail_ukuran || null;
        const [existing] = await db.query(
            `SELECT id_keranjang, jumlah FROM keranjang 
             WHERE id_user = ? AND id_produk = ? AND (detail_ukuran = ? OR (detail_ukuran IS NULL AND ? IS NULL))`,
            [id_user, id_produk, detail, detail]
        );

        if (existing.length > 0) {
            const newQty = Number(existing[0].jumlah) + qty;
            await db.query(`UPDATE keranjang SET jumlah = ? WHERE id_keranjang = ? AND id_user = ?`, [newQty, existing[0].id_keranjang, id_user]);
        } else {
            await db.query(`INSERT INTO keranjang (id_user, id_produk, jumlah, detail_ukuran) VALUES (?, ?, ?, ?)`, [id_user, id_produk, qty, detail]);
        }

        return res.json({ status: 'success', message: 'Produk berhasil ditambahkan ke keranjang!' });
    } catch (error) {
        console.error('Error addToCart:', error);
        return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server.' });
    }
};

// ==========================================
// 2. AMBIL ISI KERANJANG PELANGGAN
// ==========================================
exports.getCart = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    }

    try {
        const [rows] = await db.query(
            `SELECT k.id_keranjang, k.id_user, k.id_produk, k.jumlah, k.detail_ukuran, k.created_at, 
                    p.nama_produk, p.harga_estimasi, p.gambar_url
             FROM keranjang k
             INNER JOIN produk p ON k.id_produk = p.id_produk
             WHERE k.id_user = ? ORDER BY k.created_at DESC`,
            [req.session.userId]
        );
        return res.json({ status: 'success', data: rows });
    } catch (error) {
        console.error('Error getCart:', error);
        return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server.' });
    }
};

// ==========================================
// 3. HAPUS ITEM DARI KERANJANG
// ==========================================
exports.removeFromCart = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    }

    const id_user = req.session.userId;
    const id_keranjang = req.params.id;

    try {
        const [result] = await db.query(`DELETE FROM keranjang WHERE id_keranjang = ? AND id_user = ?`, [id_keranjang, id_user]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Item keranjang tidak ditemukan.' });
        }
        return res.json({ status: 'success', message: 'Item berhasil dihapus dari keranjang.' });
    } catch (error) {
        console.error('Error removeFromCart:', error);
        return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server.' });
    }
};