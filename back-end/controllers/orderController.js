const db = require('../config/db');

const STATUS_VALID = ['Menunggu', 'Diproses', 'Dikirim', 'Selesai', 'Batal'];

// =====================================================
// HELPER: AUTENTIKASI DAN VALIDASI
// =====================================================

function getSessionUser(req) {
    const idUser = req.session?.userId;
    const role = String(req.session?.role || '').toLowerCase();
    if (idUser === undefined || idUser === null || idUser === '') return null;
    return { idUser, role };
}

function isAdmin(user) {
    return user?.role === 'admin';
}

function sameId(a, b) {
    return String(a) === String(b);
}

function isValidId(value) {
    return (value !== undefined && value !== null && String(value).trim() !== '' && Number.isSafeInteger(Number(value)) && Number(value) > 0);
}

function parsePositiveInteger(value) {
    if (value === undefined || value === null || String(value).trim() === '') return null;
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number <= 0) return null;
    return number;
}

function parseNonNegativeNumber(value) {
    if (value === undefined || value === null || String(value).trim() === '') return null;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return null;
    return number;
}

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function validateText(value, maxLength = 5000) {
    return (typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength);
}

function validatePaymentMethod(value) {
    if (typeof value === 'object' && value !== null) return true;
    return validateText(value, 200);
}

function extractPaymentMethodString(value) {
    if (typeof value === 'object' && value !== null) {
        return value.nama || value.metode || value.type || value.nama_metode || JSON.stringify(value);
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (typeof parsed === 'object' && parsed !== null) {
                    if (Array.isArray(parsed)) return parsed.join('');
                    if (Object.keys(parsed).every(k => !isNaN(k))) return Object.values(parsed).join('');
                    return parsed.nama || parsed.metode || parsed.type || parsed.nama_metode || trimmed;
                }
            } catch (e) {
                return trimmed;
            }
        }
        return trimmed;
    }
    return String(value || 'Transfer Bank').trim();
}

function calculateTotal(harga, jumlah, ongkir) {
    const total = Number(harga) * Number(jumlah) + Number(ongkir);
    if (!Number.isFinite(total) || total < 0) throw new Error('Perhitungan total harga tidak valid.');
    return Math.round(total * 100) / 100;
}

async function addNotification(connection, idUser, pesan, tipe = 'success', targetId = null) {
    await connection.query(
        `INSERT INTO notifikasi (id_user, pesan, tipe, link_tab, target_id, is_read, tanggal) VALUES (?, ?, ?, 'pesanan', ?, 0, NOW())`,
        [idUser, pesan, tipe, targetId]
    );
}

function sendServerError(res, error, message) {
    console.error(message, error);
    return res.status(500).json({ status: 'error', message });
}

// =====================================================
// 1. MEMBUAT PESANAN BARU (SATUAN)
// =====================================================

