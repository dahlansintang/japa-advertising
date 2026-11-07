'use strict';

const db = require('../config/db');

exports.getAllProducts = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id_produk, nama_produk, deskripsi, bahan, harga_estimasi, gambar_url, created_at, berat FROM produk ORDER BY id_produk DESC'
        );
        return res.json({ status: 'success', data: rows });
    } catch (error) {
        console.error('Gagal mengambil produk:', error);
        return res.status(500).json({ status: 'error', message: 'Gagal mengambil data produk.' });
    }
};

exports.getProductById = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ status: 'error', message: 'ID produk tidak valid.' });
    }

    try {
        const [rows] = await db.query(
            'SELECT id_produk, nama_produk, deskripsi, bahan, harga_estimasi, gambar_url, created_at, berat FROM produk WHERE id_produk = ?',
            [id]
        );
        if (!rows.length) {
            return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan.' });
        }
        return res.json({ status: 'success', data: rows[0] });
    } catch (error) {
        console.error('Gagal mengambil detail produk:', error);
        return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server.' });
    }
};