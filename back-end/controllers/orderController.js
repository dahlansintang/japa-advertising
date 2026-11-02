const db = require('../config/db');
const { calculateSelectedShipping } = require('../utils/shippingCalculator');

const STATUS_VALID = ['Menunggu', 'Diproses', 'Dikirim', 'Selesai', 'Batal'];
const STATUS_TRANSITIONS = {
    Menunggu: ['Diproses', 'Batal'],
    Diproses: ['Dikirim', 'Batal'],
    Dikirim: ['Selesai'],
    Selesai: [],
    Batal: []
};

function getSessionUser(req) {
    const idUser = req.session?.userId;
    const role = String(req.session?.role || '').toLowerCase();
    return idUser !== undefined && idUser !== null && idUser !== ''
        ? { idUser, role } : null;
}
function isAdmin(user) { return user?.role === 'admin'; }
function sameId(a, b) { return String(a) === String(b); }
function validId(v) { return Number.isSafeInteger(Number(v)) && Number(v) > 0; }
function positiveInt(v) {
    const n = Number(v);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
}
function validText(v, max = 2000) {
    return typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
}
function paymentMethod(v) {
    if (typeof v !== 'string' || !v.trim() || v.trim().length > 100) return null;
    const allowed = ['Transfer Bank BCA', 'Transfer Bank Mandiri', 'Transfer Bank BNI', 'E-Wallet (GoPay / OVO / Dana)', 'Bayar di Toko (Tunai)'];
    return allowed.includes(v.trim()) ? v.trim() : null;
}
function sendServerError(res, error, message) {
    console.error(message, error);
    return res.status(500).json({ status: 'error', message });
}
async function addNotification(conn, userId, message, type = 'success', targetId = null) {
    await conn.query(
        `INSERT INTO notifikasi (id_user, pesan, tipe, link_tab, target_id, is_read, tanggal)
         VALUES (?, ?, ?, 'pesanan', ?, 0, NOW())`,
        [userId, message, type, targetId]
    );
}
function money(n) {
    const value = Number(n);
    if (!Number.isFinite(value) || value < 0) throw new Error('Nilai pembayaran tidak valid.');
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
function shippingInput(body) {
    const city = body.destinationName || body.kota_tujuan;
    const province = body.provinceName || body.provinsi_tujuan;
    const serviceCode = body.serviceCode || body.kode_layanan;

    if (!city || !province || !serviceCode) {
        throw new Error('Pilih kabupaten/kota, provinsi, dan layanan pengiriman.');
    }
    return {
        city: String(city).trim(),
        province: String(province).trim(),
        serviceCode: String(serviceCode).trim()
    };
}
function allocateShipping(items, shippingTotal) {
    const weights = items.map(i => Number(i.berat || 1000) * Number(i.jumlah));
    const sumWeight = weights.reduce((a, b) => a + b, 0);
    let allocated = 0;
    return items.map((item, index) => {
        const part = index === items.length - 1
            ? shippingTotal - allocated
            : Math.floor(shippingTotal * (sumWeight > 0 ? weights[index] / sumWeight : 1 / items.length));
        allocated += part;
        return part;
    });
}

// Checkout satu produk
exports.buatPesanan = async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });

    const body = req.body || {};
    const productId = Number(body.id_produk);
    const qty = positiveInt(body.jumlah);
    if (!validId(productId) || !qty || qty > 1000) {
        return res.status(400).json({ status: 'error', message: 'Produk atau jumlah pesanan tidak valid.' });
    }
    if (!validText(body.alamat_pengiriman, 2000) || !validText(body.detail_ukuran || '-', 10000)) {
        return res.status(400).json({ status: 'error', message: 'Alamat atau detail ukuran tidak valid.' });
    }
    const payment = paymentMethod(body.metode_pembayaran);
    if (!payment) return res.status(400).json({ status: 'error', message: 'Metode pembayaran tidak valid.' });

    let conn;
    try {
        const shipping = shippingInput(body);
        conn = await db.getConnection();
        await conn.beginTransaction();

        const [products] = await conn.query(
            `SELECT id_produk, nama_produk, harga_estimasi, berat
             FROM produk WHERE id_produk = ? FOR UPDATE`,
            [productId]
        );
        if (!products.length) {
            await conn.rollback();
            return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan.' });
        }

        const product = products[0];
        const unitPrice = money(product.harga_estimasi);
        const weight = Number(product.berat || 1000) * qty;
        if (!Number.isSafeInteger(weight) || weight < 1 || weight > 100000) {
            await conn.rollback();
            return res.status(400).json({ status: 'error', message: 'Berat pesanan maksimal 100 kg.' });
        }
        const quote = calculateSelectedShipping(shipping.city, shipping.province, weight, shipping.serviceCode);
        const subtotal = money(unitPrice * qty);
        const total = money(subtotal + quote.cost);

        const [insert] = await conn.query(
            `INSERT INTO pesanan
             (id_user, id_produk, detail_ukuran, status, tanggal_pesan, jumlah, ongkir, total_harga,
              alamat_pengiriman, metode_pembayaran, harga_satuan, ekspedisi, layanan_pengiriman,
              kota_tujuan, provinsi_tujuan, kode_layanan)
             VALUES (?, ?, ?, 'Menunggu', NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user.idUser, product.id_produk, (body.detail_ukuran || '-').trim(), qty, quote.cost, total,
             body.alamat_pengiriman.trim(), payment, unitPrice, quote.courier, quote.service,
             shipping.city, shipping.province, quote.code]
        );
        const orderId = insert.insertId;

        await addNotification(conn, user.idUser, `Pesanan "${product.nama_produk}" berhasil dibuat dan menunggu konfirmasi.`, 'success', orderId);
        const [admins] = await conn.query(`SELECT id_user FROM users WHERE role = 'admin'`);
        for (const admin of admins) {
            await addNotification(conn, admin.id_user, `Pesanan baru "${product.nama_produk}" (Qty: ${qty}) telah masuk.`, 'success', orderId);
        }

        await conn.commit();
        return res.status(201).json({
            status: 'success', message: 'Pesanan berhasil dibuat.',
            data: { id_pesanan: orderId, nama_produk: product.nama_produk, jumlah: qty,
                harga_satuan: unitPrice, subtotal, ongkir: quote.cost, total_harga: total,
                ekspedisi: quote.courier, layanan_pengiriman: quote.service, status: 'Menunggu' }
        });
    } catch (error) {
        if (conn) await conn.rollback().catch(() => {});
        return sendServerError(res, error, 'Terjadi kesalahan saat membuat pesanan.');
    } finally {
        if (conn) conn.release();
    }
};

// Checkout keranjang
exports.buatPesananKeranjang = async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });

    const body = req.body || {};
    if (!validText(body.alamat_pengiriman, 2000)) {
        return res.status(400).json({ status: 'error', message: 'Alamat pengiriman wajib diisi.' });
    }
    const payment = paymentMethod(body.metode_pembayaran);
    if (!payment) return res.status(400).json({ status: 'error', message: 'Metode pembayaran tidak valid.' });

    let conn;
    try {
        const shipping = shippingInput(body);
        conn = await db.getConnection();
        await conn.beginTransaction();

        const [items] = await conn.query(
            `SELECT k.id_keranjang, k.id_produk, k.jumlah, k.detail_ukuran,
                    p.nama_produk, p.harga_estimasi, p.berat
             FROM keranjang k
             INNER JOIN produk p ON p.id_produk = k.id_produk
             WHERE k.id_user = ? ORDER BY k.id_keranjang FOR UPDATE`,
            [user.idUser]
        );
        if (!items.length) {
            await conn.rollback();
            return res.status(400).json({ status: 'error', message: 'Keranjang belanja Anda kosong.' });
        }

        let totalWeight = 0;
        let subtotal = 0;
        for (const item of items) {
            const qty = positiveInt(item.jumlah);
            const weight = Number(item.berat || 1000);
            const price = money(item.harga_estimasi);
            if (!qty || qty > 1000 || !Number.isSafeInteger(weight) || weight < 1) {
                throw new Error(`Data produk "${item.nama_produk}" tidak valid.`);
            }
            totalWeight += weight * qty;
            subtotal += money(price * qty);
        }
        if (!Number.isSafeInteger(totalWeight) || totalWeight > 100000) {
            throw new Error('Berat total keranjang maksimal 100 kg.');
        }

        const quote = calculateSelectedShipping(shipping.city, shipping.province, totalWeight, shipping.serviceCode);
        const shippingParts = allocateShipping(items, quote.cost);
        const orderIds = [];
        let totalStored = 0;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const qty = Number(item.jumlah);
            const price = money(item.harga_estimasi);
            const itemShipping = shippingParts[i];
            const itemTotal = money(price * qty + itemShipping);

            const [insert] = await conn.query(
                `INSERT INTO pesanan
                 (id_user, id_produk, detail_ukuran, status, tanggal_pesan, jumlah, ongkir, total_harga,
                  alamat_pengiriman, metode_pembayaran, harga_satuan, ekspedisi, layanan_pengiriman,
                  kota_tujuan, provinsi_tujuan, kode_layanan)
                 VALUES (?, ?, ?, 'Menunggu', NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [user.idUser, item.id_produk, item.detail_ukuran || '-', qty, itemShipping, itemTotal,
                 body.alamat_pengiriman.trim(), payment, price, quote.courier, quote.service,
                 shipping.city, shipping.province, quote.code]
            );
            orderIds.push(insert.insertId);
            totalStored += itemTotal;
        }

        await conn.query('DELETE FROM keranjang WHERE id_user = ?', [user.idUser]);
        const grandTotal = money(subtotal + quote.cost);

        await addNotification(conn, user.idUser,
            `Checkout ${items.length} produk berhasil dibuat. Total pembayaran Rp ${grandTotal.toLocaleString('id-ID')}.`,
            'success', orderIds[0]);

        const [admins] = await conn.query(`SELECT id_user FROM users WHERE role = 'admin'`);
        for (const admin of admins) {
            await addNotification(conn, admin.id_user,
                `Pesanan keranjang baru (${items.length} produk) telah dibuat pelanggan.`, 'success', orderIds[0]);
        }

        if (money(totalStored) !== grandTotal) throw new Error('Rekonsiliasi total checkout keranjang gagal.');
        await conn.commit();

        return res.status(201).json({
            status: 'success', message: 'Pesanan keranjang berhasil dibuat.',
            data: { jumlah_produk: items.length, subtotal, berat_gram: totalWeight, ongkir: quote.cost,
                total_harga: grandTotal, ekspedisi: quote.courier, layanan_pengiriman: quote.service,
                inserted_ids: orderIds }
        });
    } catch (error) {
        if (conn) await conn.rollback().catch(() => {});
        return sendServerError(res, error, 'Terjadi kesalahan saat memproses pesanan keranjang.');
    } finally {
        if (conn) conn.release();
    }
};

