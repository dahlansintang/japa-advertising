// Array & Storage untuk Riwayat Notifikasi Lonceng (Tersimpan Permanen di localStorage)
let notificationHistory = JSON.parse(localStorage.getItem('admin_notifications')) || [];
let lastKnownOrderCount = null;

// Fungsi Global untuk Menampilkan Toast & Masuk ke Riwayat Lonceng dengan Detail Spesifik
function showToast(message, type = 'success', linkTab = 'pesanan', targetId = null) {
    // 1. Tampilkan Toast Melayang di Pojok Kanan Atas
    const container = document.getElementById('toast-container');
    if (container) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <span style="cursor: pointer; margin-left: 12px; font-weight: bold;" onclick="this.parentElement.remove()">&times;</span>
        `;
        container.appendChild(toast);
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, 3500);
    }

    // 2. Tambahkan ke Riwayat Lonceng Notifikasi (Belum Dibaca / unread: true)
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const newNotif = {
        id: Date.now(),
        message,
        time: timeNow,
        type,
        unread: true,
        linkTab,
        targetId
    };

    notificationHistory.unshift(newNotif);
    saveAndFormatNotifications();
}

// Simpan ke localStorage dan Perbarui UI Lonceng
function saveAndFormatNotifications() {
    localStorage.setItem('admin_notifications', JSON.stringify(notificationHistory));
    updateNotificationUI();
}

// Perbarui Tampilan Dropdown Lonceng, Badge Counter, & Status Dibaca/Belum
function updateNotificationUI() {
    const listContainer = document.getElementById('notificationList');
    const badge = document.getElementById('notifBadge');
    if (!listContainer || !badge) return;

    const unreadCount = notificationHistory.filter(item => item.unread).length;

    if (notificationHistory.length === 0) {
        listContainer.innerHTML = '<div class="notification-empty">Belum ada notifikasi pesanan.</div>';
        badge.style.display = 'none';
        badge.innerText = '0';
        return;
    }

    if (unreadCount > 0) {
        badge.style.display = 'inline-block';
        badge.innerText = unreadCount;
    } else {
        badge.style.display = 'none';
        badge.innerText = '0';
    }

    listContainer.innerHTML = '';
    notificationHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = `notification-item ${item.unread ? 'unread' : 'read'}`;
        div.style.cssText = `
            padding: 12px 16px; 
            border-bottom: 1px solid #f1f5f9; 
            font-size: 12px; 
            color: #334155; 
            cursor: pointer; 
            background: ${item.unread ? '#eff6ff' : '#ffffff'};
            border-left: ${item.unread ? '4px solid #2563eb' : '4px solid transparent'};
            transition: background 0.15s;
        `;
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                <strong style="color: #0f172a;">${item.type === 'success' ? '📦 Update Pesanan / Produk' : '⚠️ Perhatian'}</strong>
                <span style="font-size: 10px; color: #94a3b8;">${item.time}</span>
            </div>
            <span>${item.message}</span>
        `;

        // Saat notif di-klik: ubah status jadi dibaca & arahkan ke tab tujuan
        div.onclick = () => {
            item.unread = false;
            saveAndFormatNotifications();
            
            if (item.linkTab) {
                const targetLink = document.getElementById('link-' + item.linkTab);
                if (targetLink) targetLink.click();
            }
        };

        listContainer.appendChild(div);
    });
}

// Hapus / Bersihkan Semua Riwayat Notifikasi
function clearNotifications() {
    notificationHistory = [];
    saveAndFormatNotifications();
}

