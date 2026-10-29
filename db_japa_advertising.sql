-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 28 Okt 2026 pada 10.12
-- Versi server: 10.11.16-MariaDB
-- Versi PHP: 8.5.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Basis data: `db_japa_advertising`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `notifikasi`
--

CREATE TABLE `notifikasi` (
  `id_notifikasi` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `pesan` text NOT NULL,
  `tipe` varchar(50) DEFAULT 'success',
  `link_tab` varchar(50) DEFAULT 'pesanan',
  `target_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `tanggal` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `notifikasi`
--

INSERT INTO `notifikasi` (`id_notifikasi`, `id_user`, `pesan`, `tipe`, `link_tab`, `target_id`, `is_read`, `tanggal`) VALUES
(1, 3, '📦 Ada pesanan baru masuk dari pelanggan!', 'success', 'pesanan', 1, 1, '2026-10-28 05:33:06'),
(2, 3, '🔔 Status pesanan #1 berhasil diperbarui menjadi Diproses', 'success', 'pesanan', 1, 1, '2026-10-28 05:33:06'),
(3, 3, 'Pesanan baru #40 berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-28 06:08:48'),
(4, 3, 'Pesanan baru #41 berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-28 06:17:36'),
(5, 3, 'Pesanan \"Pylon Sign\" (#42) berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-28 07:06:50'),
(6, 3, 'Status pesanan \"Pylon Sign\" (#42) telah diperbarui menjadi: Diproses', 'success', 'pesanan', NULL, 1, '2026-10-28 07:09:26'),
(7, 3, 'Pesanan \"Visual Poster\" (#43) berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-28 07:10:23'),
(8, 3, 'Riwayat pesanan telah dihapus dari sistem.', 'info', 'pesanan', NULL, 1, '2026-10-28 07:23:13'),
(9, 3, 'Status pesanan \"Visual Poster\" telah diperbarui menjadi: Diproses', 'success', 'pesanan', NULL, 1, '2026-10-28 07:30:05'),
(10, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 0, '2026-10-28 08:51:04');

-- --------------------------------------------------------

--
-- Struktur dari tabel `pesanan`
--

CREATE TABLE `pesanan` (
  `id_pesanan` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_produk` int(11) NOT NULL,
  `detail_ukuran` text NOT NULL,
  `status` enum('Menunggu','Diproses','Selesai','Batal') NOT NULL DEFAULT 'Menunggu',
  `tanggal_pesan` timestamp NOT NULL DEFAULT current_timestamp(),
  `jumlah` int(11) DEFAULT 1,
  `ongkir` decimal(15,2) DEFAULT 0.00,
  `total_harga` decimal(15,2) DEFAULT 0.00,
  `alamat_pengiriman` text DEFAULT NULL,
  `metode_pembayaran` varchar(100) DEFAULT 'Transfer Bank'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `pesanan`
--

INSERT INTO `pesanan` (`id_pesanan`, `id_user`, `id_produk`, `detail_ukuran`, `status`, `tanggal_pesan`, `jumlah`, `ongkir`, `total_harga`, `alamat_pengiriman`, `metode_pembayaran`) VALUES
(32, 3, 19, 'eweq', 'Menunggu', '2026-10-28 02:19:33', 4, 220000.00, 360000.00, 'ss, Kel. BALAI AGUNG, Kec. SUNGAI TEBELIAN, KABUPATEN SINTANG, Prov. KALIMANTAN BARAT - Kode Pos: 78611', 'Transfer Bank BCA'),
(33, 3, 19, 'ssss', 'Menunggu', '2026-10-28 05:14:20', 1, 55000.00, 90000.00, 'sss, Kel. KANDIS KOTA, Kec. KANDIS, KABUPATEN S I A K, Prov. RIAU - Kode Pos: 78611', 'Transfer Bank BCA'),
(34, 3, 16, 'asdas', 'Menunggu', '2026-10-28 05:20:29', 1, 35000.00, 70000.00, 'dasdas, Kel. MARENGMANG, Kec. KALIJATI, KABUPATEN SUBANG, Prov. JAWA BARAT - Kode Pos: 78611', 'Transfer Bank BCA'),
(35, 3, 19, 'sadas', 'Menunggu', '2026-10-28 05:27:38', 1, 35000.00, 70000.00, 'dsad, Kel. BANDUNG, Kec. PLAYEN, KABUPATEN GUNUNG KIDUL, Prov. DI YOGYAKARTA - Kode Pos: 78611', 'Transfer Bank BCA'),
(36, 3, 19, 'sdas', 'Menunggu', '2026-10-28 05:35:48', 1, 55000.00, 90000.00, 'sada, Kel. AUR GADING, Kec. BATIN XXIV, KABUPATEN BATANG HARI, Prov. JAMBI - Kode Pos: 78611', 'Transfer Bank BCA'),
(37, 3, 19, 'asda', 'Menunggu', '2026-10-28 05:37:33', 1, 35000.00, 70000.00, 'asda, Kel. JETAK, Kec. SIDOHARJO, KABUPATEN SRAGEN, Prov. JAWA TENGAH - Kode Pos: 78611', 'Transfer Bank BCA'),
(38, 3, 18, 'fdsfds', 'Diproses', '2026-10-28 05:38:10', 1, 95000.00, 130000.00, 'fdsfs, Kel. SUNGAI GADING, Kec. SELAGAN RAYA, KABUPATEN MUKOMUKO, Prov. BENGKULU - Kode Pos: 78611', 'Transfer Bank BCA'),
(39, 3, 19, 'asdas', 'Diproses', '2026-10-28 05:55:57', 1, 55000.00, 90000.00, 'asdas, Kel. BETUNG, Kec. PANGKALAN KURAS, KABUPATEN PELALAWAN, Prov. RIAU - Kode Pos: 78611', 'Transfer Bank BCA'),
(40, 3, 19, 'dasdsa', 'Menunggu', '2026-10-28 06:08:48', 1, 55000.00, 90000.00, 'sada, Kel. JANGGA BARU, Kec. BATIN XXIV, KABUPATEN BATANG HARI, Prov. JAMBI - Kode Pos: 78611', 'Transfer Bank BCA'),
(41, 3, 19, 'asdsa', 'Menunggu', '2026-10-28 06:17:36', 1, 95000.00, 130000.00, 'asda, Kel. SUNGAI DAENG, Kec. MENTOK, KABUPATEN BANGKA BARAT, Prov. KEPULAUAN BANGKA BELITUNG - Kode Pos: 78611', 'Transfer Bank BCA'),
(42, 3, 15, 'dfsdfs', 'Diproses', '2026-10-28 07:06:50', 1, 55000.00, 90000.00, 'fdsfdsf, Kel. LUBUK OGUNG, Kec. BANDAR SEIKIJANG, KABUPATEN PELALAWAN, Prov. RIAU - Kode Pos: 78611', 'Transfer Bank BCA'),
(44, 3, 19, 'dfdsf', 'Menunggu', '2026-10-28 08:51:04', 1, 35000.00, 70000.00, 'fdsfds, Kel. TEGALDOWO, Kec. GEMOLONG, KABUPATEN SRAGEN, Prov. JAWA TENGAH - Kode Pos: 78611', 'Transfer Bank BCA');

-- --------------------------------------------------------

--
-- Struktur dari tabel `produk`
--

CREATE TABLE `produk` (
  `id_produk` int(11) NOT NULL,
  `nama_produk` varchar(150) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `bahan` varchar(100) DEFAULT NULL,
  `harga_estimasi` decimal(12,2) NOT NULL DEFAULT 0.00,
  `gambar_url` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `berat` int(11) DEFAULT 1000
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `produk`
--

INSERT INTO `produk` (`id_produk`, `nama_produk`, `deskripsi`, `bahan`, `harga_estimasi`, `gambar_url`, `created_at`, `berat`) VALUES
(5, 'Acrylic Laser', '', '', 35000.00, 'images/1793150794702-WhatsApp-Image-2026-10-27-at-17.38.32-(10).jpeg', '2026-10-28 01:26:34', 1000),
(6, 'Billboard', '', '', 35000.00, '[\"images/1793153365164-WhatsApp-Image-2026-10-27-at-17.38.32-(24).jpeg\",\"images/1793153365167-WhatsApp-Image-2026-10-27-at-17.38.33-(10).jpeg\"]', '2026-10-28 01:27:16', 1000),
(7, 'Cutting Sticker', '', '', 35000.00, 'images/1793150870911-WhatsApp-Image-2026-10-27-at-17.38.32-(19).jpeg', '2026-10-28 01:27:50', 1000),
(8, 'Huruf Timbul Acrylic', '', 'Akrilic', 35000.00, '[\"images/1793164081291-WhatsApp-Image-2026-10-27-at-17.38.32-(1).jpeg\",\"images/1793164081294-WhatsApp-Image-2026-10-27-at-17.38.32-(6).jpeg\",\"images/1793164081295-WhatsApp-Image-2026-10-27-at-17.38.32-(26).jpeg\",\"images/1793164081298-WhatsApp-Image-2026-10-27-at-17.38.32-(28).jpeg\",\"images/1793164081304-WhatsApp-Image-2026-10-27-at-17.38.34-(3).jpeg\"]', '2026-10-28 02:11:01', 1000),
(9, 'Huruf Timbul Galvanis', '', '', 35000.00, '[\"images/1793153562093-WhatsApp-Image-2026-10-27-at-17.38.32-(3).jpeg\",\"images/1793153562094-WhatsApp-Image-2026-10-27-at-17.38.32-(7).jpeg\",\"images/1793153562095-WhatsApp-Image-2026-10-27-at-17.38.32-(9).jpeg\",\"images/1793153562097-WhatsApp-Image-2026-10-27-at-17.38.32-(14).jpeg\",\"images/1793153562098-WhatsApp-Image-2026-10-27-at-17.38.33.jpeg\"]', '2026-10-28 02:12:42', 1000),
(10, 'Huruf Timbul Stainless', '', '', 35000.00, '[\"images/1793153591645-WhatsApp-Image-2026-10-27-at-17.38.32-(11).jpeg\",\"images/1793153591650-WhatsApp-Image-2026-10-27-at-17.38.32-(23).jpeg\",\"images/1793153591656-WhatsApp-Image-2026-10-27-at-17.38.33-(7).jpeg\"]', '2026-10-28 02:13:11', 1000),
(11, 'Letter Box', '', '', 35000.00, '[\"images/1793153653945-WhatsApp-Image-2026-10-27-at-17.38.32-(2).jpeg\",\"images/1793153653947-WhatsApp-Image-2026-10-27-at-17.38.32-(13).jpeg\",\"images/1793153653950-WhatsApp-Image-2026-10-27-at-17.38.32-(15).jpeg\"]', '2026-10-28 02:14:13', 1000),
(12, 'Neon Box', '', '', 35000.00, '[\"images/1793153687286-WhatsApp-Image-2026-10-27-at-17.38.32-(17).jpeg\",\"images/1793153687290-WhatsApp-Image-2026-10-27-at-17.38.32-(18).jpeg\",\"images/1793153687294-WhatsApp-Image-2026-10-27-at-17.38.32-(21).jpeg\",\"images/1793153687304-WhatsApp-Image-2026-10-27-at-17.38.33-(1).jpeg\",\"images/1793153687311-WhatsApp-Image-2026-10-27-at-17.38.33-(3).jpeg\"]', '2026-10-28 02:14:47', 1000),
(13, 'Neon Flix', '', '', 35000.00, '[\"images/1793153752680-WhatsApp-Image-2026-10-27-at-17.38.32-(25).jpeg\",\"images/1793153752685-WhatsApp-Image-2026-10-27-at-17.38.33-(8).jpeg\",\"images/1793153752688-WhatsApp-Image-2026-10-27-at-17.38.33-(9).jpeg\"]', '2026-10-28 02:15:52', 1000),
(14, 'Pole Sign', '', '', 35000.00, '[\"images/1793153775864-WhatsApp-Image-2026-10-27-at-17.38.32-(16).jpeg\",\"images/1793153775866-WhatsApp-Image-2026-10-27-at-17.38.32.jpeg\",\"images/1793153775873-WhatsApp-Image-2026-10-27-at-17.38.33-(5).jpeg\",\"images/1793153775881-WhatsApp-Image-2026-10-27-at-17.38.33-(6).jpeg\"]', '2026-10-28 02:16:15', 1000),
(15, 'Pylon Sign', '', '', 35000.00, '[\"images/1793153813424-WhatsApp-Image-2026-10-27-at-17.38.32-(5).jpeg\",\"images/1793153813428-WhatsApp-Image-2026-10-27-at-17.38.33-(2).jpeg\",\"images/1793153813433-WhatsApp-Image-2026-10-27-at-17.38.33-(4).jpeg\",\"images/1793153813439-WhatsApp-Image-2026-10-27-at-17.38.34-(1).jpeg\"]', '2026-10-28 02:16:53', 1000),
(16, 'Rambu Rambu', '', '', 35000.00, '[\"images/1793164876823-WhatsApp-Image-2026-10-27-at-17.38.32-(22).jpeg\"]', '2026-10-28 02:17:20', 1000),
(17, 'Sign Custom', '', '', 35000.00, '[\"images/1793153858729-WhatsApp-Image-2026-10-27-at-17.38.32.jpeg\",\"images/1793153858734-WhatsApp-Image-2026-10-27-at-17.38.33-(11).jpeg\"]', '2026-10-28 02:17:38', 1000),
(18, 'Sign Petunjuk', '', '', 35000.00, '[\"images/1793153877318-WhatsApp-Image-2026-10-27-at-21.00.02.jpeg\"]', '2026-10-28 02:17:57', 1000),
(19, 'Visual Poster', '', 'Poster', 35000.00, '[\"images/1793153894528-WhatsApp-Image-2026-10-27-at-21.02.03.jpeg\"]', '2026-10-28 02:18:14', 1000);

-- --------------------------------------------------------

--
-- Struktur dari tabel `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('8DuVE6W4TzOmDTHXrfEQA3apLBIF0sK-', 1793263864, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-10-29T08:35:38.573Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":3,\"role\":\"pelanggan\",\"nama\":\"DAHLAN\"}'),
('Cf42Al81SI5EjoqKfTtweAImwzGrCaC7', 1793265132, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-10-29T08:42:00.482Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":2,\"role\":\"admin\",\"nama\":\"Admin\"}'),
('N8ovTVNZGAkkKGnC0YBnD_ic76KdFjqq', 1793262939, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-10-29T08:35:38.503Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":3,\"role\":\"pelanggan\",\"nama\":\"DAHLAN\"}'),
('Ve36R2cNt1IVqEK-BXuGzD4TDDyygmKL', 1793178844, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-10-28T09:14:03.807Z\",\"httpOnly\":true,\"path\":\"/\"},\"userId\":3,\"role\":\"pelanggan\",\"nama\":\"DAHLAN\"}'),
('be4Ksk_ptEdtXS6N4aZtOOt2CD_3bzgJ', 1793242384, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-10-29T02:18:39.566Z\",\"httpOnly\":true,\"path\":\"/\"},\"userId\":3,\"role\":\"pelanggan\",\"nama\":\"DAHLAN\"}'),
('epcpZuc0SnfihmXX9BByQH5C0IDtYFL7', 1793178675, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-10-28T08:57:46.322Z\",\"httpOnly\":true,\"path\":\"/\"},\"userId\":3,\"role\":\"pelanggan\",\"nama\":\"DAHLAN\"}'),
('qBudiZOCQ5X8QEnkL47EV5JXBk9fImtX', 1793258533, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-10-29T07:22:13.378Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":3,\"role\":\"pelanggan\",\"nama\":\"DAHLAN\"}'),
('uq8hRyGOVJnOy2WAQP1-JMWmdLgycvA0', 1793186888, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-10-28T11:25:49.658Z\",\"httpOnly\":true,\"path\":\"/\"},\"userId\":3,\"role\":\"pelanggan\",\"nama\":\"DAHLAN\"}');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id_user` int(11) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `no_telp` varchar(20) DEFAULT NULL,
  `role` enum('pelanggan','admin') NOT NULL DEFAULT 'pelanggan',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `alamat` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id_user`, `nama_lengkap`, `email`, `password_hash`, `no_telp`, `role`, `created_at`, `alamat`) VALUES
(2, 'Admin', 'admin@japa.com', '$2b$10$5pOgQDx2D9DBSR.dSgx1XOLSRODdxHZIggjvInKpC3cNOxsT4PZG2', NULL, 'admin', '2026-10-24 10:41:50', NULL),
(3, 'DAHLAN', 'dahlansintang@gmail.com', '$2b$10$uNhT/K4IhP4JFovpInNlsew1rYEy0ghnRHgbZfeN161lI.ElNlVua', '085750299097', 'pelanggan', '2026-10-24 12:53:52', 'DUSUN TUNAS JAYA');

--
-- Indeks untuk tabel yang dibuang
--

--
-- Indeks untuk tabel `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD PRIMARY KEY (`id_notifikasi`);

--
-- Indeks untuk tabel `pesanan`
--
ALTER TABLE `pesanan`
  ADD PRIMARY KEY (`id_pesanan`),
  ADD KEY `idx_pesanan_user` (`id_user`),
  ADD KEY `idx_pesanan_produk` (`id_produk`),
  ADD KEY `idx_pesanan_tanggal` (`tanggal_pesan`);

--
-- Indeks untuk tabel `produk`
--
ALTER TABLE `produk`
  ADD PRIMARY KEY (`id_produk`),
  ADD KEY `idx_produk_nama` (`nama_produk`);

--
-- Indeks untuk tabel `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `uq_users_email` (`email`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `notifikasi`
--
ALTER TABLE `notifikasi`
  MODIFY `id_notifikasi` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT untuk tabel `pesanan`
--
ALTER TABLE `pesanan`
  MODIFY `id_pesanan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT untuk tabel `produk`
--
ALTER TABLE `produk`
  MODIFY `id_produk` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `pesanan`
--
ALTER TABLE `pesanan`
  ADD CONSTRAINT `fk_pesanan_produk` FOREIGN KEY (`id_produk`) REFERENCES `produk` (`id_produk`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pesanan_user` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
