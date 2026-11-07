'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '../..');
const files = [
  'front-end/js/admin.js',
  'front-end/js/admin-profile.js',
  'front-end/js/checkout.js'
];
let failed = 0;
function check(condition, label) {
  console.log(`${condition ? 'LULUS' : 'GAGAL'} - ${label}`);
  if (!condition) failed++;
}
for (const relative of files) {
  const full = path.join(root, relative);
  check(fs.existsSync(full), `File tersedia: ${relative}`);
  if (!fs.existsSync(full)) continue;
  const syntax = spawnSync(process.execPath, ['--check', full], { encoding: 'utf8' });
  check(syntax.status === 0, `Sintaks JavaScript: ${relative}`);
  if (syntax.status !== 0) process.stderr.write(syntax.stderr || syntax.stdout);
}
const admin = fs.readFileSync(path.join(root, files[0]), 'utf8');
const profile = fs.readFileSync(path.join(root, files[1]), 'utf8');
const checkout = fs.readFileSync(path.join(root, files[2]), 'utf8');
check(admin.includes("'/api/admin/pesanan'") && admin.includes("'/api/admin/produk'"), 'Admin menggunakan endpoint pesanan dan produk proyek');
check(!/tanggalRaw\.substring\(0,\s*16\)|groupedOrdersMap/.test(admin), 'Tidak menggabungkan pesanan berdasarkan nama/waktu');
check(admin.includes('textContent') && !admin.includes('innerHTML = `'), 'Data dinamis dashboard tidak disisipkan melalui template innerHTML');
check(profile.includes("'/api/admin/profile'") && profile.includes('alamat: currentAddress'), 'Profil menggunakan endpoint dan mempertahankan alamat lama');
check(checkout.includes("'/api/cart/checkout'") && checkout.includes("'/api/pesanan'") && checkout.includes("'/api/cek-ongkir'"), 'Checkout memakai endpoint backend yang tersedia');
check(checkout.includes('Number.isSafeInteger(jumlah)'), 'Jumlah checkout divalidasi sebagai integer positif');
const adminHtml = fs.readFileSync(path.join(root, 'front-end/pages/admin.html'), 'utf8');
const profileHtml = fs.readFileSync(path.join(root, 'front-end/pages/admin-profile.html'), 'utf8');
const checkoutHtml = fs.readFileSync(path.join(root, 'front-end/pages/checkout.html'), 'utf8');
for (const [html, ids, label] of [
  [adminHtml, ['table-body','admin-catalog-grid','customer-table-body','notificationList','notifBadge','addProductForm','editProductForm','btnLogout'], 'admin.html'],
  [profileHtml, ['profileForm','nama_lengkap','email','no_telp','password_lama','password_baru','alert-box'], 'admin-profile.html'],
  [checkoutHtml, ['checkoutForm','jumlah','provinsi','kabupaten','kecamatan','kelurahan','layanan_kurir','metode_pembayaran','btnSubmit'], 'checkout.html']
]) {
  check(ids.every(id => new RegExp(`id=["']${id}["']`).test(html)), `Elemen penting HTML tersedia: ${label}`);
}
console.log(`\nHasil: ${failed ? `${failed} pemeriksaan gagal` : 'seluruh pemeriksaan statis lulus'}.`);
process.exitCode = failed ? 1 : 0;
