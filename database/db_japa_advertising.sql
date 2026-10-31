-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 31 Okt 2026 pada 11.44
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
(10, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-28 08:51:04'),
(11, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-29 05:20:49'),
(12, 3, 'Pesanan \"Sign Petunjuk\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 46, 1, '2026-10-29 05:52:54'),
(13, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 47, 1, '2026-10-29 07:49:26'),
(14, 9, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 48, 0, '2026-10-29 08:20:17'),
(15, 3, 'Status pesanan \"Visual Poster\" telah diperbarui menjadi: Batal.', 'info', 'pesanan', 39, 1, '2026-10-29 08:21:38'),
(16, 9, 'Status pesanan \"Visual Poster\" telah diperbarui menjadi: Batal.', 'info', 'pesanan', 48, 0, '2026-10-29 09:05:53'),
(17, 9, 'Status pesanan \"Visual Poster\" telah diperbarui menjadi: Diproses.', 'success', 'pesanan', 48, 1, '2026-10-29 09:06:00'),
(18, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 49, 1, '2026-10-29 09:19:00'),
(19, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 50, 1, '2026-10-29 13:47:53'),
(20, 3, 'Status pesanan \"Visual Poster\" telah diperbarui menjadi: Batal.', 'info', 'pesanan', 49, 1, '2026-10-29 13:50:59'),
(21, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 47, 1, '2026-10-29 13:51:10'),
(22, 3, 'Pesanan \"Sign Petunjuk\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 51, 1, '2026-10-29 13:53:55'),
(23, 3, 'Status pesanan \"Sign Petunjuk\" telah diperbarui menjadi: Diproses.', 'success', 'pesanan', 51, 1, '2026-10-29 13:55:17'),
(24, 3, 'Status pesanan \"Sign Petunjuk\" telah diperbarui menjadi: Selesai.', 'success', 'pesanan', 51, 1, '2026-10-29 13:55:20'),
(25, 3, 'Status pesanan \"Sign Petunjuk\" telah diperbarui menjadi: Diproses.', 'success', 'pesanan', 51, 1, '2026-10-29 13:55:22'),
(26, 3, 'Status pesanan \"Sign Petunjuk\" telah diperbarui menjadi: Selesai.', 'success', 'pesanan', 51, 1, '2026-10-29 13:55:37'),
(27, 3, 'Status pesanan \"Sign Petunjuk\" telah diperbarui menjadi: Batal.', 'info', 'pesanan', 51, 1, '2026-10-29 13:55:41'),
(28, 3, 'Status pesanan \"Sign Petunjuk\" telah diperbarui menjadi: Menunggu.', 'success', 'pesanan', 51, 1, '2026-10-29 13:55:43'),
(29, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 52, 1, '2026-10-29 14:13:48'),
(30, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 53, 1, '2026-10-30 01:48:44'),
(31, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 54, 1, '2026-10-30 01:54:08'),
(32, 3, 'Checkout 2 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 02:35:54'),
(33, 3, 'Checkout 2 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 04:35:44'),
(34, 3, 'Pesanan \"Pylon Sign\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 58, 1, '2026-10-30 04:42:42'),
(35, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 55, 1, '2026-10-30 04:42:43'),
(36, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 54, 1, '2026-10-30 04:42:45'),
(37, 3, 'Pesanan \"Sign Custom\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 56, 1, '2026-10-30 04:42:47'),
(38, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 53, 1, '2026-10-30 04:42:50'),
(39, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 52, 1, '2026-10-30 04:42:51'),
(40, 3, 'Pesanan \"Sign Petunjuk\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 51, 1, '2026-10-30 04:42:53'),
(41, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 50, 1, '2026-10-30 04:42:55'),
(42, 3, 'Pesanan \"Sign Petunjuk\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 46, 1, '2026-10-30 04:42:57'),
(43, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 44, 1, '2026-10-30 04:42:59'),
(44, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 41, 1, '2026-10-30 04:43:01'),
(45, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 40, 1, '2026-10-30 04:43:03'),
(46, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 37, 1, '2026-10-30 04:43:05'),
(47, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 45, 1, '2026-10-30 04:43:07'),
(48, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 32, 1, '2026-10-30 04:43:10'),
(49, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 36, 1, '2026-10-30 04:43:12'),
(50, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 35, 1, '2026-10-30 04:43:14'),
(51, 3, 'Pesanan \"Rambu Rambu\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 34, 1, '2026-10-30 04:43:16'),
(52, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 33, 1, '2026-10-30 04:43:18'),
(53, 3, 'Pesanan \"Sign Custom\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 57, 1, '2026-10-30 04:43:21'),
(54, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 05:05:55'),
(55, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 05:10:14'),
(56, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 05:24:14'),
(57, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 05:32:53'),
(58, 3, 'Status pesanan \"Visual Poster\" telah diperbarui menjadi: Diproses.', 'success', 'pesanan', 68, 1, '2026-10-30 05:42:53'),
(59, 3, 'Status pesanan \"Visual Poster\" telah diperbarui menjadi: Dikirim.', 'success', 'pesanan', 68, 1, '2026-10-30 05:59:03'),
(60, 3, 'Status pesanan \"Sign Custom\" telah diperbarui menjadi: Dikirim.', 'success', 'pesanan', 69, 1, '2026-10-30 05:59:03'),
(61, 3, 'Status pesanan \"Pylon Sign\" telah diperbarui menjadi: Dikirim.', 'success', 'pesanan', 70, 1, '2026-10-30 05:59:03'),
(62, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 06:08:07'),
(63, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 74, 1, '2026-10-30 06:10:02'),
(64, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 06:16:43'),
(65, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 06:18:12'),
(66, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 06:23:14'),
(67, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 84, 1, '2026-10-30 06:23:40'),
(68, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 85, 1, '2026-10-30 06:24:59'),
(69, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 06:26:18'),
(70, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 89, 1, '2026-10-30 06:27:24'),
(71, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 06:28:41'),
(72, 3, 'Checkout 2 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 06:37:06'),
(73, 3, 'Checkout 2 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 06:44:06'),
(74, 3, 'Checkout 4 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 06:50:30'),
(75, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 06:54:23'),
(76, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 06:57:12'),
(77, 3, 'Checkout 4 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 07:00:27'),
(78, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 07:04:46'),
(79, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 07:39:16'),
(80, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 07:43:04'),
(81, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 08:06:57'),
(82, 3, 'Checkout 3 produk dari keranjang berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', NULL, 1, '2026-10-30 08:43:42'),
(83, 3, 'Checkout 3 produk dari keranjang berhasil dibuat.', 'success', 'pesanan', NULL, 1, '2026-10-30 08:52:35'),
(84, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 129, 1, '2026-10-30 08:53:53'),
(85, 3, 'Checkout 3 produk dari keranjang berhasil dibuat.', 'success', 'pesanan', NULL, 1, '2026-10-30 08:55:38'),
(86, 3, 'Checkout 3 produk dari keranjang berhasil dibuat.', 'success', 'pesanan', NULL, 1, '2026-10-30 09:03:07'),
(87, 3, 'Pesanan \"Sign Custom\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 134, 1, '2026-10-30 09:06:01'),
(88, 3, 'Pesanan \"Rambu Rambu\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 135, 1, '2026-10-30 09:06:03'),
(89, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 130, 1, '2026-10-30 09:06:05'),
(90, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 133, 1, '2026-10-30 09:06:08'),
(91, 3, 'Pesanan \"Pylon Sign\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 131, 1, '2026-10-30 09:06:10'),
(92, 3, 'Pesanan \"Pole Sign\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 132, 1, '2026-10-30 09:06:11'),
(93, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 129, 1, '2026-10-30 09:06:13'),
(94, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 126, 1, '2026-10-30 09:06:15'),
(95, 3, 'Pesanan \"Sign Custom\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 127, 1, '2026-10-30 09:06:18'),
(96, 3, 'Pesanan \"Rambu Rambu\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 128, 1, '2026-10-30 09:06:20'),
(97, 3, 'Pesanan \"Sign Petunjuk\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 123, 1, '2026-10-30 09:06:22'),
(98, 3, 'Pesanan \"Rambu Rambu\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 124, 1, '2026-10-30 09:06:23'),
(99, 3, 'Pesanan \"Pole Sign\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 125, 1, '2026-10-30 09:06:25'),
(100, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 120, 1, '2026-10-30 09:06:26'),
(101, 3, 'Pesanan \"Sign Petunjuk\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 121, 1, '2026-10-30 09:06:28'),
(102, 3, 'Pesanan \"Sign Custom\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 122, 1, '2026-10-30 09:06:30'),
(103, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 117, 1, '2026-10-30 09:06:34'),
(104, 3, 'Pesanan \"Sign Custom\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 118, 1, '2026-10-30 09:06:36'),
(105, 3, 'Pesanan \"Rambu Rambu\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 119, 1, '2026-10-30 09:06:38'),
(106, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 107, 1, '2026-10-30 09:06:41'),
(107, 3, 'Pesanan \"Sign Custom\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 112, 1, '2026-10-30 09:06:43'),
(108, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 111, 1, '2026-10-30 09:06:45'),
(109, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 114, 1, '2026-10-30 09:06:47'),
(110, 3, 'Pesanan \"Sign Petunjuk\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 115, 1, '2026-10-30 09:06:49'),
(111, 3, 'Pesanan \"Sign Custom\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 116, 1, '2026-10-30 09:06:52'),
(112, 3, 'Pesanan \"Pylon Sign\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 113, 1, '2026-10-30 09:06:54'),
(113, 3, 'Pesanan \"Pole Sign\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 108, 1, '2026-10-30 09:06:55'),
(114, 3, 'Pesanan \"Rambu Rambu\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 109, 1, '2026-10-30 09:06:56'),
(115, 3, 'Pesanan \"Sign Custom\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 110, 1, '2026-10-30 09:06:58'),
(116, 3, 'Checkout 3 produk dari keranjang berhasil dibuat.', 'success', 'pesanan', NULL, 1, '2026-10-30 09:07:43'),
(117, 3, 'Checkout 2 produk dari keranjang berhasil dibuat.', 'success', 'pesanan', NULL, 1, '2026-10-30 09:17:02'),
(118, 3, 'Checkout 2 produk dari keranjang berhasil dibuat.', 'success', 'pesanan', NULL, 1, '2026-10-30 09:19:30'),
(119, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 143, 1, '2026-10-30 10:23:39'),
(120, 3, 'Checkout 3 produk berhasil dibuat. Total pembayaran Rp 10.460.000.', 'success', 'pesanan', NULL, 1, '2026-10-30 10:25:08'),
(121, 3, 'Status pesanan \"Visual Poster\" telah diperbarui menjadi: Dikirim.', 'success', 'pesanan', 144, 1, '2026-10-30 10:29:30'),
(122, 3, 'Status pesanan \"Pylon Sign\" telah diperbarui menjadi: Dikirim.', 'success', 'pesanan', 145, 1, '2026-10-30 10:29:30'),
(123, 3, 'Status pesanan \"Sign Petunjuk\" telah diperbarui menjadi: Dikirim.', 'success', 'pesanan', 146, 1, '2026-10-30 10:29:30'),
(124, 3, 'Status pesanan \"Visual Poster\" telah diperbarui menjadi: Diproses.', 'success', 'pesanan', 141, 1, '2026-10-30 10:53:05'),
(125, 3, 'Status pesanan \"Sign Custom\" telah diperbarui menjadi: Diproses.', 'success', 'pesanan', 142, 1, '2026-10-30 10:53:05'),
(126, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 139, 1, '2026-10-30 10:54:45'),
(127, 3, 'Status pesanan \"Visual Poster\" telah diperbarui menjadi: Menunggu.', 'success', 'pesanan', 141, 1, '2026-10-30 10:54:55'),
(128, 3, 'Status pesanan \"Sign Custom\" telah diperbarui menjadi: Menunggu.', 'success', 'pesanan', 142, 1, '2026-10-30 10:54:56'),
(129, 3, 'Status pesanan \"Visual Poster\" telah diperbarui menjadi: Menunggu.', 'success', 'pesanan', 144, 1, '2026-10-30 10:54:59'),
(130, 3, 'Status pesanan \"Pylon Sign\" telah diperbarui menjadi: Menunggu.', 'success', 'pesanan', 145, 1, '2026-10-30 10:54:59'),
(131, 3, 'Status pesanan \"Sign Petunjuk\" telah diperbarui menjadi: Menunggu.', 'success', 'pesanan', 146, 1, '2026-10-30 10:54:59'),
(132, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 141, 1, '2026-10-30 10:55:21'),
(133, 3, 'Pesanan \"Sign Custom\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 142, 1, '2026-10-30 10:55:28'),
(134, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 143, 1, '2026-10-30 10:55:32'),
(135, 3, 'Pesanan \"Sign Petunjuk\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 140, 1, '2026-10-30 10:55:37'),
(136, 3, 'Pesanan \"Visual Poster\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 136, 1, '2026-10-30 10:55:49'),
(137, 3, 'Pesanan \"Sign Custom\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 137, 1, '2026-10-30 10:56:21'),
(138, 3, 'Pesanan \"Rambu Rambu\" telah dihapus dari riwayat pesanan.', 'info', 'pesanan', 138, 1, '2026-10-30 10:56:30'),
(139, 3, 'Checkout 3 produk berhasil dibuat. Total pembayaran Rp 11.255.000.', 'success', 'pesanan', NULL, 1, '2026-10-30 22:40:03'),
(140, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 150, 1, '2026-10-30 22:41:04'),
(141, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 151, 1, '2026-10-30 23:02:20'),
(142, 3, 'Checkout 3 produk berhasil dibuat. Total pembayaran Rp 3.260.000.', 'success', 'pesanan', NULL, 1, '2026-10-30 23:04:57'),
(143, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 155, 1, '2026-10-30 23:22:03'),
(144, 3, 'Pesanan \"Sign Petunjuk\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 156, 1, '2026-10-30 23:23:14'),
(145, 3, 'Checkout 3 produk berhasil dibuat. Total pembayaran Rp 15.220.000.', 'success', 'pesanan', NULL, 1, '2026-10-30 23:27:21'),
(146, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 160, 1, '2026-10-30 23:30:11'),
(147, 3, 'Pesanan \"Sign Petunjuk\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 161, 1, '2026-10-30 23:31:30'),
(148, 3, 'Pesanan \"Sign Petunjuk\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 162, 1, '2026-10-30 23:37:08'),
(149, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 163, 1, '2026-10-30 23:41:26'),
(150, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 164, 1, '2026-10-31 04:35:00'),
(151, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 165, 1, '2026-10-31 04:36:06'),
(152, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 166, 1, '2026-10-31 04:38:54'),
(153, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 167, 1, '2026-10-31 04:44:16'),
(154, 3, 'Pesanan \"Sign Petunjuk\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 168, 1, '2026-10-31 04:45:42'),
(155, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 169, 1, '2026-10-31 04:52:26'),
(156, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 1, 1, '2026-10-31 05:05:03'),
(157, 3, 'Checkout 3 produk berhasil dibuat. Total pembayaran Rp 1.760.000.', 'success', 'pesanan', NULL, 1, '2026-10-31 05:06:53'),
(158, 3, 'Status pesanan \"Visual Poster\" telah diperbarui menjadi: Diproses.', 'success', 'pesanan', 1, 1, '2026-10-31 07:03:42'),
(159, 3, 'Status pesanan \"Visual Poster\" telah diperbarui menjadi: Menunggu.', 'success', 'pesanan', 1, 1, '2026-10-31 07:03:56'),
(160, 3, 'Detail pesanan \"Visual Poster\" berhasil diperbarui.', 'success', 'pesanan', 1, 1, '2026-10-31 07:07:40'),
(161, 3, 'Detail pesanan \"Visual Poster\" berhasil diperbarui.', 'success', 'pesanan', 1, 1, '2026-10-31 07:18:22'),
(162, 3, 'Detail pesanan \"Visual Poster\" berhasil diperbarui.', 'success', 'pesanan', 1, 1, '2026-10-31 07:22:49'),
(163, 3, 'Detail pesanan \"Visual Poster\" berhasil diperbarui.', 'success', 'pesanan', 1, 1, '2026-10-31 07:35:58'),
(164, 2, '✏️ Pesanan #1 (\"Visual Poster\") telah diedit/diperbarui oleh pelanggan.', 'success', 'pesanan', 1, 0, '2026-10-31 07:35:58'),
(165, 3, 'Pesanan \"Visual Poster\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 5, 0, '2026-10-31 07:55:56'),
(166, 3, 'Detail pesanan \"Visual Poster\" berhasil diperbarui.', 'success', 'pesanan', 5, 0, '2026-10-31 08:05:10'),
(167, 2, '✏️ Pesanan #5 (\"Visual Poster\") telah diedit/diperbarui oleh pelanggan.', 'success', 'pesanan', 5, 0, '2026-10-31 08:05:10'),
(168, 3, 'Detail pesanan \"Visual Poster\" berhasil diperbarui.', 'success', 'pesanan', 5, 0, '2026-10-31 08:21:10'),
(169, 2, '✏️ Pesanan #5 (\"Visual Poster\") telah diedit/diperbarui oleh pelanggan.', 'success', 'pesanan', 5, 1, '2026-10-31 08:21:10'),
(170, 3, 'Detail pesanan \"Visual Poster\" berhasil diperbarui.', 'success', 'pesanan', 2, 0, '2026-10-31 08:27:29'),
(171, 2, '✏️ Pesanan #2 (\"Visual Poster\") telah diedit/diperbarui oleh pelanggan.', 'success', 'pesanan', 2, 0, '2026-10-31 08:27:29'),
(172, 3, 'Detail pesanan \"Sign Custom\" berhasil diperbarui.', 'success', 'pesanan', 3, 0, '2026-10-31 08:28:16'),
(173, 2, '✏️ Pesanan #3 (\"Sign Custom\") telah diedit/diperbarui oleh pelanggan.', 'success', 'pesanan', 3, 0, '2026-10-31 08:28:16'),
(174, 3, 'Pesanan \"Sign Petunjuk\" berhasil dibuat dan sedang menunggu konfirmasi.', 'success', 'pesanan', 1, 1, '2026-10-31 08:36:54'),
(175, 3, 'Checkout 3 produk berhasil dibuat. Total pembayaran Rp 1.435.000.', 'success', 'pesanan', NULL, 1, '2026-10-31 08:37:57'),
(176, 3, 'Pesanan 2 berhasil diperbarui.', 'success', 'pesanan', 2, 0, '2026-10-31 10:00:38'),
(177, 2, '✏️ Pesanan 2 (\"Visual Poster\") telah diedit/diperbarui oleh pelanggan.', 'success', 'pesanan', 2, 0, '2026-10-31 10:00:38'),
(178, 3, 'Pesanan 3 berhasil diperbarui.', 'success', 'pesanan', 3, 0, '2026-10-31 10:00:38'),
(179, 2, '✏️ Pesanan 3 (\"Sign Petunjuk\") telah diedit/diperbarui oleh pelanggan.', 'success', 'pesanan', 3, 0, '2026-10-31 10:00:38'),
(180, 3, 'Pesanan 4 berhasil diperbarui.', 'success', 'pesanan', 4, 0, '2026-10-31 10:00:38'),
(181, 2, '✏️ Pesanan 4 (\"Sign Custom\") telah diedit/diperbarui oleh pelanggan.', 'success', 'pesanan', 4, 0, '2026-10-31 10:00:38'),
(182, 3, 'Pesanan 2 berhasil diperbarui.', 'success', 'pesanan', 2, 0, '2026-10-31 10:01:17'),
(183, 2, '✏️ Pesanan 2 (\"Visual Poster\") telah diedit/diperbarui oleh pelanggan.', 'success', 'pesanan', 2, 0, '2026-10-31 10:01:17'),
(184, 3, 'Pesanan 3 berhasil diperbarui.', 'success', 'pesanan', 3, 0, '2026-10-31 10:01:17'),
(185, 2, '✏️ Pesanan 3 (\"Sign Petunjuk\") telah diedit/diperbarui oleh pelanggan.', 'success', 'pesanan', 3, 0, '2026-10-31 10:01:17'),
(186, 3, 'Pesanan 4 berhasil diperbarui.', 'success', 'pesanan', 4, 0, '2026-10-31 10:01:17'),
(187, 2, '✏️ Pesanan 4 (\"Sign Custom\") telah diedit/diperbarui oleh pelanggan.', 'success', 'pesanan', 4, 0, '2026-10-31 10:01:17'),
(188, 3, 'Pesanan 1 berhasil diperbarui.', 'success', 'pesanan', 1, 0, '2026-10-31 10:05:55'),
(189, 2, '✏️ Pesanan 1 (\"Sign Petunjuk\") telah diedit/diperbarui oleh pelanggan.', 'success', 'pesanan', 1, 0, '2026-10-31 10:05:55');

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
  `metode_pembayaran` varchar(100) DEFAULT 'Transfer Bank'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `pesanan`
--

INSERT INTO `pesanan` (`id_pesanan`, `id_user`, `id_produk`, `detail_ukuran`, `status`, `tanggal_pesan`, `jumlah`, `ongkir`, `total_harga`, `alamat_pengiriman`, `metode_pembayaran`) VALUES
(1, 3, 18, 'edit', 'Menunggu', '2026-10-31 08:36:54', 1, 55000.00, 255000.00, 'zdfds, Kel. SENANGAK, Kec. NANGA TAMAN, Kab. KABUPATEN SEKADAU, Prov. KALIMANTAN BARAT 78611', 'Transfer Bank BCA'),
(2, 3, 19, 'edit', 'Menunggu', '2026-10-31 08:37:57', 1, 55000.00, 255000.00, 'dsada, Kel. TELUK AUR, Kec. BUNUT HILIR, Kab. KABUPATEN KAPUAS HULU, Prov. KALIMANTAN BARAT 78611', 'E-Wallet (GoPay / OVO / Dana)'),
(3, 3, 18, 'fsdfds', 'Menunggu', '2026-10-31 08:37:57', 1, 55000.00, 255000.00, 'dsada, Kel. TELUK AUR, Kec. BUNUT HILIR, Kab. KABUPATEN KAPUAS HULU, Prov. KALIMANTAN BARAT 78611', 'E-Wallet (GoPay / OVO / Dana)'),
(4, 3, 17, 'fsdfsd', 'Menunggu', '2026-10-31 08:37:57', 3, 55000.00, 3055000.00, 'dsada, Kel. TELUK AUR, Kec. BUNUT HILIR, Kab. KABUPATEN KAPUAS HULU, Prov. KALIMANTAN BARAT 78611', 'E-Wallet (GoPay / OVO / Dana)');

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
(19, 'Visual Poster', '- Kontruksi Rangka hollow 3x3\r\n- List alumunium/kayu ', 'Flexy Fronlite Digital Printing', 200000.00, '[\"images/1793153894528-WhatsApp-Image-2026-10-27-at-21.02.03.jpeg\"]', '2026-10-28 02:18:14', 1000);

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
('AJI2tc7zutenF0woP3HCn09uT3YeSOc8', 1793508343, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-11-01T04:43:54.105Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":3,\"role\":\"pelanggan\",\"nama\":\"DAHLAN\"}'),
('B5OjnBuaq9mwxHLI-3cFXOog58EmZD1A', 1793529853, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-11-01T08:25:12.877Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":3,\"role\":\"pelanggan\",\"nama\":\"DAHLAN\"}'),
('EI2Sd58Hyzl3CwliihCSC2d8omho9bNU', 1793509589, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-11-01T05:06:28.884Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":3,\"role\":\"pelanggan\",\"nama\":\"DAHLAN\"}'),
('Fg2-BvwiiN0BfBGIsfSXGloa4ZDj5wj_', 1793489354, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-10-31T08:56:37.589Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":2,\"role\":\"admin\",\"nama\":\"Admin\"}'),
('Xrn9FAzxMr9OjZS8gXpbW5ONqKATpoa6', 1793522414, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-11-01T07:56:31.721Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":2,\"role\":\"admin\",\"nama\":\"Admin\"}'),
('gj74JWssMUeeJ8PP4hC79UZ1weZ7zI6r', 1793489437, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-10-31T23:29:36.695Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":3,\"role\":\"pelanggan\",\"nama\":\"DAHLAN\"}'),
('xXOvFiYmFw7EIYwC_fr-1uGRUFk5pJ2B', 1793488944, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-10-31T23:21:33.380Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":3,\"role\":\"pelanggan\",\"nama\":\"DAHLAN\"}');

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
(3, 'DAHLAN', 'dahlansintang@gmail.com', '$2b$10$uNhT/K4IhP4JFovpInNlsew1rYEy0ghnRHgbZfeN161lI.ElNlVua', '085750299097', 'pelanggan', '2026-10-24 12:53:52', 'DUSUN TUNAS JAYA'),
(9, 'dddd', 'test@japa.com', '$2b$10$ICWJjXfDJwdWv3wz1KEmaeCoE7UicX.smYNC828v9pzkz./cmmNdC', '081545751255', 'pelanggan', '2026-10-29 08:19:38', 'DUSUN TUNAS JAYA');

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
  MODIFY `id_keranjang` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

--
-- AUTO_INCREMENT untuk tabel `notifikasi`
--
ALTER TABLE `notifikasi`
  MODIFY `id_notifikasi` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=190;

--
-- AUTO_INCREMENT untuk tabel `pesanan`
--
ALTER TABLE `pesanan`
  MODIFY `id_pesanan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `produk`
--
ALTER TABLE `produk`
  MODIFY `id_produk` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

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
