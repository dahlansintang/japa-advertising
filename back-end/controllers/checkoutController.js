const db = require('../config/db');

/**
 * Mengambil ID pengguna dari session login.
 * Sesuai dengan authController.js.
 */
function getUserId(req) {
    return req.session?.userId ?? null;
}

/**
 * Memastikan nilai merupakan bilangan bulat positif.
 */
function parsePositiveInteger(value) {
    const number = Number(value);

    if (!Number.isSafeInteger(number) || number <= 0) {
        return null;
    }

    return number;
}

/**
 * Membuat notifikasi untuk pengguna.
 * Mengikuti struktur tabel notifikasi pada database.
 */
async function buatNotifikasi(
    connection,
    idUser,
    pesan,
    targetId = null,
    tipe = 'success'
) {
    await connection.query(
        `INSERT INTO notifikasi
            (id_user, pesan, tipe, link_tab, target_id, is_read, tanggal)
         VALUES (?, ?, ?, 'pesanan', ?, 0, CURRENT_TIMESTAMP)`,
        [idUser, pesan, tipe, targetId]
    );
}

/**
 * POST /api/pesanan/pesanan
 *
 * Membuat pesanan baru.
 */
exports.buatPesanan = async (req, res) => {
    const idUser = getUserId(req);

    if (!idUser) {
        return res.status(401).json({
            status: 'error',
            message: 'Silakan login terlebih dahulu.'
        });
    }

    const body = req.body || {};

    // Mendukung nama properti dari form lama maupun baru.
    const idProduk = parsePositiveInteger(body.id_produk);
    const jumlah = parsePositiveInteger(body.jumlah);

    const detailUkuran =
        typeof body.detail_ukuran === 'string'
            ? body.detail_ukuran.trim()
            : typeof body.ukuran === 'string'
                ? body.ukuran.trim()
                : '';

    const alamatPengiriman =
        typeof body.alamat_pengiriman === 'string'
            ? body.alamat_pengiriman.trim()
            : typeof body.alamat === 'string'
                ? body.alamat.trim()
                : '';

    const metodePembayaran =
        typeof body.metode_pembayaran === 'string'
            ? body.metode_pembayaran.trim()
            : 'Transfer Bank';

    const ongkir = Number(body.ongkir ?? 0);

    // Validasi input.
    if (!idProduk) {
        return res.status(400).json({
            status: 'error',
            message: 'ID produk tidak valid.'
        });
    }

    if (!jumlah) {
        return res.status(400).json({
            status: 'error',
            message: 'Jumlah pesanan harus berupa bilangan bulat positif.'
        });
    }

    if (!detailUkuran) {
        return res.status(400).json({
            status: 'error',
            message: 'Detail ukuran produk wajib diisi.'
        });
    }

    if (!alamatPengiriman) {
        return res.status(400).json({
            status: 'error',
            message: 'Alamat pengiriman wajib diisi.'
        });
    }

    if (
        !metodePembayaran ||
        metodePembayaran.length > 100
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Metode pembayaran tidak valid.'
        });
    }

    if (!Number.isFinite(ongkir) || ongkir < 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Biaya pengiriman tidak valid.'
        });
    }

    let connection;

    try {
        connection = await db.getConnection();

        await connection.beginTransaction();

        // Pastikan produk tersedia.
        const [produkRows] = await connection.query(
            `SELECT id_produk, nama_produk, harga_estimasi
             FROM produk
             WHERE id_produk = ?
             LIMIT 1`,
            [idProduk]
        );

        if (produkRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                status: 'error',
                message: 'Produk tidak ditemukan.'
            });
        }

        const produk = produkRows[0];
        const hargaProduk = Number(produk.harga_estimasi);

        if (
            !Number.isFinite(hargaProduk) ||
            hargaProduk < 0
        ) {
            await connection.rollback();

            return res.status(500).json({
                status: 'error',
                message: 'Harga produk pada database tidak valid.'
            });
        }

        /*
         * Mengikuti pola harga pada data pesanan yang Anda kirim:
         * total_harga = (harga_estimasi * jumlah) + ongkir.
         *
         * Perhitungan ini mengasumsikan harga_estimasi adalah harga
         * per unit. Produk dengan perhitungan khusus berdasarkan
         * ukuran perlu menggunakan rumus harga yang sesuai.
         */
        const totalHarga = (hargaProduk * jumlah) + ongkir;

        if (!Number.isFinite(totalHarga)) {
            await connection.rollback();

            return res.status(400).json({
                status: 'error',
                message: 'Total harga pesanan tidak valid.'
            });
        }

        // Simpan pesanan menggunakan nama kolom dari SQL Dump.
        const [hasilPesanan] = await connection.query(
            `INSERT INTO pesanan
                (
                    id_user,
                    id_produk,
                    detail_ukuran,
                    status,
                    tanggal_pesan,
                    jumlah,
                    ongkir,
                    total_harga,
                    alamat_pengiriman,
                    metode_pembayaran
                )
             VALUES (?, ?, ?, 'Menunggu', CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)`,
            [
                idUser,
                idProduk,
                detailUkuran,
                jumlah,
                ongkir,
                totalHarga,
                alamatPengiriman,
                metodePembayaran
            ]
        );

        const idPesanan = hasilPesanan.insertId;

        // Notifikasi untuk pelanggan.
        await buatNotifikasi(
            connection,
            idUser,
            `Pesanan "${produk.nama_produk}" (#${idPesanan}) berhasil dibuat dan sedang menunggu konfirmasi.`,
            idPesanan,
            'success'
        );

        await connection.commit();

        return res.status(201).json({
            status: 'success',
            message: 'Pesanan berhasil dibuat.',
            data: {
                id_pesanan: idPesanan,
                id_user: idUser,
                id_produk: idProduk,
                nama_produk: produk.nama_produk,
                detail_ukuran: detailUkuran,
                jumlah: jumlah,
                ongkir: ongkir,
                total_harga: totalHarga,
                alamat_pengiriman: alamatPengiriman,
                metode_pembayaran: metodePembayaran,
                status: 'Menunggu'
            }
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    'Gagal membatalkan transaksi:',
                    rollbackError.message
                );
            }
        }

        console.error('Gagal membuat pesanan:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan saat membuat pesanan.'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


/**
 * GET /api/pesanan/customer/orders
 *
 * Mengambil riwayat pesanan milik pengguna yang sedang login.
 */
exports.getRiwayatPesanan = async (req, res) => {
    const idUser = getUserId(req);

    if (!idUser) {
        return res.status(401).json({
            status: 'error',
            message: 'Silakan login terlebih dahulu.'
        });
    }

    try {
        const [pesanan] = await db.query(
            `SELECT
                p.*,
                pr.nama_produk,
                pr.harga_estimasi,
                pr.gambar_url
             FROM pesanan AS p
             INNER JOIN produk AS pr
                ON p.id_produk = pr.id_produk
             WHERE p.id_user = ?
             ORDER BY p.tanggal_pesan DESC`,
            [idUser]
        );

        return res.status(200).json({
            status: 'success',
            message: 'Riwayat pesanan berhasil diambil.',
            data: pesanan
        });
    } catch (error) {
        console.error('Gagal mengambil riwayat pesanan:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan saat mengambil riwayat pesanan.'
        });
    }
};