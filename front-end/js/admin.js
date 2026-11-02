let notificationHistory = [];
let lastKnownOrderCount = null;

// Fungsi Global untuk Menampilkan Toast & Menyegarkan Notifikasi Admin
function showToast(message, type = 'success', linkTab = 'pesanan', targetId = null) {
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
    
    // Refresh data notifikasi dari database
    muatNotifikasiAdmin();
}

async function muatNotifikasiAdmin() {
    try {
        const response = await fetch('/api/admin/notifikasi', { credentials: 'include' });
        if (!response.ok) return;
        const result = await response.json();
        
        if (result.status === 'success' && Array.isArray(result.data)) {
            notificationHistory = result.data.map(n => ({
                id: n.id_notifikasi,
                message: n.pesan,
                time: new Date(n.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                type: n.tipe || 'success',
                unread: n.is_read === 0,
                linkTab: n.link_tab || 'pesanan',
                targetId: n.target_id
            }));
            updateNotificationUI();
        }
    } catch (err) {
        console.error('Gagal memuat notifikasi admin:', err);
    }
}

function updateNotificationUI() {
    const listContainer = document.getElementById('notificationList');
    const badge = document.getElementById('notifBadge');
    if (!listContainer || !badge) return;

    const unreadCount = notificationHistory.filter(item => item.unread).length;

    if (notificationHistory.length === 0) {
        listContainer.innerHTML = '<div class="notification-empty" style="padding: 16px; text-align: center; color: #64748b;">Belum ada notifikasi pesanan.</div>';
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

        div.onclick = async () => {
            item.unread = false;
            updateNotificationUI();
            
            if (item.id) {
                try {
                    await fetch(`/api/admin/notifikasi/${item.id}/read`, { method: 'PUT', credentials: 'include' });
                } catch (e) {
                    console.error('Gagal menandai notifikasi dibaca', e);
                }
            }
            
            if (item.linkTab) {
                const targetLink = document.getElementById('link-' + item.linkTab);
                if (targetLink) targetLink.click();
            }
        };

        listContainer.appendChild(div);
    });
}

