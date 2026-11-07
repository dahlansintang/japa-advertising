let dataProdukGlobal = [];
let dataPesananGlobal = [];
let lastKnownCustomerOrderCount = null;
let lastOrderStatusMap = {};
let customerNotifications = [];

function buatElemenTeks(tag, value, className = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = value == null ? '' : String(value);
    return el;
}

function buatOption(value, label) {
    const option = document.createElement('option');
    option.value = value == null ? '' : String(value);
    option.textContent = label == null ? '' : String(label);
    return option;
}

function tampilkanPesanDOM(container, tag, message, styleText = '') {
    if (!container) return;
    const messageEl = buatElemenTeks(tag, message);
    if (styleText) messageEl.style.cssText = styleText;
    container.replaceChildren(messageEl);
}

// ==========================================
// FUNGSI UMUM & UI
// ==========================================
function showCustomerToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        font-size: 14px; font-weight: 500; display: flex; align-items: center; justify-content: space-between; gap: 12px;
        min-width: 280px; animation: slideIn 0.2s ease-out;
    `;
    
    const spanText = document.createElement('span');
    spanText.textContent = message;

    const spanClose = document.createElement('span');
    spanClose.style.cssText = 'cursor: pointer; font-weight: bold; font-size: 16px;';
    spanClose.textContent = '×';
    spanClose.addEventListener('click', () => toast.remove());

    toast.appendChild(spanText);
    toast.appendChild(spanClose);
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 4000);
}

function toggleNotificationDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('notificationDropdown');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileDropdown) profileDropdown.classList.remove('show');
    if (dropdown) dropdown.classList.toggle('show');
}

function closeAllDropdowns() {
    const notifDropdown = document.getElementById('notificationDropdown');
    const profileDropdown = document.getElementById('profileDropdown');
    if (notifDropdown) notifDropdown.classList.remove('show');
    if (profileDropdown) profileDropdown.classList.remove('show');
}

function toggleDropdown(event) {
    event.stopPropagation();
    const notifDropdown = document.getElementById('notificationDropdown');
    if (notifDropdown) notifDropdown.classList.remove('show');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileDropdown) profileDropdown.classList.toggle('show');
}

window.addEventListener('click', (e) => {
    if (!e.target.closest('.notification-container') && !e.target.closest('.profile-dropdown-container')) {
        closeAllDropdowns();
    }
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
    }
});

function switchTab(tabId, event) {
    if (event) event.preventDefault();
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const targetLink = document.getElementById('link-' + tabId);
    if (targetLink) targetLink.classList.add('active');

    document.querySelectorAll('.tab-section').forEach(section => section.classList.remove('active-tab'));
    const targetSection = document.getElementById('tab-' + tabId);
    if (targetSection) targetSection.classList.add('active-tab');

    if (tabId === 'pesanan') muatPesananSaya();
}

// ==========================================
// FITUR KERANJANG BELANJA (SHOPPING CART)
// ==========================================
function bukaModalKeranjang() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) cartModal.style.display = 'flex';
    muatIsiKeranjang();
}

function tutupModalKeranjang() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) cartModal.style.display = 'none';
}

async function muatJumlahKeranjangBadge() {
    try {
        const res = await fetch('/api/cart', { credentials: 'include' });
        const result = await res.json();
        const badge = document.getElementById('cartBadge');
        if (badge) {
            if (result.status === 'success' && result.data.length > 0) {
                badge.style.display = 'inline-block';
                badge.innerText = result.data.length;
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (err) {}
}

async function muatIsiKeranjang() {
    const container = document.getElementById('cart-items-container');
    const priceEl = document.getElementById('cart-total-price');
    if (!container || !priceEl) return;

    try {
        const res = await fetch('/api/cart', { credentials: 'include' });
        const result = await res.json();
        
        if (result.status === 'success') {
            if (result.data.length === 0) {
                tampilkanPesanDOM(container, 'p', 'Keranjang belanja kosong.', 'text-align: center; color: #64748b; padding: 20px;');
                priceEl.innerText = 'Rp 0';
                return;
            }
            
            container.replaceChildren();
            let total = 0;
            result.data.forEach(item => {
                const subtotal = item.harga_estimasi * item.jumlah;
                total += subtotal;
                const div = document.createElement('div');
                div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9;';
                
                const leftDiv = document.createElement('div');
                const productName = buatElemenTeks('strong', item.nama_produk);
                productName.style.cssText = 'color:#0f172a; font-size:14px;';
                const itemMeta = buatElemenTeks('span', `Qty: ${item.jumlah} | Catatan: ${item.detail_ukuran || '-'}`);
                itemMeta.style.cssText = 'font-size: 12px; color: #64748b;';
                leftDiv.appendChild(productName);
                leftDiv.appendChild(document.createElement('br'));
                leftDiv.appendChild(itemMeta);

                const rightDiv = document.createElement('div');
                rightDiv.style.textAlign = 'right';

                const priceSpan = document.createElement('span');
                priceSpan.style.cssText = 'font-weight: 600; color: #2563eb; font-size:14px;';
                priceSpan.innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;

                const deleteSpan = document.createElement('span');
                deleteSpan.style.cssText = 'font-size: 12px; color: #dc2626; cursor: pointer; font-weight:600; display: block;';
                deleteSpan.innerText = 'Hapus';
                deleteSpan.addEventListener('click', () => hapusItemKeranjang(item.id_keranjang));

                rightDiv.appendChild(priceSpan);
                rightDiv.appendChild(deleteSpan);

                div.appendChild(leftDiv);
                div.appendChild(rightDiv);
                container.appendChild(div);
            });
            priceEl.innerText = 'Rp ' + total.toLocaleString('id-ID');
        }
    } catch (err) {
        console.error(err);
    }
}

function tambahKeKeranjang(id_produk) {
    const produk = dataProdukGlobal.find(p => p.id_produk === id_produk);
    if (!produk) {
        showCustomerToast('Produk tidak ditemukan.', 'error');
        return;
    }

    const cartInputId = document.getElementById('cart_input_id_produk');
    const cartInputQty = document.getElementById('cart_input_qty');
    const cartInputDetail = document.getElementById('cart_input_detail');

    if (cartInputId) cartInputId.value = id_produk;
    if (cartInputQty) cartInputQty.value = 1;
    if (cartInputDetail) cartInputDetail.value = '';
    
    const detailModal = document.getElementById('detailModal');
    if (detailModal) detailModal.style.display = 'none';

    const addToCartModal = document.getElementById('addToCartModal');
    if (addToCartModal) addToCartModal.style.display = 'flex';
}

function tutupModalAddToCart() {
    const addToCartModal = document.getElementById('addToCartModal');
    if (addToCartModal) addToCartModal.style.display = 'none';
}

async function prosesTambahKeKeranjang(event) {
    event.preventDefault(); 
    
    const id_produk = document.getElementById('cart_input_id_produk').value;
    const jumlah = document.getElementById('cart_input_qty').value;
    let detail_ukuran = document.getElementById('cart_input_detail').value.trim();
    
    if (!detail_ukuran) detail_ukuran = "-"; 

    try {
        const payload = { id_produk, jumlah: parseInt(jumlah), detail_ukuran };
        let res;

        if (typeof csrfFetch === 'function') {
            res = await csrfFetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
        }

        const result = await res.json();
        
        if (res.ok && result.status === 'success') {
            showCustomerToast('Produk berhasil masuk keranjang!', 'success');
            tutupModalAddToCart();
            muatJumlahKeranjangBadge(); 
        } else {
            showCustomerToast(result.message || 'Gagal menambahkan ke keranjang.', 'error');
        }
    } catch (err) {
        showCustomerToast('Terjadi kesalahan jaringan.', 'error');
    }
}

async function hapusItemKeranjang(id) {
    if(!confirm('Hapus produk ini dari keranjang?')) return;
    try {
        if (typeof csrfFetch === 'function') {
            await csrfFetch(`/api/cart/${id}`, { method: 'DELETE' });
        } else {
            await fetch(`/api/cart/${id}`, { method: 'DELETE', credentials: 'include' });
        }
        muatIsiKeranjang();
        muatJumlahKeranjangBadge();
    } catch (err) {
        console.error(err);
    }
}

function bukaCheckoutKeranjang() {
    const container = document.getElementById('cart-items-container');
    if(container && container.innerText.includes('kosong')) {
        alert('Keranjang Anda kosong!');
        return;
    }
    
    tutupModalKeranjang();
    window.location.href = `/pages/checkout.html?mode=keranjang`;
}

// ==========================================
// NOTIFIKASI
// ==========================================
async function muatNotifikasiPelanggan() {
    try {
        const res = await fetch('/api/auth/notifikasi/customer', { credentials: 'include' });
        if (!res.ok) return;
        const result = await res.json();
        
        if (result.status === 'success' && Array.isArray(result.data)) {
            customerNotifications = result.data.map(n => ({
                id: n.id_notifikasi,
                text: n.pesan,
                time: new Date(n.tanggal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: n.is_read === 1,
                linkTab: n.link_tab || 'pesanan'
            }));
            updateNotificationUI();
        }
    } catch (err) {
        console.error('Gagal memuat notifikasi:', err);
    }
}

function addNotification(message, linkTab = 'pesanan') {
    customerNotifications.unshift({
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        linkTab: linkTab
    });
    updateNotificationUI();
}

function updateNotificationUI() {
    const badge = document.getElementById('notificationBadge');
    const listContainer = document.getElementById('notificationListContainer');
    
    if (!badge || !listContainer) return;

    const unreadCount = customerNotifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
        badge.style.display = 'block';
        badge.innerText = unreadCount;
    } else {
        badge.style.display = 'none';
    }

    if (customerNotifications.length === 0) {
        tampilkanPesanDOM(listContainer, 'div', 'Belum ada notifikasi baru', 'padding: 16px; text-align: center; color: #64748b; font-size: 12px;');
        return;
    }

    listContainer.replaceChildren();
    customerNotifications.forEach(n => {
        const item = document.createElement('div');
        item.className = `notification-item ${n.read ? '' : 'unread'}`;
        
        const bgStyle = n.read ? '#ffffff' : '#eff6ff'; 
        const fontWeight = n.read ? '400' : '600';    
        const textColor = n.read ? '#64748b' : '#1e293b'; 
        
        item.style.cssText = `
            padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 12px; 
            color: ${textColor}; background: ${bgStyle}; font-weight: ${fontWeight}; cursor: pointer;
            display: flex; align-items: flex-start; gap: 8px; transition: background 0.15s; 
        `;
        
        item.onmouseover = () => item.style.background = n.read ? '#f8fafc' : '#dbeafe';
        item.onmouseout = () => item.style.background = bgStyle;

        item.addEventListener('click', async () => {
            if (!n.read) {
                n.read = true;
                updateNotificationUI(); 
                if (n.id) {
                    try { 
                        if (typeof csrfFetch === 'function') {
                            await csrfFetch(`/api/auth/notifikasi/${n.id}/read`, { method: 'PUT' });
                        } else {
                            await fetch(`/api/auth/notifikasi/${n.id}/read`, { method: 'PUT', credentials: 'include' });
                        }
                    } catch (err) {}
                }
            }
            if (n.linkTab) switchTab(n.linkTab);
            closeAllDropdowns();
        });

        const indicator = document.createElement('span');
        indicator.style.cssText = 'width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-top: 4px; flex-shrink: 0;';
        if (!n.read) indicator.style.background = '#2563eb';

        const content = document.createElement('div');
        content.style.flexGrow = '1';
        const message = buatElemenTeks('div', n.text);
        message.style.marginBottom = '2px';
        const time = buatElemenTeks('div', n.time);
        time.style.cssText = 'font-size: 10px; color: #94a3b8; font-weight: normal;';
        content.appendChild(message);
        content.appendChild(time);
        item.appendChild(indicator);
        item.appendChild(content);
        listContainer.appendChild(item);
    });
}

async function markAllNotificationsAsRead() {
    try {
        if (typeof csrfFetch === 'function') {
            await csrfFetch('/api/auth/notifikasi/read-all', { method: 'PUT' });
        } else {
            await fetch('/api/auth/notifikasi/read-all', { method: 'PUT', credentials: 'include' });
        }
        customerNotifications.forEach(n => n.read = true);
        updateNotificationUI();
    } catch (err) { console.error('Gagal menandai notifikasi dibaca:', err); }
}

// ==========================================
// CEK PESANAN OTOMATIS (POLLING)
// ==========================================
async function checkCustomerOrdersAutomatically() {
    try {
        const res = await fetch('/api/pesanan/customer/orders', { credentials: 'include' });
        if (!res.ok) return;
        const result = await res.json();

        if (result.status === 'success' && Array.isArray(result.data)) {
            const currentOrders = result.data;
            const currentCount = currentOrders.length;

            if (lastKnownCustomerOrderCount === null) {
                lastKnownCustomerOrderCount = currentCount;
                currentOrders.forEach(o => { lastOrderStatusMap[o.id_pesanan] = o.status; });
                return;
            }

            if (currentCount > lastKnownCustomerOrderCount) {
                const msg = '📦 Pesanan baru Anda berhasil tercatat di sistem!';
                showCustomerToast(msg, 'success');
                muatPesananSaya();
            }

            currentOrders.forEach(o => {
                if (lastOrderStatusMap[o.id_pesanan] && lastOrderStatusMap[o.id_pesanan] !== o.status) {
                    const msg = `🔔 Status pesanan "${o.nama_produk}" berubah ke: ${o.status}`;
                    showCustomerToast(msg, 'success');
                    addNotification(msg, 'pesanan');
                    muatPesananSaya();
                }
                lastOrderStatusMap[o.id_pesanan] = o.status;
            });

            lastKnownCustomerOrderCount = currentCount;
        }
    } catch (err) {}
}

// ==========================================
// INISIALISASI HALAMAN & EVENT LISTENER DOM
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof getCsrfToken === 'function') {
        try { await getCsrfToken(); } catch (e) {}
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const tabId = link.getAttribute('data-tab');
            if (tabId) switchTab(tabId, e);
        });
    });

    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) cartBtn.addEventListener('click', bukaModalKeranjang);

    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) notificationBtn.addEventListener('click', toggleNotificationDropdown);

    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);

    const profileTrigger = document.getElementById('profileTrigger');
    if (profileTrigger) profileTrigger.addEventListener('click', toggleDropdown);

    const profileMenuBtn = document.getElementById('profileMenuBtn');
    if (profileMenuBtn) profileMenuBtn.addEventListener('click', () => { window.location.href = '/pages/customer-profile.html'; });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const closeCartModalBtn = document.getElementById('closeCartModalBtn');
    if (closeCartModalBtn) closeCartModalBtn.addEventListener('click', tutupModalKeranjang);

    const checkoutCartBtn = document.getElementById('checkoutCartBtn');
    if (checkoutCartBtn) checkoutCartBtn.addEventListener('click', bukaCheckoutKeranjang);

    const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
    if (closeDetailModalBtn) closeDetailModalBtn.addEventListener('click', closeDetailModal);

    const closeEditOrderModalBtn = document.getElementById('closeEditOrderModalBtn');
    const cancelEditOrderBtn = document.getElementById('cancelEditOrderBtn');
    if (closeEditOrderModalBtn) closeEditOrderModalBtn.addEventListener('click', closeEditOrderModal);
    if (cancelEditOrderBtn) cancelEditOrderBtn.addEventListener('click', closeEditOrderModal);

    const closeAddToCartBtn = document.getElementById('closeAddToCartBtn');
    const cancelAddToCartBtn = document.getElementById('cancelAddToCartBtn');
    if (closeAddToCartBtn) closeAddToCartBtn.addEventListener('click', tutupModalAddToCart);
    if (cancelAddToCartBtn) cancelAddToCartBtn.addEventListener('click', tutupModalAddToCart);

    const addToCartForm = document.getElementById('addToCartForm');
    if (addToCartForm) addToCartForm.addEventListener('submit', prosesTambahKeKeranjang);

    try {
        const response = await fetch('/api/auth/check', { credentials: 'include' });
        const result = await response.json();
        
        if (result.status !== 'success' || result.data.role !== 'pelanggan') {
            alert('Akses Ditolak! Sesi Anda telah berakhir atau Anda belum login.');
            window.location.href = '/pages/login.html';
            return;
        }
        
        muatKatalog();
        muatHeaderProfil();
        muatPesananSaya();
        muatNotifikasiPelanggan();
        muatJumlahKeranjangBadge();

        setInterval(checkCustomerOrdersAutomatically, 15000);
        setInterval(muatJumlahKeranjangBadge, 15000);
        
    } catch (error) {
        window.location.href = '/pages/login.html';
    }
});

function closeEditOrderModal() {
    const editOrderModal = document.getElementById('editOrderModal');
    if (editOrderModal) editOrderModal.style.display = 'none';
}

// ==========================================
// DATA WILAYAH INDONESIA API & ONGKIR
// ==========================================
async function loadEditProvinces() {
    try {
        const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        const provinces = await response.json();
        const select = document.getElementById('edit_provinsi');
        if(select) {
            select.replaceChildren(buatOption('', 'Pilih Provinsi'));
            provinces.forEach(prov => {
                const opt = document.createElement('option');
                opt.value = prov.name;
                opt.dataset.id = prov.id;
                opt.textContent = prov.name;
                select.appendChild(opt);
            });
        }
    } catch (e) { console.error('Gagal memuat data provinsi', e); }
}

const elProvinsi = document.getElementById('edit_provinsi');
if(elProvinsi) {
    elProvinsi.addEventListener('change', async function() {
        const provId = this.options[this.selectedIndex]?.dataset.id;
        const kabSelect = document.getElementById('edit_kabupaten');
        
        kabSelect.replaceChildren(buatOption('', 'Pilih Kabupaten/Kota'));
        document.getElementById('edit_kecamatan').replaceChildren(buatOption('', 'Pilih Kecamatan'));
        document.getElementById('edit_kelurahan').replaceChildren(buatOption('', 'Pilih Kelurahan/Desa'));
        document.getElementById('edit_kurir').replaceChildren(buatOption('', '-- Pilih Kabupaten/Kota Terlebih Dahulu --'));
        hitungTotalEdit();
        
        if (!provId) return;
        try {
            const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`);
            const data = await res.json();
            data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.name;
                opt.dataset.id = item.id;
                opt.textContent = item.name;
                kabSelect.appendChild(opt);
            });
        } catch (e) { console.error(e); }
    });
}

