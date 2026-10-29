let hargaSatuan = 0;
let idProduk = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    idProduk = urlParams.get('id');

    if (!idProduk) {
        alert('Produk tidak ditemukan!');
        window.location.href = '/pages/customer.html';
        return;
    }

    // Muat Data Produk
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
    const kabName = this.value.toUpperCase();
    const kurirSelect = document.getElementById('layanan_kurir');
    
    kurirSelect.innerHTML = '<option value="">Pilih Layanan Kurir</option>';

    if (kabName.includes('BOGOR')) {
        kurirSelect.innerHTML += `
            <option value="15000">Tarif Lokal - Bogor (Rp 15.000 / item)</option>
            <option value="0">Ambil Sendiri di Toko / Workshop (Gratis)</option>
        `;
    } else {
        const provName = document.getElementById('provinsi').value.toUpperCase();
        if (provName.includes('JAWA') || provName.includes('JAKARTA') || provName.includes('YOGYAKARTA') || provName.includes('BANTEN')) {
            kurirSelect.innerHTML += `
                <option value="30000">Reguler - Pulau Jawa (Rp 30.000 / item)</option>
                <option value="60000">Express - Pulau Jawa (Rp 60.000 / item)</option>
                <option value="0">Ambil Sendiri di Toko / Workshop (Gratis)</option>
            `;
        } else {
            kurirSelect.innerHTML += `
                <option value="50000">Reguler - Luar Pulau Jawa (Rp 50.000 / item)</option>
                <option value="85000">Express - Luar Pulau Jawa (Rp 85.000 / item)</option>
                <option value="0">Ambil Sendiri di Toko / Workshop (Gratis)</option>
            `;
        }
    }

    kalkulasiBiaya();

    const kecSelect = document.getElementById('kecamatan');
    kecSelect.innerHTML = '<option value="">Pilih Kecamatan</option>';
    document.getElementById('kelurahan').innerHTML = '<option value="">Pilih Kelurahan/Desa</option>';
    
    if (!kabId) return;
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
    } catch (e) { console.error(e); }
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

document.getElementById('jumlah').addEventListener('input', kalkulasiBiaya);
document.getElementById('layanan_kurir').addEventListener('change', kalkulasiBiaya);

