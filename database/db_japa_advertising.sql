-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 02 Nov 2026 pada 06.16
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
-- Struktur dari tabel `keranjang`
--

CREATE TABLE `keranjang` (
  `id_keranjang` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_produk` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL DEFAULT 1,
  `detail_ukuran` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

-- --------------------------------------------------------

--
-- Struktur dari tabel `pesanan`
--

CREATE TABLE `pesanan` (
  `id_pesanan` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_produk` int(11) NOT NULL,
  `detail_ukuran` text NOT NULL,
  `status` enum('Menunggu','Diproses','Dikirim','Selesai','Batal') NOT NULL DEFAULT 'Menunggu',
  `tanggal_pesan` timestamp NOT NULL DEFAULT current_timestamp(),
  `jumlah` int(11) DEFAULT 1,
  `ongkir` decimal(15,2) DEFAULT 0.00,
  `total_harga` decimal(15,2) DEFAULT 0.00,
  `alamat_pengiriman` text DEFAULT NULL,
  `metode_pembayaran` varchar(100) DEFAULT 'Transfer Bank',
  `harga_satuan` decimal(12,2) DEFAULT NULL,
  `ekspedisi` varchar(50) DEFAULT NULL,
  `layanan_pengiriman` varchar(100) DEFAULT NULL,
  `kota_tujuan` varchar(150) DEFAULT NULL,
  `provinsi_tujuan` varchar(150) DEFAULT NULL,
  `kode_layanan` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(5, 'Acrylic Laser', 'Finishing warna cat duco', 'Acrylic 2 mm/3 mm/5 mm (sesuai permintaan)', 200000.00, 'images/1793150794702-WhatsApp-Image-2026-10-27-at-17.38.32-(10).jpeg', '2026-10-28 01:26:34', 1000),
(6, 'Billboard', '- Kontruksi Rangka hollow 3x3\r\n- List alumunium ', 'ACP/Flexy Fronlite', 200000.00, '[\"images/1793153365164-WhatsApp-Image-2026-10-27-at-17.38.32-(24).jpeg\",\"images/1793153365167-WhatsApp-Image-2026-10-27-at-17.38.33-(10).jpeg\"]', '2026-10-28 01:27:16', 1000),
(7, 'Cutting Sticker', '', 'Sticker Oracal 651', 200000.00, 'images/1793150870911-WhatsApp-Image-2026-10-27-at-17.38.32-(19).jpeg', '2026-10-28 01:27:50', 1000),
(8, 'Huruf Timbul Acrylic', '- Warna Finishing cutting sticker oracal\r\n- Bagian belakang PVC/plat galvanis\r\n- Penerangan led module (jika huruf menyala)', 'Acrylic Susu 3 mm', 1000000.00, '[\"images/1793164081291-WhatsApp-Image-2026-10-27-at-17.38.32-(1).jpeg\",\"images/1793164081294-WhatsApp-Image-2026-10-27-at-17.38.32-(6).jpeg\",\"images/1793164081295-WhatsApp-Image-2026-10-27-at-17.38.32-(26).jpeg\",\"images/1793164081298-WhatsApp-Image-2026-10-27-at-17.38.32-(28).jpeg\",\"images/1793164081304-WhatsApp-Image-2026-10-27-at-17.38.34-(3).jpeg\"]', '2026-10-28 02:11:01', 1000),
(9, 'Huruf Timbul Galvanis', '- warna finishing cat duco glossy/doff\r\n- Penerangan led module (jika huruf menyala) ', 'Plat Galvanis', 1000000.00, '[\"images/1793153562093-WhatsApp-Image-2026-10-27-at-17.38.32-(3).jpeg\",\"images/1793153562094-WhatsApp-Image-2026-10-27-at-17.38.32-(7).jpeg\",\"images/1793153562095-WhatsApp-Image-2026-10-27-at-17.38.32-(9).jpeg\",\"images/1793153562097-WhatsApp-Image-2026-10-27-at-17.38.32-(14).jpeg\",\"images/1793153562098-WhatsApp-Image-2026-10-27-at-17.38.33.jpeg\"]', '2026-10-28 02:12:42', 1000),
(10, 'Huruf Timbul Stainless', 'Penerangan led module (jika huruf menyala) ', 'Stainless Mirror/Hairline', 1000000.00, '[\"images/1793153591645-WhatsApp-Image-2026-10-27-at-17.38.32-(11).jpeg\",\"images/1793153591650-WhatsApp-Image-2026-10-27-at-17.38.32-(23).jpeg\",\"images/1793153591656-WhatsApp-Image-2026-10-27-at-17.38.33-(7).jpeg\"]', '2026-10-28 02:13:11', 1000),
(11, 'Letter Box', '- Warna Finishing cutting sticker oracal\r\n- Bagian belakang PVC/plat galvanis\r\n- Penerangan led module (jika huruf menyala) ', 'Acrylic Susu 3 mm', 1000000.00, '[\"images/1793153653945-WhatsApp-Image-2026-10-27-at-17.38.32-(2).jpeg\",\"images/1793153653947-WhatsApp-Image-2026-10-27-at-17.38.32-(13).jpeg\",\"images/1793153653950-WhatsApp-Image-2026-10-27-at-17.38.32-(15).jpeg\"]', '2026-10-28 02:14:13', 1000),
(12, 'Neon Box', '- Kontruksi rangka hollow 3x3\r\n- Frame plat galvanis finishing cat\r\n- Dasar acrylic/flexy  (sesuai ukuran/permintaan)\r\n- Media  sticker digital printing/cutting sticker\r\n- Penerangan TL Led\r\n- Tiang pipa sesuai kebutuhan (jika dibutuhkan) ', '', 1000000.00, '[\"images/1793153687286-WhatsApp-Image-2026-10-27-at-17.38.32-(17).jpeg\",\"images/1793153687290-WhatsApp-Image-2026-10-27-at-17.38.32-(18).jpeg\",\"images/1793153687294-WhatsApp-Image-2026-10-27-at-17.38.32-(21).jpeg\",\"images/1793153687304-WhatsApp-Image-2026-10-27-at-17.38.33-(1).jpeg\",\"images/1793153687311-WhatsApp-Image-2026-10-27-at-17.38.33-(3).jpeg\"]', '2026-10-28 02:14:47', 1000),
(13, 'Neon Flix', '- Dasar acrylic bening 3mm\r\n- Led flix', '', 500000.00, '[\"images/1793153752680-WhatsApp-Image-2026-10-27-at-17.38.32-(25).jpeg\",\"images/1793153752685-WhatsApp-Image-2026-10-27-at-17.38.33-(8).jpeg\",\"images/1793153752688-WhatsApp-Image-2026-10-27-at-17.38.33-(9).jpeg\"]', '2026-10-28 02:15:52', 1000),
(14, 'Pole Sign', '- Kontruksi hollow 3x3\r\n- Frame plat galvanis finishing cat\r\n- Dasar flexy colybrite polos finishing cutting\r\nsticker/dasar backlite digital printing\r\n- Penerangan TL Led\r\n- Pondasi cor tanam/angkur (sesuai kebutuhan)\r\n- Tiang pipa  4’’\r\n-  proporsi', '', 5000000.00, '[\"images/1793153775864-WhatsApp-Image-2026-10-27-at-17.38.32-(16).jpeg\",\"images/1793153775866-WhatsApp-Image-2026-10-27-at-17.38.32.jpeg\",\"images/1793153775873-WhatsApp-Image-2026-10-27-at-17.38.33-(5).jpeg\",\"images/1793153775881-WhatsApp-Image-2026-10-27-at-17.38.33-(6).jpeg\"]', '2026-10-28 02:16:15', 1000),
(15, 'Pylon Sign', '- Kontruksi hollow 3x3\r\n- Dasar ACP Decobond\r\n- Acrylic susu 3mm \r\n- Penerangan TL Led (jika menyala)\r\n- Dasar warna di cat (sesuai permintaan)\r\n- Tiang pipa\r\n- Dasar pondasi cor tanam', '', 10000000.00, '[\"images/1793153813424-WhatsApp-Image-2026-10-27-at-17.38.32-(5).jpeg\",\"images/1793153813428-WhatsApp-Image-2026-10-27-at-17.38.33-(2).jpeg\",\"images/1793153813433-WhatsApp-Image-2026-10-27-at-17.38.33-(4).jpeg\",\"images/1793153813439-WhatsApp-Image-2026-10-27-at-17.38.34-(1).jpeg\"]', '2026-10-28 02:16:53', 1000),
(16, 'Rambu Rambu', '- Tiang pipa umumnya 2’’ finishing cat\r\n- Dasar plat galvanis\r\n- Media sticker transign ', '', 500000.00, '[\"images/1793164876823-WhatsApp-Image-2026-10-27-at-17.38.32-(22).jpeg\"]', '2026-10-28 02:17:20', 1000),
(17, 'Sign Custom', 'Penerangan Led Module', 'Acrylic Susu', 1000000.00, '[\"images/1793153858729-WhatsApp-Image-2026-10-27-at-17.38.32.jpeg\",\"images/1793153858734-WhatsApp-Image-2026-10-27-at-17.38.33-(11).jpeg\"]', '2026-10-28 02:17:38', 1000),
(18, 'Sign Petunjuk', 'Media finishing sticker', 'Acrylic 3 mm', 200000.00, '[\"images/1793153877318-WhatsApp-Image-2026-10-27-at-21.00.02.jpeg\"]', '2026-10-28 02:17:57', 1000),
(19, 'Visual Poster', '- Kontruksi Rangka hollow 3x3\r\n- List alumunium/kayu ', 'Flexy Fronlite Digital Printing', 200000.00, '[\"images/1793153894528-WhatsApp-Image-2026-10-27-at-21.02.03.jpeg\"]', '2026-10-28 02:18:14', 5000);

-- --------------------------------------------------------

--
-- Struktur dari tabel `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(1, 'Admin', 'admin@japa.com', '$2b$10$5pOgQDx2D9DBSR.dSgx1XOLSRODdxHZIggjvInKpC3cNOxsT4PZG2', NULL, 'admin', '2026-10-24 10:41:50', NULL);

--
-- Indeks untuk tabel yang dibuang
--

--
-- Indeks untuk tabel `keranjang`
--
ALTER TABLE `keranjang`
  ADD PRIMARY KEY (`id_keranjang`),
  ADD KEY `id_user` (`id_user`),
  ADD KEY `id_produk` (`id_produk`);

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
-- AUTO_INCREMENT untuk tabel `keranjang`
--
ALTER TABLE `keranjang`
  MODIFY `id_keranjang` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=127;

--
-- AUTO_INCREMENT untuk tabel `notifikasi`
--
ALTER TABLE `notifikasi`
  MODIFY `id_notifikasi` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `pesanan`
--
ALTER TABLE `pesanan`
  MODIFY `id_pesanan` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `produk`
--
ALTER TABLE `produk`
  MODIFY `id_produk` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `keranjang`
--
ALTER TABLE `keranjang`
  ADD CONSTRAINT `keranjang_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE,
  ADD CONSTRAINT `keranjang_ibfk_2` FOREIGN KEY (`id_produk`) REFERENCES `produk` (`id_produk`) ON DELETE CASCADE;

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
