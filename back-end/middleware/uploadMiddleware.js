'use strict';

const multer = require('multer');
const fs = require('fs');
const { uploadConfig } = require('./security');

const uploadProductImagesMulter = uploadConfig.array('gambar_file', 5);

const multerMessages = {
    LIMIT_FILE_SIZE: 'Ukuran setiap gambar maksimal 5 MB.',
    LIMIT_FILE_COUNT: 'Maksimal 5 gambar dalam satu unggahan.',
    LIMIT_UNEXPECTED_FILE: 'Nama field upload tidak sesuai. Gunakan field gambar_file.',
    LIMIT_FIELD_COUNT: 'Jumlah field formulir terlalu banyak.',
    LIMIT_FIELD_KEY: 'Nama field formulir terlalu panjang.',
    LIMIT_FIELD_VALUE: 'Nilai field formulir terlalu besar.',
    LIMIT_PART_COUNT: 'Jumlah bagian formulir terlalu banyak.'
};

async function cleanupUploadedFiles(req) {
    const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
    await Promise.all(files.map(file => {
        if (!file || !file.path) return Promise.resolve();
        return fs.promises.unlink(file.path).catch(error => {
            if (error.code !== 'ENOENT') {
                console.error('Gagal membersihkan file upload sementara:', error.message);
            }
        });
    }));
}

function uploadProductImages(req, res, next) {
    uploadProductImagesMulter(req, res, async error => {
        if (!error) return next();

        await cleanupUploadedFiles(req);

        if (error.code === 'INVALID_IMAGE_TYPE') {
            return res.status(400).json({
                status: 'error',
                message: error.message
            });
        }

        if (error instanceof multer.MulterError) {
            return res.status(400).json({
                status: 'error',
                message: multerMessages[error.code] || 'Upload file gagal.'
            });
        }

        return next(error);
    });
}

module.exports = { uploadProductImages, cleanupUploadedFiles };