function kalkulasiBiaya() {
    const jumlah = Number(document.getElementById('jumlah').value) || 1;
    const kurirSelect = document.getElementById('layanan_kurir');
    const tarifKurir = kurirSelect.value ? Number(kurirSelect.value) : 0;
    
    const subtotal = hargaSatuan * jumlah;
    const ongkir = tarifKurir === 0 ? 0 : tarifKurir * jumlah; 
    const total = subtotal + ongkir;

    document.getElementById('subtotal_display').innerText = 'Rp ' + subtotal.toLocaleString('id-ID');
    document.getElementById('ongkir_display').innerText = 'Rp ' + ongkir.toLocaleString('id-ID');
    document.getElementById('total_display').innerText = 'Rp ' + total.toLocaleString('id-ID');
    
    document.getElementById('checkoutForm').dataset.ongkir = ongkir;
    document.getElementById('checkoutForm').dataset.total = total;
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
    btn.innerText = 'Memproses...';
    btn.disabled = true;

    const namaProduk = document.getElementById('nama_produk').value;
    const jumlah = document.getElementById('jumlah').value;
    const detailUkuran = document.getElementById('detail_ukuran').value;
    const detailAlamat = document.getElementById('detail_alamat').value;
    const kelurahan = document.getElementById('kelurahan').value;
    const kecamatan = document.getElementById('kecamatan').value;
    const kabupaten = document.getElementById('kabupaten').value;
    const provinsi = document.getElementById('provinsi').value;
    const kodePos = document.getElementById('kode_pos').value;
    
    // AMBIL NILAI TEKS METODE PEMBAYARAN SECARA EKSPLISIT (.value)
    const metodePembayaranEl = document.getElementById('metode_pembayaran');
    const metodePembayaran = metodePembayaranEl ? metodePembayaranEl.value : '';

    const alamatLengkapGabungan = `${detailAlamat}, Kel. ${kelurahan}, Kec. ${kecamatan}, ${kabupaten}, Prov. ${provinsi} - Kode Pos: ${kodePos}`;
    const ongkir = document.getElementById('checkoutForm').dataset.ongkir;
    const totalHarga = document.getElementById('checkoutForm').dataset.total;

    const payload = {
        id_produk: idProduk,
        jumlah: jumlah,
        detail_ukuran: detailUkuran,
        alamat_pengiriman: alamatLengkapGabungan,
        ongkir: ongkir,
        total_harga: totalHarga,
        metode_pembayaran: metodePembayaran
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
            // Ambil total keseluruhan pesanan di database sebagai nomor urut berikutnya (misal: 13)
            let nomorUrutPesanan = '1';
            try {
                const resOrders = await fetch('/api/customer/orders', { credentials: 'include' });
                const dataOrders = await resOrders.json();
                if (dataOrders.status === 'success' && dataOrders.data.length > 0) {
                    // Mengambil total jumlah baris pesanan secara keseluruhan
                    nomorUrutPesanan = dataOrders.data.length;
                }
            } catch (err) {
                console.error('Gagal mengambil total nomor urut:', err);
                nomorUrutPesanan = result.id_pesanan; // Fallback ke ID dari database jika gagal
            }

            const nomorWaPerusahaan = '6281545751255'; 
            const subtotalProduk = hargaSatuan * Number(jumlah);

            // Format Pesan WhatsApp dengan ID Pesanan melanjutkan total keseluruhan (misal: No. 13)
            const pesanWa = `*NOTA / KONFIRMASI PESANAN BARU*\n` +
                            `*PT Japa Prabu Advertising*\n\n` +
                            `----------------------------------------\n` +
                            `*ID Pesanan:* No. ${nomorUrutPesanan}\n` +
                            `*Nama Produk:* ${namaProduk}\n` +
                            `*Harga Satuan:* Rp ${hargaSatuan.toLocaleString('id-ID')}\n` +
                            `*Jumlah (Qty):* ${jumlah}\n` +
                            `*Subtotal Produk:* Rp ${subtotalProduk.toLocaleString('id-ID')}\n` +
                            `*Detail Ukuran & Catatan:* ${detailUkuran}\n` +
                            `----------------------------------------\n` +
                            `*INFORMASI PENGIRIMAN*\n` +
                            `*Kurir / Layanan:* ${namaKurir}\n` +
                            `*Alamat Lengkap:* ${alamatLengkapGabungan}\n` +
                            `----------------------------------------\n` +
                            `*RINCIAN PEMBAYARAN*\n` +
                            `*Subtotal:* Rp ${subtotalProduk.toLocaleString('id-ID')}\n` +
                            `*Ongkos Kirim:* Rp ${Number(ongkir).toLocaleString('id-ID')}\n` +
                            `*Total Pembayaran:* Rp ${Number(totalHarga).toLocaleString('id-ID')}\n` +
                            `*Metode Pembayaran:* ${metodePembayaran}\n\n` +
                            `Mohon konfirmasi dan proses pesanan ini. Terima kasih!`;

            const waUrl = `https://wa.me/${nomorWaPerusahaan}?text=${encodeURIComponent(pesanWa)}`;

            alert('Pesanan berhasil disimpan ke sistem! Klik OK untuk melanjutkan ke WhatsApp.');
            window.location.href = waUrl;
        } else {
            alert(result.message || 'Gagal membuat pesanan.');
            btn.innerText = 'Proses Pesanan Sekarang';
            btn.disabled = false;
        }
    } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan jaringan.');
        btn.innerText = 'Proses Pesanan Sekarang';
        btn.disabled = false;
    }
});