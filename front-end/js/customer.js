let dataProdukGlobal = [];
let dataPesananGlobal = [];
let lastKnownCustomerOrderCount = null;
let lastOrderStatusMap = {};
let customerNotifications = [];

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
    toast.innerHTML = `
        <span>${message}</span>
        <span style="cursor: pointer; font-weight: bold; font-size: 16px;" onclick="this.parentElement.remove()">&times;</span>
    `;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 4000);
}

function toggleNotificationDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('notificationDropdown');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileDropdown) profileDropdown.classList.remove('show');
    dropdown.classList.toggle('show');
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
    document.getElementById('profileDropdown').classList.toggle('show');
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
    document.getElementById('cartModal').style.display = 'flex';
    muatIsiKeranjang();
}

function tutupModalKeranjang() {
    document.getElementById('cartModal').style.display = 'none';
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
                container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Keranjang belanja kosong.</p>';
                priceEl.innerText = 'Rp 0';
                return;
            }
            
            container.innerHTML = '';
            let total = 0;
            result.data.forEach(item => {
                const subtotal = item.harga_estimasi * item.jumlah;
                total += subtotal;
                const div = document.createElement('div');
                div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9;';
                div.innerHTML = `
                    <div>
                        <strong style="color:#0f172a; font-size:14px;">${item.nama_produk}</strong><br>
                        <span style="font-size: 12px; color: #64748b;">Qty: ${item.jumlah} | Catatan: ${item.detail_ukuran || '-'}</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-weight: 600; color: #2563eb; font-size:14px;">Rp ${subtotal.toLocaleString('id-ID')}</span><br>
                        <span style="font-size: 12px; color: #dc2626; cursor: pointer; font-weight:600;" onclick="hapusItemKeranjang(${item.id_keranjang})">Hapus</span>
                    </div>
                `;
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

    document.getElementById('cart_input_id_produk').value = id_produk;
    document.getElementById('cart_input_qty').value = 1;
    document.getElementById('cart_input_detail').value = '';
    
    const detailModal = document.getElementById('detailModal');
    if (detailModal) detailModal.style.display = 'none';

    document.getElementById('addToCartModal').style.display = 'flex';
}

function tutupModalAddToCart() {
    document.getElementById('addToCartModal').style.display = 'none';
}

async function prosesTambahKeKeranjang(event) {
    event.preventDefault(); 
    
    const id_produk = document.getElementById('cart_input_id_produk').value;
    const jumlah = document.getElementById('cart_input_qty').value;
    let detail_ukuran = document.getElementById('cart_input_detail').value.trim();
    
    if (!detail_ukuran) detail_ukuran = "-"; 

    try {
        const res = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_produk, jumlah: parseInt(jumlah), detail_ukuran }),
            credentials: 'include'
        });
        const result = await res.json();
        
        if (result.status === 'success') {
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
        await fetch(`/api/cart/${id}`, { method: 'DELETE', credentials: 'include' });
        muatIsiKeranjang();
        muatJumlahKeranjangBadge();
    } catch (err) {
        console.error(err);
    }
}

