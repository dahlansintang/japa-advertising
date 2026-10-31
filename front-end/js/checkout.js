let hargaSatuan = 0;
let idProduk = null;
let isCheckoutKeranjang = false;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    idProduk = urlParams.get('id');
    const mode = urlParams.get('mode');

    if (mode === 'keranjang') {
        isCheckoutKeranjang = true;
        const titleEl = document.querySelector('h1, h2, h3, .checkout-title');
        if (titleEl) titleEl.innerText = '🛒 Checkout Keranjang Belanja';

        const namaProdukEl = document.getElementById('nama_produk');
        if (namaProdukEl) namaProdukEl.value = 'Checkout Semua Produk di Keranjang';
        
        try {
            const res = await fetch('/api/cart', { credentials: 'include' });
            const result = await res.json();
            if (result.status === 'success' && result.data.length > 0) {
                let totalKeranjang = 0;
                result.data.forEach(item => {
                    totalKeranjang += (item.harga_estimasi * item.jumlah);
                });
                hargaSatuan = totalKeranjang;
                const hargaDisplay = document.getElementById('harga_satuan_display');
                if (hargaDisplay) hargaDisplay.value = 'Rp ' + totalKeranjang.toLocaleString('id-ID');
                
                kalkulasiBiaya();
            } else {
                alert('Keranjang belanja Anda kosong!');
                window.location.href = '/pages/customer.html';
                return;
            }
        } catch (err) {
            console.error(err);
            alert('Gagal memuat data keranjang.');
            window.location.href = '/pages/customer.html';
            return;
        }

    } else if (!idProduk) {
        alert('Produk tidak ditemukan!');
        window.location.href = '/pages/customer.html';
        return;
    } else {
        try {
            const res = await fetch(`/api/produk/${idProduk}`, { credentials: 'include' });
            const result = await res.json();

            if (result.status === 'success') {
                const p = result.data;
                document.getElementById('nama_produk').value = p.nama_produk;
                hargaSatuan = Number(p.harga_estimasi);
                document.getElementById('harga_satuan_display').value = 'Rp ' + hargaSatuan.toLocaleString('id-ID');
                
                kalkulasiBiaya();
            } else {
                alert('Produk tidak ditemukan di database.');
                window.location.href = '/pages/customer.html';
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat memuat produk.');
        }
    }

    loadProvinces();
});

// Cascading Dropdown Wilayah Indonesia
async function loadProvinces() {
    try {
        const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        const provinces = await response.json();
        const select = document.getElementById('provinsi');
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

document.getElementById('provinsi').addEventListener('change', async function() {
    const provId = this.options[this.selectedIndex].dataset.id;
    const kabSelect = document.getElementById('kabupaten');
    kabSelect.innerHTML = '<option value="">Pilih Kabupaten/Kota</option>';
    document.getElementById('kecamatan').innerHTML = '<option value="">Pilih Kecamatan</option>';
    document.getElementById('kelurahan').innerHTML = '<option value="">Pilih Kelurahan/Desa</option>';
    document.getElementById('layanan_kurir').innerHTML = '<option value="">-- Pilih Kabupaten/Kota Terlebih Dahulu --</option>';
    
    kalkulasiBiaya();
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

document.getElementById('kabupaten').addEventListener('change', async function() {
    const kabId = this.options[this.selectedIndex].dataset.id;
    const kabName = this.value;
    const provName = document.getElementById('provinsi').value;
    const kurirSelect = document.getElementById('layanan_kurir');
    
    kurirSelect.innerHTML = '<option value="">Memuat tarif kurir...</option>';
    kalkulasiBiaya();

    const kecSelect = document.getElementById('kecamatan');
    kecSelect.innerHTML = '<option value="">Pilih Kecamatan</option>';
    document.getElementById('kelurahan').innerHTML = '<option value="">Pilih Kelurahan/Desa</option>';
    
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
                kurirSelect.innerHTML += `<option value="${item.cost}">JNE ${item.service} (${item.etd}) - Rp ${item.cost.toLocaleString('id-ID')}</option>`;
            });
        } else {
            kurirSelect.innerHTML = '<option value="0">Tidak ada kurir (Ambil di Toko) - Rp 0</option>';
        }
    } catch (err) {
        kurirSelect.innerHTML = '<option value="0">Gagal memuat ongkir (Ambil di Toko) - Rp 0</option>';
    }
});

