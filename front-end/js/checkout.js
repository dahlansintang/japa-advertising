'use strict';

const CHECKOUT_CONFIG = {
    nomorWhatsApp: '6287880825010',
    halamanKatalog: '/pages/customer.html',
    wilayahBase: 'https://www.emsifa.com/api-wilayah-indonesia/api'
};

let hargaSatuan = 0;
let idProduk = null;
let isCheckoutKeranjang = false;
let dataKeranjang = [];
let sedangMemproses = false;
let requestWilayahVersion = 0;

const el = {
    form: document.getElementById('checkoutForm'),
    namaProduk: document.getElementById('nama_produk'),
    hargaDisplay: document.getElementById('harga_satuan_display'),
    jumlah: document.getElementById('jumlah'),
    detailUkuran: document.getElementById('detail_ukuran'),
    provinsi: document.getElementById('provinsi'),
    kabupaten: document.getElementById('kabupaten'),
    kecamatan: document.getElementById('kecamatan'),
    kelurahan: document.getElementById('kelurahan'),
    kodePos: document.getElementById('kode_pos'),
    kurir: document.getElementById('layanan_kurir'),
    metode: document.getElementById('metode_pembayaran'),
    detailAlamat: document.getElementById('detail_alamat'),
    subtotal: document.getElementById('subtotal_display'),
    ongkir: document.getElementById('ongkir_display'),
    total: document.getElementById('total_display'),
    containerKeranjang: document.getElementById('cart-items-summary-container'),
    tombol: document.getElementById('btnSubmit')
};

function formatRupiah(value) {
    const n = Number(value);
    return `Rp ${(Number.isFinite(n) ? n : 0).toLocaleString('id-ID')}`;
}
function angkaValid(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}
function setOptions(select, placeholder) {
    if (!select) return;
    select.replaceChildren();
    const option = document.createElement('option');
    option.value = ''; option.textContent = placeholder;
    select.appendChild(option);
}
function appendOption(select, value, label, id = null) {
    const option = document.createElement('option');
    option.value = value; option.textContent = label;
    if (id !== null) option.dataset.id = String(id);
    select.appendChild(option);
}

async function requestJSON(url, options = {}) {
    let response;
    const method = String(options.method || 'GET').toUpperCase();
    
    if (typeof csrfFetch === 'function' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        response = await csrfFetch(url, options);
    } else {
        response = await fetch(url, {
            credentials: 'include', ...options,
            headers: { ...(options.headers || {}) }
        });
    }

    let result;
    try { result = await response.json(); }
    catch (_) { throw new Error('Respons server tidak valid.'); }
    if (!response.ok) throw new Error(result.message || `Permintaan gagal (${response.status}).`);
    return result;
}

async function fetchWilayah(path) {
    const response = await fetch(`${CHECKOUT_CONFIG.wilayahBase}/${path}`);
    if (!response.ok) throw new Error('Gagal mengambil data wilayah Indonesia.');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Format data wilayah tidak valid.');
    return data;
}

document.addEventListener('DOMContentLoaded', initCheckout);

async function initCheckout() {
    if (!el.form || !el.provinsi || !el.kabupaten || !el.kecamatan || !el.kelurahan || !el.kurir) {
        console.error('Elemen form checkout tidak lengkap.');
        return;
    }
    const logo = document.querySelector('.brand img');
    logo?.addEventListener('error', () => { logo.style.display = 'none'; });

    if (typeof getCsrfToken === 'function') {
        try {
            await getCsrfToken();
        } catch (e) {
            console.error('Gagal menyiapkan token CSRF:', e);
        }
    }

    const params = new URLSearchParams(window.location.search);
    const rawId = params.get('id');
    idProduk = rawId ? Number(rawId) : null;
    isCheckoutKeranjang = params.get('mode') === 'keranjang';
    try {
        if (isCheckoutKeranjang) await loadCartCheckout();
        else {
            if (!Number.isSafeInteger(idProduk) || idProduk < 1) throw new Error('Produk tidak valid atau tidak ditemukan.');
            await loadSingleProduct();
        }
        await loadProvinces();
        bindCheckoutEvents();
    } catch (error) {
        console.error('Inisialisasi checkout:', error);
        window.alert(error.message || 'Checkout gagal dimuat.');
        window.location.href = CHECKOUT_CONFIG.halamanKatalog;
    }
}