const elKabupaten = document.getElementById('edit_kabupaten');
if(elKabupaten) {
    elKabupaten.addEventListener('change', async function() {
        const kabId = this.options[this.selectedIndex]?.dataset.id;
        const kabName = this.value;
        const provName = document.getElementById('edit_provinsi').value;
        const kurirSelect = document.getElementById('edit_kurir');
        
        kurirSelect.replaceChildren(buatOption('', 'Memuat tarif kurir...'));
        hitungTotalEdit();

        const kecSelect = document.getElementById('edit_kecamatan');
        kecSelect.replaceChildren(buatOption('', 'Pilih Kecamatan'));
        document.getElementById('edit_kelurahan').replaceChildren(buatOption('', 'Pilih Kelurahan/Desa'));
        
        if (!kabId) {
            kurirSelect.replaceChildren(buatOption('', '-- Pilih Kabupaten/Kota Terlebih Dahulu --'));
            return;
        }

        try {
            const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${kabId}.json`);
            const data = await res.json();
            data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.name;
                opt.dataset.id = item.id;
                opt.textContent = item.name;
                kecSelect.appendChild(opt);
            });
        } catch (e) {}

        try {
            const itemContainers = document.querySelectorAll('.edit-item-row');
            const requestBody = {
                mode: 'pesanan',
                destinationName: kabName,
                provinceName: provName
            };

            if (itemContainers.length > 0) {
                requestBody.items = Array.from(itemContainers).map(container => ({
                    id_pesanan: Number(container.getAttribute('data-id')),
                    jumlah: Number(container.querySelector('.edit-item-jumlah')?.value)
                }));
            } else {
                requestBody.items = [{
                    id_pesanan: Number(document.getElementById('edit_id_pesanan')?.value),
                    jumlah: Number(document.getElementById('edit_jumlah')?.value)
                }];
            }

            let response;
            if (typeof csrfFetch === 'function') {
                response = await csrfFetch('/api/cek-ongkir', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(requestBody)
                });
            } else {
                response = await fetch('/api/cek-ongkir', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(requestBody),
                    credentials: 'include'
                });
            }

            const result = await response.json();
            kurirSelect.replaceChildren(buatOption('', 'Pilih Layanan Kurir'));

            if (response.ok && result.status === 'success' && result.data && result.data.length > 0) {
                result.data.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.code;
                    option.dataset.cost = String(item.cost);
                    option.textContent = `${item.courier || ''} ${item.service} (${item.etd}) - Rp ${Number(item.cost).toLocaleString('id-ID')}`;
                    kurirSelect.appendChild(option);
                });
            } else {
                addEditPickupOption();
            }
        } catch (err) {
            console.error('Gagal memuat ongkir:', err);
            addEditPickupOption();
        }
    });
}

function addEditPickupOption() {
    const kurirSelect = document.getElementById('edit_kurir');
    kurirSelect.replaceChildren();
    const option = document.createElement('option');
    option.value = 'PICKUP_STORE';
    option.dataset.cost = '0';
    option.textContent = 'Ambil di Toko / Workshop (Gratis) - Rp 0';
    kurirSelect.appendChild(option);
    hitungTotalEdit();
}

const elKurirEdit = document.getElementById('edit_kurir');
if (elKurirEdit) {
    elKurirEdit.addEventListener('change', () => {
        hitungTotalEdit();
    });
}

const elKecamatan = document.getElementById('edit_kecamatan');
if(elKecamatan) {
    elKecamatan.addEventListener('change', async function() {
        const kecId = this.options[this.selectedIndex]?.dataset.id;
        const kelSelect = document.getElementById('edit_kelurahan');
        kelSelect.replaceChildren(buatOption('', 'Pilih Kelurahan/Desa'));
        if (!kecId) return;
        try {
            const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${kecId}.json`);
            const data = await res.json();
            data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.name;
                opt.textContent = item.name;
                kelSelect.appendChild(opt);
            });
        } catch (e) {}
    });
}