document.getElementById('kecamatan').addEventListener('change', async function() {
    const kecId = this.options[this.selectedIndex].dataset.id;
    const kelSelect = document.getElementById('kelurahan');
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

const jumlahInput = document.getElementById('jumlah');
if(jumlahInput) jumlahInput.addEventListener('input', kalkulasiBiaya);
document.getElementById('layanan_kurir').addEventListener('change', kalkulasiBiaya);

function kalkulasiBiaya() {
    const jumlah = isCheckoutKeranjang ? 1 : (Number(document.getElementById('jumlah')?.value) || 1);
    const kurirSelect = document.getElementById('layanan_kurir');
    const tarifKurir = kurirSelect.value ? Number(kurirSelect.value) : 0;
    
    const subtotal = hargaSatuan * jumlah;
    const ongkir = tarifKurir === 0 ? 0 : tarifKurir * jumlah; 
    const total = subtotal + ongkir;

    const subtotalDisplay = document.getElementById('subtotal_display');
    const ongkirDisplay = document.getElementById('ongkir_display');
    const totalDisplay = document.getElementById('total_display');

    if(subtotalDisplay) subtotalDisplay.innerText = 'Rp ' + subtotal.toLocaleString('id-ID');
    if(ongkirDisplay) ongkirDisplay.innerText = 'Rp ' + ongkir.toLocaleString('id-ID');
    if(totalDisplay) totalDisplay.innerText = 'Rp ' + total.toLocaleString('id-ID');
    
    const form = document.getElementById('checkoutForm');
    if(form) {
        form.dataset.ongkir = ongkir;
        form.dataset.total = total;
    }
}

// Submit Form Checkout & Kirim ke WhatsApp
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const kurirSelect = document.getElementById('layanan_kurir');
    const kurirVal = kurirSelect.value;
    if (!kurirVal) {
        alert('Silakan pilih layanan kurir pengiriman terlebih dahulu.');
        return;
    }
    const namaKurir = kurirSelect.options[kurirSelect.selectedIndex].text;

    const btn = document.getElementById('btnSubmit');
    if(btn) {
        btn.innerText = 'Memproses...';
        btn.disabled = true;
    }

    const detailAlamat = document.getElementById('detail_alamat').value.trim();
    const kelurahan = document.getElementById('kelurahan').value;
    const kecamatan = document.getElementById('kecamatan').value;
    const kabupaten = document.getElementById('kabupaten').value;
    const provinsi = document.getElementById('provinsi').value;
    const kodePos = document.getElementById('kode_pos').value.trim();
    
    const metodeEl = document.getElementById('metode_pembayaran');
    let metodePembayaran = 'Transfer Bank';
    if (metodeEl) {
        if (metodeEl.tagName === 'SELECT' && metodeEl.selectedIndex >= 0) {
            metodePembayaran = metodeEl.options[metodeEl.selectedIndex].text || metodeEl.value;
        } else {
            metodePembayaran = metodeEl.value || 'Transfer Bank';
        }
    }

    const alamatLengkapGabungan = `${detailAlamat}, Kel. ${kelurahan}, Kec. ${kecamatan}, ${kabupaten}, Prov. ${provinsi} - Kode Pos: ${kodePos}`;
    
    const ongkirForm = document.getElementById('checkoutForm').dataset.ongkir;
    const ongkir = ongkirForm !== undefined && ongkirForm !== '' ? Number(ongkirForm) : (kurirVal ? Number(kurirVal) : 0);
    
    const totalHarga = Number(document.getElementById('checkoutForm').dataset.total) || 0;
    const nomorWaPerusahaan = '6281545751255';

    if (isCheckoutKeranjang) {
        try {
            const cartRes = await fetch('/api/cart', { credentials: 'include' });
            const cartResult = await cartRes.json();
            
            let daftarProdukStr = '';
            if (cartResult.status === 'success' && cartResult.data.length > 0) {
                cartResult.data.forEach((item, idx) => {
                    const subtotalItem = item.harga_estimasi * item.jumlah;
                    daftarProdukStr += `\n${idx + 1}. *${item.nama_produk}*\n` +
                                      `   - Harga Satuan: Rp ${Number(item.harga_estimasi).toLocaleString('id-ID')}\n` +
                                      `   - Jumlah: ${item.jumlah}\n` +
                                      `   - Subtotal: Rp ${subtotalItem.toLocaleString('id-ID')}\n` +
                                      `   - Catatan: ${item.detail_ukuran || '-'}\n`;
                });
            }

            const response = await fetch('/api/cart/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    alamat_pengiriman: alamatLengkapGabungan, 
                    metode_pembayaran: String(metodePembayaran),
                    ongkir: Number(ongkir) 
                }),
                credentials: 'include'
            });
            const result = await response.json();
            
            if (result.status === 'success') {
                const nomorUrutPesanan = '1';

                const pesanWa = `*NOTA / KONFIRMASI CHECKOUT KERANJANG*\n` +
                                `*PT Japa Prabu Advertising*\n\n` +
                                `----------------------------------------\n` +
                                `*Nomor Urut Pesanan:* ${nomorUrutPesanan}\n` +
                                `*DAFTAR PRODUK:*` + daftarProdukStr + `\n` +
                                `----------------------------------------\n` +
                                `*INFORMASI PENGIRIMAN*\n` +
                                `*Kurir / Layanan:* ${namaKurir}\n` +
                                `*Alamat Lengkap:* ${alamatLengkapGabungan}\n` +
                                `----------------------------------------\n` +
                                `*RINCIAN PEMBAYARAN*\n` +
                                `*Subtotal Produk:* Rp ${hargaSatuan.toLocaleString('id-ID')}\n` +
                                `*Ongkos Kirim:* Rp ${ongkir.toLocaleString('id-ID')}\n` +
                                `*Total Pembayaran:* Rp ${totalHarga.toLocaleString('id-ID')}\n` +
                                `*Metode Pembayaran:* ${metodePembayaran}\n\n` +
                                `Mohon konfirmasi dan proses pesanan ini. Terima kasih!`;

                const waUrl = `https://wa.me/${nomorWaPerusahaan}?text=${encodeURIComponent(pesanWa)}`;
                alert('Checkout keranjang berhasil disimpan! Klik OK untuk melanjutkan ke WhatsApp.');
                window.location.href = waUrl;
            } else {
                alert(result.message || 'Gagal melakukan checkout keranjang.');
                if(btn) { btn.innerText = 'Proses Pesanan Sekarang'; btn.disabled = false; }
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan jaringan.');
            if(btn) { btn.innerText = 'Proses Pesanan Sekarang'; btn.disabled = false; }
        }

    } else {
        const namaProduk = document.getElementById('nama_produk').value;
        const jumlah = document.getElementById('jumlah').value;
        const detailUkuran = document.getElementById('detail_ukuran').value;

        const payload = {
            id_produk: idProduk,
            jumlah: jumlah,
            detail_ukuran: detailUkuran,
            alamat_pengiriman: alamatLengkapGabungan,
            ongkir: Number(ongkir),
            total_harga: totalHarga,
            metode_pembayaran: String(metodePembayaran)
        };

        try {
            const response = await fetch('/api/pesanan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            
            const result = await response.json();
            if (result.status === 'success') {
                const nomorUrutPesanan = '1';
                const subtotalProduk = hargaSatuan * Number(jumlah);

                const pesanWa = `*NOTA / KONFIRMASI PESANAN BARU*\n` +
                                `*PT Japa Prabu Advertising*\n\n` +
                                `----------------------------------------\n` +
                                `*Nomor Urut Pesanan:* ${nomorUrutPesanan}\n` +
                                `*Nama Produk:* ${namaProduk}\n` +
                                `*Harga Satuan:* Rp ${hargaSatuan.toLocaleString('id-ID')}\n` +
                                `*Jumlah (Qty):* ${jumlah}\n` +
                                `*Subtotal Produk:* Rp ${subtotalProduk.toLocaleString('id-ID')}\n` +
                                `*Detail Ukuran:* ${detailUkuran}\n` +
                                `----------------------------------------\n` +
                                `*INFORMASI PENGIRIMAN*\n` +
                                `*Kurir / Layanan:* ${namaKurir}\n` +
                                `*Alamat Lengkap:* ${alamatLengkapGabungan}\n` +
                                `----------------------------------------\n` +
                                `*RINCIAN PEMBAYARAN*\n` +
                                `*Subtotal:* Rp ${subtotalProduk.toLocaleString('id-ID')}\n` +
                                `*Ongkos Kirim:* Rp ${ongkir.toLocaleString('id-ID')}\n` +
                                `*Total Pembayaran:* Rp ${totalHarga.toLocaleString('id-ID')}\n` +
                                `*Metode Pembayaran:* ${metodePembayaran}\n\n` +
                                `Mohon konfirmasi dan proses pesanan ini. Terima kasih!`;

                const waUrl = `https://wa.me/${nomorWaPerusahaan}?text=${encodeURIComponent(pesanWa)}`;
                alert('Pesanan berhasil disimpan ke sistem! Klik OK untuk melanjutkan ke WhatsApp.');
                window.location.href = waUrl;
            } else {
                alert(result.message || 'Gagal membuat pesanan.');
                if(btn) { btn.innerText = 'Proses Pesanan Sekarang'; btn.disabled = false; }
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan jaringan.');
            if(btn) { btn.innerText = 'Proses Pesanan Sekarang'; btn.disabled = false; }
        }
    }
});