async function loadSingleProduct() {
    const result = await requestJSON('/api/produk');
    if (result.status !== 'success' || !Array.isArray(result.data)) throw new Error('Gagal mengambil data produk.');
    const product = result.data.find(item => String(item.id_produk) === String(idProduk));
    if (!product) throw new Error('Produk tidak ditemukan.');
    hargaSatuan = angkaValid(product.harga_estimasi);
    if (el.namaProduk) el.namaProduk.value = product.nama_produk || '';
    if (el.hargaDisplay) el.hargaDisplay.value = formatRupiah(hargaSatuan);
    const params = new URLSearchParams(window.location.search);
    if (el.detailUkuran && params.has('detail')) el.detailUkuran.value = params.get('detail') || '';
    kalkulasiBiaya();
}

async function loadCartCheckout() {
    const title = document.getElementById('sectionTitle'); if (title) title.textContent = 'Ringkasan Checkout Keranjang';
    ['groupNamaProduk', 'rowSatuanQty', 'groupDetailCatatan'].forEach(id => {
        const node = document.getElementById(id); if (node) node.style.display = 'none';
    });
    el.namaProduk?.removeAttribute('required');
    el.jumlah?.removeAttribute('required');
    el.detailUkuran?.removeAttribute('required');
    const result = await requestJSON('/api/cart');
    if (result.status !== 'success' || !Array.isArray(result.data) || result.data.length === 0) throw new Error('Keranjang belanja Anda kosong.');
    dataKeranjang = result.data;
    hargaSatuan = 0;
    if (el.containerKeranjang) {
        el.containerKeranjang.replaceChildren();
        dataKeranjang.forEach((item, index) => {
            const price = angkaValid(item.harga_estimasi);
            const qty = Number(item.jumlah);
            if (!Number.isSafeInteger(qty) || qty < 1) throw new Error('Jumlah produk dalam keranjang tidak valid.');
            hargaSatuan += price * qty;
            const wrapper = document.createElement('div'); wrapper.className = 'cart-item';
            const info = document.createElement('div'); info.className = 'cart-item-info';
            const name = document.createElement('strong'); name.textContent = `${index + 1}. ${item.nama_produk || 'Produk'}`;
            const detail = document.createElement('small'); detail.textContent = `Qty: ${qty} | Catatan: ${item.detail_ukuran || '-'}`;
            info.append(name, detail);
            const subtotal = document.createElement('div'); subtotal.className = 'cart-item-price'; subtotal.textContent = formatRupiah(price * qty);
            wrapper.append(info, subtotal); el.containerKeranjang.appendChild(wrapper);
        });
    }
    kalkulasiBiaya();
}

async function loadProvinces() {
    setOptions(el.provinsi, 'Memuat provinsi...');
    const data = await fetchWilayah('provinces.json');
    setOptions(el.provinsi, 'Pilih Provinsi');
    data.forEach(item => appendOption(el.provinsi, item.name, item.name, item.id));
}
function resetKabupaten() { setOptions(el.kabupaten, 'Pilih Kabupaten/Kota'); }
function resetKecamatan() { setOptions(el.kecamatan, 'Pilih Kecamatan'); }
function resetKelurahan() { setOptions(el.kelurahan, 'Pilih Kelurahan/Desa'); }
function resetKurir() { setOptions(el.kurir, 'Pilih Kabupaten/Kota Terlebih Dahulu'); kalkulasiBiaya(); }
function addPickupOption() {
    setOptions(el.kurir, 'Pilih Layanan Kurir');
    appendOption(el.kurir, 'PICKUP_STORE', 'Ambil di Toko / Workshop (Gratis) - Rp 0');
    el.kurir.options[1].dataset.cost = '0';
}