exports.buatPesanan = async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });

    const { id_produk, jumlah, detail_ukuran, alamat_pengiriman, ongkir, metode_pembayaran } = req.body || {};

    if (!isValidId(id_produk)) return res.status(400).json({ status: 'error', message: 'ID produk tidak valid.' });
    
    const jumlahValid = parsePositiveInteger(jumlah);
    if (!jumlahValid) return res.status(400).json({ status: 'error', message: 'Jumlah pesanan harus berupa bilangan bulat lebih dari nol.' });
    if (!validateText(alamat_pengiriman, 2000)) return res.status(400).json({ status: 'error', message: 'Alamat pengiriman wajib diisi.' });
    if (!validatePaymentMethod(metode_pembayaran)) return res.status(400).json({ status: 'error', message: 'Metode pembayaran wajib diisi.' });

    const metodePembayaranString = extractPaymentMethodString(metode_pembayaran);
    const detailUkuranValid = typeof detail_ukuran === 'string' && detail_ukuran.trim() ? detail_ukuran.trim() : 'Belum ada detail ukuran';
    if (detailUkuranValid.length > 10000) return res.status(400).json({ status: 'error', message: 'Detail ukuran terlalu panjang.' });

    const ongkirValid = ongkir === undefined ? 0 : parseNonNegativeNumber(ongkir);
    if (ongkirValid === null) return res.status(400).json({ status: 'error', message: 'Ongkos kirim tidak valid.' });

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [produkRows] = await connection.query(`SELECT id_produk, nama_produk, harga_estimasi FROM produk WHERE id_produk = ? FOR UPDATE`, [Number(id_produk)]);
        if (produkRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan.' });
        }

        const produk = produkRows[0];
        const harga = Number(produk.harga_estimasi);
        if (!Number.isFinite(harga) || harga < 0) {
            await connection.rollback();
            return res.status(400).json({ status: 'error', message: 'Harga produk tidak valid.' });
        }

        const totalHarga = calculateTotal(harga, jumlahValid, ongkirValid);

        const [result] = await connection.query(
            `INSERT INTO pesanan (id_user, id_produk, detail_ukuran, status, tanggal_pesan, jumlah, ongkir, total_harga, alamat_pengiriman, metode_pembayaran)
             VALUES (?, ?, ?, 'Menunggu', NOW(), ?, ?, ?, ?, ?)`,
            [user.idUser, produk.id_produk, detailUkuranValid, jumlahValid, ongkirValid, totalHarga, alamat_pengiriman.trim(), metodePembayaranString]
        );
        const idPesanan = result.insertId;

        // Notifikasi untuk Pelanggan & Admin
        await addNotification(connection, user.idUser, `Pesanan "${produk.nama_produk}" berhasil dibuat dan sedang menunggu konfirmasi.`, 'success', idPesanan);
        const [adminRows] = await connection.query(`SELECT id_user FROM users WHERE role = 'admin'`);
        for (const admin of adminRows) {
            await addNotification(connection, admin.id_user, `🛒 Pesanan Baru! "${produk.nama_produk}" (Qty: ${jumlahValid}) telah masuk.`, 'success', idPesanan);
        }

        await connection.commit();
        return res.status(201).json({
            status: 'success', message: 'Pesanan berhasil dibuat.', id_pesanan: idPesanan,
            data: { id_pesanan: idPesanan, id_produk: produk.id_produk, nama_produk: produk.nama_produk, jumlah: jumlahValid, harga_satuan: harga, ongkir: ongkirValid, total_harga: totalHarga, status: 'Menunggu' }
        });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        return sendServerError(res, error, 'Terjadi kesalahan saat membuat pesanan.');
    } finally {
        if (connection) connection.release();
    }
};

// =====================================================
// 1B. MEMBUAT PESANAN DARI KERANJANG (CHECKOUT KERANJANG)
// =====================================================

