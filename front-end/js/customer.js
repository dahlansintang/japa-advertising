let dataProdukGlobal = [];
let dataPesananGlobal = [];
let lastKnownCustomerOrderCount = null;
let lastOrderStatusMap = {};
let customerNotifications = [];

// Fungsi Toast Notification Samping
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

// Pengelolaan Dropdown Lonceng Notifikasi
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

// Ambil Riwayat Notifikasi dari Database
async function muatNotifikasiPelanggan() {
    try {
        const res = await fetch('/api/auth/notifikasi/customer', { credentials: 'include' });
        if (!res.ok) return;
        const result = await res.json();
        
        if (result.status === 'success' && Array.isArray(result.data)) {
            customerNotifications = result.data.map(n => ({
                id: n.id_notifikasi, // Simpan ID agar bisa di-update saat diklik
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
        
        // Membedakan styling antara yang BELUM DIBACA dan SUDAH DIBACA
        const bgStyle = n.read ? '#ffffff' : '#eff6ff'; 
        const fontWeight = n.read ? '400' : '600';     
        const textColor = n.read ? '#64748b' : '#1e293b'; 
        
        item.style.cssText = `
            padding: 12px 16px; 
            border-bottom: 1px solid #f1f5f9; 
            font-size: 12px; 
            color: ${textColor}; 
            background: ${bgStyle};
            font-weight: ${fontWeight};
            cursor: pointer;
            display: flex;
            align-items: flex-start;
            gap: 8px;
            transition: background 0.15s; 
        `;
        
        item.onmouseover = () => item.style.background = n.read ? '#f8fafc' : '#dbeafe';
        item.onmouseout = () => item.style.background = bgStyle;

        // Event saat notifikasi diklik: tandai sudah dibaca di server & lokal, lalu arahkan ke tab tujuan
        item.onclick = async () => {
            if (!n.read) {
                n.read = true;
                updateNotificationUI(); // Perbarui UI seketika
                
                if (n.id) {
                    try {
                        await fetch(`/api/auth/notifikasi/${n.id}/read`, { 
                            method: 'PUT', 
                            credentials: 'include' 
                        });
                    } catch (err) {
                        console.error('Gagal memperbarui status dibaca:', err);
                    }
                }
            }

            if (n.linkTab) {
                switchTab(n.linkTab);
            }
            closeAllDropdowns();
        };

        // Indikator titik biru kecil di sebelah kiri untuk yang belum dibaca
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
    } catch (err) {
        console.error('Gagal menandai notifikasi dibaca:', err);
    }
}

// Validasi Sesi & Polling Real-time
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/auth/check', { credentials: 'include' });
        const result = await response.json();
        
        if (result.status !== 'success' || result.data.role !== 'pelanggan') {
            alert('Akses Ditolak! Sesi Anda telah berakhir atau Anda belum login sebagai pelanggan.');
            window.location.href = '/pages/login.html';
            return;
        }
        
        muatKatalog();
        muatHeaderProfil();
        muatPesananSaya();
        muatNotifikasiPelanggan();

        setInterval(checkCustomerOrdersAutomatically, 15000);
        
    } catch (error) {
        console.error('Gagal mengecek sesi:', error);
        window.location.href = '/pages/login.html';
    }
});

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
    } catch (err) {
        console.error('Gagal mengecek pembaruan pesanan otomatis:', err);
    }
}

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

async function loadEditProvinces() {
    try {
        const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        const provinces = await response.json();
        const select = document.getElementById('edit_provinsi');
        select.innerHTML = '<option value="">Pilih Provinsi</option>';
        provinces.forEach(prov => {
            const opt = document.createElement('option');
            opt.value = prov.name;
            opt.dataset.id = prov.id;
            opt.textContent = prov.name;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Gagal memuat data provinsi', e);
    }
}

document.getElementById('edit_provinsi').addEventListener('change', async function() {
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

document.getElementById('edit_kabupaten').addEventListener('change', async function() {
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
    } catch (e) { console.error('Gagal memuat kecamatan:', e); }

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
                kurirSelect.innerHTML += `
                    <option value="${item.cost}">
                        JNE ${item.service} (${item.etd}) - Rp ${item.cost.toLocaleString('id-ID')}
                    </option>
                `;
            });
        } else {
            kurirSelect.innerHTML = '<option value="">Tidak ada layanan kurir tersedia</option>';
        }
    } catch (err) {
        console.error('Gagal mengambil ongkir:', err);
        kurirSelect.innerHTML = '<option value="">Gagal memuat tarif kurir</option>';
    }
});

document.getElementById('edit_kecamatan').addEventListener('change', async function() {
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
    } catch (e) { console.error(e); }
});

function hitungTotalEdit() {
    const hargaDasar = Number(document.getElementById('edit_harga_dasar').value) || 0;
    const jumlah = Number(document.getElementById('edit_jumlah').value) || 1;
    const kurirSelect = document.getElementById('edit_kurir');
    
    const tarifKurir = kurirSelect.value ? Number(kurirSelect.value) : 0;
    const ongkir = tarifKurir === 0 ? 0 : tarifKurir * jumlah; 
    const total = (hargaDasar * jumlah) + ongkir;
    
    document.getElementById('editTotalDisplay').innerText = 'Rp ' + total.toLocaleString('id-ID');
    document.getElementById('editOrderForm').dataset.ongkir = ongkir;
    document.getElementById('editOrderForm').dataset.total = total;
}