exports.getAllOrders = async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    if (!isAdmin(user)) return res.status(403).json({ status: 'error', message: 'Akses hanya untuk admin.' });
    try {
        const [rows] = await db.query(
            `SELECT p.*, u.nama_lengkap, u.email, pr.nama_produk, pr.gambar_url, pr.berat,
                    COALESCE(p.harga_satuan, p.total_harga) AS harga_satuan
             FROM pesanan p
             INNER JOIN users u ON u.id_user = p.id_user
             LEFT JOIN produk pr ON pr.id_produk = p.id_produk
             ORDER BY p.tanggal_pesan DESC`
        );
        return res.json({ status: 'success', data: rows });
    } catch (error) { return sendServerError(res, error, 'Gagal mengambil daftar pesanan.'); }
};

exports.getRiwayatPesanan = async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    try {
        const [rows] = await db.query(
            `SELECT p.*, pr.nama_produk, pr.deskripsi, pr.gambar_url, pr.berat,
                    COALESCE(p.harga_satuan, pr.harga_estimasi, 0) AS harga_satuan
             FROM pesanan p LEFT JOIN produk pr ON pr.id_produk = p.id_produk
             WHERE p.id_user = ? ORDER BY p.tanggal_pesan DESC`,
            [user.idUser]
        );
        return res.json({ status: 'success', data: rows });
    } catch (error) { return sendServerError(res, error, 'Gagal mengambil riwayat pesanan.'); }
};