function bukaCheckoutKeranjang() {
    const container = document.getElementById('cart-items-container');
    if(container.innerText.includes('kosong')) {
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
        listContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: #64748b; font-size: 12px;">Belum ada notifikasi baru</div>';
        return;
    }

    listContainer.innerHTML = '';
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

        item.onclick = async () => {
            if (!n.read) {
                n.read = true;
                updateNotificationUI(); 
                if (n.id) {
                    try { await fetch(`/api/auth/notifikasi/${n.id}/read`, { method: 'PUT', credentials: 'include' }); } 
                    catch (err) {}
                }
            }
            if (n.linkTab) switchTab(n.linkTab);
            closeAllDropdowns();
        };

        const indicator = !n.read 
            ? `<span style="width: 8px; height: 8px; background: #2563eb; border-radius: 50%; display: inline-block; margin-top: 4px; flex-shrink: 0;"></span>` 
            : `<span style="width: 8px; height: 8px; display: inline-block; margin-top: 4px; flex-shrink: 0;"></span>`;

        item.innerHTML = `
            ${indicator}
            <div style="flex-grow: 1;">
                <div style="margin-bottom: 2px;">${n.text}</div>
                <div style="font-size: 10px; color: #94a3b8; font-weight: normal;">${n.time}</div>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

async function markAllNotificationsAsRead() {
    try {
        await fetch('/api/auth/notifikasi/read-all', { method: 'PUT', credentials: 'include' });
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
// INISIALISASI HALAMAN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
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

// ==========================================
// DATA WILAYAH INDONESIA API & ONGKIR
// ==========================================
async function loadEditProvinces() {
    try {
        const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        const provinces = await response.json();
        const select = document.getElementById('edit_provinsi');
        if(select) {
            select.innerHTML = '<option value="">Pilih Provinsi</option>';
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
        
        kabSelect.innerHTML = '<option value="">Pilih Kabupaten/Kota</option>';
        document.getElementById('edit_kecamatan').innerHTML = '<option value="">Pilih Kecamatan</option>';
        document.getElementById('edit_kelurahan').innerHTML = '<option value="">Pilih Kelurahan/Desa</option>';
        document.getElementById('edit_kurir').innerHTML = '<option value="">-- Pilih Kabupaten/Kota Terlebih Dahulu --</option>';
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
        
        kurirSelect.innerHTML = '<option value="">Memuat tarif kurir...</option>';
        hitungTotalEdit();

        const kecSelect = document.getElementById('edit_kecamatan');
        kecSelect.innerHTML = '<option value="">Pilih Kecamatan</option>';
        document.getElementById('edit_kelurahan').innerHTML = '<option value="">Pilih Kelurahan/Desa</option>';
        
        if (!kabId) {
            kurirSelect.innerHTML = '<option value="">-- Pilih Kabupaten/Kota Terlebih Dahulu --</option>';
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
            const response = await fetch('/api/cek-ongkir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destinationName: kabName, provinceName: provName, weight: 1000 })
            });

            const result = await response.json();
            kurirSelect.innerHTML = '<option value="">Pilih Layanan Kurir</option>';

            if (result.status === 'success' && result.data && result.data.length > 0) {
                result.data.forEach(item => {
                    kurirSelect.innerHTML += `<option value="${item.cost}"> ${item.service} (${item.etd}) - Rp ${item.cost.toLocaleString('id-ID')}</option>`;
                });
            } else {
                kurirSelect.innerHTML = '<option value="0">Tidak ada kurir (Ambil di Toko) - Rp 0</option>';
            }
        } catch (err) {
            kurirSelect.innerHTML = '<option value="0">Gagal memuat ongkir (Ambil di Toko) - Rp 0</option>';
        }
    });
}

const elKecamatan = document.getElementById('edit_kecamatan');
if(elKecamatan) {
    elKecamatan.addEventListener('change', async function() {
        const kecId = this.options[this.selectedIndex]?.dataset.id;
        const kelSelect = document.getElementById('edit_kelurahan');
        kelSelect.innerHTML = '<option value="">Pilih Kelurahan/Desa</option>';
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
    const ongkir = kurirSelect && kurirSelect.value ? Number(kurirSelect.value) : 0;
    
    const total = totalSubtotal + ongkir;
    
    const displayTotal = document.getElementById('editTotalDisplay');
    if(displayTotal) displayTotal.innerText = 'Rp ' + total.toLocaleString('id-ID');
    
    const form = document.getElementById('editOrderForm');
    if(form) {
        form.dataset.ongkir = ongkir;
        form.dataset.total = total;
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
            container.innerHTML = '';
            
            if (dataProdukGlobal.length === 0) {
                container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #64748b;">Belum ada produk.</p>';
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
                card.innerHTML = `
                    <img src="${imgSrc}" class="product-img" alt="${p.nama_produk}" onclick="openDetailModal(${p.id_produk})" onerror="this.src='https://via.placeholder.com/400x300?text=Error'">
                    <div class="product-body">
                        <h3 class="product-title" onclick="openDetailModal(${p.id_produk})">${p.nama_produk}</h3>
                        <p class="product-desc">${p.deskripsi || 'Tidak ada deskripsi'}</p>
                        <p style="font-size:13px; color:#334155;"><strong>Bahan:</strong> ${p.bahan || '-'}</p>
                        <div class="product-price">Rp ${Number(p.harga_estimasi).toLocaleString('id-ID')}</div>
                    </div>
                    <div class="product-footer">
                        <button class="btn-cart" onclick="tambahKeKeranjang(${p.id_produk})">🛒 + Keranjang</button>
                        <button class="btn-order" onclick="openOrderPage(${p.id_produk})">Pesan Sekarang</button>
                    </div>
                `;
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
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red; padding: 20px;">Gagal memuat data.</td></tr>`;
            return;
        }

        const result = await res.json();
        if (result.status === 'success') {
            const rawOrders = result.data;
            tbody.innerHTML = '';
            
            if (!rawOrders || rawOrders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#64748b; padding: 20px;">Belum ada riwayat pesanan.</td></tr>';
                return;
            }

            const groupedOrdersMap = {};
            
            rawOrders.forEach(item => {
                const tanggalRaw = item.tanggal_pesan || item.created_at || '';
                const key = `${tanggalRaw.substring(0, 16)}_${item.alamat_pengiriman || ''}`;
                
                if (!groupedOrdersMap[key]) {
                    groupedOrdersMap[key] = {
                        id_pesanan: item.id_pesanan,
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
                    if (Number(groupedOrdersMap[key].ongkir) === 0 && Number(item.ongkir) > 0) {
                        groupedOrdersMap[key].ongkir = Number(item.ongkir);
                    }
                }
                
                groupedOrdersMap[key].items.push({
                    id_pesanan: item.id_pesanan,
                    nama_produk: item.nama_produk || 'Produk',
                    jumlah: Number(item.jumlah || 1),
                    harga_estimasi: Number(item.harga_estimasi || item.total_harga || 0),
                    detail_ukuran: item.detail_ukuran || '-'
                });
            });

            const finalOrders = Object.values(groupedOrdersMap);
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

                let produkHtml = '';
                let detailUkuranHtml = '-';
                let totalHargaGrup = 0;

                if (order.items.length > 1) {
                    order.items.forEach(i => {
                        totalHargaGrup += (i.harga_estimasi * i.jumlah);
                    });
                    totalHargaGrup += order.ongkir;

                    produkHtml = `<strong>${order.items.length} Produk dalam 1 Pesanan</strong><br>
                                  <span style="font-size: 11px; color: #2563eb; font-weight: 600;">(Checkout Keranjang)</span>`;
                    
                    detailUkuranHtml = `<button onclick="bukaRincianKeranjangPelanggan(${index})" style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap;">🔍 Lihat Rincian (${order.items.length} Item)</button>`;
                } else {
                    const p = order.items[0];
                    totalHargaGrup = (p.harga_estimasi * p.jumlah) + order.ongkir;
                    produkHtml = `<strong>${p.nama_produk}</strong><br><span style="color: #2563eb; font-size: 12px; font-weight: 500;">Qty: ${p.jumlah} item</span>`;
                    detailUkuranHtml = p.detail_ukuran || '-';
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

                let actionButtons = '';
                if (order.status === 'Menunggu') {
                    actionButtons = `
                        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px;">
                            <button class="action-btn btn-edit" onclick="bukaEditPesanan(${order.items[0].id_pesanan})">Edit</button>
                            <button class="action-btn btn-batal" onclick="batalkanPesanan(${order.items[0].id_pesanan})">Batal</button>
                        </div>
                    `;
                }

                let bgStatus = '#fef3c7', colorStatus = '#d97706';
                if (order.status === 'Selesai') { bgStatus = '#dcfce7'; colorStatus = '#16a34a'; }
                else if (order.status === 'Diproses') { bgStatus = '#e0f2fe'; colorStatus = '#0284c7'; }
                else if (order.status === 'Dikirim') { bgStatus = '#ede9fe'; colorStatus = '#7c3aed'; }
                else if (order.status === 'Batal') { bgStatus = '#fee2e2'; colorStatus = '#dc2626'; }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 600; text-align: center; padding: 12px 8px;">${nomorUrut}</td>
                    <td style="font-weight: 600; color: #475569; text-align: center; padding: 12px 8px;">${displayIdPesanan}</td>
                    <td style="color: #64748b; white-space: nowrap; padding: 12px 8px;">${tanggal}</td>
                    <td style="padding: 12px 8px; min-width: 140px;">${produkHtml}</td>
                    <td style="max-width: 200px; word-break: break-word; font-size: 13px; padding: 12px 8px;">${detailUkuranHtml}</td>
                    <td style="max-width: 220px; word-break: break-word; font-size: 12px; color: #334155; padding: 12px 8px;">${order.alamat_pengiriman}</td>
                    <td style="font-size: 12px; color: #475569; white-space: nowrap; padding: 12px 8px;">
                        Bayar: <strong style="color: #0f172a;">${metodeBayar}</strong><br>
                        Ongkir: Rp ${Number(order.ongkir).toLocaleString('id-ID')}
                    </td>
                    <td style="font-weight: 700; color: #16a34a; white-space: nowrap; padding: 12px 8px;">Rp ${totalHargaGrup.toLocaleString('id-ID')}</td>
                    <td style="padding: 12px 8px; white-space: nowrap;">
                        <span style="font-weight:600; padding: 4px 8px; border-radius: 4px; background: ${bgStatus}; color: ${colorStatus};">${order.status}</span>
                        ${actionButtons}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:red; padding: 20px;">Gagal memuat riwayat pesanan.</td></tr>';
    }
}

// MODAL LIHAT RINCIAN UNTUK PELANGGAN
function bukaRincianKeranjangPelanggan(index) {
    const order = window.globalCustomerPesanan[index];
    
    let modalEl = document.getElementById('modalRincianPelanggan');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'modalRincianPelanggan';
        modalEl.className = 'modal-overlay';
        modalEl.innerHTML = `
            <div class="modal-content" style="max-width: 600px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
                    <h3 style="color: #0f172a; font-size: 18px; font-weight: 600;">📦 Rincian Item Pesanan Keranjang</h3>
                    <span style="font-size: 24px; cursor: pointer; color: #64748b; line-height: 1;" onclick="tutupRincianKeranjangPelanggan()">&times;</span>
                </div>
                <div id="modalRincianBodyPelanggan" style="max-height: 400px; overflow-y: auto;"></div>
            </div>
        `;
        document.body.appendChild(modalEl);
    }

    const bodyContent = document.getElementById('modalRincianBodyPelanggan');
    if (!order.items || order.items.length === 0) {
        bodyContent.innerHTML = '<p>Tidak ada rincian item.</p>';
    } else {
        let html = `<p style="margin-bottom: 12px; font-size: 14px; color: #475569;">Daftar produk dalam transaksi pesanan Anda:</p>`;
        html += `<ul style="list-style: none; padding: 0;">`;
        
        order.items.forEach((item, idx) => {
            const subtotal = item.harga_estimasi * item.jumlah;
            html += `
                <li style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${idx + 1}. ${item.nama_produk}</strong><br>
                        <span style="font-size: 12px; color: #64748b;">Harga: Rp ${Number(item.harga_estimasi).toLocaleString('id-ID')} | Qty: ${item.jumlah}</span><br>
                        <span style="font-size: 12px; color: #475569;">Catatan: ${item.detail_ukuran || '-'}</span>
                    </div>
                    <div style="font-weight: 600; color: #2563eb; text-align: right; white-space: nowrap;">
                        Rp ${subtotal.toLocaleString('id-ID')}
                    </div>
                </li>
            `;
        });
        html += `</ul>`;
        bodyContent.innerHTML = html;
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
        const response = await fetch(`/api/pesanan/${id_pesanan}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Batal' }),
            credentials: 'include'
        });
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

    if (orderGroup.items.length > 1) {
        
        let html = `<h4 style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #0f172a;">📦 Daftar Produk dalam Pesanan (${orderGroup.items.length} Item)</h4>`;
        
        orderGroup.items.forEach((item, index) => {
            html += `
                <div class="edit-item-row" data-id="${item.id_pesanan}" data-harga="${item.harga_estimasi}" style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 10px;">
                    <p style="font-weight: 600; font-size: 13px; color: #1e293b; margin-bottom: 6px;">${index + 1}. ${item.nama_produk} (Rp ${Number(item.harga_estimasi).toLocaleString('id-ID')})</p>
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px; font-weight: 600; color: #475569;">Detail Ukuran & Catatan:</label>
                        <textarea class="edit-item-detail" data-id="${item.id_pesanan}" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px;" rows="2">${(item.detail_ukuran && item.detail_ukuran !== '-') ? item.detail_ukuran : ''}</textarea>
                    </div>
                    <div>
                        <label style="font-size: 11px; font-weight: 600; color: #475569;">Jumlah (Qty):</label>
                        <input type="number" class="edit-item-jumlah" data-id="${item.id_pesanan}" min="1" value="${item.jumlah}" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px;" oninput="hitungTotalEdit()">
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } else {
        
        const item = orderGroup.items[0];
        container.innerHTML = `
            <input type="hidden" id="edit_id_pesanan" value="${item.id_pesanan}">
            <input type="hidden" id="edit_harga_dasar" value="${item.harga_estimasi || 0}">
            
            <div style="background: #f8fafc; padding: 12px 14px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block; text-transform: uppercase;">Produk Dipesan</span>
                    <strong style="color: #0f172a; font-size: 14px;">${item.nama_produk}</strong>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block; text-transform: uppercase;">Harga Satuan</span>
                    <strong style="color: #2563eb; font-size: 14px;">Rp ${Number(item.harga_estimasi).toLocaleString('id-ID')}</strong>
                </div>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="font-size: 13px; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Detail Ukuran & Catatan Desain</label>
                <textarea id="edit_detail_ukuran" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;" rows="3">${(item.detail_ukuran && item.detail_ukuran !== '-') ? item.detail_ukuran : ''}</textarea>
            </div>
            <div style="margin-bottom: 16px;">
                <label style="font-size: 13px; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Jumlah (Qty)</label>
                <input type="number" id="edit_jumlah" min="1" value="${item.jumlah}" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;" oninput="hitungTotalEdit()">
            </div>
        `;
    }

    if (typeof loadEditProvinces === 'function') {
        loadEditProvinces();
    }

    document.getElementById('edit_kabupaten').innerHTML = '<option value="">Pilih Kabupaten/Kota</option>';
    document.getElementById('edit_kecamatan').innerHTML = '<option value="">Pilih Kecamatan</option>';
    document.getElementById('edit_kelurahan').innerHTML = '<option value="">Pilih Kelurahan/Desa</option>';
    document.getElementById('edit_kurir').innerHTML = '<option value="">-- Pilih Kabupaten/Kota Terlebih Dahulu --</option>';
    document.getElementById('edit_alamat_detail').value = '';
    document.getElementById('edit_kodepos').value = '';

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
        const ongkir = kurirSelect.value ? Number(kurirSelect.value) : 0;
        const metode_pembayaran = document.getElementById('edit_metode_pembayaran').value;
        
        const itemContainers = document.querySelectorAll('.edit-item-row');
        
        try {
            if (itemContainers.length > 0) {
                
                let successAll = true;
                let firstId = null;

                for (const container of itemContainers) {
                    const idPesanan = container.getAttribute('data-id');
                    if (!firstId) firstId = idPesanan;

                    const detail_ukuran = container.querySelector('.edit-item-detail').value.trim() || '-';
                    const jumlah = Number(container.querySelector('.edit-item-jumlah').value) || 1;
                    const hargaDasar = Number(container.getAttribute('data-harga')) || 0;
                    const total_harga = (hargaDasar * jumlah) + ongkir;

                    const response = await fetch(`/api/pesanan/${idPesanan}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            detail_ukuran,
                            jumlah,
                            alamat_pengiriman,
                            ongkir,
                            metode_pembayaran,
                            total_harga
                        }),
                        credentials: 'include'
                    });
                    const result = await response.json();
                    if (result.status !== 'success') successAll = false;
                }

                if (successAll) {
                    const pesanNotif = `📝 Pesanan keranjang berhasil diperbarui.`;
                    showCustomerToast(pesanNotif, 'success');
                    if (typeof addNotification === 'function') addNotification(pesanNotif, 'pesanan');

                    document.getElementById('editOrderModal').style.display = 'none';
                    muatPesananSaya();
                } else {
                    showCustomerToast('Sebagian pesanan gagal diperbarui.', 'error');
                }
            } else {
                // Single item update
                const id_pesanan = document.getElementById('edit_id_pesanan').value;
                const detail_ukuran = document.getElementById('edit_detail_ukuran').value.trim();
                const jumlah = document.getElementById('edit_jumlah').value;
                const hargaDasar = Number(document.getElementById('edit_harga_dasar').value) || 0;
                const total_harga = (hargaDasar * Number(jumlah)) + ongkir;

                const response = await fetch(`/api/pesanan/${id_pesanan}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        detail_ukuran,
                        jumlah: parseInt(jumlah),
                        alamat_pengiriman,
                        ongkir,
                        metode_pembayaran,
                        total_harga
                    }),
                    credentials: 'include'
                });

                const result = await response.json();

                if (result.status === 'success') {
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
    thumbContainer.innerHTML = '';
    
    if (images.length > 1) {
        images.forEach((img) => {
            const imgEl = document.createElement('img');
            imgEl.src = `/${img}`;
            imgEl.className = 'thumbnail-img';
            imgEl.onclick = () => { document.getElementById('detailImg').src = `/${img}`; };
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

    document.getElementById('detailModal').style.display = 'flex';
}

function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
}

function openOrderPage(id) {
    window.location.href = `/pages/checkout.html?id=${id}`;
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/pages/login.html';
    } catch (err) {
        window.location.href = '/pages/login.html';
    }
}