// ==============================
// CEK PESANAN BARU OTOMATIS (POLLING) DENGAN DETAIL NAMA & QTY
// ==============================
async function checkNewOrdersAutomatically() {
    try {
        const response = await fetch('/api/pesanan', { credentials: 'include' });
        const result = await response.json();
        
        if (result.status === 'success' && Array.isArray(result.data)) {
            const currentOrders = result.data;
            const currentCount = currentOrders.length;
            const savedLastCount = localStorage.getItem('admin_last_order_count');
            
            if (savedLastCount === null) {
                localStorage.setItem('admin_last_order_count', currentCount);
                lastKnownOrderCount = currentCount;
                return;
            }
            
            const lastCountNum = parseInt(savedLastCount, 10);
            
            // Jika ada pesanan baru masuk
            if (currentCount > lastCountNum) {
                const pesananBaru = currentOrders[0];
                const namaProduk = pesananBaru.nama_produk || 'Produk';
                const jumlahQty = pesananBaru.jumlah || 1;
                const namaPelanggan = pesananBaru.nama_lengkap || pesananBaru.nama_pelanggan || 'Pelanggan';

                showToast(`🛒 Pesanan Baru! "${namaProduk}" (Qty: ${jumlahQty}) dari ${namaPelanggan}`, 'success', 'pesanan');
                
                if (typeof muatDataPesanan === 'function') {
                    muatDataPesanan();
                }
            }
            
            localStorage.setItem('admin_last_order_count', currentCount);
            lastKnownOrderCount = currentCount;
        }
    } catch (error) {
        console.error('Gagal mengecek pesanan otomatis:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    updateNotificationUI();

    try {
        const response = await fetch('/api/auth/check', { credentials: 'include' });
        const result = await response.json();
        
        if (result.status !== 'success' || result.data.role !== 'admin') {
            alert('Akses Ditolak! Sesi Anda telah berakhir, bukan admin, atau belum login.');
            window.location.href = '/pages/login.html';
            return;
        }
        
        const nameDisplay = document.getElementById('adminNameDisplay');
        if (nameDisplay) {
            nameDisplay.innerText = 'Halo, ' + (result.data.nama || 'Admin');
        }
        
        muatDataPesanan();
        muatKatalogAdminGrid();

        setInterval(checkNewOrdersAutomatically, 15000);
        
    } catch (error) {
        console.error('Gagal mengecek sesi:', error);
        window.location.href = '/pages/login.html';
    }
});

// Fungsi Logout
const btnLogout = document.getElementById('btnLogout');
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        const konfirmasi = confirm('Apakah Anda yakin ingin keluar dari Dashboard?');
        if (konfirmasi) {
            try {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                window.location.href = '/pages/login.html';
            } catch (error) {
                showToast('Terjadi kesalahan saat logout.', 'error');
            }
        }
    });
}