exports.updateOrderStatus = async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    const id = Number(req.params.id);
    const nextStatus = req.body?.status;
    if (!validId(id)) return res.status(400).json({ status: 'error', message: 'ID pesanan tidak valid.' });
    if (!STATUS_VALID.includes(nextStatus)) return res.status(400).json({ status: 'error', message: 'Status pesanan tidak valid.' });
    if (!isAdmin(user) && nextStatus !== 'Batal') {
        return res.status(403).json({ status: 'error', message: 'Pelanggan hanya dapat membatalkan pesanan.' });
    }

    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();
        const [rows] = await conn.query(
            `SELECT p.id_pesanan, p.id_user, p.status, p.id_produk, pr.nama_produk
             FROM pesanan p LEFT JOIN produk pr ON pr.id_produk = p.id_produk
             WHERE p.id_pesanan = ? FOR UPDATE`, [id]);
        if (!rows.length) {
            await conn.rollback();
            return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan.' });
        }
        const order = rows[0];
        if (!isAdmin(user) && !sameId(order.id_user, user.idUser)) {
            await conn.rollback();
            return res.status(403).json({ status: 'error', message: 'Anda tidak berhak mengubah pesanan ini.' });
        }
        if (!STATUS_TRANSITIONS[order.status]?.includes(nextStatus)) {
            await conn.rollback();
            return res.status(400).json({ status: 'error', message: `Perubahan status ${order.status} ke ${nextStatus} tidak diperbolehkan.` });
        }
        await conn.query('UPDATE pesanan SET status = ? WHERE id_pesanan = ?', [nextStatus, id]);
        await addNotification(conn, order.id_user,
            `Status pesanan "${order.nama_produk || 'Produk'}" diperbarui menjadi ${nextStatus}.`,
            nextStatus === 'Batal' ? 'info' : 'success', id);
        await conn.commit();
        return res.json({ status: 'success', message: 'Status pesanan berhasil diperbarui.', data: { id_pesanan: id, status: nextStatus } });
    } catch (error) {
        if (conn) await conn.rollback().catch(() => {});
        return sendServerError(res, error, 'Gagal memperbarui status pesanan.');
    } finally { if (conn) conn.release(); }
};

