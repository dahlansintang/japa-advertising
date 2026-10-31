
const db = require('../config/db');

// ==========================================
// KONFIGURASI
// ==========================================

const METODE_PEMBAYARAN_VALID = [
    'Transfer Bank BCA',
    'Transfer Bank Mandiri',
    'E-Wallet (GoPay / OVO / Dana)',
    'Bayar di Toko (Tunai)'
];

// ==========================================
// HELPER: VALIDASI METODE PEMBAYARAN
// ==========================================

function validasiMetodePembayaran(value) {

    // Metode pembayaran wajib berupa string.
    // Object atau array tidak boleh langsung disimpan.

    if (typeof value !== 'string') {
        return null;
    }

    const metode = value.trim();

    if (!METODE_PEMBAYARAN_VALID.includes(metode)) {
        return null;
    }

    return metode;
}

// ==========================================
// HELPER: VALIDASI ONGKIR
// ==========================================

function validasiOngkir(value) {

    if (
        value === undefined ||
        value === null ||
        value === ''
    ) {
        return null;
    }

    const ongkir = Number(value);

    if (
        !Number.isSafeInteger(ongkir) ||
        ongkir < 0
    ) {
        return null;
    }

    return ongkir;
}

// ==========================================
// 1. TAMBAH PRODUK KE KERANJANG
// ==========================================

exports.addToCart = async (req, res) => {

    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Silakan login terlebih dahulu.'
        });
    }

    const id_user = req.session.userId;

    const {
        id_produk,
        jumlah,
        detail_ukuran
    } = req.body;

    const qty = Number(jumlah);

    if (
        !id_produk ||
        !Number.isSafeInteger(qty) ||
        qty < 1
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Produk atau jumlah pesanan tidak valid.'
        });
    }

    if (
        detail_ukuran !== undefined &&
        detail_ukuran !== null &&
        typeof detail_ukuran !== 'string'
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Detail ukuran tidak valid.'
        });
    }

    try {

        const [produk] = await db.query(
            `SELECT id_produk
             FROM produk
             WHERE id_produk = ?`,
            [id_produk]
        );

        if (produk.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Produk tidak ditemukan.'
            });
        }

        const detail = detail_ukuran || null;

        const [existing] = await db.query(
            `SELECT id_keranjang, jumlah
             FROM keranjang
             WHERE id_user = ?
             AND id_produk = ?
             AND (
                detail_ukuran = ?
                OR (detail_ukuran IS NULL AND ? IS NULL)
             )`,
            [
                id_user,
                id_produk,
                detail,
                detail
            ]
        );

        if (existing.length > 0) {

            const newQty =
                Number(existing[0].jumlah) + qty;

            await db.query(
                `UPDATE keranjang
                 SET jumlah = ?
                 WHERE id_keranjang = ?
                 AND id_user = ?`,
                [
                    newQty,
                    existing[0].id_keranjang,
                    id_user
                ]
            );

        } else {

            await db.query(
                `INSERT INTO keranjang
                    (id_user, id_produk, jumlah, detail_ukuran)
                 VALUES (?, ?, ?, ?)`,
                [
                    id_user,
                    id_produk,
                    qty,
                    detail
                ]
            );
        }

        return res.json({
            status: 'success',
            message: 'Produk berhasil ditambahkan ke keranjang!'
        });

    } catch (error) {

        console.error('Error addToCart:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server.'
        });
    }
};

// ==========================================
// 2. AMBIL ISI KERANJANG PELANGGAN
// ==========================================

exports.getCart = async (req, res) => {

    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Silakan login terlebih dahulu.'
        });
    }

    try {

        const [rows] = await db.query(
            `SELECT
                k.id_keranjang,
                k.id_user,
                k.id_produk,
                k.jumlah,
                k.detail_ukuran,
                k.created_at,
                p.nama_produk,
                p.harga_estimasi,
                p.gambar_url
             FROM keranjang k
             INNER JOIN produk p
                ON k.id_produk = p.id_produk
             WHERE k.id_user = ?
             ORDER BY k.created_at DESC`,
            [req.session.userId]
        );

        return res.json({
            status: 'success',
            data: rows
        });

    } catch (error) {

        console.error('Error getCart:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server.'
        });
    }
};

// ==========================================
// 3. HAPUS ITEM DARI KERANJANG
// ==========================================