// ==============================
// MANAJEMEN PESANAN & UBAH STATUS
// ==============================
async function muatDataPesanan() {
    const tbody = document.getElementById('table-body');
    if (!tbody) return;
    
    try {
        const response = await fetch('/api/pesanan', { credentials: 'include' });
        const result = await response.json();
        
        if (result.status === 'success') {
            tbody.innerHTML = '';
            
            if (!result.data || result.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:#64748b; padding: 20px;">Belum ada pesanan masuk.</td></tr>';
                return;
            }

            window.globalAdminPesanan = result.data;

            result.data.forEach((pesanan, index) => {
                const tanggal = new Date(pesanan.tanggal_pesan).toLocaleDateString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                const jumlahItem = Number(pesanan.jumlah || 1);
                const totalBayar = Number(pesanan.total_harga || (pesanan.harga_estimasi * jumlahItem) + Number(pesanan.ongkir || 0));

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 600;">${index + 1}</td>
                    <td style="color: #64748b; white-space: nowrap;">${tanggal}</td>
                    <td style="font-weight: 600;">${pesanan.nama_lengkap || pesanan.nama_pelanggan || 'Pelanggan'}</td>
                    <td>
                        <strong>${pesanan.nama_produk}</strong><br>
                        <span style="color: #2563eb; font-size: 12px; font-weight: 500;">Qty: ${jumlahItem} item</span>
                    </td>
                    <td style="max-width: 150px; word-break: break-word; font-size: 13px;">${pesanan.detail_ukuran || '-'}</td>
                    <td style="max-width: 200px; word-break: break-word; font-size: 12px; color: #334155;">${pesanan.alamat_pengiriman || '-'}</td>
                    <td style="font-size: 12px; color: #475569; white-space: nowrap;">
                        <strong>Bayar:</strong> <span style="color: #0f172a; font-weight: 600;">${pesanan.metode_pembayaran || '-'}</span>
                    </td>
                    <td style="font-weight: 700; color: #16a34a; white-space: nowrap;">Rp ${totalBayar.toLocaleString('id-ID')}</td>
                    <td>
                        <span style="font-weight:600; padding: 4px 8px; border-radius: 4px; background: ${pesanan.status==='Selesai'?'#dcfce7':pesanan.status==='Diproses'?'#e0f2fe':pesanan.status==='Batal'?'#fee2e2':'#fef3c7'}; color:${pesanan.status==='Selesai'?'#16a34a':pesanan.status==='Diproses'?'#0284c7':pesanan.status==='Batal'?'#dc2626':'#d97706'}">
                            ${pesanan.status}
                        </span>
                    </td>
                    <td style="white-space: nowrap;">
                        <select onchange="ubahStatus(${pesanan.id_pesanan}, this.value)" style="padding: 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 13px;">
                            <option value="Menunggu" ${pesanan.status === 'Menunggu' ? 'selected' : ''}>Menunggu</option>
                            <option value="Diproses" ${pesanan.status === 'Diproses' ? 'selected' : ''}>Diproses</option>
                            <option value="Selesai" ${pesanan.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                            <option value="Batal" ${pesanan.status === 'Batal' ? 'selected' : ''}>Batal</option>
                        </select>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error memuat pesanan:', error);
    }
}

async function ubahStatus(id_pesanan, status_baru) {
    try {
        const response = await fetch(`/api/pesanan/${id_pesanan}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status_baru }),
            credentials: 'include'
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            let infoProduk = `Pesanan #${id_pesanan}`;
            if (window.globalAdminPesanan) {
                const targetPesanan = window.globalAdminPesanan.find(p => p.id_pesanan == id_pesanan);
                if (targetPesanan) {
                    infoProduk = `[${targetPesanan.nama_produk}] (Qty: ${targetPesanan.jumlah || 1})`;
                }
            }

            showToast(`Status ${infoProduk} diubah menjadi: ${status_baru}`, 'success', 'pesanan', id_pesanan);
            muatDataPesanan();
        } else {
            showToast('Gagal mengubah status: ' + (result.message || 'Kesalahan server'), 'error', 'pesanan');
        }
    } catch (error) {
        console.error('Error API:', error);
        showToast('Terjadi kesalahan jaringan saat memperbarui status.', 'error', 'pesanan');
    }
}

// ==============================
// MANAJEMEN KATALOG PRODUK
// ==============================
async function muatKatalogAdminGrid() {
    const container = document.getElementById('admin-catalog-grid');
    if (!container) return;

    try {
        const response = await fetch('/api/produk', { credentials: 'include' });
        const result = await response.json();

        if (result.status === 'success') {
            container.innerHTML = '';
            const dataProduk = result.data;

            if (dataProduk.length === 0) {
                container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 20px;">Belum ada produk di katalog.</p>';
                return;
            }

            window.globalAdminProduk = dataProduk;

            dataProduk.forEach(p => {
                let imgSrc = 'https://via.placeholder.com/400x300?text=Tanpa+Gambar';
                if (p.gambar_url) {
                    try {
                        const imagesArr = JSON.parse(p.gambar_url);
                        if (Array.isArray(imagesArr) && imagesArr.length > 0) imgSrc = `/${imagesArr[0]}`;
                    } catch(e) {
                        imgSrc = `/${p.gambar_url}`;
                    }
                }

                const card = document.createElement('div');
                card.className = 'product-card';
                card.style.cssText = 'background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.05);';
                
                card.innerHTML = `
                    <img src="${imgSrc}" class="product-img" alt="${p.nama_produk}" style="width: 100%; height: 200px; object-fit: cover; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0; cursor: pointer;" onclick="bukaPreviewModal(${p.id_produk})" onerror="this.src='https://via.placeholder.com/400x300?text=Error'">
                    <div class="product-body" style="padding: 20px;">
                        <h3 class="product-title" style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 8px; cursor: pointer;" onclick="bukaPreviewModal(${p.id_produk})">${p.nama_produk}</h3>
                        <p class="product-desc" style="font-size: 13px; color: #64748b; margin-bottom: 14px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${p.deskripsi || 'Tidak ada deskripsi'}</p>
                        <p style="font-size:13px; color:#334155;"><strong>Bahan:</strong> ${p.bahan || '-'}</p>
                        <div class="product-price" style="font-size: 18px; font-weight: 700; color: #2563eb; margin-top: 12px;">Rp ${Number(p.harga_estimasi).toLocaleString('id-ID')}</div>
                    </div>
                    <div class="product-footer" style="padding: 16px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; gap: 8px;">
                        <button onclick="bukaModalEditDariID(${p.id_produk})" style="flex: 1; background-color: #0284c7; color: white; border: none; padding: 10px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">Edit</button>
                        <button onclick="hapusProdukAdmin(${p.id_produk})" style="flex: 1; background-color: #dc2626; color: white; border: none; padding: 10px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">Hapus</button>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (err) {
        console.error('Gagal memuat grid katalog admin:', err);
    }
}

function bukaPreviewModal(id_produk) {
    const produk = window.globalAdminProduk.find(p => p.id_produk === id_produk);
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

    const mainImg = images.length > 0 ? `/${images[0]}` : 'https://via.placeholder.com/600x400?text=Tanpa+Gambar';

    document.getElementById('preview-product-name').innerText = produk.nama_produk;
    document.getElementById('preview-product-img').src = mainImg;
    document.getElementById('preview-product-desc').innerText = produk.deskripsi || 'Tidak ada deskripsi rinci.';
    document.getElementById('preview-product-bahan').innerText = produk.bahan || '-';
    document.getElementById('preview-product-price').innerText = 'Rp ' + Number(produk.harga_estimasi).toLocaleString('id-ID');

    const thumbContainer = document.getElementById('preview-thumbnails');
    thumbContainer.innerHTML = '';

    if (images.length > 1) {
        images.forEach(img => {
            const thumb = document.createElement('img');
            thumb.src = `/${img}`;
            thumb.style.cssText = 'width: 65px; height: 65px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid transparent; background: #f1f5f9;';
            thumb.onclick = () => { document.getElementById('preview-product-img').src = `/${img}`; };
            thumbContainer.appendChild(thumb);
        });
    }

    const modalEl = document.getElementById('previewModal');
    if (modalEl) modalEl.style.display = 'flex';
}

function closePreviewModal() {
    const modalEl = document.getElementById('previewModal');
    if (modalEl) modalEl.style.display = 'none';
}

async function hapusProdukAdmin(id_produk) {
    let namaProduk = "Produk";
    if (window.globalAdminProduk) {
        const prod = window.globalAdminProduk.find(p => p.id_produk == id_produk);
        if (prod) namaProduk = prod.nama_produk;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${namaProduk}" dari katalog?`)) return;

    try {
        const response = await fetch(`/api/produk/${id_produk}`, { method: 'DELETE', credentials: 'include' });
        const result = await response.json();

        if (result.status === 'success') {
            showToast(`Produk [${namaProduk}] berhasil dihapus dari katalog`, 'success', 'katalog');
            muatKatalogAdminGrid();
        } else {
            showToast('Gagal menghapus produk: ' + (result.message || 'Kesalahan server'), 'error', 'katalog');
        }
    } catch (err) {
        console.error('Error:', err);
        showToast('Terjadi kesalahan jaringan.', 'error', 'katalog');
    }
}

// Tambah Produk
const addProductForm = document.getElementById('addProductForm');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const namaProdukInput = document.getElementById('nama_produk').value;
        const formData = new FormData();
        formData.append('nama_produk', namaProdukInput);
        formData.append('bahan', document.getElementById('bahan').value);
        formData.append('deskripsi', document.getElementById('deskripsi').value);
        formData.append('harga_estimasi', document.getElementById('harga_estimasi').value);

        const fileInput = document.getElementById('gambar_file');
        if (fileInput && fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('gambar_file', fileInput.files[i]);
            }
        }

        try {
            const response = await fetch('/api/produk', {
                method: 'POST',
                body: formData,
                credentials: 'include' 
            });

            const result = await response.json();

            if (result.status === 'success') {
                showToast(`Produk baru [${namaProdukInput}] berhasil ditambahkan ke katalog`, 'success', 'katalog');
                addProductForm.reset();
                muatKatalogAdminGrid();
            } else {
                showToast(result.message || 'Gagal menambahkan produk.', 'error', 'katalog');
            }
        } catch (err) {
            console.error('Error:', err);
            showToast('Terjadi kesalahan jaringan saat menyimpan produk.', 'error', 'katalog');
        }
    });
}

function bukaModalEdit(id, nama, bahan, deskripsi, harga) {
    document.getElementById('edit_id_produk').value = id;
    document.getElementById('edit_nama_produk').value = decodeURIComponent(nama);
    document.getElementById('edit_bahan').value = decodeURIComponent(bahan);
    document.getElementById('edit_deskripsi').value = decodeURIComponent(deskripsi);
    document.getElementById('edit_harga_estimasi').value = harga;
    document.getElementById('editModal').style.display = 'flex';
}

function bukaModalEditDariID(id_produk) {
    const produk = window.globalAdminProduk.find(p => p.id_produk === id_produk);
    if (!produk) return;
    bukaModalEdit(produk.id_produk, encodeURIComponent(produk.nama_produk), encodeURIComponent(produk.bahan || ''), encodeURIComponent(produk.deskripsi || ''), produk.harga_estimasi);
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    const form = document.getElementById('editProductForm');
    if(form) form.reset();
}

const editProductForm = document.getElementById('editProductForm');
if (editProductForm) {
    editProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('edit_id_produk').value;
        const namaProdukBaru = document.getElementById('edit_nama_produk').value;
        const formData = new FormData();
        formData.append('nama_produk', namaProdukBaru);
        formData.append('bahan', document.getElementById('edit_bahan').value);
        formData.append('deskripsi', document.getElementById('edit_deskripsi').value);
        formData.append('harga_estimasi', document.getElementById('edit_harga_estimasi').value);

        const fileInput = document.getElementById('edit_gambar_file');
        if (fileInput && fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('gambar_file', fileInput.files[i]);
            }
        }

        try {
            const response = await fetch(`/api/produk/${id}`, {
                method: 'PUT',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                showToast('Gagal memperbarui produk. Kesalahan internal server.', 'error', 'katalog');
                return;
            }

            const result = await response.json();

            if (result.status === 'success') {
                showToast(`Produk [${namaProdukBaru}] berhasil diperbarui`, 'success', 'katalog');
                closeEditModal();
                muatKatalogAdminGrid(); 
            } else {
                showToast('Gagal memperbarui produk: ' + (result.message || 'Kesalahan server'), 'error', 'katalog');
            }
        } catch (err) {
            console.error('Error:', err);
            showToast('Terjadi kesalahan jaringan saat memperbarui produk.', 'error', 'katalog');
        }
    });
}