exports.updateOrder = async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ status: 'error', message: 'Silakan login terlebih dahulu.' });
    const id = Number(req.params.id);
    if (!validId(id)) return res.status(400).json({ status: 'error', message: 'ID pesanan tidak valid.' });
    if (isAdmin(user)) return res.status(403).json({ status: 'error', message: 'Admin mengelola status pesanan, bukan mengubah detail checkout pelanggan.' });

    const body = req.body || {};
    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        // =======================================================
        // MODE 1: PESANAN KERANJANG LEBIH DARI 1 ITEM
        // =======================================================
        if (body.is_batch && Array.isArray(body.items) && body.items.length > 0) {
            const itemIds = body.items.map(i => Number(i.id_pesanan));
            
            const [rows] = await conn.query(
                `SELECT p.*, pr.nama_produk, pr.harga_estimasi, pr.berat
                 FROM pesanan p INNER JOIN produk pr ON pr.id_produk = p.id_produk
                 WHERE p.id_pesanan IN (?) FOR UPDATE`, [itemIds]
            );

            if (rows.length !== itemIds.length) {
                await conn.rollback();
                return res.status(404).json({ status: 'error', message: 'Beberapa pesanan tidak ditemukan.' });
            }

            let totalWeight = 0;
            const itemsData = [];

            for (const order of rows) {
                if (!sameId(order.id_user, user.idUser)) {
                    await conn.rollback(); return res.status(403).json({ status: 'error', message: 'Akses ditolak.' });
                }
                if (order.status !== 'Menunggu') {
                    await conn.rollback(); return res.status(400).json({ status: 'error', message: 'Hanya pesanan Menunggu yang dapat diubah.' });
                }

                const inputItem = body.items.find(i => i.id_pesanan == order.id_pesanan);
                const qty = inputItem.jumlah === undefined ? Number(order.jumlah) : positiveInt(inputItem.jumlah);
                if (!qty || qty > 1000) {
                    await conn.rollback(); return res.status(400).json({ status: 'error', message: 'Jumlah pesanan tidak valid.' });
                }

                const detail = inputItem.detail_ukuran === undefined ? order.detail_ukuran : String(inputItem.detail_ukuran).trim();
                const weight = Number(order.berat || 1000);
                totalWeight += weight * qty;

                itemsData.push({
                    id_pesanan: order.id_pesanan,
                    qty, detail, weight,
                    harga_satuan: order.harga_satuan,
                    harga_estimasi: order.harga_estimasi
                });
            }

            const address = body.alamat_pengiriman === undefined ? rows[0].alamat_pengiriman : body.alamat_pengiriman.trim();
            const city = body.destinationName === undefined ? rows[0].kota_tujuan : body.destinationName;
            const province = body.provinceName === undefined ? rows[0].provinsi_tujuan : body.provinceName;
            const serviceCode = body.serviceCode === undefined ? rows[0].kode_layanan : body.serviceCode;
            const paymentInput = body.metode_pembayaran === undefined ? rows[0].metode_pembayaran : paymentMethod(body.metode_pembayaran);

            if (!validText(address) || !validText(city) || !validText(province) || !validText(serviceCode) || !paymentInput) {
                await conn.rollback(); return res.status(400).json({ status: 'error', message: 'Data pengiriman/pembayaran tidak valid.' });
            }
            if (totalWeight > 100000) {
                await conn.rollback(); return res.status(400).json({ status: 'error', message: 'Berat maksimal 100 kg.' });
            }

            // 1. Kalkulasi Ulang Ongkir Keranjang Gabungan
            const quote = calculateSelectedShipping(city, province, totalWeight, serviceCode);
            
            // 2. Alokasikan total ongkir ke masing-masing item
            const allocationItems = itemsData.map(i => ({ berat: i.weight, jumlah: i.qty }));
            const shippingParts = allocateShipping(allocationItems, quote.cost);

            // 3. Update semua row pesanan di database
            for (let i = 0; i < itemsData.length; i++) {
                const item = itemsData[i];
                const unitPrice = money(item.harga_satuan == null ? item.harga_estimasi : item.harga_satuan);
                const itemShipping = shippingParts[i];
                const itemTotal = money(unitPrice * item.qty + itemShipping);

                await conn.query(
                    `UPDATE pesanan SET jumlah = ?, detail_ukuran = ?, alamat_pengiriman = ?, ongkir = ?,
                     total_harga = ?, ekspedisi = ?, layanan_pengiriman = ?, kota_tujuan = ?,
                     provinsi_tujuan = ?, kode_layanan = ?, metode_pembayaran = ? WHERE id_pesanan = ?`,
                    [item.qty, item.detail, address, itemShipping, itemTotal, quote.courier, quote.service, city, province, quote.code, paymentInput, item.id_pesanan]
                );
            }

            await addNotification(conn, user.idUser, `Pesanan keranjang Anda berhasil diperbarui.`, 'success', itemsData[0].id_pesanan);
            await conn.commit();
            return res.json({ status: 'success', message: 'Pesanan keranjang berhasil diperbarui.' });

        } else {
            // =======================================================
            // MODE 2: SINGLE ITEM UPDATE (PESANAN SATUAN)
            // =======================================================
            const [rows] = await conn.query(
                `SELECT p.*, pr.nama_produk, pr.harga_estimasi, pr.berat
                 FROM pesanan p INNER JOIN produk pr ON pr.id_produk = p.id_produk
                 WHERE p.id_pesanan = ? FOR UPDATE`, [id]);
            
            if (!rows.length) {
                await conn.rollback();
                return res.status(404).json({ status: 'error', message: 'Pesanan tidak ditemukan.' });
            }
            const order = rows[0];
            
            if (!sameId(order.id_user, user.idUser)) {
                await conn.rollback();
                return res.status(403).json({ status: 'error', message: 'Anda tidak berhak mengubah pesanan ini.' });
            }
            if (order.status !== 'Menunggu') {
                await conn.rollback();
                return res.status(400).json({ status: 'error', message: 'Hanya pesanan Menunggu yang dapat diubah.' });
            }

            const qty = body.jumlah === undefined ? Number(order.jumlah) : positiveInt(body.jumlah);
            if (!qty || qty > 1000) {
                await conn.rollback();
                return res.status(400).json({ status: 'error', message: 'Jumlah pesanan tidak valid.' });
            }
            
            const address = body.alamat_pengiriman === undefined ? order.alamat_pengiriman : body.alamat_pengiriman.trim();
            if (!validText(address, 2000)) {
                await conn.rollback();
                return res.status(400).json({ status: 'error', message: 'Alamat pengiriman tidak valid.' });
            }
            
            const detail = body.detail_ukuran === undefined ? order.detail_ukuran : String(body.detail_ukuran).trim();
            if (typeof detail !== 'string' || detail.length > 10000) {
                await conn.rollback();
                return res.status(400).json({ status: 'error', message: 'Detail ukuran tidak valid.' });
            }
            
            const city = body.destinationName === undefined ? order.kota_tujuan : body.destinationName;
            const province = body.provinceName === undefined ? order.provinsi_tujuan : body.provinceName;
            const serviceCode = body.serviceCode === undefined ? order.kode_layanan : body.serviceCode;
            
            if (!validText(city, 150) || !validText(province, 150) || !validText(serviceCode, 40)) {
                await conn.rollback();
                return res.status(400).json({ status: 'error', message: 'Informasi layanan pengiriman belum lengkap. Silakan pilih ulang pengiriman.' });
            }

            const paymentInput = body.metode_pembayaran === undefined 
                ? order.metode_pembayaran 
                : paymentMethod(body.metode_pembayaran);
                
            if (!paymentInput) {
                await conn.rollback();
                return res.status(400).json({ status: 'error', message: 'Metode pembayaran tidak valid.' });
            }

            const weight = Number(order.berat || 1000) * qty;
            if (!Number.isSafeInteger(weight) || weight < 1 || weight > 100000) {
                await conn.rollback();
                return res.status(400).json({ status: 'error', message: 'Berat pesanan maksimal 100 kg.' });
            }
            
            const quote = calculateSelectedShipping(city, province, weight, serviceCode);
            const unitPrice = money(order.harga_satuan == null ? order.harga_estimasi : order.harga_satuan);
            const total = money(unitPrice * qty + quote.cost);

            await conn.query(
                `UPDATE pesanan SET jumlah = ?, detail_ukuran = ?, alamat_pengiriman = ?, ongkir = ?,
                 total_harga = ?, ekspedisi = ?, layanan_pengiriman = ?, kota_tujuan = ?,
                 provinsi_tujuan = ?, kode_layanan = ?, metode_pembayaran = ? WHERE id_pesanan = ?`,
                [qty, detail, address, quote.cost, total, quote.courier, quote.service, city, province, quote.code, paymentInput, id]
            );
            
            await addNotification(conn, order.id_user, `Pesanan ${id} berhasil diperbarui.`, 'success', id);
            const [admins] = await conn.query(`SELECT id_user FROM users WHERE role = 'admin'`);
            for (const admin of admins) {
                await addNotification(conn, admin.id_user,
                    `Pesanan ${id} (${order.nama_produk}) diperbarui oleh pelanggan.`, 'success', id);
            }
            
            await conn.commit();
            return res.json({ status: 'success', message: 'Pesanan berhasil diperbarui.',
                data: { id_pesanan: id, jumlah: qty, harga_satuan: unitPrice, ongkir: quote.cost, total_harga: total, metode_pembayaran: paymentInput } });
        }
    } catch (error) {
        if (conn) await conn.rollback().catch(() => {});
        return sendServerError(res, error, 'Gagal memperbarui pesanan.');
    } finally { if (conn) conn.release(); }
};