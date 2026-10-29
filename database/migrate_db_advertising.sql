-- MIGRASI DATABASE JAPA ADVERTISING YANG SUDAH ADA
-- Target: db_japa_advertising (sesuai back-end/.env)
-- Menambah kolom yang dipakai controller dan memindahkan data dari tabel products
-- lama ke tabel produk aktif. Tidak menghapus tabel atau data lama.

USE db_japa_advertising;
SET NAMES utf8mb4;

-- Selaraskan kolom detail pesanan dengan orderController.js.
ALTER TABLE pesanan
  ADD COLUMN IF NOT EXISTS detail_ukuran TEXT NULL AFTER id_produk;

-- Pertahankan data ukuran/catatan yang mungkin tersimpan pada kolom lama.
UPDATE pesanan
SET detail_ukuran = CONCAT_WS(' | ',
    IF(panjang_cm IS NOT NULL, CONCAT('Panjang: ', panjang_cm, ' cm'), NULL),
    IF(lebar_cm IS NOT NULL, CONCAT('Lebar: ', lebar_cm, ' cm'), NULL),
    IF(NULLIF(TRIM(catatan_desain), '') IS NOT NULL,
       CONCAT('Catatan desain: ', catatan_desain), NULL)
)
WHERE detail_ukuran IS NULL OR TRIM(detail_ukuran) = '';

UPDATE pesanan
SET detail_ukuran = 'Belum ada detail ukuran'
WHERE detail_ukuran IS NULL OR TRIM(detail_ukuran) = '';

ALTER TABLE pesanan MODIFY COLUMN detail_ukuran TEXT NOT NULL;

-- Pindahkan data produk lama ke tabel yang dipakai productController.js.
-- Produk yang namanya sudah ada tidak diduplikasi.
INSERT INTO produk (nama_produk, deskripsi, bahan, harga_estimasi, gambar_url)
SELECT p.name,
       p.description,
       CASE
         WHEN p.name LIKE '%Spanduk%' OR p.name LIKE '%Banner%' THEN 'Flexi 280gr'
         WHEN p.name LIKE '%Neon Box%' THEN 'Akrilik, rangka hollow, LED'
         ELSE NULL
       END,
       p.price,
       CASE
         WHEN p.image_url IS NULL OR TRIM(p.image_url) = '' THEN NULL
         WHEN p.image_url LIKE 'images/%' THEN p.image_url
         ELSE CONCAT('images/', p.image_url)
       END
FROM products AS p
WHERE NOT EXISTS (
  SELECT 1 FROM produk AS existing_produk
  WHERE existing_produk.nama_produk = p.name
);

-- Pastikan frontend lama (yang mengirim id_user=1) tidak gagal pada instalasi
-- kosong. INSERT IGNORE menjaga agar akun/data yang sudah ada tidak tertimpa.
INSERT IGNORE INTO users
  (id_user, nama_lengkap, email, password_hash, no_telp, role)
VALUES
  (1, 'Pelanggan Website', 'website-order@japa.local',
   '$2y$12$utW9G/Ewkwzjm1chFpAKIeLX5OGtaUUkWBUqj7s0oqq2xcdVRhE1m',
   NULL, 'pelanggan');

-- Catatan: jika tabel users.nama_lengkap sudah dipakai oleh authController,
-- query daftar pesanan telah diselaraskan ke kolom tersebut di orderController.js.