exports.buatPesananKeranjang = async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });

    const { alamat_pengiriman, ongkir, metode_pembayaran } = req.body || {};

    if (!validateText(alamat_pengiriman, 2000)) return res.status(400).json({ status: 'error', message: 'Alamat pengiriman wajib diisi.' });
    const alamatClean = alamat_pengiriman.trim();

    if (!validatePaymentMethod(metode_pembayaran)) return res.status(400).json({ status: 'error', message: 'Metode pembayaran wajib diisi.' });
    const metodePembayaranClean = extractPaymentMethodString(metode_pembayaran);

    const ongkirTotal = parseNonNegativeNumber(ongkir);
    if (ongkirTotal === null) return res.status(400).json({ status: 'error', message: 'Ongkos kirim tidak valid.' });

    let connection = null;
    let transactionStarted = false;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [cartItems] = await connection.query(
            `SELECT k.id_keranjang, k.id_produk, k.jumlah, k.detail_ukuran, p.nama_produk, p.harga_estimasi
             FROM keranjang k INNER JOIN produk p ON k.id_produk = p.id_produk
             WHERE k.id_user = ? ORDER BY k.id_keranjang ASC FOR UPDATE`,
            [user.idUser]
        );

        if (cartItems.length === 0) {
            await connection.rollback();
            transactionStarted = false;
            return res.status(400).json({ status: 'error', message: 'Keranjang belanja Anda kosong.' });
        }

        let subtotalKeranjang = 0;
        for (const item of cartItems) {
            const harga = Number(item.harga_estimasi);
            const jumlah = Number(item.jumlah);
            if (!Number.isFinite(harga) || harga < 0 || !Number.isSafeInteger(jumlah) || jumlah < 1) throw new Error(`Data produk ${item.nama_produk} tidak valid.`);
            const subtotalItem = harga * jumlah;
            if (!Number.isSafeInteger(subtotalItem)) throw new Error(`Subtotal produk ${item.nama_produk} tidak valid.`);
            subtotalKeranjang += subtotalItem;
        }

        if (!Number.isSafeInteger(subtotalKeranjang) || !Number.isSafeInteger(subtotalKeranjang + ongkirTotal)) {
            throw new Error('Total pembayaran melebihi batas nilai yang valid.');
        }

        const jumlahBaris = cartItems.length;
        const ongkirDasar = Math.floor(ongkirTotal / jumlahBaris);
        const sisaOngkir = ongkirTotal % jumlahBaris;

        let totalOngkirTersimpan = 0;
        let totalHargaTersimpan = 0;
        const daftarIdPesanan = [];

        for (let index = 0; index < cartItems.length; index++) {
            const item = cartItems[index];
            const harga = Number(item.harga_estimasi);
            const jumlah = Number(item.jumlah);
            const detailUkuranValid = validateText(item.detail_ukuran, 10000) ? item.detail_ukuran.trim() : '-';

            const ongkirPerItem = ongkirDasar + (index < sisaOngkir ? 1 : 0);
            const subtotalItem = harga * jumlah;
            const totalHargaItem = subtotalItem + ongkirPerItem;

            const [insertResult] = await connection.query(
                `INSERT INTO pesanan (id_user, id_produk, jumlah, detail_ukuran, alamat_pengiriman, ongkir, metode_pembayaran, total_harga, status, tanggal_pesan)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu', NOW())`,
                [user.idUser, item.id_produk, jumlah, detailUkuranValid, alamatClean, ongkirPerItem, metodePembayaranClean, totalHargaItem]
            );

            daftarIdPesanan.push(insertResult.insertId);
            totalOngkirTersimpan += ongkirPerItem;
            totalHargaTersimpan += totalHargaItem;
        }

        const totalSeharusnya = subtotalKeranjang + ongkirTotal;
        if (totalOngkirTersimpan !== ongkirTotal || totalHargaTersimpan !== totalSeharusnya) throw new Error('Perhitungan total pesanan tidak sesuai.');

        await connection.query(`DELETE FROM keranjang WHERE id_user = ?`, [user.idUser]);

        // Notifikasi untuk Pelanggan & Admin
        await addNotification(connection, user.idUser, `Checkout ${cartItems.length} produk berhasil dibuat. Total pembayaran Rp ${totalSeharusnya.toLocaleString('id-ID')}.`, 'success', daftarIdPesanan[0]);
        const [adminRows] = await connection.query(`SELECT id_user FROM users WHERE role = 'admin'`);
        for (const admin of adminRows) {
            await addNotification(connection, admin.id_user, `🛒 Pesanan Keranjang Baru! Ada ${cartItems.length} produk telah di-checkout oleh pelanggan.`, 'success', daftarIdPesanan[0]);
        }

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            status: 'success', message: 'Pesanan keranjang berhasil dibuat.',
            data: { jumlah_produk: cartItems.length, subtotal: subtotalKeranjang, ongkir: totalOngkirTersimpan, total_harga: totalHargaTersimpan, metode_pembayaran: metodePembayaranClean, inserted_ids: daftarIdPesanan }
        });
    } catch (error) {
        if (connection && transactionStarted) await connection.rollback().catch(() => {});
        return sendServerError(res, error, 'Terjadi kesalahan saat memproses pesanan keranjang.');
    } finally {
        if (connection) connection.release();
    }
};

// =====================================================
// 2. MENGAMBIL SEMUA PESANAN
// =====================================================