function bindCheckoutEvents() {
    el.provinsi.addEventListener('change', async () => {
        const version = ++requestWilayahVersion;
        resetKabupaten(); resetKecamatan(); resetKelurahan(); resetKurir();
        const provinceId = el.provinsi.selectedOptions[0]?.dataset.id;
        if (!provinceId) return;
        try {
            const data = await fetchWilayah(`regencies/${encodeURIComponent(provinceId)}.json`);
            if (version !== requestWilayahVersion) return;
            data.forEach(item => appendOption(el.kabupaten, item.name, item.name, item.id));
        } catch (error) { window.alert(error.message); }
    });

    el.kabupaten.addEventListener('change', async () => {
        const version = ++requestWilayahVersion;
        resetKecamatan(); resetKelurahan(); setOptions(el.kurir, 'Memuat tarif pengiriman...');
        const selected = el.kabupaten.selectedOptions[0];
        const kabId = selected?.dataset.id;
        if (!kabId) { resetKurir(); return; }
        const destinationName = selected.value;
        const provinceName = el.provinsi.value;
        const qty = isCheckoutKeranjang ? 1 : Math.max(1, Number(el.jumlah?.value) || 1);
        const shippingPayload = isCheckoutKeranjang
            ? { mode: 'keranjang', destinationName, provinceName }
            : { mode: 'produk', id_produk: idProduk, jumlah: qty, destinationName, provinceName };
        try {
            const [districts, shipping] = await Promise.all([
                fetchWilayah(`districts/${encodeURIComponent(kabId)}.json`),
                requestJSON('/api/cek-ongkir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(shippingPayload) })
            ]);
            if (version !== requestWilayahVersion) return;
            districts.forEach(item => appendOption(el.kecamatan, item.name, item.name, item.id));
            setOptions(el.kurir, 'Pilih Layanan Kurir');
            if (shipping.status === 'success' && Array.isArray(shipping.data)) {
                shipping.data.forEach(item => {
                    const cost = Number(item.cost);
                    if (!Number.isFinite(cost) || cost < 0 || !item.code) return;
                    appendOption(el.kurir, item.code, `${item.courier || ''} ${item.service || ''} (${item.etd || '-'}) - ${formatRupiah(cost)}`.trim());
                    el.kurir.options[el.kurir.options.length - 1].dataset.cost = String(cost);
                });
            }
            if (el.kurir.options.length === 1) addPickupOption();
            kalkulasiBiaya();
        } catch (error) {
            console.error('Muat kecamatan/ongkir:', error);
            if (version === requestWilayahVersion) {
                addPickupOption();
                window.alert(`${error.message} Opsi ambil di toko tersedia sebagai alternatif.`);
            }
        }
    });

    el.kecamatan.addEventListener('change', async () => {
        resetKelurahan();
        const id = el.kecamatan.selectedOptions[0]?.dataset.id;
        if (!id) return;
        try {
            const data = await fetchWilayah(`villages/${encodeURIComponent(id)}.json`);
            data.forEach(item => appendOption(el.kelurahan, item.name, item.name, item.id));
        } catch (error) { window.alert(error.message); }
    });

    el.jumlah?.addEventListener('change', () => {
        kalkulasiBiaya();
        if (el.kabupaten.value) el.kabupaten.dispatchEvent(new Event('change'));
    });
    el.jumlah?.addEventListener('input', kalkulasiBiaya);
    el.kurir.addEventListener('change', kalkulasiBiaya);
    el.form.addEventListener('submit', submitCheckout);
}

function kalkulasiBiaya() {
    const qty = isCheckoutKeranjang ? 1 : Math.max(1, Number(el.jumlah?.value) || 1);
    const selected = el.kurir?.selectedOptions[0];
    const shipping = selected && selected.dataset.cost !== undefined ? Number(selected.dataset.cost) : 0;
    const subtotal = hargaSatuan * qty;
    const ongkir = Number.isFinite(shipping) && shipping >= 0 ? shipping : 0;
    const total = subtotal + ongkir;
    if (el.subtotal) el.subtotal.textContent = formatRupiah(subtotal);
    if (el.ongkir) el.ongkir.textContent = formatRupiah(ongkir);
    if (el.total) el.total.textContent = formatRupiah(total);
    if (el.form) {
        el.form.dataset.subtotal = String(subtotal);
        el.form.dataset.ongkir = String(ongkir);
        el.form.dataset.total = String(total);
    }
}
function buatAlamatLengkap() {
    const detail = el.detailAlamat?.value.trim() || '';
    const kelurahan = el.kelurahan.value;
    const kecamatan = el.kecamatan.value;
    const kabupaten = el.kabupaten.value;
    const provinsi = el.provinsi.value;
    const kodePos = el.kodePos?.value.trim() || '';
    if (!detail || !kelurahan || !kecamatan || !kabupaten || !provinsi || !kodePos) throw new Error('Lengkapi alamat, provinsi, kabupaten/kota, kecamatan, kelurahan/desa, dan kode pos.');
    return `${detail}, Kel. ${kelurahan}, Kec. ${kecamatan}, ${kabupaten}, Prov. ${provinsi}, Kode Pos: ${kodePos}`;
}
function buildWhatsAppMessage(data, alamat, metode) {
    const lines = [
        '*NOTA / KONFIRMASI PESANAN BARU*', '*PT Japa Prabu Disain*', '',
        '----------------------------------------'
    ];
    if (data.id_grup_pesanan) {
        lines.push(`ID Grup Checkout: ${data.id_grup_pesanan}`);
        lines.push('');
    }
    if (Array.isArray(data.items)) {
        lines.push('*DAFTAR PRODUK:*');
        data.items.forEach((item, index) => lines.push(
            `${index + 1}. *${item.nama_produk || 'Produk'}*`,
            `Harga Satuan: ${formatRupiah(item.harga_satuan)}`,
            `Jumlah: ${Number(item.jumlah) || 1}`,
            `Subtotal: ${formatRupiah(item.subtotal)}`,
            `Catatan: ${item.detail_ukuran || '-'}`,
            `ID Pesanan: ${item.id_pesanan || '-'}`
        ));
    } else {
        lines.push(`ID Pesanan: ${data.id_pesanan || '-'}`);
        lines.push(`Nama Produk: ${data.nama_produk || el.namaProduk?.value || '-'}`);
        lines.push(`Harga Satuan: ${formatRupiah(data.harga_satuan)}`);
        lines.push(`Jumlah: ${Number(data.jumlah) || 1}`);
        lines.push(`Detail Ukuran: ${el.detailUkuran?.value.trim() || '-'}`);
    }
    lines.push(
        '----------------------------------------', '*INFORMASI PENGIRIMAN*',
        `Kurir / Layanan: ${[data.ekspedisi, data.layanan_pengiriman].filter(Boolean).join(' ') || el.kurir.value}`,
        `Alamat Lengkap: ${alamat}`,
        '----------------------------------------', '*RINCIAN PEMBAYARAN*',
        `Subtotal Produk: ${formatRupiah(data.subtotal)}`,
        `Ongkos Kirim: ${formatRupiah(data.ongkir)}`,
        `Total Pembayaran: ${formatRupiah(data.total_harga)}`,
        `Metode Pembayaran: ${metode}`, '',
        'Mohon konfirmasi dan proses pesanan ini. Terima kasih!'
    );
    return lines.join('\n');
}
async function submitCheckout(event) {
    event.preventDefault();
    if (sedangMemproses || !el.form.reportValidity()) return;
    if (!el.kurir.value) { window.alert('Silakan pilih layanan kurir atau ambil di toko.'); return; }
    if (!el.metode?.value) { window.alert('Silakan pilih metode pembayaran.'); return; }
    let alamat;
    try { alamat = buatAlamatLengkap(); }
    catch (error) { window.alert(error.message); return; }

    const metode = el.metode.value;
    const destinationName = el.kabupaten.value;
    const provinceName = el.provinsi.value;
    const serviceCode = el.kurir.value;
    const buttonText = el.tombol?.textContent || 'Buat Pesanan';
    sedangMemproses = true;
    if (el.tombol) { el.tombol.disabled = true; el.tombol.textContent = 'Memproses Pesanan...'; }
    try {
        let result;
        if (isCheckoutKeranjang) {
            result = await requestJSON('/api/cart/checkout', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alamat_pengiriman: alamat, metode_pembayaran: metode, destinationName, provinceName, serviceCode })
            });
        } else {
            const jumlah = Number(el.jumlah.value);
            if (!Number.isSafeInteger(jumlah) || jumlah < 1) throw new Error('Jumlah pesanan harus berupa bilangan bulat minimal 1.');
            result = await requestJSON('/api/pesanan', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_produk: idProduk, jumlah, detail_ukuran: el.detailUkuran?.value.trim() || '', alamat_pengiriman: alamat, metode_pembayaran: metode, destinationName, provinceName, serviceCode })
            });
        }
        if (result.status !== 'success' || !result.data) throw new Error(result.message || 'Pesanan gagal disimpan.');
        const message = buildWhatsAppMessage(result.data, alamat, metode);
        window.alert('Pesanan berhasil disimpan ke sistem. Tekan OK untuk melanjutkan konfirmasi melalui WhatsApp.');
        window.location.href = `https://wa.me/${CHECKOUT_CONFIG.nomorWhatsApp}?text=${encodeURIComponent(message)}`;
    } catch (error) {
        console.error('Checkout:', error);
        window.alert(error.message || 'Terjadi kesalahan saat checkout.');
        sedangMemproses = false;
        if (el.tombol) { el.tombol.disabled = false; el.tombol.textContent = buttonText; }
    }
}