let hargaSatuan = 0;
let idProduk = null;
let isCheckoutKeranjang = false;
let quoteTerpilih = null;
let timerQuote = null;

const $ = (id) => document.getElementById(id);
const moneyFormat = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

document.addEventListener('DOMContentLoaded', async () => {
    const form = $('checkoutForm');
    if (!form) return;

    const params = new URLSearchParams(location.search);
    const rawId = params.get('id');
    idProduk = rawId ? Number(rawId) : null;
    isCheckoutKeranjang = params.get('mode') === 'keranjang';

    if (isCheckoutKeranjang) {
        const title = document.querySelector('h1, h2, h3, .checkout-title');
        if (title) title.textContent = '🛒 Checkout Keranjang Belanja';
        if ($('nama_produk')) $('nama_produk').value = 'Checkout Semua Produk di Keranjang';
        try {
            const response = await fetch('/api/cart', { credentials: 'include' });
            const result = await response.json();
            if (!response.ok || result.status !== 'success' || !result.data?.length) {
                alert(result.message || 'Keranjang belanja Anda kosong.');
                location.href = '/pages/customer.html';
                return;
            }
            hargaSatuan = result.data.reduce((sum, item) =>
                sum + Number(item.harga_estimasi) * Number(item.jumlah), 0);
            if ($('harga_satuan_display')) $('harga_satuan_display').value = moneyFormat(hargaSatuan);
            updateTotals();
        } catch (error) {
            console.error(error);
            alert('Gagal memuat data keranjang.');
            return;
        }
    } else {
        if (!Number.isSafeInteger(idProduk) || idProduk < 1) {
            alert('ID Produk tidak valid atau tidak ditemukan!');
            location.href = '/pages/customer.html';
            return;
        }
        try {
            const response = await fetch(`/api/produk/${encodeURIComponent(idProduk)}`, { credentials: 'include' });
            const result = await response.json();
            if (!response.ok || result.status !== 'success') throw new Error(result.message || 'Produk tidak ditemukan.');
            const product = result.data;
            if ($('nama_produk')) $('nama_produk').value = product.nama_produk;
            hargaSatuan = Number(product.harga_estimasi);
            if ($('harga_satuan_display')) $('harga_satuan_display').value = moneyFormat(hargaSatuan);
            updateTotals();
        } catch (error) {
            console.error(error);
            alert('Gagal memuat produk.');
            return;
        }
    }

    await loadProvinces();
    $('provinsi')?.addEventListener('change', onProvinceChange);
    $('kabupaten')?.addEventListener('change', onRegencyChange);
    $('kecamatan')?.addEventListener('change', onDistrictChange);
    $('jumlah')?.addEventListener('input', () => {
        updateTotals();
        requestShippingQuotes();
    });
    $('layanan_kurir')?.addEventListener('change', () => {
        const option = $('layanan_kurir').selectedOptions[0];
        quoteTerpilih = option?.dataset.cost ? Number(option.dataset.cost) : null;
        updateTotals();
    });
    form.addEventListener('submit', submitCheckout);
});

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Gagal mengambil data wilayah.');
    return response.json();
}