function hitungTotalEdit() {
    const itemContainers = document.querySelectorAll('.edit-item-row');
    let totalSubtotal = 0;

    if (itemContainers.length > 0) {
        itemContainers.forEach(container => {
            const hargaDasar = Number(container.getAttribute('data-harga')) || 0;
            const qtyInput = container.querySelector('.edit-item-jumlah');
            const qty = qtyInput ? Number(qtyInput.value) || 1 : 1;
            totalSubtotal += (hargaDasar * qty);
        });
    } else {
        const hargaDasar = Number(document.getElementById('edit_harga_dasar')?.value) || 0;
        const jumlahInput = document.getElementById('edit_jumlah');
        const jumlah = (jumlahInput && !jumlahInput.disabled) ? Number(jumlahInput.value) : 1; 
        totalSubtotal = hargaDasar * jumlah;
    }
    
    const kurirSelect = document.getElementById('edit_kurir');
    const selectedOption = kurirSelect?.selectedOptions[0];
    const ongkir = selectedOption && selectedOption.dataset.cost ? Number(selectedOption.dataset.cost) : 0;
    
    const total = totalSubtotal + ongkir;
    
    const displayTotal = document.getElementById('editTotalDisplay');
    if(displayTotal) displayTotal.innerText = 'Rp ' + total.toLocaleString('id-ID');
    
    const form = document.getElementById('editOrderForm');
    if(form) {
        form.dataset.ongkir = ongkir;
        form.dataset.total = total;
        form.dataset.serviceCode = kurirSelect ? kurirSelect.value : '';
    }
}

