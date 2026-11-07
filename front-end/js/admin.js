'use strict';

/* Dashboard admin Japa Prabu Advertising.
 * Endpoint disesuaikan dengan back-end/routes/adminRoutes.js dan orderRoutes.js.
 * Tidak menggabungkan pesanan tanpa id_grup_pesanan pada skema database.
 */

const ADMIN_API = {
    check: '/api/auth/check',
    logout: '/api/auth/logout',
    orders: '/api/admin/pesanan',
    products: '/api/admin/produk',
    customers: '/api/admin/customers',
    notifications: '/api/admin/notifikasi'
};

let notificationHistory = [];
let adminOrders = [];
let adminProducts = [];
let pollingTimer = null;
let notificationTimer = null;
let isLoadingOrders = false;
let isLoadingNotifications = false;

function byId(id) {
    return document.getElementById(id);
}

function rupiah(value) {
    const n = Number(value);
    return `Rp ${(Number.isFinite(n) ? n : 0).toLocaleString('id-ID')}`;
}

function safeDate(value, withTime = true) {
    if (!value) return '-';

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';

    return d.toLocaleString('id-ID', withTime
        ? {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }
        : {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
}

function addCell(row, value, className) {
    const td = document.createElement('td');

    if (className) td.className = className;

    td.textContent =
        value === null || value === undefined || value === ''
            ? '-'
            : String(value);

    row.appendChild(td);
    return td;
}

/**
 * Mengambil token CSRF dari backend.
 *
 * Backend wajib menyediakan:
 * GET /api/auth/csrf
 *
 * Format respons:
 * {
 *   "status": "success",
 *   "csrfToken": "TOKEN"
 * }
 */
async function loadCsrfToken(forceRefresh = false) {
    if (csrfToken && !forceRefresh) {
        return csrfToken;
    }

    if (csrfTokenPromise && !forceRefresh) {
        return csrfTokenPromise;
    }

    csrfTokenPromise = (async () => {
        const response = await fetch('/api/auth/csrf', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        let result;

        try {
            result = await response.json();
        } catch (_) {
            throw new Error(
                'Respons token CSRF dari server tidak valid.'
            );
        }

        if (!response.ok) {
            throw new Error(
                result.message || 'Gagal memperoleh token CSRF.'
            );
        }

        const token =
            result.csrfToken ||
            result.data?.csrfToken;

        if (
            typeof token !== 'string' ||
            !token.trim()
        ) {
            throw new Error(
                'Token CSRF tidak tersedia dari server.'
            );
        }

        csrfToken = token;
        return csrfToken;
    })();

    try {
        return await csrfTokenPromise;
    } finally {
        csrfTokenPromise = null;
    }
}

/**
 * Fungsi utama komunikasi dengan backend.
 *
 * GET, HEAD, OPTIONS tidak membutuhkan token CSRF.
 * POST, PUT, PATCH, DELETE wajib membawa token CSRF.
 */
async function apiJSON(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();

    const headers = {
        'Accept': 'application/json',
        ...(options.headers || {})
    };

    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

    if (!safeMethods.includes(method)) {
        if (!csrfToken) {
            await loadCsrfToken();
        }

        headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(url, {
        ...options,
        method,
        credentials: 'include',
        headers,
        cache: options.cache || 'no-store'
    });

    let result;

    try {
        result = await response.json();
    } catch (_) {
        throw new Error(
            'Respons server tidak dapat dibaca.'
        );
    }

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error(
                result.message ||
                'Sesi berakhir. Silakan login kembali.'
            );
        }

        if (response.status === 403) {
            const message = result.message || 'Akses ditolak.';

            if (/csrf|token/i.test(message)) {
                csrfToken = '';

                throw new Error(
                    'Token CSRF tidak valid atau kedaluwarsa. Muat ulang halaman lalu coba kembali.'
                );
            }

            throw new Error(message);
        }

        throw new Error(
            result.message ||
            `Permintaan gagal (${response.status}).`
        );
    }

    return result;
}

function showToast(message, type = 'success', linkTab = 'pesanan') {
    const container = byId('toast-container');

    if (!container) {
        window.alert(message);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const text = document.createElement('span');
    text.textContent = message;

    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '×';
    close.setAttribute('aria-label', 'Tutup notifikasi');
    close.addEventListener('click', () => toast.remove());

    toast.append(text, close);
    container.appendChild(toast);

    window.setTimeout(() => toast.remove(), 4000);
}

function showTableMessage(tbody, colspan, message, isError = false) {
    tbody.replaceChildren();

    const tr = document.createElement('tr');
    const td = document.createElement('td');

    td.colSpan = colspan;
    td.textContent = message;
    td.style.textAlign = 'center';
    td.style.padding = '20px';

    if (isError) {
        td.style.color = '#b91c1c';
    }

    tr.appendChild(td);
    tbody.appendChild(tr);
}

function activateTab(tabId) {
    document.querySelectorAll('.nav-link').forEach(link => {
        const active = link.getAttribute('data-tab') === tabId;

        link.classList.toggle('active', active);

        if (active) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });

    document.querySelectorAll('.tab-section').forEach(section => {
        section.classList.toggle(
            'active-tab',
            section.id === `tab-${tabId}`
        );
    });

    if (tabId === 'pesanan') muatDataPesanan();
    if (tabId === 'katalog') muatKatalogAdminGrid();
    if (tabId === 'pelanggan') muatDataPelanggan();
}

async function muatNotifikasiAdmin() {
    if (isLoadingNotifications) return;

    isLoadingNotifications = true;

    try {
        const result = await apiJSON(ADMIN_API.notifications);

        if (
            result.status !== 'success' ||
            !Array.isArray(result.data)
        ) {
            return;
        }

        notificationHistory = result.data.map(n => ({
            id: n.id_notifikasi,
            message: n.pesan || '',
            time: safeDate(n.tanggal),
            type: n.tipe || 'success',
            unread: Number(n.is_read) === 0,
            linkTab: [
                'dashboard',
                'katalog',
                'pesanan',
                'pelanggan'
            ].includes(n.link_tab)
                ? n.link_tab
                : 'pesanan'
        }));

        updateNotificationUI();

    } catch (error) {
        console.error('Muat notifikasi:', error);
    } finally {
        isLoadingNotifications = false;
    }
}

function updateNotificationUI() {
    const list = byId('notificationList');
    const badge = byId('notifBadge');

    if (!list || !badge) return;

    const unread = notificationHistory.filter(
        n => n.unread
    ).length;

    badge.textContent = String(unread);
    badge.style.display = unread ? 'inline-block' : 'none';

    list.replaceChildren();

    if (!notificationHistory.length) {
        const empty = document.createElement('div');

        empty.className = 'notification-empty';
        empty.textContent = 'Belum ada notifikasi.';
        empty.style.padding = '16px';
        empty.style.textAlign = 'center';

        list.appendChild(empty);
        return;
    }

    notificationHistory.forEach(item => {
        const node = document.createElement('button');

        node.type = 'button';
        node.className =
            `notification-item ${item.unread ? 'unread' : 'read'}`;

        node.style.cssText =
            'display:block;width:100%;text-align:left;padding:12px 16px;border:0;border-bottom:1px solid #e2e8f0;cursor:pointer;';

        const title = document.createElement('strong');
        title.textContent =
            item.type === 'success'
                ? 'Update sistem'
                : 'Perhatian';

        const time = document.createElement('small');
        time.textContent = item.time;

        const message = document.createElement('span');
        message.textContent = item.message;
        message.style.display = 'block';

        node.append(
            title,
            document.createTextNode(' · '),
            time,
            message
        );

        node.addEventListener('click', async () => {
            try {
                if (item.id) {
                    await apiJSON(
                        `${ADMIN_API.notifications}/${encodeURIComponent(item.id)}/read`,
                        { method: 'PUT' }
                    );
                }

                item.unread = false;
                updateNotificationUI();
                activateTab(item.linkTab);

            } catch (error) {
                showToast(error.message, 'error');
            }
        });

        list.appendChild(node);
    });
}

async function markAllAsReadAdmin() {
    try {
        const result = await apiJSON(
            `${ADMIN_API.notifications}/read-all`,
            { method: 'PUT' }
        );

        if (result.status === 'success') {
            notificationHistory.forEach(n => {
                n.unread = false;
            });

            updateNotificationUI();
        }

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// -------------------- Pesanan --------------------

function statusColor(status) {
    return ({
        Selesai: '#16a34a',
        Diproses: '#0284c7',
        Dikirim: '#7c3aed',
        Batal: '#dc2626',
        Menunggu: '#d97706'
    })[status] || '#64748b';
}

function kelompokkanPesananAdmin(rows) {
    const groups = new Map();
    for (const item of rows) {
        const idGrup = String(item.id_grup_pesanan || '').trim();
        const key = idGrup ? `GRUP:${idGrup}` : `SATUAN:${item.id_pesanan}`;
        if (!groups.has(key)) {
            groups.set(key, {
                key,
                id_grup_pesanan: idGrup || null,
                tanggal_pesan: item.tanggal_pesan || item.created_at,
                nama_lengkap: item.nama_lengkap || item.nama_pelanggan || 'Pelanggan',
                alamat_pengiriman: item.alamat_pengiriman || '-',
                metode_pembayaran: item.metode_pembayaran || 'Transfer Bank',
                ekspedisi: item.ekspedisi || '',
                layanan_pengiriman: item.layanan_pengiriman || '',
                items: []
            });
        }
        groups.get(key).items.push(item);
    }
    const result = Array.from(groups.values());
    for (const group of result) {
        group.items.sort((a,b) => Number(a.id_pesanan) - Number(b.id_pesanan));
        group.ongkir = group.items.reduce((n, item) => n + (Number(item.ongkir) || 0), 0);
        group.total_harga = group.items.reduce((n, item) => {
            const total = item.total_harga == null
                ? (Number(item.harga_satuan ?? item.harga_estimasi ?? 0) * Number(item.jumlah || 1)) + (Number(item.ongkir) || 0)
                : Number(item.total_harga);
            return n + (Number.isFinite(total) ? total : 0);
        }, 0);
        const statuses = group.items.map(x => x.status || 'Menunggu');
        const unique = [...new Set(statuses)];
        group.status = unique.length === 1 ? unique[0] : 'Campuran';
        group.rincian_status = [...new Set(statuses)].map(status =>
            `${statuses.filter(s => s === status).length} ${status}`
        ).join(' · ');
    }
    return result.sort((a,b) => {
        const ta = new Date(a.tanggal_pesan || 0).getTime() || 0;
        const tb = new Date(b.tanggal_pesan || 0).getTime() || 0;
        if (tb !== ta) return tb - ta;
        return (Number(b.items[b.items.length-1].id_pesanan) || 0) - (Number(a.items[a.items.length-1].id_pesanan) || 0);
    });
}

function tutupRincianPesananAdmin() {
    byId('adminOrderGroupModal')?.remove();
}

function tampilkanRincianPesananAdmin(groupKey) {
    const group = (window.globalAdminGrupPesanan || []).find(g => g.key === groupKey);
    if (!group) { showToast('Rincian pesanan tidak ditemukan.', 'error'); return; }
    tutupRincianPesananAdmin();

    const overlay = document.createElement('div');
    overlay.id = 'adminOrderGroupModal';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Rincian pesanan');
    overlay.addEventListener('click', e => { if (e.target === overlay) tutupRincianPesananAdmin(); });

    const panel = document.createElement('div');
    panel.className = 'modal-content admin-group-modal-content';
    const header = document.createElement('div');
    header.className = 'admin-group-modal-header';
    const heading = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = 'Rincian Pesanan';
    const subtitle = document.createElement('small');
    subtitle.textContent = group.id_grup_pesanan || `Pesanan ${group.items[0].id_pesanan}`;
    heading.append(title, subtitle);
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'admin-group-close'; close.textContent = '×';
    close.setAttribute('aria-label','Tutup rincian');
    close.addEventListener('click', tutupRincianPesananAdmin);
    header.append(heading,close);
    panel.appendChild(header);

    const summary = document.createElement('div');
    summary.className = 'admin-group-summary';
    const meta = [
        ['Pelanggan',group.nama_lengkap],
        ['Item',`${group.items.length} produk`],
        ['Ongkos Kirim',rupiah(group.ongkir)],
        ['Total Checkout',rupiah(group.total_harga)],
        ['Status',group.status === 'Campuran' ? `Campuran (${group.rincian_status})` : group.status]
    ];
    meta.forEach(([label,value]) => {
        const line = document.createElement('div');
        const l = document.createElement('span'); l.textContent = label;
        const v = document.createElement('strong'); v.textContent = value;
        line.append(l,v); summary.appendChild(line);
    });
    panel.appendChild(summary);

    const itemList = document.createElement('div');
    itemList.className = 'admin-group-item-list';
    group.items.forEach((item,idx) => {
        const itemBox = document.createElement('section');
        itemBox.className = 'admin-group-item';
        const name = document.createElement('strong');
        name.textContent = `${idx+1}. ${item.nama_produk || 'Produk'} · ${item.id_pesanan}`;
        const note = document.createElement('p');
        note.textContent = `Qty: ${Number(item.jumlah) || 1} · Catatan: ${item.detail_ukuran || '-'}`;
        const itemCost = document.createElement('p');
        itemCost.textContent = `Ongkir: ${rupiah(item.ongkir)} · Total: ${rupiah(item.total_harga)}`;
        const itemBottom = document.createElement('div');
        itemBottom.className = 'admin-group-item-bottom';
        const status = document.createElement('span');
        status.className = 'admin-group-status';
        status.textContent = item.status || 'Menunggu';
        status.style.color = statusColor(item.status || 'Menunggu');
        const label = document.createElement('label');
        label.textContent = 'Ubah status: ';
        const select = document.createElement('select');
        select.setAttribute('aria-label',`Status pesanan ${item.id_pesanan}`);
        ['Menunggu','Diproses','Dikirim','Selesai','Batal'].forEach(value => {
            const option = document.createElement('option');
            option.value=value; option.textContent=value;
            option.selected=value === (item.status || 'Menunggu');
            select.appendChild(option);
        });
        select.addEventListener('change', async () => {
            select.disabled = true;

            await ubahStatus(item.id_pesanan, select.value);
            tutupRincianPesananAdmin();
        });
        label.appendChild(select);
        itemBottom.append(status,label);
        itemBox.append(name,note,itemCost,itemBottom);
        itemList.appendChild(itemBox);
    });
    panel.appendChild(itemList);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    close.focus();
}

async function muatDataPesanan() {
    const tbody = byId('table-body');
    if (!tbody || isLoadingOrders) return;
    isLoadingOrders = true;
    try {
        const result = await apiJSON(ADMIN_API.orders);
        if (result.status !== 'success' || !Array.isArray(result.data)) {
            throw new Error(result.message || 'Format data pesanan tidak valid.');
        }
        adminOrders = result.data;
        window.globalAdminPesanan = adminOrders;
        const groups = kelompokkanPesananAdmin(adminOrders);
        window.globalAdminGrupPesanan = groups;
        tbody.replaceChildren();
        if (!groups.length) {
            showTableMessage(tbody, 11, 'Belum ada pesanan masuk.');
            return;
        }
        groups.forEach((group,index) => {
            const tr = document.createElement('tr');
            addCell(tr,index+1);
            const ids = group.items.map(x=>Number(x.id_pesanan));
            const idText = ids.length === 1 ? String(ids[0]) : `${Math.min(...ids)} - ${Math.max(...ids)}`;
            const idCell = addCell(tr,idText);
            if (group.id_grup_pesanan) {
                const label = document.createElement('small');
                label.textContent = `Grup: ${group.id_grup_pesanan}`;
                label.title = group.id_grup_pesanan;
                label.className = 'admin-group-id';
                idCell.appendChild(label);
            }
            addCell(tr,safeDate(group.tanggal_pesan));
            addCell(tr,group.nama_lengkap);
            const products = addCell(tr,'');
            if (group.items.length > 1) {
                const title = document.createElement('strong');
                title.textContent = `${group.items.length} Produk dalam 1 Pesanan`;
                const detail = document.createElement('small');
                detail.textContent = '(Checkout Keranjang)';
                detail.className = 'admin-group-caption';
                products.append(title,detail);
            } else {
                const item = group.items[0];
                const title = document.createElement('strong');
                title.textContent = item.nama_produk || 'Produk';
                const detail = document.createElement('small');
                detail.textContent = `Qty: ${Number(item.jumlah)||1} item`;
                detail.className = 'admin-group-caption';
                products.append(title,detail);
            }
            const notes = addCell(tr,'');
            if (group.items.length > 1) {
                const button = document.createElement('button');
                button.type = 'button'; button.className = 'admin-detail-btn';
                button.textContent = `Lihat Rincian (${group.items.length} Item)`;
                button.addEventListener('click',() => tampilkanRincianPesananAdmin(group.key));
                notes.appendChild(button);
            } else {
                notes.textContent = group.items[0].detail_ukuran || '-';
            }
            addCell(tr,group.alamat_pengiriman);
            const payment = addCell(tr,'');
            payment.textContent = group.metode_pembayaran;
            const shipping = document.createElement('small');
            shipping.textContent = `Ongkir: ${rupiah(group.ongkir)}`;
            shipping.className = 'admin-group-caption';
            payment.appendChild(shipping);
            const cost = addCell(tr,rupiah(group.total_harga));
            cost.className = 'admin-group-total';
            const statusCell = addCell(tr,'');
            const badge = document.createElement('span');
            badge.className = 'admin-group-status';
            badge.textContent = group.status;
            badge.style.color = statusColor(group.status);
            statusCell.appendChild(badge);
            if (group.status === 'Campuran') {
                const summary = document.createElement('small');
                summary.className = 'admin-group-caption';
                summary.textContent = group.rincian_status;
                statusCell.appendChild(summary);
            }
            const action = addCell(tr,'');
            if (group.items.length > 1) {
                const btn = document.createElement('button');
                btn.type = 'button'; btn.className = 'admin-detail-btn';
                btn.textContent = 'Rincian & Status';
                btn.addEventListener('click',() => tampilkanRincianPesananAdmin(group.key));
                action.appendChild(btn);
            } else {
                const item = group.items[0];
                const select = document.createElement('select');
                select.setAttribute('aria-label',`Status pesanan ${item.id_pesanan}`);
                ['Menunggu','Diproses','Dikirim','Selesai','Batal'].forEach(value => {
                    const option = document.createElement('option');
                    option.value=value;option.textContent=value;
                    option.selected=value === (item.status || 'Menunggu');
                    select.appendChild(option);
                });
                select.addEventListener('change',async () => {
                    select.disabled=true;
                    try { await ubahStatus(item.id_pesanan,select.value); }
                    finally { select.disabled=false; }
                });
                action.appendChild(select);
            }
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Muat pesanan:',error);
        showTableMessage(tbody,11,error.message || 'Gagal memuat pesanan.',true);
    } finally {
        isLoadingOrders=false;
    }
}

async function ubahStatus(idPesanan, statusBaru) {
    try {
        const result = await apiJSON(
            `/api/admin/pesanan/${encodeURIComponent(idPesanan)}/status`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: statusBaru
                })
            }
        );

        if (result.status !== 'success') {
            throw new Error(
                result.message ||
                'Status tidak berhasil diubah.'
            );
        }

        showToast(
            `Status pesanan ${idPesanan} menjadi ${statusBaru}.`
        );

        await muatDataPesanan();

    } catch (error) {
        showToast(error.message, 'error');
        await muatDataPesanan();
    }
}

// -------------------- Produk --------------------

function getProductImages(raw) {
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed)
            ? parsed
            : [String(parsed)];
    } catch (_) {
        return [String(raw)];
    }
}

function productImageUrl(raw) {
    const path = getProductImages(raw)[0];

    if (!path) {
        return 'https://via.placeholder.com/400x300?text=Tanpa+Gambar';
    }

    const normalized = path.replace(/^\/+/, '');

    return /^images\/[\w./-]+\.(?:png|jpe?g)$/i.test(normalized)
        ? `/${normalized}`
        : 'https://via.placeholder.com/400x300?text=Gambar+Tidak+Valid';
}

async function muatKatalogAdminGrid() {
    const container = byId('admin-catalog-grid');

    if (!container) return;

    try {
        const result = await apiJSON(ADMIN_API.products);

        if (
            result.status !== 'success' ||
            !Array.isArray(result.data)
        ) {
            throw new Error(
                result.message || 'Data produk tidak valid.'
            );
        }

        adminProducts = result.data;
        window.globalAdminProduk = adminProducts;

        container.replaceChildren();

        if (!adminProducts.length) {
            const p = document.createElement('p');
            p.textContent = 'Belum ada produk di katalog.';
            container.appendChild(p);
            return;
        }

        adminProducts.forEach(product => {
            const card = document.createElement('article');
            card.className = 'product-card';

            const img = document.createElement('img');
            img.src = productImageUrl(product.gambar_url);
            img.alt = product.nama_produk || 'Produk';
            img.className = 'product-img';
            img.loading = 'lazy';

            img.addEventListener('click', () => {
                bukaPreviewModal(product.id_produk);
            });

            const body = document.createElement('div');
            body.className = 'product-body';

            const title = document.createElement('h3');
            title.textContent = product.nama_produk || '-';

            const desc = document.createElement('p');
            desc.textContent =
                product.deskripsi || 'Tidak ada deskripsi';

            const bahan = document.createElement('p');
            bahan.textContent = `Bahan: ${product.bahan || '-'}`;

            const weight = document.createElement('p');
            weight.textContent =
                `Berat: ${Number(product.berat) || 1000} Gram`;

            const price = document.createElement('strong');
            price.textContent = rupiah(product.harga_estimasi);

            body.append(title, desc, bahan, weight, price);

            const footer = document.createElement('div');
            footer.className = 'product-footer';

            const edit = document.createElement('button');
            edit.type = 'button';
            edit.textContent = 'Edit';

            edit.addEventListener('click', () => {
                bukaModalEditDariID(product.id_produk);
            });

            const del = document.createElement('button');
            del.type = 'button';
            del.textContent = 'Hapus';

            del.addEventListener('click', () => {
                hapusProdukAdmin(product.id_produk);
            });

            footer.append(edit, del);
            card.append(img, body, footer);
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Muat katalog:', error);
        showToast(error.message, 'error', 'katalog');
    }
}

function bukaPreviewModal(id) {
    const product = adminProducts.find(
        p => String(p.id_produk) === String(id)
    );

    if (!product) return;

    const setText = (idElement, value) => {
        const node = byId(idElement);
        if (node) node.textContent = value || '-';
    };

    setText('preview-product-name', product.nama_produk);

    setText(
        'preview-product-desc',
        product.deskripsi || 'Tidak ada deskripsi rinci.'
    );

    setText('preview-product-bahan', product.bahan || '-');

    setText(
        'preview-product-price',
        rupiah(product.harga_estimasi)
    );

    const main = byId('preview-product-img');

    if (main) {
        main.src = productImageUrl(product.gambar_url);
    }

    const thumbs = byId('preview-thumbnails');

    if (thumbs) {
        thumbs.replaceChildren();

        getProductImages(product.gambar_url).forEach(path => {
            const image = document.createElement('img');

            image.src = productImageUrl(JSON.stringify([path]));
            image.alt = 'Pratinjau gambar produk';

            image.addEventListener('click', () => {
                if (main) main.src = image.src;
            });

            thumbs.appendChild(image);
        });
    }

    const modal = byId('previewModal');

    if (modal) {
        modal.style.display = 'flex';
    }
}

function closePreviewModal() {
    const modal = byId('previewModal');

    if (modal) {
        modal.style.display = 'none';
    }
}

function bukaModalEdit(
    id,
    nama,
    bahan,
    deskripsi,
    harga,
    berat
) {
    const values = {
        edit_id_produk: id,
        edit_nama_produk: nama,
        edit_bahan: bahan,
        edit_deskripsi: deskripsi,
        edit_harga_estimasi: harga,
        edit_berat: berat || 1000
    };

    Object.entries(values).forEach(([key, value]) => {
        const node = byId(key);

        if (node) {
            node.value = value ?? '';
        }
    });

    const modal = byId('editModal');

    if (modal) {
        modal.style.display = 'flex';
    }
}

function bukaModalEditDariID(id) {
    const p = adminProducts.find(
        item => String(item.id_produk) === String(id)
    );

    if (p) {
        bukaModalEdit(
            p.id_produk,
            p.nama_produk || '',
            p.bahan || '',
            p.deskripsi || '',
            p.harga_estimasi,
            p.berat
        );
    }
}

function closeEditModal() {
    const modal = byId('editModal');

    if (modal) {
        modal.style.display = 'none';
    }

    const form = byId('editProductForm');

    if (form) {
        form.reset();
    }
}

async function hapusProdukAdmin(id) {
    const product = adminProducts.find(
        p => String(p.id_produk) === String(id)
    );

    if (!window.confirm(
        `Hapus produk "${product?.nama_produk || id}"?`
    )) {
        return;
    }

    try {
        const result = await apiJSON(
            `${ADMIN_API.products}/${encodeURIComponent(id)}`,
            { method: 'DELETE' }
        );

        if (result.status !== 'success') {
            throw new Error(
                result.message || 'Produk gagal dihapus.'
            );
        }

        showToast('Produk berhasil dihapus.');
        await muatKatalogAdminGrid();

    } catch (error) {
        showToast(error.message, 'error');
    }
}

function bindProductForm(formId, isEdit) {
    const form = byId(formId);

    if (!form) return;

    form.addEventListener('submit', async event => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        const id = isEdit
            ? byId('edit_id_produk')?.value
            : null;

        const prefix = isEdit ? 'edit_' : '';
        const data = new FormData();

        [
            'nama_produk',
            'bahan',
            'deskripsi',
            'harga_estimasi',
            'berat'
        ].forEach(field => {
            const input = byId(prefix + field);

            if (input) {
                data.append(field, input.value.trim());
            }
        });

        const files = byId(prefix + 'gambar_file');

        if (files?.files) {
            Array.from(files.files).forEach(file => {
                data.append('gambar_file', file);
            });
        }

        const submit = form.querySelector('[type="submit"]');

        if (submit) {
            submit.disabled = true;
        }

        try {
            const url = isEdit
                ? `${ADMIN_API.products}/${encodeURIComponent(id)}`
                : ADMIN_API.products;

            const result = await apiJSON(url, {
                method: isEdit ? 'PUT' : 'POST',
                body: data
            });

            if (result.status !== 'success') {
                throw new Error(
                    result.message || 'Penyimpanan produk gagal.'
                );
            }

            showToast(
                isEdit
                    ? 'Produk berhasil diperbarui.'
                    : 'Produk berhasil ditambahkan.'
            );

            form.reset();

            if (isEdit) {
                closeEditModal();
            }

            await muatKatalogAdminGrid();

        } catch (error) {
            showToast(error.message, 'error');

        } finally {
            if (submit) {
                submit.disabled = false;
            }
        }
    });
}

async function muatDataPelanggan() {
    const tbody = byId('customer-table-body');

    if (!tbody) return;

    try {
        const result = await apiJSON(ADMIN_API.customers);

        if (
            result.status !== 'success' ||
            !Array.isArray(result.data)
        ) {
            throw new Error(
                result.message || 'Data pelanggan tidak valid.'
            );
        }

        tbody.replaceChildren();

        if (!result.data.length) {
            showTableMessage(
                tbody,
                6,
                'Belum ada pelanggan terdaftar.'
            );
            return;
        }

        result.data.forEach((customer, index) => {
            const tr = document.createElement('tr');

            addCell(tr, index + 1);
            addCell(tr, customer.nama_lengkap);
            addCell(tr, customer.email);
            addCell(tr, customer.no_telp);
            addCell(tr, customer.alamat);
            addCell(tr, safeDate(customer.created_at, false));

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Muat pelanggan:', error);

        showTableMessage(
            tbody,
            6,
            error.message,
            true
        );
    }
}

async function checkNewOrdersAutomatically() {
    await muatDataPesanan();
}

document.addEventListener('DOMContentLoaded', async () => {
    const brandImg = document.querySelector('.nav-brand img');

    if (brandImg) {
        brandImg.addEventListener('error', () => {
            brandImg.style.display = 'none';
        });
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();

            const tab = link.getAttribute('data-tab');

            if (tab) {
                activateTab(tab);
            }
        });
    });

    const profileBtn = byId('profileMenuBtn');

    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            window.location.href = '/pages/admin-profile.html';
        });
    }

    const profileTrigger = byId('profileDropdownTrigger');
    const profileDropdown = byId('profileDropdown');

    const notificationBtn = byId('notificationBtn');
    const notificationDropdown = byId('notificationDropdown');

    profileTrigger?.addEventListener('click', event => {
        event.stopPropagation();

        profileDropdown?.classList.toggle('show');
        notificationDropdown?.classList.remove('show');
    });

    notificationBtn?.addEventListener('click', event => {
        event.stopPropagation();

        notificationDropdown?.classList.toggle('show');
        profileDropdown?.classList.remove('show');
    });

    byId('markAllReadBtn')?.addEventListener(
        'click',
        markAllAsReadAdmin
    );

    byId('closeEditModalBtn')?.addEventListener(
        'click',
        closeEditModal
    );

    byId('closePreviewModalBtn')?.addEventListener(
        'click',
        closePreviewModal
    );

    window.addEventListener('click', event => {
        if (
            profileDropdown &&
            !profileDropdown.contains(event.target) &&
            event.target !== profileTrigger
        ) {
            profileDropdown.classList.remove('show');
        }

        if (
            notificationDropdown &&
            !notificationDropdown.contains(event.target) &&
            event.target !== notificationBtn
        ) {
            notificationDropdown.classList.remove('show');
        }

        if (event.target?.id === 'editModal') {
            closeEditModal();
        }

        if (event.target?.id === 'previewModal') {
            closePreviewModal();
        }
    });

    bindProductForm('addProductForm', false);
    bindProductForm('editProductForm', true);

    const logout = byId('btnLogout');

    logout?.addEventListener('click', async () => {
        if (!window.confirm(
            'Apakah Anda yakin ingin keluar dari Dashboard?'
        )) {
            return;
        }

        logout.disabled = true;

        try {
            await apiJSON(
                ADMIN_API.logout,
                { method: 'POST' }
            );

            window.location.href = '/pages/login.html';

        } catch (error) {
            showToast(
                error.message || 'Logout gagal.',
                'error'
            );

            logout.disabled = false;
        }
    });

    try {
        const result = await apiJSON(ADMIN_API.check);

        if (
            result.status !== 'success' ||
            String(result.data?.role).toLowerCase() !== 'admin'
        ) {
            window.alert(
                'Akses ditolak. Silakan login menggunakan akun admin.'
            );

            window.location.href = '/pages/login.html';
            return;
        }

        const name = byId('adminNameDisplay');

        if (name) {
            name.textContent =
                `Halo, ${result.data.nama || 'Admin'}`;
        }

        await loadCsrfToken();

        await Promise.all([
            muatNotifikasiAdmin(),
            muatDataPesanan(),
            muatKatalogAdminGrid()
        ]);

        pollingTimer = window.setInterval(
            checkNewOrdersAutomatically,
            30000
        );

        notificationTimer = window.setInterval(
            muatNotifikasiAdmin,
            30000
        );

    } catch (error) {
        console.error(
            'Pemeriksaan sesi admin:',
            error
        );

        window.alert(
            error.message ||
            'Sesi tidak valid. Silakan login kembali.'
        );

        window.location.href = '/pages/login.html';
    }
});

window.muatDataPesanan = muatDataPesanan;
window.muatKatalogAdminGrid = muatKatalogAdminGrid;
window.muatDataPelanggan = muatDataPelanggan;
window.muatNotifikasiAdmin = muatNotifikasiAdmin;
window.markAllAsReadAdmin = markAllAsReadAdmin;
window.bukaPreviewModal = bukaPreviewModal;
window.closePreviewModal = closePreviewModal;
window.bukaModalEdit = bukaModalEdit;
window.bukaModalEditDariID = bukaModalEditDariID;
window.closeEditModal = closeEditModal;
window.hapusProdukAdmin = hapusProdukAdmin;
window.ubahStatus = ubahStatus;

window.bukaRincianKeranjang = index => {
    const group = (window.globalAdminGrupPesanan || [])[index];
    if (group) tampilkanRincianPesananAdmin(group.key);
};
window.tutupRincianKeranjang = tutupRincianPesananAdmin;
