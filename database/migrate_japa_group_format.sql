-- JAPA Advertising: ID grup checkout JAPA-YYYYMMDD-NNNN.
-- Jalankan SEKALI (aman dijalankan ulang) di database db_japa_advertising.
-- Tidak mengubah/menghapus isi tabel pesanan atau ID grup UUID yang lama.
-- Prasyarat: kolom pesanan.id_grup_pesanan sudah ada dari migrasi sebelumnya.

CREATE TABLE IF NOT EXISTS `checkout_group_counter` (
    `tanggal` DATE NOT NULL,
    `nomor_terakhir` INT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (`tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jika pernah ada transaksi format JAPA sebelumnya, lanjutkan dari nomor
-- tertinggi tiap tanggal agar migrasi ulang tidak mengulang nomor yang sama.
INSERT INTO `checkout_group_counter` (`tanggal`, `nomor_terakhir`)
SELECT
    STR_TO_DATE(SUBSTRING(p.`id_grup_pesanan`, 6, 8), '%Y%m%d') AS `tanggal`,
    MAX(CAST(SUBSTRING(p.`id_grup_pesanan`, 15, 4) AS UNSIGNED)) AS `nomor_terakhir`
FROM `pesanan` p
WHERE p.`id_grup_pesanan` REGEXP '^JAPA-[0-9]{8}-[0-9]{4}$'
  AND STR_TO_DATE(SUBSTRING(p.`id_grup_pesanan`, 6, 8), '%Y%m%d') IS NOT NULL
GROUP BY STR_TO_DATE(SUBSTRING(p.`id_grup_pesanan`, 6, 8), '%Y%m%d')
ON DUPLICATE KEY UPDATE
    `nomor_terakhir` = GREATEST(`nomor_terakhir`, VALUES(`nomor_terakhir`));

-- Pemeriksaan:
-- SELECT * FROM checkout_group_counter ORDER BY tanggal DESC;
-- SELECT id_grup_pesanan, COUNT(*) AS jumlah_item, SUM(total_harga) AS total
-- FROM pesanan WHERE id_grup_pesanan IS NOT NULL
-- GROUP BY id_grup_pesanan ORDER BY MAX(tanggal_pesan) DESC;