// ==========================================
// LOAD DATA MASTER & LISTING
// ==========================================
async function muatHeaderProfil() {
    try {
        const res = await fetch('/api/customer/profile', { credentials: 'include' });
        const result = await res.json();
        if (result.status === 'success') {
            const u = result.data;
            document.getElementById('customerNameDisplay').innerText = u.nama_lengkap.split(' ')[0];
            document.getElementById('customerAvatarInit').innerText = u.nama_lengkap.charAt(0).toUpperCase();
            document.getElementById('dropdownEmail').innerText = u.email;
        }
    } catch (err) {}
}

async function muatKatalog() {
    const container = document.getElementById('catalog-container');
    if(!container) return;

    try {
        const response = await fetch('/api/produk', { credentials: 'include' });
        const result = await response.json();

        if (result.status === 'success') {
            dataProdukGlobal = result.data;
            container.replaceChildren();
            
            if (dataProdukGlobal.length === 0) {
                tampilkanPesanDOM(container, 'p', 'Belum ada produk.', 'grid-column: 1 / -1; text-align: center; color: #64748b;');
                return;
            }
            
            dataProdukGlobal.forEach(p => {
                let imgSrc = 'https://via.placeholder.com/400x300?text=Tanpa+Gambar';
                if (p.gambar_url) {
                    try {
                        const imgs = JSON.parse(p.gambar_url);
                        if (Array.isArray(imgs) && imgs.length > 0) imgSrc = `/${imgs[0]}`;
                        else imgSrc = `/${p.gambar_url}`;
                    } catch(e) { imgSrc = `/${p.gambar_url}`; }
                }

                const card = document.createElement('div');
                card.className = 'product-card';

                const imgEl = document.createElement('img');
                imgEl.src = imgSrc;
                imgEl.className = 'product-img';
                imgEl.alt = p.nama_produk;
                imgEl.addEventListener('click', () => openDetailModal(p.id_produk));
                imgEl.onerror = () => { imgEl.src = 'https://via.placeholder.com/400x300?text=Error'; };

                const bodyDiv = document.createElement('div');
                bodyDiv.className = 'product-body';

                const titleEl = document.createElement('h3');
                titleEl.className = 'product-title';
                titleEl.innerText = p.nama_produk;
                titleEl.addEventListener('click', () => openDetailModal(p.id_produk));

                const descEl = document.createElement('p');
                descEl.className = 'product-desc';
                descEl.innerText = p.deskripsi || 'Tidak ada deskripsi';

                const bahanEl = document.createElement('p');
                bahanEl.style.cssText = 'font-size:13px; color:#334155; margin-bottom: 4px;';
                const bahanLabel = buatElemenTeks('strong', 'Bahan: ');
                bahanEl.appendChild(bahanLabel);
                bahanEl.appendChild(document.createTextNode(p.bahan || '-'));

                const beratEl = document.createElement('p');
                beratEl.style.cssText = 'font-size:13px; color:#334155;';
                const beratLabel = buatElemenTeks('strong', 'Berat: ');
                beratEl.appendChild(beratLabel);
                beratEl.appendChild(document.createTextNode(p.berat ? `${p.berat} Gram` : '1000 Gram'));

                const priceEl = document.createElement('div');
                priceEl.className = 'product-price';
                priceEl.innerText = `Rp ${Number(p.harga_estimasi).toLocaleString('id-ID')}`;

                bodyDiv.appendChild(titleEl);
                bodyDiv.appendChild(descEl);
                bodyDiv.appendChild(bahanEl);
                bodyDiv.appendChild(beratEl);
                bodyDiv.appendChild(priceEl);

                const footerDiv = document.createElement('div');
                footerDiv.className = 'product-footer';

                const btnCart = document.createElement('button');
                btnCart.className = 'btn-cart';
                btnCart.innerText = '🛒 + Keranjang';
                btnCart.addEventListener('click', () => tambahKeKeranjang(p.id_produk));

                const btnOrder = document.createElement('button');
                btnOrder.className = 'btn-order';
                btnOrder.innerText = 'Pesan Sekarang';
                btnOrder.addEventListener('click', () => openOrderPage(p.id_produk));

                footerDiv.appendChild(btnCart);
                footerDiv.appendChild(btnOrder);

                card.appendChild(imgEl);
                card.appendChild(bodyDiv);
                card.appendChild(footerDiv);
                container.appendChild(card);
            });
        }
    } catch (err) { console.error(err); }
}