// ==============================
// MANAJEMEN DATA PELANGGAN
// ==============================
async function muatDataPelanggan() {
    const tbody = document.getElementById('customer-table-body');
    if (!tbody) return;

    try {
        const response = await fetch('/api/admin/customers', { credentials: 'include' });
        
        if (!response.ok) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-row" style="color: red;">Gagal memuat data (Sesi berakhir atau akses ditolak).</td></tr>';
            return;
        }

        const result = await response.json();

        if (result.status === 'success') {
            const customers = result.data;
            tbody.innerHTML = '';

            if (customers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-row">Belum ada pelanggan terdaftar.</td></tr>';
                return;
            }

            customers.forEach((c, index) => {
                const tanggal = c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric'
                }) : '-';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 600;">${index + 1}</td>
                    <td><strong>${c.nama_lengkap}</strong></td>
                    <td>${c.email}</td>
                    <td>${c.no_telp || '-'}</td>
                    <td style="max-width: 250px; word-break: break-word; font-size: 13px;">${c.alamat || '-'}</td>
                    <td style="color: #64748b; white-space: nowrap;">${tanggal}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-row" style="color: red;">Gagal memuat data pelanggan.</td></tr>';
        }
    } catch (err) {
        console.error('Error:', err);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-row" style="color: red;">Terjadi kesalahan jaringan.</td></tr>';
    }
}