async function loadProvinces() {
    try {
        const provinces = await fetchJson('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        const select = $('provinsi');
        if (!select) return;
        provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province.name;
            option.dataset.id = province.id;
            option.textContent = province.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Gagal memuat provinsi:', error);
        alert('Daftar provinsi gagal dimuat. Periksa koneksi internet.');
    }
}

async function onProvinceChange() {
    resetSelect('kabupaten', 'Pilih Kabupaten/Kota');
    resetSelect('kecamatan', 'Pilih Kecamatan');
    resetSelect('kelurahan', 'Pilih Kelurahan/Desa');
    resetSelect('layanan_kurir', 'Pilih Kabupaten/Kota Terlebih Dahulu');
    quoteTerpilih = null;
    updateTotals();

    const select = $('provinsi');
    const provinceId = select?.selectedOptions[0]?.dataset.id;
    if (!provinceId) return;

    try {
        const rows = await fetchJson(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`);
        rows.forEach(row => addOption('kabupaten', row.name, row.id));
    } catch (error) { console.error(error); }
}

async function onRegencyChange() {
    resetSelect('kecamatan', 'Pilih Kecamatan');
    resetSelect('kelurahan', 'Pilih Kelurahan/Desa');
    resetSelect('layanan_kurir', 'Memuat layanan pengiriman...');
    quoteTerpilih = null;
    updateTotals();

    const regencyId = $('kabupaten')?.selectedOptions[0]?.dataset.id;
    if (!regencyId) {
        resetSelect('layanan_kurir', 'Pilih Kabupaten/Kota Terlebih Dahulu');
        return;
    }

    try {
        const districts = await fetchJson(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regencyId}.json`);
        districts.forEach(row => addOption('kecamatan', row.name, row.id));
    } catch (error) { console.error(error); }
    await requestShippingQuotes();
}

async function onDistrictChange() {
    resetSelect('kelurahan', 'Pilih Kelurahan/Desa');
    const districtId = $('kecamatan')?.selectedOptions[0]?.dataset.id;
    if (!districtId) return;
    try {
        const villages = await fetchJson(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`);
        villages.forEach(row => addOption('kelurahan', row.name));
    } catch (error) { console.error(error); }
}

function resetSelect(id, label) {
    const select = $(id);
    if (!select) return;
    select.innerHTML = '';
    const option = document.createElement('option');
    option.value = '';
    option.textContent = label;
    select.appendChild(option);
}

function addOption(id, value, dataId) {
    const select = $(id);
    if (!select) return;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    if (dataId) option.dataset.id = dataId;
    select.appendChild(option);
}

async function requestShippingQuotes() {
    clearTimeout(timerQuote);
    timerQuote = setTimeout(loadShippingQuotes, 250);
}

async function loadShippingQuotes() {
    const city = $('kabupaten')?.value;
    const province = $('provinsi')?.value;
    if (!city || !province) return;

    const select = $('layanan_kurir');
    resetSelect('layanan_kurir', 'Memuat tarif pengiriman...');
    quoteTerpilih = null;
    updateTotals();

    const currentQty = Number($('jumlah')?.value || 1);
    const payload = isCheckoutKeranjang
        ? { mode: 'keranjang', destinationName: city, provinceName: province }
        : { mode: 'produk', id_produk: Number(idProduk), jumlah: currentQty, destinationName: city, provinceName: province };

    try {
        const response = await fetch('/api/cek-ongkir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok || result.status !== 'success') throw new Error(result.message || 'Gagal menghitung ongkir.');

        resetSelect('layanan_kurir', 'Pilih Layanan Kurir');
        result.data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.code;
            option.dataset.cost = item.cost;
            option.textContent = `${item.courier} ${item.service} (${item.etd}) - ${moneyFormat(item.cost)}`;
            select.appendChild(option);
        });
        select.disabled = false;
    } catch (error) {
        console.error(error);
        resetSelect('layanan_kurir', 'Gagal memuat ongkir - pilih ulang wilayah');
        select.disabled = true;
        alert(error.message);
    }
    updateTotals();
}

function updateTotals() {
    const qty = isCheckoutKeranjang ? 1 : Math.max(1, Number($('jumlah')?.value || 1));
    const subtotal = isCheckoutKeranjang ? hargaSatuan : hargaSatuan * qty;
    const selected = $('layanan_kurir')?.selectedOptions[0];
    const shipping = selected?.dataset.cost ? Number(selected.dataset.cost) : 0;
    if ($('subtotal_display')) $('subtotal_display').textContent = moneyFormat(subtotal);
    if ($('ongkir_display')) $('ongkir_display').textContent = moneyFormat(shipping);
    if ($('total_display')) $('total_display').textContent = moneyFormat(subtotal + shipping);
}

async function submitCheckout(event) {
    event.preventDefault();
    const btn = $('btnSubmit');
    const city = $('kabupaten')?.value;
    const province = $('provinsi')?.value;
    const serviceCode = $('layanan_kurir')?.value;
    
    if (!city || !province || !serviceCode) {
        alert('Lengkapi wilayah tujuan dan pilih layanan pengiriman.');
        return;
    }

    const detailAddress = $('detail_alamat')?.value.trim();
    const village = $('kelurahan')?.value;
    const district = $('kecamatan')?.value;
    const postal = $('kode_pos')?.value.trim();
    if (!detailAddress || !village || !district || !postal) {
        alert('Lengkapi alamat, kelurahan, kecamatan, dan kode pos.');
        return;
    }

    const paymentEl = $('metode_pembayaran');
    const payment = paymentEl
        ? (paymentEl.tagName === 'SELECT'
            ? (paymentEl.selectedOptions[0]?.text || paymentEl.value)
            : paymentEl.value)
        : 'Transfer Bank';
    const allowedPayments = ['Transfer Bank BCA', 'Transfer Bank Mandiri', 'Transfer Bank BNI', 'E-Wallet (GoPay / OVO / Dana)', 'Bayar di Toko (Tunai)'];
    if (!allowedPayments.includes(payment)) {
        alert('Metode pembayaran tidak dikenali. Periksa pilihan metode pembayaran pada form.');
        return;
    }

    const address = `${detailAddress}, Kel. ${village}, Kec. ${district}, ${city}, Prov. ${province}, Kode Pos: ${postal}`;

    const payload = {
        alamat_pengiriman: address,
        metode_pembayaran: payment,
        destinationName: city,
        provinceName: province,
        serviceCode: serviceCode
    };
    
    if (!isCheckoutKeranjang) {
        payload.id_produk = Number(idProduk);
        payload.jumlah = Number($('jumlah')?.value || 1);
        payload.detail_ukuran = $('detail_ukuran')?.value || '-';
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Memproses...'; }
    try {
        const url = isCheckoutKeranjang ? '/api/cart/checkout' : '/api/pesanan';
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok || result.status !== 'success') throw new Error(result.message || 'Checkout gagal.');

        const data = result.data || {};
        const message = [
            '*KONFIRMASI PESANAN PT JAPA PRABU ADVERTISING*',
            '',
            `Nomor pesanan: ${data.id_pesanan || (data.inserted_ids || []).join(', ')}`,
            `Kurir: ${data.ekspedisi || ''} ${data.layanan_pengiriman || ''}`,
            `Alamat: ${address}`,
            `Subtotal: ${moneyFormat(data.subtotal ?? (Number(data.harga_satuan || 0) * Number(data.jumlah || 0)))}`,
            `Ongkos kirim: ${moneyFormat(data.ongkir)}`,
            `Total pembayaran: ${moneyFormat(data.total_harga)}`,
            `Metode pembayaran: ${payment}`,
            '',
            'Mohon konfirmasi pesanan ini. Terima kasih.'
        ].join('\n');
        const whatsapp = `https://wa.me/6281545751255?text=${encodeURIComponent(message)}`;
        alert('Pesanan berhasil disimpan. Anda akan diarahkan ke WhatsApp.');
        location.href = whatsapp;
    } catch (error) {
        console.error(error);
        alert(error.message || 'Terjadi kesalahan saat checkout.');
        if (btn) { btn.disabled = false; btn.textContent = 'Proses Pesanan Sekarang'; }
    }
}