async function muatPesananSaya() {
    const tbody = document.getElementById('my-orders-body');
    if(!tbody) return;

    try {
        const res = await fetch('/api/pesanan/customer/orders', { credentials: 'include' });
        if (!res.ok) {
            const errorRow = document.createElement('tr');
            const errorCell = buatElemenTeks('td', 'Gagal memuat data.');
            errorCell.colSpan = 9;
            errorCell.style.cssText = 'text-align:center; color:red; padding: 20px;';
            errorRow.appendChild(errorCell);
            tbody.replaceChildren(errorRow);
            return;
        }

        const result = await res.json();
        if (result.status === 'success') {
            const rawOrders = result.data;
            tbody.replaceChildren();
            
            if (!rawOrders || rawOrders.length === 0) {
                const emptyRow = document.createElement('tr');
                const emptyCell = buatElemenTeks('td', 'Belum ada riwayat pesanan.');
                emptyCell.colSpan = 9;
                emptyCell.style.cssText = 'text-align:center; color:#64748b; padding: 20px;';
                emptyRow.appendChild(emptyCell);
                tbody.appendChild(emptyRow);
                return;
            }

            const groupedOrdersMap = {};
            
            rawOrders.forEach(item => {
                const tanggalRaw = item.tanggal_pesan || item.created_at || '';

                const key = item.id_grup_pesanan
                    ? `G_${item.id_grup_pesanan}`
                    : `P_${item.id_pesanan}`;
                
                if (!groupedOrdersMap[key]) {
                    groupedOrdersMap[key] = {
                        id_pesanan: item.id_pesanan,
                        id_grup_pesanan: item.id_grup_pesanan || null,
                        tanggal_pesan: tanggalRaw,
                        alamat_pengiriman: item.alamat_pengiriman || '-',
                        metode_pembayaran: item.metode_pembayaran,
                        ongkir: Number(item.ongkir || 0),
                        status: item.status || 'Menunggu',
                        items: []
                    };
                } else {
                    if ((!groupedOrdersMap[key].metode_pembayaran || groupedOrdersMap[key].metode_pembayaran === 'Transfer Bank') && item.metode_pembayaran) {
                        groupedOrdersMap[key].metode_pembayaran = item.metode_pembayaran;
                    }
                    
                    groupedOrdersMap[key].ongkir += Number(item.ongkir || 0);
                }
                
                groupedOrdersMap[key].items.push({
                    id_pesanan: item.id_pesanan,
                    id_produk: item.id_produk,
                    nama_produk: item.nama_produk || 'Produk',
                    jumlah: Number(item.jumlah || 1),
                    harga_estimasi: Number(item.harga_satuan || item.harga_estimasi || 0),
                    detail_ukuran: item.detail_ukuran || '-',
                    berat: Number(item.berat || 1000),
                    status: item.status || 'Menunggu',
                    ongkir: Number(item.ongkir || 0),
                    total_harga: Number(item.total_harga || 0)
                });
            });

            const finalOrders = Object.values(groupedOrdersMap);

            finalOrders.forEach(group => {
                group.items.sort((a, b) => Number(a.id_pesanan) - Number(b.id_pesanan));
                const statuses = group.items.map(item => item.status || 'Menunggu');
                group.status = new Set(statuses).size === 1 ? statuses[0] : 'Campuran';
                group.rincian_status = [...new Set(statuses)].map(s =>
                    `${statuses.filter(value => value === s).length} ${s}`
                ).join(' · ');
            });
            window.globalCustomerPesanan = finalOrders;

            finalOrders.forEach((order, index) => {
                const nomorUrut = index + 1;
                const tanggal = new Date(order.tanggal_pesan || Date.now()).toLocaleDateString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                let displayIdPesanan = order.items[0].id_pesanan;
                if (order.items.length > 1) {
                    const firstId = order.items[0].id_pesanan;
                    const lastId = order.items[order.items.length - 1].id_pesanan;
                    displayIdPesanan = firstId !== lastId ? `${Math.min(firstId, lastId)} - ${Math.max(firstId, lastId)}` : firstId;
                }

                let totalHargaGrup = 0;

                if (order.items.length > 1) {
                    order.items.forEach(i => {
                        totalHargaGrup += (i.harga_estimasi * i.jumlah);
                    });
                    totalHargaGrup += order.ongkir;
                } else {
                    const p = order.items[0];
                    totalHargaGrup = (p.harga_estimasi * p.jumlah) + order.ongkir;
                }

                let metodeBayar = order.metode_pembayaran;
                if (typeof metodeBayar === 'object' && metodeBayar !== null) {
                    metodeBayar = metodeBayar.nama || metodeBayar.metode || metodeBayar.type || 'Transfer Bank';
                } else if (typeof metodeBayar === 'string' && (metodeBayar.trim().startsWith('{') || metodeBayar.includes('"0":'))) {
                    try {
                        const parsed = JSON.parse(metodeBayar);
                        metodeBayar = parsed.nama || parsed.metode || parsed.type || Object.values(parsed).join('') || 'Transfer Bank';
                    } catch (e) {
                        metodeBayar = 'Transfer Bank';
                    }
                } else if (!metodeBayar || metodeBayar === '[object Object]' || String(metodeBayar).trim() === '') {
                    metodeBayar = 'Transfer Bank';
                }

                let bgStatus = '#fef3c7', colorStatus = '#d97706';
                if (order.status === 'Selesai') { bgStatus = '#dcfce7'; colorStatus = '#16a34a'; }
                else if (order.status === 'Diproses') { bgStatus = '#e0f2fe'; colorStatus = '#0284c7'; }
                else if (order.status === 'Dikirim') { bgStatus = '#ede9fe'; colorStatus = '#7c3aed'; }
                else if (order.status === 'Batal') { bgStatus = '#fee2e2'; colorStatus = '#dc2626'; }
                else if (order.status === 'Campuran') { bgStatus = '#f1f5f9'; colorStatus = '#475569'; }

                const tr = document.createElement('tr');
                const buatCell = (value, styleText = '', className = '') => {
                    const td = document.createElement('td');
                    if (styleText) td.style.cssText = styleText;
                    if (className) td.className = className;
                    if (value instanceof Node) td.appendChild(value);
                    else td.textContent = value == null ? '' : String(value);
                    return td;
                };

                const productCellContent = document.createElement('div');
                if (order.items.length > 1) {
                    const productCount = buatElemenTeks('strong', `${order.items.length} Produk dalam 1 Pesanan`);
                    const cartLabel = buatElemenTeks('span', '(Checkout Keranjang)');
                    cartLabel.style.cssText = 'font-size: 11px; color: #2563eb; font-weight: 600;';
                    productCellContent.appendChild(productCount);
                    productCellContent.appendChild(document.createElement('br'));
                    productCellContent.appendChild(cartLabel);
                } else {
                    const productName = buatElemenTeks('strong', order.items[0].nama_produk);
                    const qty = buatElemenTeks('span', `Qty: ${order.items[0].jumlah} item`);
                    qty.style.cssText = 'color: #2563eb; font-size: 12px; font-weight: 500;';
                    productCellContent.appendChild(productName);
                    productCellContent.appendChild(document.createElement('br'));
                    productCellContent.appendChild(qty);
                }

                const paymentContent = document.createElement('div');
                paymentContent.appendChild(document.createTextNode('Bayar: '));
                const paymentStrong = buatElemenTeks('strong', metodeBayar);
                paymentStrong.style.color = '#0f172a';
                paymentContent.appendChild(paymentStrong);
                paymentContent.appendChild(document.createElement('br'));
                paymentContent.appendChild(document.createTextNode(`Ongkir: Rp ${Number(order.ongkir).toLocaleString('id-ID')}`));

                const statusCellContent = document.createElement('div');
                const statusLabel = buatElemenTeks('span', order.status);
                statusLabel.style.cssText = `font-weight:600; padding: 4px 8px; border-radius: 4px; background: ${bgStatus}; color: ${colorStatus};`;
                const actionContainer = document.createElement('div');
                actionContainer.className = 'action-buttons-container';
                actionContainer.style.cssText = 'display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px;';
                statusCellContent.appendChild(statusLabel);
                if (order.status === 'Campuran') {
                    const rincianStatus = buatElemenTeks('small', order.rincian_status);
                    rincianStatus.style.cssText = 'display:block; color:#64748b; margin-top:6px; font-size:11px; white-space:normal;';
                    statusCellContent.appendChild(rincianStatus);
                }
                statusCellContent.appendChild(actionContainer);

                tr.appendChild(buatCell(nomorUrut, 'font-weight: 600; text-align: center; padding: 12px 8px;'));
                const idCell = buatCell(displayIdPesanan, 'font-weight: 600; color: #475569; text-align: center; padding: 12px 8px;');
                if (order.id_grup_pesanan) {
                    const grupLabel = buatElemenTeks('small', `Grup: ${order.id_grup_pesanan}`);
                    grupLabel.style.cssText = 'display:block; font-size:10px; color:#2563eb; font-weight:500; max-width:180px; overflow-wrap:anywhere;';
                    grupLabel.title = order.id_grup_pesanan;
                    idCell.appendChild(grupLabel);
                }
                tr.appendChild(idCell);
                tr.appendChild(buatCell(tanggal, 'color: #64748b; white-space: nowrap; padding: 12px 8px;'));
                tr.appendChild(buatCell(productCellContent, 'padding: 12px 8px; min-width: 140px;'));
                tr.appendChild(buatCell('', 'max-width: 200px; word-break: break-word; font-size: 13px; padding: 12px 8px;', 'col-rincian'));
                tr.appendChild(buatCell(order.alamat_pengiriman, 'max-width: 220px; word-break: break-word; font-size: 12px; color: #334155; padding: 12px 8px;'));
                tr.appendChild(buatCell(paymentContent, 'font-size: 12px; color: #475569; white-space: nowrap; padding: 12px 8px;'));
                tr.appendChild(buatCell(`Rp ${totalHargaGrup.toLocaleString('id-ID')}`, 'font-weight: 700; color: #16a34a; white-space: nowrap; padding: 12px 8px;'));
                tr.appendChild(buatCell(statusCellContent, 'padding: 12px 8px; white-space: nowrap;', 'col-status'));
                tbody.appendChild(tr);

                const colRincian = tr.querySelector('.col-rincian');
                if (order.items.length > 1) {
                    const btnRincian = document.createElement('button');
                    btnRincian.style.cssText = "background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap;";
                    btnRincian.innerText = `🔍 Lihat Rincian (${order.items.length} Item)`;
                    btnRincian.addEventListener('click', () => bukaRincianKeranjangPelanggan(index));
                    colRincian.appendChild(btnRincian);
                } else {
                    colRincian.innerText = order.items[0].detail_ukuran || '-';
                }

                if (order.status === 'Menunggu') {
                    const actionContainer = tr.querySelector('.action-buttons-container');
                    
                    const btnEdit = document.createElement('button');
                    btnEdit.className = 'action-btn btn-edit';
                    btnEdit.innerText = 'Edit';
                    btnEdit.addEventListener('click', () => bukaEditPesanan(order.items[0].id_pesanan));

                    const btnBatal = document.createElement('button');
                    btnBatal.className = 'action-btn btn-batal';
                    btnBatal.innerText = 'Batal';
                    btnBatal.addEventListener('click', () => batalkanPesanan(order.items[0].id_pesanan));

                    actionContainer.appendChild(btnEdit);

                    if (order.items.length === 1) actionContainer.appendChild(btnBatal);
                }
            });
        }
    } catch (err) {
        const errorRow = document.createElement('tr');
        const errorCell = buatElemenTeks('td', 'Gagal memuat riwayat pesanan.');
        errorCell.colSpan = 9;
        errorCell.style.cssText = 'text-align:center; color:red; padding: 20px;';
        errorRow.appendChild(errorCell);
        tbody.replaceChildren(errorRow);
    }
}

