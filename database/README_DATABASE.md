# Database Japa Advertising

## Berkas database yang benar

- `db_advertising.sql`: skema instalasi baru untuk `db_japa_advertising`.
- `database/migrate_db_advertising.sql`: migrasi database lama; mempertahankan tabel dan data lama, menambahkan `pesanan.detail_ukuran`, lalu menyalin produk dari tabel lama `products` ke tabel aktif `produk`.

**Jangan impor kedua berkas sekaligus.** Untuk database yang sudah berisi data, backup database terlebih dahulu lalu jalankan berkas migrasi saja. Untuk instalasi baru, jalankan `db_advertising.sql`.

## Penyesuaian kode

- `orderController.js` kini memakai `users.nama_lengkap`, sesuai skema `users`.
- `authController.js` memverifikasi `password_hash` menggunakan `bcrypt.compare`, sehingga isi `password_hash` harus berupa hash bcrypt, bukan password teks biasa.

## Membuat akun admin

Skema tidak menanam password admin bawaan. Dari direktori `back-end`, buat hash password dengan bcrypt:

```bash
node -e "require('bcrypt').hash('GANTI_DENGAN_PASSWORD_KUAT', 12).then(console.log)"
```

Salin hash yang dihasilkan, kemudian jalankan SQL berikut dengan nilai yang Anda tentukan sendiri:

```sql
INSERT INTO users (nama_lengkap, email, password_hash, role)
VALUES ('Admin Japa', 'admin@domain-anda.id', 'TEMPEL_HASH_BCRYPT_DI_SINI', 'admin');
```

Ganti contoh email dan hash dengan nilai milik Anda. Jangan memakai password contoh secara langsung.

## Catatan penting

Frontend saat ini mengirim `id_user = 1` untuk pesanan pelanggan. SQL menyediakan pelanggan sementara hanya jika ID 1 belum digunakan. Untuk pemakaian produksi, alur ini sebaiknya diganti dengan formulir data pelanggan atau autentikasi pelanggan, agar pesanan tidak selalu diatribusikan ke satu akun.