exports.getAllOrders = async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    if (!isAdmin(user)) return res.status(403).json({ status: 'error', message: 'Akses hanya untuk admin.' });

    try {
        const [rows] = await db.query(
            `SELECT p.id_pesanan, p.id_user, u.nama_lengkap, u.email, pr.nama_produk, pr.harga_estimasi, pr.gambar_url, 
                    p.detail_ukuran, p.jumlah, p.ongkir, p.total_harga, p.alamat_pengiriman, p.metode_pembayaran, p.status, p.tanggal_pesan
             FROM pesanan p INNER JOIN users u ON p.id_user = u.id_user INNER JOIN produk pr ON p.id_produk = pr.id_produk
             ORDER BY p.tanggal_pesan DESC`
        );
        return res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        return sendServerError(res, error, 'Gagal mengambil daftar pesanan.');
    }
};

// =====================================================
// 3. RIWAYAT PESANAN PELANGGAN
// =====================================================

exports.getRiwayatPesanan = async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });

    try {
        const [rows] = await db.query(
            `SELECT p.*, pr.nama_produk, pr.deskripsi, pr.harga_estimasi, pr.gambar_url
             FROM pesanan p INNER JOIN produk pr ON p.id_produk = pr.id_produk
             WHERE p.id_user = ? ORDER BY p.tanggal_pesan DESC`,
            [user.idUser]
        );
        return res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        return sendServerError(res, error, 'Gagal mengambil riwayat pesanan.');
    }
};

// =====================================================
// 4. MEMPERBARUI STATUS PESANAN
// =====================================================

exports.updateOrderStatus = async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });

    const { id } = req.params;
    const { status } = req.body || {};

    if (!isValidId(id)) return res.status(400).json({ status: 'error', message: 'ID pesanan tidak valid.' });
    if (!STATUS_VALID.includes(status)) return res.status(400).json({ status: 'error', message: 'Status pesanan tidak valid.' });
    if (!isAdmin(user) && status !== 'Batal') return res.status(403).json({ status: 'error', message: 'Pelanggan hanya dapat membatalkan pesanan.' });

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(`SELECT p.id_pesanan, p.id_user, p.status, pr.nama_produk FROM pesanan p INNER JOIN produk pr ON p.id_produk = pr.id_produk WHERE p.id_pesanan = ? FOR UPDATE`, [Number(id)]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan.' });
        }

        const order = rows[0];
        if (!isAdmin(user)) {
            if (!sameId(order.id_user, user.idUser)) {
                await connection.rollback();
                return res.status(403).json({ status: 'error', message: 'Anda tidak berhak mengubah pesanan ini.' });
            }
            if (order.status !== 'Menunggu') {
                await connection.rollback();
                return res.status(400).json({ status: 'error', message: 'Hanya pesanan berstatus Menunggu yang dapat dibatalkan.' });
            }
        }

        if (order.status === status) {
            await connection.rollback();
            return res.status(400).json({ status: 'error', message: 'Pesanan sudah memiliki status tersebut.' });
        }

        await connection.query(`UPDATE pesanan SET status = ? WHERE id_pesanan = ?`, [status, Number(id)]);
        await addNotification(connection, order.id_user, `Status pesanan "${order.nama_produk}" telah diperbarui menjadi: ${status}.`, status === 'Batal' ? 'info' : 'success', order.id_pesanan);

        await connection.commit();
        return res.status(200).json({ status: 'success', message: 'Status pesanan berhasil diperbarui.', data: { id_pesanan: order.id_pesanan, status } });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        return sendServerError(res, error, 'Gagal memperbarui status pesanan.');
    } finally {
        if (connection) connection.release();
    }
};

// =====================================================
// 5. MEMPERBARUI DETAIL PESANAN
// =====================================================