exports.removeFromCart = async (req, res) => {

    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Silakan login terlebih dahulu.'
        });
    }

    const id_user = req.session.userId;
    const id_keranjang = req.params.id;

    try {

        const [result] = await db.query(
            `DELETE FROM keranjang
             WHERE id_keranjang = ?
             AND id_user = ?`,
            [
                id_keranjang,
                id_user
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Item keranjang tidak ditemukan.'
            });
        }

        return res.json({
            status: 'success',
            message: 'Item berhasil dihapus dari keranjang.'
        });

    } catch (error) {

        console.error('Error removeFromCart:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server.'
        });
    }
};

// ==========================================
// 4. CHECKOUT SEMUA ITEM KERANJANG
// ==========================================

exports.checkoutCart = async (req, res) => {

    // --------------------------------------
    // CEK LOGIN
    // --------------------------------------

    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Silakan login terlebih dahulu.'
        });
    }

    const id_user = req.session.userId;

    const {
        alamat_pengiriman,
        metode_pembayaran,
        ongkir
    } = req.body;

    // --------------------------------------
    // VALIDASI ALAMAT
    // --------------------------------------

    if (
        typeof alamat_pengiriman !== 'string' ||
        !alamat_pengiriman.trim()
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Alamat pengiriman wajib diisi.'
        });
    }

    const alamatClean = alamat_pengiriman.trim();

    if (alamatClean.length > 2000) {
        return res.status(400).json({
            status: 'error',
            message: 'Alamat pengiriman terlalu panjang.'
        });
    }

    // --------------------------------------
    // VALIDASI METODE PEMBAYARAN
    // --------------------------------------

    const metodePembayaranClean =
        validasiMetodePembayaran(metode_pembayaran);

    if (!metodePembayaranClean) {
        return res.status(400).json({
            status: 'error',
            message: 'Metode pembayaran tidak valid.'
        });
    }

    // --------------------------------------
    // VALIDASI ONGKIR
    // --------------------------------------

    const ongkirTotal =
        validasiOngkir(ongkir);

    if (ongkirTotal === null) {
        return res.status(400).json({
            status: 'error',
            message: 'Ongkos kirim tidak valid.'
        });
    }

    let connection = null;
    let transactionStarted = false;

    try {

        // ==================================
        // MULAI TRANSAKSI DATABASE
        // ==================================

        connection = await db.getConnection();

        await connection.beginTransaction();

        transactionStarted = true;

        // ==================================
        // AMBIL DATA KERANJANG
        // ==================================

        const [cartItems] = await connection.query(
            `SELECT
                k.id_keranjang,
                k.id_produk,
                k.jumlah,
                k.detail_ukuran,
                p.nama_produk,
                p.harga_estimasi
             FROM keranjang k
             INNER JOIN produk p
                ON k.id_produk = p.id_produk
             WHERE k.id_user = ?
             ORDER BY k.id_keranjang ASC
             FOR UPDATE`,
            [id_user]
        );

        if (cartItems.length === 0) {

            await connection.rollback();

            transactionStarted = false;

            return res.status(400).json({
                status: 'error',
                message: 'Keranjang belanja Anda kosong.'
            });
        }

        // ==================================
        // HITUNG SUBTOTAL SELURUH PRODUK
        // ==================================

        let subtotalKeranjang = 0;

        for (const item of cartItems) {

            const harga = Number(item.harga_estimasi);
            const jumlah = Number(item.jumlah);

            if (
                !Number.isFinite(harga) ||
                harga < 0 ||
                !Number.isSafeInteger(jumlah) ||
                jumlah < 1
            ) {
                throw new Error(
                    `Data produk ${item.nama_produk} tidak valid.`
                );
            }

            const subtotalItem = harga * jumlah;

            if (!Number.isSafeInteger(subtotalItem)) {
                throw new Error(
                    `Subtotal produk ${item.nama_produk} tidak valid.`
                );
            }

            subtotalKeranjang += subtotalItem;
        }

        if (
            !Number.isSafeInteger(subtotalKeranjang) ||
            !Number.isSafeInteger(subtotalKeranjang + ongkirTotal)
        ) {
            throw new Error('Total pembayaran melebihi batas nilai yang valid.');
        }

        // ==================================
        // BAGIKAN ONGKIR SECARA AKURAT
        // ==================================

        /*
         * Contoh:
         *
         * Ongkir total = Rp15.000
         * Jumlah baris pesanan = 3
         *
         * Produk 1 = Rp5.000
         * Produk 2 = Rp5.000
         * Produk 3 = Rp5.000
         *
         * Jumlah ongkir seluruh pesanan
         * tetap Rp15.000.
         *
         * Jika tidak habis dibagi, sisa rupiah
         * dialokasikan ke baris awal.
         */

        const jumlahBaris = cartItems.length;

        const ongkirDasar = Math.floor(
            ongkirTotal / jumlahBaris
        );

        const sisaOngkir =
            ongkirTotal % jumlahBaris;

        // ==================================
        // SIAPKAN HASIL TRANSAKSI
        // ==================================

        let totalOngkirTersimpan = 0;
        let totalHargaTersimpan = 0;

        const daftarIdPesanan = [];

        // ==================================
        // SIMPAN SETIAP PRODUK KE PESANAN
        // ==================================

        for (let index = 0; index < cartItems.length; index++) {

            const item = cartItems[index];

            const harga = Number(item.harga_estimasi);
            const jumlah = Number(item.jumlah);

            // Alokasi ongkir untuk baris ini.
            const ongkirPerItem =
                ongkirDasar +
                (index < sisaOngkir ? 1 : 0);

            // Hitung subtotal produk.
            const subtotalItem =
                harga * jumlah;

            // Hitung total baris pesanan.
            const totalHargaItem =
                subtotalItem + ongkirPerItem;

            // Simpan ke database.
            const [insertResult] = await connection.query(
                `INSERT INTO pesanan (
                    id_user,
                    id_produk,
                    jumlah,
                    detail_ukuran,
                    alamat_pengiriman,
                    ongkir,
                    metode_pembayaran,
                    total_harga,
                    status,
                    tanggal_pesan
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu', NOW())`,
                [
                    id_user,
                    item.id_produk,
                    jumlah,
                    item.detail_ukuran || '-',
                    alamatClean,
                    ongkirPerItem,
                    metodePembayaranClean,
                    totalHargaItem
                ]
            );

            daftarIdPesanan.push(insertResult.insertId);

            totalOngkirTersimpan += ongkirPerItem;

            totalHargaTersimpan += totalHargaItem;
        }

        // ==================================
        // VERIFIKASI TOTAL
        // ==================================

        const totalSeharusnya =
            subtotalKeranjang + ongkirTotal;

        if (
            totalOngkirTersimpan !== ongkirTotal ||
            totalHargaTersimpan !== totalSeharusnya
        ) {
            throw new Error(
                'Perhitungan total pesanan tidak sesuai.'
            );
        }

        // ==================================
        // HAPUS KERANJANG SETELAH BERHASIL
        // ==================================

        await connection.query(
            `DELETE FROM keranjang
             WHERE id_user = ?`,
            [id_user]
        );

        // ==================================
        // SIMPAN NOTIFIKASI
        // ==================================

        await connection.query(
            `INSERT INTO notifikasi
                (id_user, pesan, is_read, tanggal)
             VALUES (?, ?, 0, NOW())`,
            [
                id_user,
                `Checkout ${cartItems.length} produk berhasil dibuat. Total pembayaran Rp ${totalSeharusnya.toLocaleString('id-ID')}.`
            ]
        );

        // ==================================
        // SELESAIKAN TRANSAKSI
        // ==================================

        await connection.commit();

        transactionStarted = false;

        // ==================================
        // RESPONSE BERHASIL
        // ==================================

        return res.status(200).json({

            status: 'success',

            message: 'Checkout berhasil!',

            data: {

                jumlah_produk: cartItems.length,

                subtotal: subtotalKeranjang,

                ongkir: totalOngkirTersimpan,

                total_harga: totalHargaTersimpan,

                metode_pembayaran: metodePembayaranClean,

                id_pesanan: daftarIdPesanan

            }

        });

    } catch (error) {

        // ==================================
        // ROLLBACK JIKA TERJADI KEGAGALAN
        // ==================================

        if (connection && transactionStarted) {

            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    'Rollback error:',
                    rollbackError
                );
            }

            transactionStarted = false;
        }

        console.error('Error checkoutCart:', error);

        return res.status(500).json({

            status: 'error',

            message: 'Kesalahan saat memproses checkout.',

            ...(process.env.NODE_ENV !== 'production'
                ? { detail: error.message }
                : {})

        });

    } finally {

        // ==================================
        // LEPASKAN KONEKSI
        // ==================================

        if (connection) {
            connection.release();
        }

    }
};
