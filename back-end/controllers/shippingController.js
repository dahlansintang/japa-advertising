'use strict';
const db = require('../config/db');
const { calculateShippingQuotes } = require('../utils/shippingCalculator');

function positiveInteger(value) {
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
}

exports.cekOngkir = async (req, res) => {
    const body = req.body || {};
    const destinationName = body.destinationName || body.kota_tujuan;
    const provinceName = body.provinceName || body.provinsi_tujuan;
    if (typeof destinationName !== 'string' || !destinationName.trim() ||
        typeof provinceName !== 'string' || !provinceName.trim()) {
        return res.status(400).json({ status: 'error', message: 'Kabupaten/kota dan provinsi tujuan wajib diisi.' });
    }

    try {
        const mode = body.mode || 'satuan';
        let weightGrams = 0;

        if (mode === 'keranjang') {
            const [items] = await db.query(
                `SELECT k.jumlah, p.berat FROM keranjang k
                 INNER JOIN produk p ON p.id_produk = k.id_produk
                 WHERE k.id_user = ?`, [req.session.userId]
            );
            if (!items.length) return res.status(400).json({ status: 'error', message: 'Keranjang belanja Anda kosong.' });
            for (const item of items) {
                const qty = positiveInteger(item.jumlah);
                const unitWeight = positiveInteger(item.berat || 1000);
                if (!qty || qty > 1000 || !unitWeight) {
                    return res.status(400).json({ status: 'error', message: 'Data jumlah atau berat produk tidak valid.' });
                }
                weightGrams += qty * unitWeight;
            }
        } else if (mode === 'pesanan') {
            const requestedItems = Array.isArray(body.items) && body.items.length
                ? body.items
                : [{ id_pesanan: body.id_pesanan, jumlah: body.jumlah }];
            if (requestedItems.length > 100 || requestedItems.some(item => !positiveInteger(item.id_pesanan))) {
                return res.status(400).json({ status: 'error', message: 'ID pesanan untuk perhitungan ongkir tidak valid.' });
            }
            const ids = requestedItems.map(item => Number(item.id_pesanan));
            if (new Set(ids).size !== ids.length) {
                return res.status(400).json({ status: 'error', message: 'ID pesanan tidak boleh duplikat.' });
            }
            const [items] = await db.query(
                `SELECT p.id_pesanan, p.jumlah, pr.berat FROM pesanan p
                 INNER JOIN produk pr ON pr.id_produk = p.id_produk
                 WHERE p.id_user = ? AND p.id_pesanan IN (?)`, [req.session.userId, ids]
            );
            if (items.length !== ids.length) {
                return res.status(404).json({ status: 'error', message: 'Sebagian pesanan tidak ditemukan atau bukan milik Anda.' });
            }
            const requestedById = new Map(requestedItems.map(item => [Number(item.id_pesanan), item]));
            for (const item of items) {
                const requested = requestedById.get(Number(item.id_pesanan));
                const qty = requested.jumlah === undefined ? positiveInteger(item.jumlah) : positiveInteger(requested.jumlah);
                const unitWeight = positiveInteger(item.berat || 1000);
                if (!qty || qty > 1000 || !unitWeight) return res.status(400).json({ status: 'error', message: 'Data jumlah atau berat pesanan tidak valid.' });
                weightGrams += qty * unitWeight;
            }
        } else {
            const productId = positiveInteger(body.id_produk);
            const qty = positiveInteger(body.jumlah);
            if (!productId || !qty || qty > 1000) {
                return res.status(400).json({ status: 'error', message: 'Produk atau jumlah pesanan tidak valid.' });
            }
            const [products] = await db.query('SELECT berat FROM produk WHERE id_produk = ? LIMIT 1', [productId]);
            if (!products.length) return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan.' });
            const unitWeight = positiveInteger(products[0].berat || 1000);
            if (!unitWeight) return res.status(400).json({ status: 'error', message: 'Berat produk tidak valid.' });
            weightGrams = unitWeight * qty;
        }

        if (!Number.isSafeInteger(weightGrams) || weightGrams < 1 || weightGrams > 100000) {
            return res.status(400).json({ status: 'error', message: 'Berat total pengiriman maksimal 100 kg.' });
        }
        const data = calculateShippingQuotes(destinationName.trim(), provinceName.trim(), weightGrams);
        return res.status(200).json({ status: 'success', data,
            meta: { berat_gram: weightGrams, berat_kg_dibulatkan: Math.ceil(weightGrams / 1000) } });
    } catch (error) {
        console.error('Gagal menghitung ongkir:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal menghitung ongkos kirim.' });
    }
};