async function muatKatalog() {
    const container = document.getElementById('catalog-container');
    try {
        const response = await fetch('/api/produk', { credentials: 'include' });
        const result = await response.json();
        
        muatHeaderProfil();

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
                    } catch(e) {
                        imgSrc = `/${p.gambar_url}`;
                    }
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
                        <button class="btn-order" onclick="openOrderPage(${p.id_produk})">Pesan Sekarang</button>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

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
    } catch (err) {
        console.error(err);
    }
}

async function muatPesananSaya() {
    const tbody = document.getElementById('my-orders-body');
    try {
        const res = await fetch('/api/pesanan/customer/orders', { credentials: 'include' });
        
        if (!res.ok) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red; padding: 20px;">Sesi berakhir atau gagal memuat data.</td></tr>`;
            return;
        }

        const result = await res.json();
        if (result.status === 'success') {
            dataPesananGlobal = result.data;
            tbody.innerHTML = '';
            if (dataPesananGlobal.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#64748b; padding: 20px;">Belum ada riwayat pesanan.</td></tr>';
                return;
            }
            dataPesananGlobal.forEach((o, index) => {
                const tanggal = new Date(o.tanggal_pesan).toLocaleDateString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                const jumlahItem = Number(o.jumlah || 1);
                const totalBayar = Number(o.total_harga || (o.harga_estimasi * jumlahItem) + Number(o.ongkir || 0));

                let actionButtons = '';
                if (o.status === 'Menunggu') {
                    actionButtons = `
                        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 10px;">
                            <button class="action-btn btn-edit" onclick="editPesanan(${o.id_pesanan})">Edit</button>
                            <button class="action-btn btn-batal" onclick="batalkanPesanan(${o.id_pesanan})">Batal</button>
                            <button class="action-btn btn-hapus" onclick="hapusPesanan(${o.id_pesanan})">Hapus</button>
                        </div>
                    `;
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 600;">${index + 1}</td>
                    <td style="color: #64748b; white-space: nowrap;">${tanggal}</td>
                    <td>
                        <strong>${o.nama_produk}</strong><br>
                        <span style="color: #2563eb; font-size: 12px; font-weight: 500;">Qty: ${jumlahItem} item</span>
                    </td>
                    <td style="max-width: 150px; word-break: break-word; font-size: 13px;">${o.detail_ukuran || '-'}</td>
                    <td style="max-width: 200px; word-break: break-word; font-size: 12px; color: #334155;">
                        ${o.alamat_pengiriman || '-'}
                    </td>
                    <td style="font-size: 12px; color: #475569; white-space: nowrap;">
                        <strong>Bayar:</strong> <span style="color: #0f172a; font-weight: 600;">${o.metode_pembayaran || '-'}</span>
                    </td>
                    <td style="font-weight: 700; color: #16a34a; white-space: nowrap;">
                        Rp ${totalBayar.toLocaleString('id-ID')}
                    </td>
                    <td>
                        <span style="font-weight:600; padding: 4px 8px; border-radius: 4px; background: ${o.status==='Selesai'?'#dcfce7':o.status==='Diproses'?'#e0f2fe':o.status==='Batal'?'#fee2e2':'#fef3c7'}; color:${o.status==='Selesai'?'#16a34a':o.status==='Diproses'?'#0284c7':o.status==='Batal'?'#dc2626':'#d97706'}">
                            ${o.status}
                        </span>
                        ${actionButtons}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red; padding: 20px;">Gagal memuat riwayat pesanan.</td></tr>';
    }
}

function editPesanan(id_pesanan) {
    const pesanan = dataPesananGlobal.find(o => o.id_pesanan === id_pesanan);
    if (!pesanan) return;

    document.getElementById('edit_id_pesanan').value = pesanan.id_pesanan;
    document.getElementById('edit_detail_ukuran').value = pesanan.detail_ukuran || '';
    document.getElementById('edit_jumlah').value = pesanan.jumlah || 1;
    document.getElementById('edit_metode_pembayaran').value = pesanan.metode_pembayaran || 'Transfer Bank Mandiri';
    document.getElementById('edit_harga_dasar').value = pesanan.harga_estimasi || 0;

    document.getElementById('edit_alamat_detail').value = '';
    document.getElementById('edit_kodepos').value = '';
    document.getElementById('edit_provinsi').innerHTML = '<option value="">Pilih Provinsi</option>';
    document.getElementById('edit_kabupaten').innerHTML = '<option value="">Pilih Kabupaten/Kota</option>';
    document.getElementById('edit_kecamatan').innerHTML = '<option value="">Pilih Kecamatan</option>';
    document.getElementById('edit_kelurahan').innerHTML = '<option value="">Pilih Kelurahan/Desa</option>';
    document.getElementById('edit_kurir').innerHTML = '<option value="">-- Pilih Kabupaten/Kota Terlebih Dahulu --</option>';

    loadEditProvinces();
    hitungTotalEdit();
    document.getElementById('editOrderModal').style.display = 'flex';
}

function closeEditOrderModal() {
    document.getElementById('editOrderModal').style.display = 'none';
}

const editOrderForm = document.getElementById('editOrderForm');
if (editOrderForm) {
    editOrderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('edit_id_pesanan').value;
        const detail_ukuran = document.getElementById('edit_detail_ukuran').value;
        const jumlah = Number(document.getElementById('edit_jumlah').value);
        
        const kurirSelect = document.getElementById('edit_kurir');
        if (!kurirSelect.value) {
            alert("Pilih Layanan Kurir terlebih dahulu.");
            return;
        }

        const detail = document.getElementById('edit_alamat_detail').value.trim();
        const kel = document.getElementById('edit_kelurahan').value;
        const kec = document.getElementById('edit_kecamatan').value;
        const kab = document.getElementById('edit_kabupaten').value;
        const prov = document.getElementById('edit_provinsi').value;
        const kodepos = document.getElementById('edit_kodepos').value.trim();

        const alamat_pengiriman = `${detail}, Kel. ${kel}, Kec. ${kec}, ${kab}, Prov. ${prov} - Kode Pos: ${kodepos}`;
        
        const metode_pembayaran = document.getElementById('edit_metode_pembayaran').value;
        const ongkir = Number(document.getElementById('editOrderForm').dataset.ongkir) || 0;
        const total_harga = Number(document.getElementById('editOrderForm').dataset.total) || 0;

        try {
            const response = await fetch(`/api/pesanan/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ detail_ukuran, jumlah, alamat_pengiriman, metode_pembayaran, ongkir, total_harga }),
                credentials: 'include'
            });

            const result = await response.json();
            if (result.status === 'success') {
                const msg = 'Pesanan berhasil diperbarui!';
                showCustomerToast(msg, 'success');
                addNotification(msg, 'pesanan');
                closeEditOrderModal();
                muatPesananSaya();
            } else {
                alert('Gagal memperbarui pesanan: ' + (result.message || 'Kesalahan server'));
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Terjadi kesalahan jaringan.');
        }
    });
}

async function batalkanPesanan(id_pesanan) {
    const konfirmasi = confirm('Apakah Anda yakin ingin membatalkan pesanan ini?');
    if (!konfirmasi) return;

    try {
        const response = await fetch(`/api/pesanan/${id_pesanan}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Batal' }),
            credentials: 'include'
        });

        if (!response.ok) {
            alert('Gagal membatalkan pesanan. Terjadi kesalahan pada server.');
            return;
        }

        const result = await response.json();
        if (result.status === 'success') {
            const msg = 'Pesanan Anda berhasil dibatalkan.';
            showCustomerToast(msg, 'success');
            addNotification(msg, 'pesanan');
            muatPesananSaya(); 
        } else {
            alert('Gagal membatalkan pesanan: ' + (result.message || 'Kesalahan server'));
        }
    } catch (err) {
        console.error('Error membatalkan pesanan:', err);
        alert('Terjadi kesalahan jaringan saat mencoba membatalkan pesanan.');
    }
}

async function hapusPesanan(id_pesanan) {
    const konfirmasi = confirm('Apakah Anda yakin ingin menghapus riwayat pesanan ini dari daftar Anda?');
    if (!konfirmasi) return;

    try {
        const response = await fetch(`/api/pesanan/${id_pesanan}`, { 
            method: 'DELETE', 
            credentials: 'include' 
        });
        const result = await response.json();

        if (result.status === 'success') {
            const msg = 'Pesanan berhasil dihapus.';
            showCustomerToast(msg, 'success');
            addNotification(msg, 'pesanan');
            muatPesananSaya();
        } else {
            alert('Gagal menghapus pesanan: ' + (result.message || 'Kesalahan server'));
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Terjadi kesalahan jaringan.');
    }
}

function openDetailModal(id_produk) {
    const produk = dataProdukGlobal.find(p => p.id_produk === id_produk);
    if (!produk) return;

    let images = [];
    if (produk.gambar_url) {
        try {
            images = JSON.parse(produk.gambar_url);
            if (!Array.isArray(images)) images = [produk.gambar_url];
        } catch (e) {
            images = [produk.gambar_url];
        }
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
    btnPesan.onclick = () => {
        closeDetailModal();
        openOrderPage(produk.id_produk);
    };

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
        
        customerNotifications = [];
        lastKnownCustomerOrderCount = null;
        lastOrderStatusMap = {};
        
        const badge = document.getElementById('notificationBadge');
        if (badge) badge.style.display = 'none';
        
        const listContainer = document.getElementById('notificationListContainer');
        if (listContainer) listContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: #64748b; font-size: 12px;">Belum ada notifikasi baru</div>';

        window.location.href = '/pages/login.html';
    } catch (err) {
        console.error('Gagal logout:', err);
        window.location.href = '/pages/login.html';
    }
}