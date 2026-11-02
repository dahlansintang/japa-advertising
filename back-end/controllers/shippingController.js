const db = require('../config/db');
const { calculateShippingQuotes } = require('../utils/shippingCalculator');

exports.cekOngkir = async (req, res) => {
    try {
        const { destinationName, provinceName, mode, id_produk, jumlah, totalWeight } = req.body || {};
        let weightGrams = 0;

        if (totalWeight !== undefined && Number(totalWeight) > 0) {
            weightGrams = Number(totalWeight);
        } else if (mode === 'keranjang') {
            const userId = req.session && req.session.userId;
            if (!userId) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });

            const [items] = await db.query(
                `SELECT k.jumlah, p.berat
                 FROM keranjang k
                 INNER JOIN produk p ON p.id_produk = k.id_produk
                 WHERE k.id_user = ?`,
                [userId]
            );
            if (!items.length) {
                return res.status(400).json({ status: 'error', message: 'Keranjang belanja Anda kosong.' });
            }

            for (const item of items) {
                const berat = Number(item.berat || 1000);
                const qty = Number(item.jumlah);
                if (!Number.isSafeInteger(berat) || berat < 1 || !Number.isSafeInteger(qty) || qty < 1) {
                    return res.status(400).json({ status: 'error', message: 'Data berat atau jumlah produk tidak valid.' });
                }
                weightGrams += berat * qty;
            }
        } else {
            const productId = Number(id_produk);
            const qty = Number(jumlah);
            if (!Number.isSafeInteger(productId) || productId < 1 ||
                !Number.isSafeInteger(qty) || qty < 1 || qty > 1000) {
                return res.status(400).json({ status: 'error', message: 'Produk atau jumlah pesanan tidak valid.' });
            }

            const [products] = await db.query(
                'SELECT berat FROM produk WHERE id_produk = ?',
                [productId]
            );
            if (!products.length) return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan.' });

            const berat = Number(products[0].berat || 1000);
            if (!Number.isSafeInteger(berat) || berat < 1) {
                return res.status(400).json({ status: 'error', message: 'Berat produk tidak valid.' });
            }
            weightGrams = berat * qty;
        }

        if (!Number.isSafeInteger(weightGrams) || weightGrams < 1 || weightGrams > 100000) {
            return res.status(400).json({ status: 'error', message: 'Berat total pengiriman maksimal 100 kg.' });
        }

        const data = calculateShippingQuotes(destinationName, provinceName, weightGrams);
        return res.status(200).json({
            status: 'success',
            data,
            meta: { berat_gram: weightGrams, berat_kg_dibulatkan: Math.ceil(weightGrams / 1000) }
        });
    } catch (error) {
        console.error('Gagal menghitung ongkir:', error);
        return res.status(400).json({
            status: 'error',
            message: error.message || 'Gagal menghitung ongkos kirim.'
        });
    }
};