// MODAL LIHAT RINCIAN UNTUK PELANGGAN
function bukaRincianKeranjangPelanggan(index) {
    const order = window.globalCustomerPesanan?.[index];
    if (!order) return;
    
    let modalEl = document.getElementById('modalRincianPelanggan');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'modalRincianPelanggan';
        modalEl.className = 'modal-overlay';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'modal-content';
        contentDiv.style.cssText = 'max-width: 600px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';

        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;';
        
        const h3 = document.createElement('h3');
        h3.style.cssText = 'color: #0f172a; font-size: 18px; font-weight: 600;';
        h3.innerText = '📦 Rincian Item Pesanan Keranjang';

        const closeSpan = document.createElement('span');
        closeSpan.style.cssText = 'font-size: 24px; cursor: pointer; color: #64748b; line-height: 1;';
        closeSpan.textContent = '×';
        closeSpan.addEventListener('click', tutupRincianKeranjangPelanggan);

        headerDiv.appendChild(h3);
        headerDiv.appendChild(closeSpan);

        const bodyDiv = document.createElement('div');
        bodyDiv.id = 'modalRincianBodyPelanggan';
        bodyDiv.style.cssText = 'max-height: 400px; overflow-y: auto;';

        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(bodyDiv);
        modalEl.appendChild(contentDiv);
        document.body.appendChild(modalEl);
    }

    const bodyContent = document.getElementById('modalRincianBodyPelanggan');
    if (!order.items || order.items.length === 0) {
        tampilkanPesanDOM(bodyContent, 'p', 'Tidak ada rincian item.');
    } else {
        bodyContent.replaceChildren();
        const pDesc = document.createElement('p');
        pDesc.style.cssText = 'margin-bottom: 12px; font-size: 14px; color: #475569;';
        pDesc.innerText = 'Daftar produk dalam transaksi pesanan Anda:';
        bodyContent.appendChild(pDesc);

        const ul = document.createElement('ul');
        ul.style.cssText = 'list-style: none; padding: 0;';
        
        order.items.forEach((item, idx) => {
            const subtotal = item.harga_estimasi * item.jumlah;
            const li = document.createElement('li');
            li.style.cssText = 'padding: 12px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;';
            
            const itemInfo = document.createElement('div');
            const itemName = buatElemenTeks('strong', `${idx + 1}. ${item.nama_produk}`);
            const itemPrice = buatElemenTeks('span', `Harga: Rp ${Number(item.harga_estimasi).toLocaleString('id-ID')} | Qty: ${item.jumlah}`);
            itemPrice.style.cssText = 'font-size: 12px; color: #64748b;';
            const itemNote = buatElemenTeks('span', `Catatan: ${item.detail_ukuran || '-'}`);
            itemNote.style.cssText = 'font-size: 12px; color: #475569;';
            itemInfo.appendChild(itemName);
            itemInfo.appendChild(document.createElement('br'));
            itemInfo.appendChild(itemPrice);
            itemInfo.appendChild(document.createElement('br'));
            itemInfo.appendChild(itemNote);
            itemInfo.appendChild(document.createElement('br'));
            const itemStatus = buatElemenTeks('span', `Status: ${item.status || 'Menunggu'}`);
            itemStatus.style.cssText = 'font-size:12px; font-weight:600; color:#475569;';
            itemInfo.appendChild(itemStatus);
            if (item.status === 'Menunggu') {
                const btnBatalItem = document.createElement('button');
                btnBatalItem.type = 'button';
                btnBatalItem.className = 'action-btn btn-batal';
                btnBatalItem.style.cssText = 'display:block;margin-top:6px;';
                btnBatalItem.textContent = `Batal Item #${item.id_pesanan}`;
                btnBatalItem.addEventListener('click', () => {
                    tutupRincianKeranjangPelanggan();
                    batalkanPesanan(item.id_pesanan);
                });
                itemInfo.appendChild(btnBatalItem);
            }

            const subtotalEl = buatElemenTeks('div', `Rp ${subtotal.toLocaleString('id-ID')}`);
            subtotalEl.style.cssText = 'font-weight: 600; color: #2563eb; text-align: right; white-space: nowrap;';
            li.appendChild(itemInfo);
            li.appendChild(subtotalEl);
            ul.appendChild(li);
        });
        bodyContent.appendChild(ul);
    }

    modalEl.style.display = 'flex';
}

function tutupRincianKeranjangPelanggan() {
    const modalEl = document.getElementById('modalRincianPelanggan');
    if (modalEl) modalEl.style.display = 'none';
}

