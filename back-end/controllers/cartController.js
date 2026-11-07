'use strict';
const db = require('../config/db');
const MAX_QTY = 1000;

function validPositiveId(value) {
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
}

exports.addToCart = async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    const productId = validPositiveId(req.body?.id_produk);
    const qty = validPositiveId(req.body?.jumlah);
    const detail = req.body?.detail_ukuran;
    if (!productId || !qty || qty > MAX_QTY) {
        return res.status(400).json({ status: 'error', message: 'Produk atau jumlah tidak valid (maksimal 1.000).' });
    }
    if (detail !== undefined && detail !== null && (typeof detail !== 'string' || detail.trim().length > 10000)) {
        return res.status(400).json({ status: 'error', message: 'Detail ukuran tidak valid.' });
    }

    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();
        const [users] = await conn.query('SELECT id_user FROM users WHERE id_user = ? FOR UPDATE', [userId]);
        if (!users.length) {
            await conn.rollback();
            return res.status(401).json({ status: 'error', message: 'Akun tidak ditemukan. Silakan login kembali.' });
        }
        const [products] = await conn.query('SELECT id_produk FROM produk WHERE id_produk = ? LIMIT 1', [productId]);
        if (!products.length) {
            await conn.rollback();
            return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan.' });
        }
        const normalizedDetail = typeof detail === 'string' && detail.trim() ? detail.trim() : null;
        const [existing] = await conn.query(
            `SELECT id_keranjang, jumlah FROM keranjang
             WHERE id_user = ? AND id_produk = ?
             AND (detail_ukuran = ? OR (detail_ukuran IS NULL AND ? IS NULL))
             LIMIT 1 FOR UPDATE`, [userId, productId, normalizedDetail, normalizedDetail]
        );
        if (existing.length) {
            const newQty = Number(existing[0].jumlah) + qty;
            if (!Number.isSafeInteger(newQty) || newQty > MAX_QTY) {
                await conn.rollback();
                return res.status(400).json({ status: 'error', message: 'Jumlah produk dalam satu item keranjang maksimal 1.000.' });
            }
            await conn.query('UPDATE keranjang SET jumlah = ? WHERE id_keranjang = ? AND id_user = ?', [newQty, existing[0].id_keranjang, userId]);
        } else {
            await conn.query('INSERT INTO keranjang (id_user, id_produk, jumlah, detail_ukuran) VALUES (?, ?, ?, ?)', [userId, productId, qty, normalizedDetail]);
        }
        await conn.commit();
        return res.json({ status: 'success', message: 'Produk berhasil ditambahkan ke keranjang.' });
    } catch (error) {
        if (conn) await conn.rollback().catch(() => {});
        console.error('Error addToCart:', error);
        return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan saat memperbarui keranjang.' });
    } finally {
        if (conn) conn.release();
    }
};

exports.getCart = async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    try {
        const [rows] = await db.query(
            `SELECT k.id_keranjang, k.id_user, k.id_produk, k.jumlah, k.detail_ukuran, k.created_at,
                    p.nama_produk, p.harga_estimasi, p.gambar_url, p.berat
             FROM keranjang k INNER JOIN produk p ON p.id_produk = k.id_produk
             WHERE k.id_user = ? ORDER BY k.created_at DESC`, [userId]
        );
        return res.json({ status: 'success', data: rows });
    } catch (error) {
        console.error('Error getCart:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal mengambil keranjang.' });
    }
};

exports.removeFromCart = async (req, res) => {
    const userId = req.session?.userId;
    const cartId = validPositiveId(req.params.id);
    if (!userId) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    if (!cartId) return res.status(400).json({ status: 'error', message: 'ID item keranjang tidak valid.' });
    try {
        const [result] = await db.query('DELETE FROM keranjang WHERE id_keranjang = ? AND id_user = ?', [cartId, userId]);
        if (!result.affectedRows) return res.status(404).json({ status: 'error', message: 'Item keranjang tidak ditemukan.' });
        return res.json({ status: 'success', message: 'Item berhasil dihapus dari keranjang.' });
    } catch (error) {
        console.error('Error removeFromCart:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal menghapus item keranjang.' });
    }
};