exports.updateOrder = async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });

    const { id } = req.params;
    const body = req.body || {};

    if (!isValidId(id)) return res.status(400).json({ status: 'error', message: 'ID pesanan tidak valid.' });

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(`SELECT p.*, pr.nama_produk, pr.harga_estimasi FROM pesanan p INNER JOIN produk pr ON p.id_produk = pr.id_produk WHERE p.id_pesanan = ? FOR UPDATE`, [Number(id)]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan.' });
        }

        const order = rows[0];
        if (!isAdmin(user)) {
            if (!sameId(order.id_user, user.idUser)) {
                await connection.rollback();
                return res.status(403).json({ status: 'error', message: 'Anda tidak berhak mengubah pesanan ini.' });
            }
            if (order.status !== 'Menunggu') {
                await connection.rollback();
                return res.status(400).json({ status: 'error', message: 'Pesanan yang sudah diproses tidak dapat diubah.' });
            }
        }

        let jumlahValid = Number(order.jumlah);
        if (hasOwn(body, 'jumlah')) {
            jumlahValid = parsePositiveInteger(body.jumlah);
            if (!jumlahValid) { await connection.rollback(); return res.status(400).json({ status: 'error', message: 'Jumlah harus berupa bilangan bulat.' }); }
        }

        let detailUkuran = order.detail_ukuran;
        if (hasOwn(body, 'detail_ukuran')) {
            if (!validateText(body.detail_ukuran, 10000)) { await connection.rollback(); return res.status(400).json({ status: 'error', message: 'Detail ukuran tidak valid.' }); }
            detailUkuran = body.detail_ukuran.trim();
        }

        let alamat = order.alamat_pengiriman;
        if (hasOwn(body, 'alamat_pengiriman')) {
            if (!validateText(body.alamat_pengiriman, 2000)) { await connection.rollback(); return res.status(400).json({ status: 'error', message: 'Alamat pengiriman tidak valid.' }); }
            alamat = body.alamat_pengiriman.trim();
        }

        let metodePembayaran = order.metode_pembayaran;
        if (hasOwn(body, 'metode_pembayaran')) {
            if (!validatePaymentMethod(body.metode_pembayaran)) { await connection.rollback(); return res.status(400).json({ status: 'error', message: 'Metode pembayaran tidak valid.' }); }
            metodePembayaran = extractPaymentMethodString(body.metode_pembayaran);
        }

        let ongkirValid = Number(order.ongkir || 0);
        if (hasOwn(body, 'ongkir')) {
            ongkirValid = parseNonNegativeNumber(body.ongkir);
            if (ongkirValid === null) { await connection.rollback(); return res.status(400).json({ status: 'error', message: 'Ongkos kirim tidak valid.' }); }
        }

        const harga = Number(order.harga_estimasi);
        if (!Number.isFinite(harga) || harga < 0) { await connection.rollback(); return res.status(400).json({ status: 'error', message: 'Harga produk tidak valid.' }); }

        const totalHarga = calculateTotal(harga, jumlahValid, ongkirValid);

        await connection.query(`UPDATE pesanan SET detail_ukuran = ?, jumlah = ?, alamat_pengiriman = ?, metode_pembayaran = ?, ongkir = ?, total_harga = ? WHERE id_pesanan = ?`,
            [detailUkuran, jumlahValid, alamat, metodePembayaran, ongkirValid, totalHarga, Number(id)]);

        // Notifikasi untuk Pelanggan & Admin
        await addNotification(connection, order.id_user, `Pesanan ${order.id_pesanan} berhasil diperbarui.`, 'success', order.id_pesanan);
        const [adminRows] = await connection.query(`SELECT id_user FROM users WHERE role = 'admin'`);
        for (const admin of adminRows) {
            await addNotification(connection, admin.id_user, `✏️ Pesanan ${order.id_pesanan} ("${order.nama_produk}") telah diedit/diperbarui oleh pelanggan.`, 'success', order.id_pesanan);
        }

        await connection.commit();
        return res.status(200).json({
            status: 'success', message: 'Pesanan berhasil diperbarui.',
            data: { id_pesanan: Number(id), jumlah: jumlahValid, harga_satuan: harga, ongkir: ongkirValid, total_harga: totalHarga, status: order.status }
        });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        return sendServerError(res, error, 'Gagal memperbarui pesanan.');
    } finally {
        if (connection) connection.release();
    }
};