// ==========================================
// MANIPULASI PESANAN (BATAL & EDIT)
// ==========================================
async function batalkanPesanan(id_pesanan) {
    if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return;
    try {
        let response;
        const payload = { status: 'Batal' };

        if (typeof csrfFetch === 'function') {
            response = await csrfFetch(`/api/pesanan/${id_pesanan}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            response = await fetch(`/api/pesanan/${id_pesanan}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
        }

        if (response.ok) {
            const msg = `Pesanan ${id_pesanan} berhasil dibatalkan.`;
            showCustomerToast(msg, 'success');
            addNotification(msg, 'pesanan');
            muatPesananSaya(); 
        }
    } catch (err) {}
}

function bukaEditPesanan(id_pesanan) {
    const orderGroup = window.globalCustomerPesanan.find(g => g.items.some(i => i.id_pesanan == id_pesanan));
    
    if (!orderGroup) {
        showCustomerToast('Data pesanan tidak ditemukan.', 'error');
        return;
    }

    const container = document.getElementById('singleItemCheckoutContainer');
    if (!container) return;

    container.replaceChildren();

    if (orderGroup.items.length > 1) {
        const h4 = document.createElement('h4');
        h4.style.cssText = 'margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #0f172a;';
        h4.innerText = `📦 Daftar Produk dalam Pesanan (${orderGroup.items.length} Item)`;
        container.appendChild(h4);
        
        orderGroup.items.forEach((item, index) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'edit-item-row';
            rowDiv.setAttribute('data-id', item.id_pesanan);
            rowDiv.setAttribute('data-id-produk', item.id_produk || 1);
            rowDiv.setAttribute('data-harga', item.harga_estimasi);
            rowDiv.setAttribute('data-berat', item.berat);
            rowDiv.style.cssText = 'background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 10px;';

            const pTitle = document.createElement('p');
            pTitle.style.cssText = 'font-weight: 600; font-size: 13px; color: #1e293b; margin-bottom: 6px;';
            pTitle.innerText = `${index + 1}. ${item.nama_produk} (Rp ${Number(item.harga_estimasi).toLocaleString('id-ID')})`;

            const divDetail = document.createElement('div');
            divDetail.style.marginBottom = '8px';
            const labelDetail = document.createElement('label');
            labelDetail.style.cssText = 'font-size: 11px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;';
            labelDetail.innerText = 'Detail Ukuran & Catatan:';
            
            const textarea = document.createElement('textarea');
            textarea.className = 'edit-item-detail';
            textarea.setAttribute('data-id', item.id_pesanan);
            textarea.style.cssText = 'width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px;';
            textarea.rows = 2;
            textarea.value = (item.detail_ukuran && item.detail_ukuran !== '-') ? item.detail_ukuran : '';

            divDetail.appendChild(labelDetail);
            divDetail.appendChild(textarea);

            const divQty = document.createElement('div');
            const labelQty = document.createElement('label');
            labelQty.style.cssText = 'font-size: 11px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;';
            labelQty.innerText = 'Jumlah (Qty):';

            const inputQty = document.createElement('input');
            inputQty.type = 'number';
            inputQty.className = 'edit-item-jumlah';
            inputQty.setAttribute('data-id', item.id_pesanan);
            inputQty.min = 1;
            inputQty.value = item.jumlah;
            inputQty.style.cssText = 'width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px;';
            inputQty.addEventListener('input', hitungTotalEdit);

            divQty.appendChild(labelQty);
            divQty.appendChild(inputQty);

            rowDiv.appendChild(pTitle);
            rowDiv.appendChild(divDetail);
            rowDiv.appendChild(divQty);

            container.appendChild(rowDiv);
        });
    } else {
        const item = orderGroup.items[0];
        
        const inputIdPesanan = document.createElement('input');
        inputIdPesanan.type = 'hidden';
        inputIdPesanan.id = 'edit_id_pesanan';
        inputIdPesanan.value = item.id_pesanan;

        const inputHargaDasar = document.createElement('input');
        inputHargaDasar.type = 'hidden';
        inputHargaDasar.id = 'edit_harga_dasar';
        inputHargaDasar.value = item.harga_estimasi || 0;

        const infoBox = document.createElement('div');
        infoBox.style.cssText = 'background: #f8fafc; padding: 12px 14px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;';
        const productInfo = document.createElement('div');
        const productCaption = buatElemenTeks('span', 'Produk Dipesan');
        productCaption.style.cssText = 'font-size: 11px; color: #64748b; font-weight: 600; display: block; text-transform: uppercase;';
        const productName = buatElemenTeks('strong', item.nama_produk);
        productName.style.cssText = 'color: #0f172a; font-size: 14px;';
        productInfo.appendChild(productCaption);
        productInfo.appendChild(productName);

        const priceInfo = document.createElement('div');
        priceInfo.style.textAlign = 'right';
        const priceCaption = buatElemenTeks('span', 'Harga Satuan');
        priceCaption.style.cssText = 'font-size: 11px; color: #64748b; font-weight: 600; display: block; text-transform: uppercase;';
        const priceValue = buatElemenTeks('strong', `Rp ${Number(item.harga_estimasi).toLocaleString('id-ID')}`);
        priceValue.style.cssText = 'color: #2563eb; font-size: 14px;';
        priceInfo.appendChild(priceCaption);
        priceInfo.appendChild(priceValue);
        infoBox.appendChild(productInfo);
        infoBox.appendChild(priceInfo);

        const divDetail = document.createElement('div');
        divDetail.style.marginBottom = '16px';
        const detailLabel = buatElemenTeks('label', 'Detail Ukuran & Catatan Desain');
        detailLabel.style.cssText = 'font-size: 13px; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;';
        const detailTextarea = document.createElement('textarea');
        detailTextarea.id = 'edit_detail_ukuran';
        detailTextarea.style.cssText = 'width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;';
        detailTextarea.rows = 3;
        detailTextarea.value = (item.detail_ukuran && item.detail_ukuran !== '-') ? item.detail_ukuran : '';
        divDetail.appendChild(detailLabel);
        divDetail.appendChild(detailTextarea);

        const divQty = document.createElement('div');
        divQty.style.marginBottom = '16px';
        const labelQty = document.createElement('label');
        labelQty.style.cssText = 'font-size: 13px; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;';
        labelQty.innerText = 'Jumlah (Qty)';

        const inputJumlah = document.createElement('input');
        inputJumlah.type = 'number';
        inputJumlah.id = 'edit_jumlah';
        inputJumlah.min = 1;
        inputJumlah.value = item.jumlah;
        inputJumlah.style.cssText = 'width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;';
        inputJumlah.addEventListener('input', hitungTotalEdit);

        divQty.appendChild(labelQty);
        divQty.appendChild(inputJumlah);

        container.appendChild(inputIdPesanan);
        container.appendChild(inputHargaDasar);
        container.appendChild(infoBox);
        container.appendChild(divDetail);
        container.appendChild(divQty);
    }

    if (typeof loadEditProvinces === 'function') {
        loadEditProvinces();
    }

    document.getElementById('edit_kabupaten').replaceChildren(buatOption('', 'Pilih Kabupaten/Kota'));
    document.getElementById('edit_kecamatan').replaceChildren(buatOption('', 'Pilih Kecamatan'));
    document.getElementById('edit_kelurahan').replaceChildren(buatOption('', 'Pilih Kelurahan/Desa'));
    document.getElementById('edit_kurir').replaceChildren(buatOption('', '-- Pilih Kabupaten/Kota Terlebih Dahulu --'));
    document.getElementById('edit_alamat_detail').value = '';
    document.getElementById('edit_kodepos').value = '';

    const selectMetode = document.getElementById('edit_metode_pembayaran');
    if (selectMetode) {
        let metodeBayar = orderGroup.metode_pembayaran;
        if (typeof metodeBayar === 'object' && metodeBayar !== null) {
            metodeBayar = metodeBayar.nama || metodeBayar.metode || metodeBayar.type || '';
        } else if (typeof metodeBayar === 'string' && (metodeBayar.trim().startsWith('{') || metodeBayar.includes('"0":'))) {
            try {
                const parsed = JSON.parse(metodeBayar);
                metodeBayar = parsed.nama || parsed.metode || parsed.type || Object.values(parsed).join('');
            } catch (e) {}
        }
        if (metodeBayar) {
            let optionFound = false;
            for (let i = 0; i < selectMetode.options.length; i++) {
                if (selectMetode.options[i].value.toLowerCase().includes(metodeBayar.toLowerCase()) || 
                    metodeBayar.toLowerCase().includes(selectMetode.options[i].value.toLowerCase())) {
                    selectMetode.selectedIndex = i;
                    optionFound = true;
                    break;
                }
            }
            if (!optionFound) selectMetode.selectedIndex = 0;
        }
    }

    if (typeof hitungTotalEdit === 'function') {
        hitungTotalEdit();
    }

    document.getElementById('editOrderModal').style.display = 'flex';
}

