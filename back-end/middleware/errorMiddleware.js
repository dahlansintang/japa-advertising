'use strict';

const multer = require('multer');

const multerMessages = {
    LIMIT_FILE_SIZE: 'Ukuran setiap gambar maksimal 5 MB.',
    LIMIT_FILE_COUNT: 'Maksimal 5 gambar dalam satu unggahan.',
    LIMIT_UNEXPECTED_FILE: 'Nama field upload tidak sesuai. Gunakan field gambar_file.',
    LIMIT_FIELD_COUNT: 'Jumlah field formulir terlalu banyak.',
    LIMIT_FIELD_KEY: 'Nama field formulir terlalu panjang.',
    LIMIT_FIELD_VALUE: 'Nilai field formulir terlalu besar.',
    LIMIT_PART_COUNT: 'Jumlah bagian formulir terlalu banyak.'
};

function errorMiddleware(err, req, res, next) {
    if (res.headersSent) return next(err);

    if (err && err.code === 'INVALID_IMAGE_TYPE') {
        return res.status(400).json({ status: 'error', message: err.message });
    }

    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            status: 'error',
            message: multerMessages[err.code] || 'Upload file gagal.'
        });
    }

    if (err && err.message === 'Origin tidak diizinkan oleh kebijakan CORS.') {
        return res.status(403).json({
            status: 'error',
            message: 'Akses dari origin ini tidak diizinkan.'
        });
    }

    console.error('Global server error:', err);
    return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server.'
    });
}

module.exports = errorMiddleware;