// Tandai Semua Dibaca (Menggunakan endpoint admin)
async function markAllAsReadAdmin() {
    try {
        const response = await fetch('/api/admin/notifikasi/read-all', { 
            method: 'PUT', 
            credentials: 'include' 
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            notificationHistory.forEach(item => item.unread = false);
            updateNotificationUI();
        }
    } catch (e) {
        console.error('Gagal menandai semua notifikasi dibaca:', e);
    }
}

// ==============================
// CEK PESANAN BARU OTOMATIS (POLLING)
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
                muatNotifikasiAdmin();
                return;
            }
            
            const lastCountNum = parseInt(savedLastCount, 10);
            
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
    muatNotifikasiAdmin();

    const mainContainers = document.querySelectorAll('.container, main, .card, .dashboard-container, div[style*="max-width"]');
    mainContainers.forEach(el => {
        el.style.maxWidth = '98%';
        el.style.width = '100%';
        el.style.margin = '0 auto';
        el.style.paddingLeft = '15px';
        el.style.paddingRight = '15px';
    });

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

        setInterval(checkNewOrdersAutomatically, 5000);
        setInterval(muatNotifikasiAdmin, 5000);
        
    } catch (error) {
        console.error('Gagal mengecek sesi:', error);
        window.location.href = '/pages/login.html';
    }
});

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
// MANAJEMEN PESANAN & PENGELOMPOKKAN KERANJANG OTOMATIS
// ==============================
async function muatDataPesanan() {
    const tbody = document.getElementById('table-body');
    if (!tbody) return;
    
    const tableEl = tbody.closest('table');
    if (tableEl && tableEl.parentElement) {
        tableEl.style.width = '100%';
        tableEl.parentElement.style.overflowX = 'auto';
        tableEl.parentElement.style.maxWidth = '100%';
    }

    try {
        const response = await fetch('/api/pesanan', { credentials: 'include' });
        const result = await response.json();
        
        if (result.status === 'success') {
            tbody.innerHTML = '';
            
            if (!result.data || result.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color:#64748b; padding: 20px;">Belum ada pesanan masuk.</td></tr>';
                return;
            }

            const groupedOrdersMap = {};
            
            result.data.forEach(item => {
                const nama = item.nama_lengkap || item.nama_pelanggan || 'Pelanggan';
                const tanggalRaw = item.tanggal_pesan || item.created_at || '';
                const key = `${nama}_${tanggalRaw.substring(0, 16)}`;
                
                if (!groupedOrdersMap[key]) {
                    groupedOrdersMap[key] = {
                        id_pesanan: item.id_pesanan,
                        tanggal_pesan: tanggalRaw,
                        nama_lengkap: nama,
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
                    nama_produk: item.nama_produk || 'Produk',
                    jumlah: Number(item.jumlah || 1),
                    harga_estimasi: Number(item.harga_satuan || item.harga_estimasi || 0),
                    detail_ukuran: item.detail_ukuran || '-'
                });
            });

            const finalOrders = Object.values(groupedOrdersMap);
            window.globalAdminPesanan = finalOrders;

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
                let aksiHtml = `<span style="font-size: 12px; color: #64748b;">Satuan</span>`;
                let totalHargaGrup = 0;

                if (order.items.length > 1) {
                    order.items.forEach(i => {
                        totalHargaGrup += (i.harga_estimasi * i.jumlah);
                    });
                    totalHargaGrup += order.ongkir;

                    produkHtml = `<strong>${order.items.length} Produk dalam 1 Pesanan</strong><br>
                                  <span style="font-size: 11px; color: #2563eb; font-weight: 600;">(Checkout Keranjang)</span>`;
                    
                    detailUkuranHtml = `<button onclick="bukaRincianKeranjang(${index})" style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap;">🔍 Lihat Rincian (${order.items.length} Item)</button>`;
                    aksiHtml = `<button onclick="bukaRincianKeranjang(${index})" style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap;">Rincian</button>`;
                } else {
                    const p = order.items[0];
                    totalHargaGrup = (p.harga_estimasi * p.jumlah) + order.ongkir;
                    produkHtml = `<strong>${p.nama_produk}</strong><br><span style="color: #2563eb; font-size: 12px; font-weight: 500;">Qty: ${p.jumlah} item</span>`;
                    detailUkuranHtml = p.detail_ukuran || '-';
                }

                let metodeBayar = order.metode_pembayaran;
                if (typeof metodeBayar === 'object' && metodeBayar !== null) {
                    metodeBayar = metodeBayar.nama || metodeBayar.metode || metodeBayar.type || metodeBayar.nama_metode || 'Transfer Bank';
                } else if (typeof metodeBayar === 'string' && metodeBayar.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(metodeBayar);
                        metodeBayar = parsed.nama || parsed.metode || parsed.type || 'Transfer Bank';
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

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 600; padding: 12px 8px; text-align: center;">${nomorUrut}</td>
                    <td style="font-weight: 600; color: #475569; text-align: center; padding: 12px 8px;">${displayIdPesanan}</td>
                    <td style="color: #64748b; white-space: nowrap; padding: 12px 8px;">${tanggal}</td>
                    <td style="font-weight: 600; padding: 12px 8px; white-space: nowrap;">${order.nama_lengkap}</td>
                    <td style="padding: 12px 8px; min-width: 140px;">${produkHtml}</td>
                    <td style="max-width: 220px; word-break: break-word; font-size: 13px; padding: 12px 8px;">${detailUkuranHtml}</td>
                    <td style="max-width: 250px; word-break: break-word; font-size: 12px; color: #334155; padding: 12px 8px;">${order.alamat_pengiriman}</td>
                    <td style="font-size: 12px; color: #475569; white-space: nowrap; padding: 12px 8px;">
                        Bayar: <strong style="color: #0f172a;">${metodeBayar}</strong><br>
                        Ongkir: Rp ${Number(order.ongkir).toLocaleString('id-ID')}
                    </td>
                    <td style="font-weight: 700; color: #16a34a; white-space: nowrap; padding: 12px 8px;">Rp ${totalHargaGrup.toLocaleString('id-ID')}</td>
                    <td style="padding: 12px 8px; white-space: nowrap;">
                        <span style="font-weight:600; padding: 4px 8px; border-radius: 4px; background: ${bgStatus}; color: ${colorStatus};">
                            ${order.status}
                        </span>
                    </td>
                    <td style="white-space: nowrap; padding: 12px 8px;">
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <select onchange="ubahStatus(${order.items[0].id_pesanan}, this.value, ${index})" style="padding: 6px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 13px;">
                                <option value="Menunggu" ${order.status === 'Menunggu' ? 'selected' : ''}>Menunggu</option>
                                <option value="Diproses" ${order.status === 'Diproses' ? 'selected' : ''}>Diproses</option>
                                <option value="Dikirim" ${order.status === 'Dikirim' ? 'selected' : ''}>Dikirim</option>
                                <option value="Selesai" ${order.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                                <option value="Batal" ${order.status === 'Batal' ? 'selected' : ''}>Batal</option>
                            </select>
                            ${order.items.length > 1 ? aksiHtml : ''}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error memuat pesanan:', error);
    }
}

// Modal Rincian Item Pesanan Keranjang di Admin
function bukaRincianKeranjang(index) {
    const order = window.globalAdminPesanan[index];
    
    let modalEl = document.getElementById('modalRincianAdmin');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'modalRincianAdmin';
        modalEl.className = 'modal-overlay';
        modalEl.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
                    <h3 style="color: #0f172a; font-size: 18px; font-weight: 600;">📦 Rincian Item Pesanan Keranjang</h3>
                    <span style="font-size: 24px; cursor: pointer; color: #64748b; line-height: 1;" onclick="tutupRincianKeranjang()">&times;</span>
                </div>
                <div id="modalRincianBody" style="max-height: 400px; overflow-y: auto;"></div>
            </div>
        `;
        document.body.appendChild(modalEl);
    }

    const bodyContent = document.getElementById('modalRincianBody');
    if (!order.items || order.items.length === 0) {
        bodyContent.innerHTML = '<p>Tidak ada rincian item.</p>';
    } else {
        let html = `<p style="margin-bottom: 12px; font-size: 14px; color: #475569;">Daftar produk dalam keranjang pesanan oleh <strong>${order.nama_lengkap}</strong>:</p>`;
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

function tutupRincianKeranjang() {
    const modalEl = document.getElementById('modalRincianAdmin');
    if (modalEl) modalEl.style.display = 'none';
}

async function ubahStatus(id_pesanan, status_baru, indexGrup = null) {
    try {
        let listIdItem = [id_pesanan];
        if (indexGrup !== null && window.globalAdminPesanan && window.globalAdminPesanan[indexGrup]) {
            const grup = window.globalAdminPesanan[indexGrup];
            if (grup.items && grup.items.length > 0) {
                listIdItem = grup.items.map(i => i.id_pesanan);
            }
        }

        let successCount = 0;
        let errorMessage = '';

        for (const id of listIdItem) {
            const response = await fetch(`/api/pesanan/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: String(status_baru).trim() }),
                credentials: 'include'
            });
            
            const result = await response.json();
            if (response.ok && result.status === 'success') {
                successCount++;
            } else {
                errorMessage = result.message || 'Gagal mengubah status.';
            }
        }

        if (successCount > 0) {
            showToast(`Status pesanan berhasil diubah menjadi: ${status_baru}`, 'success', 'pesanan');
            muatDataPesanan();
        } else {
            showToast(errorMessage || 'Gagal mengubah status pesanan.', 'error', 'pesanan');
            muatDataPesanan(); 
        }
    } catch (error) {
        console.error('Error API:', error);
        showToast('Terjadi kesalahan jaringan saat memperbarui status.', 'error', 'pesanan');
        muatDataPesanan();
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
                        
                        <p style="font-size:13px; color:#334155; margin-bottom: 4px;"><strong>Bahan:</strong> ${p.bahan || '-'}</p>
                        <p style="font-size:13px; color:#334155;"><strong>Berat:</strong> ${p.berat ? p.berat + ' Gram' : '1000 Gram'}</p>
                        
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
        formData.append('berat', document.getElementById('berat').value);

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

function bukaModalEdit(id, nama, bahan, deskripsi, harga, berat) {
    document.getElementById('edit_id_produk').value = id;
    document.getElementById('edit_nama_produk').value = decodeURIComponent(nama);
    document.getElementById('edit_bahan').value = decodeURIComponent(bahan);
    document.getElementById('edit_deskripsi').value = decodeURIComponent(deskripsi);
    document.getElementById('edit_harga_estimasi').value = harga;
    document.getElementById('edit_berat').value = berat || 1000;
    
    document.getElementById('editModal').style.display = 'flex';
}

function bukaModalEditDariID(id_produk) {
    const produk = window.globalAdminProduk.find(p => p.id_produk === id_produk);
    if (!produk) return;
    bukaModalEdit(
        produk.id_produk, 
        encodeURIComponent(produk.nama_produk), 
        encodeURIComponent(produk.bahan || ''), 
        encodeURIComponent(produk.deskripsi || ''), 
        produk.harga_estimasi,
        produk.berat
    );
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
        formData.append('berat', document.getElementById('edit_berat').value);

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

                const nomorUrutCust = index + 1;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 600;">${nomorUrutCust}</td>
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