// ----------------------------------------------------
// EVENT LISTENER FORM EDIT PESANAN & NOTIFIKASI
// ----------------------------------------------------
const editOrderFormEl = document.getElementById('editOrderForm');
if (editOrderFormEl) {
    editOrderFormEl.addEventListener('submit', async function(e) {
        e.preventDefault();

        const alamat_detail = document.getElementById('edit_alamat_detail').value.trim();
        const provinsi = document.getElementById('edit_provinsi').value;
        const kabupaten = document.getElementById('edit_kabupaten').value;
        const kecamatan = document.getElementById('edit_kecamatan').value;
        const kelurahan = document.getElementById('edit_kelurahan').value;
        const kodepos = document.getElementById('edit_kodepos').value;
        
        const alamat_pengiriman = `${alamat_detail}, Kel. ${kelurahan}, Kec. ${kecamatan}, Kab. ${kabupaten}, Prov. ${provinsi} ${kodepos}`;
        
        const kurirSelect = document.getElementById('edit_kurir');
        const selectedOption = kurirSelect?.selectedOptions[0];
        const ongkir = selectedOption && selectedOption.dataset.cost ? Number(selectedOption.dataset.cost) : 0;
        const serviceCode = kurirSelect ? kurirSelect.value : '';
        const metode_pembayaran = document.getElementById('edit_metode_pembayaran').value;
        
        const itemContainers = document.querySelectorAll('.edit-item-row');
        
        try {
            if (itemContainers.length > 0) {
                let firstId = null;
                let itemsToUpdate = [];

                for (const container of itemContainers) {
                    const idPesanan = container.getAttribute('data-id');
                    if (!firstId) firstId = idPesanan;

                    itemsToUpdate.push({
                        id_pesanan: idPesanan,
                        detail_ukuran: container.querySelector('.edit-item-detail').value.trim() || '-',
                        jumlah: Number(container.querySelector('.edit-item-jumlah').value) || 1
                    });
                }

                const payload = {
                    is_batch: true,
                    items: itemsToUpdate,
                    alamat_pengiriman,
                    metode_pembayaran,
                    serviceCode,
                    destinationName: kabupaten,
                    provinceName: provinsi
                };

                let response;
                if (typeof csrfFetch === 'function') {
                    response = await csrfFetch(`/api/pesanan/${firstId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    response = await fetch(`/api/pesanan/${firstId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify(payload),
                        credentials: 'include'
                    });
                }
                
                const result = await response.json();
                
                if (response.ok && result.status === 'success') {
                    const pesanNotif = `📝 Pesanan keranjang berhasil diperbarui.`;
                    showCustomerToast(pesanNotif, 'success');
                    if (typeof addNotification === 'function') addNotification(pesanNotif, 'pesanan');

                    document.getElementById('editOrderModal').style.display = 'none';
                    muatPesananSaya();
                } else {
                    showCustomerToast(result.message || 'Sebagian pesanan gagal diperbarui.', 'error');
                }
            } else {
                const id_pesanan = document.getElementById('edit_id_pesanan').value;
                const detail_ukuran = document.getElementById('edit_detail_ukuran').value.trim();
                const jumlah = document.getElementById('edit_jumlah').value;
                const hargaDasar = Number(document.getElementById('edit_harga_dasar').value) || 0;
                const total_harga = (hargaDasar * Number(jumlah)) + ongkir;

                const payload = {
                    detail_ukuran,
                    jumlah: parseInt(jumlah),
                    alamat_pengiriman,
                    ongkir,
                    metode_pembayaran,
                    total_harga,
                    serviceCode,
                    destinationName: kabupaten,
                    provinceName: provinsi
                };

                let response;
                if (typeof csrfFetch === 'function') {
                    response = await csrfFetch(`/api/pesanan/${id_pesanan}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    response = await fetch(`/api/pesanan/${id_pesanan}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify(payload),
                        credentials: 'include'
                    });
                }

                const result = await response.json();

                if (response.ok && result.status === 'success') {
                    const pesanNotif = `📝 Pesanan ${id_pesanan} berhasil diperbarui.`;
                    
                    showCustomerToast(pesanNotif, 'success');
                    if (typeof addNotification === 'function') {
                        addNotification(pesanNotif, 'pesanan');
                    }

                    document.getElementById('editOrderModal').style.display = 'none';
                    muatPesananSaya();
                } else {
                    showCustomerToast(result.message || 'Gagal memperbarui pesanan.', 'error');
                }
            }
        } catch (err) {
            console.error(err);
            showCustomerToast('Terjadi kesalahan jaringan saat menyimpan.', 'error');
        }
    });
}

// ==========================================
// MODAL DETAIL PRODUK
// ==========================================
function openDetailModal(id_produk) {
    const produk = dataProdukGlobal.find(p => p.id_produk === id_produk);
    if (!produk) return;

    let images = [];
    if (produk.gambar_url) {
        try {
            images = JSON.parse(produk.gambar_url);
            if (!Array.isArray(images)) images = [produk.gambar_url];
        } catch (e) { images = [produk.gambar_url]; }
    }

    const mainImgSrc = images.length > 0 ? `/${images[0]}` : 'https://via.placeholder.com/600x400?text=Tanpa+Gambar';
    document.getElementById('detailImg').src = mainImgSrc;
    document.getElementById('detailTitle').innerText = produk.nama_produk;
    document.getElementById('detailDesc').innerText = produk.deskripsi || 'Tidak ada deskripsi rinci.';
    document.getElementById('detailBahan').innerText = produk.bahan || '-';
    document.getElementById('detailPrice').innerText = 'Rp ' + Number(produk.harga_estimasi).toLocaleString('id-ID');

    const thumbContainer = document.getElementById('detailThumbnails');
    thumbContainer.replaceChildren();
    
    if (images.length > 1) {
        images.forEach((img) => {
            const imgEl = document.createElement('img');
            imgEl.src = `/${img}`;
            imgEl.className = 'thumbnail-img';
            imgEl.addEventListener('click', () => { document.getElementById('detailImg').src = `/${img}`; });
            thumbContainer.appendChild(imgEl);
        });
    }

    const btnPesan = document.getElementById('btnPesanDariDetail');
    if(btnPesan) {
        btnPesan.onclick = () => {
            closeDetailModal();
            openOrderPage(produk.id_produk);
        };
    }
    
    const btnKeranjangDetail = document.getElementById('btnTambahKeranjangDetail');
    if(btnKeranjangDetail) {
        btnKeranjangDetail.onclick = () => {
            tambahKeKeranjang(produk.id_produk);
        };
    }

    const detailModal = document.getElementById('detailModal');
    if (detailModal) detailModal.style.display = 'flex';
}

function closeDetailModal() {
    const detailModal = document.getElementById('detailModal');
    if (detailModal) detailModal.style.display = 'none';
}

function openOrderPage(id) {
    window.location.href = `/pages/checkout.html?id=${id}`;
}

async function logout() {
    try {
        if (typeof csrfFetch === 'function') {
            await csrfFetch('/api/auth/logout', { method: 'POST' });
        } else {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        }
        window.location.href = '/pages/login.html';
    } catch (err) {
        window.location.href = '/pages/login.html';
    }
}