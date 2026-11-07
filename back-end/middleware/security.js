'use strict';

const crypto = require('crypto');
const xss = require('xss-clean');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const {
    customLoginLimiter,
    recordFailedLogin,
    resetLoginAttempts,
    isStrongPassword
} = require('../utils/authSecurity');

// =====================================================
// 3. XSS PROTECTION
// =====================================================

const xssProtection = xss();

// =====================================================
// 4. CSRF PROTECTION
// =====================================================

const CSRF_TOKEN_BYTES = 32;
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Membuat atau mengambil token CSRF yang terikat pada session.
 * Dipasang pada GET /api/auth/csrf setelah middleware session.
 */
function generateCsrfToken(req, res, next) {
    if (!req.session) {
        return res.status(500).json({
            status: 'error',
            message: 'Session belum tersedia.'
        });
    }

    if (
        typeof req.session.csrfToken !== 'string' ||
        !CSRF_TOKEN_PATTERN.test(req.session.csrfToken)
    ) {
        req.session.csrfToken = crypto
            .randomBytes(CSRF_TOKEN_BYTES)
            .toString('hex');
    }

    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
    });

    return req.session.save(error => {
        if (error) {
            return next(error);
        }

        return res.status(200).json({
            status: 'success',
            csrfToken: req.session.csrfToken
        });
    });
}

/**
 * Melindungi semua endpoint mutasi.
 * Origin yang hadir harus termasuk allowlist; request tanpa Origin
 * tetap wajib membawa token yang cocok dengan session.
 */
function createCsrfProtection(allowedOrigins = []) {
    const allowedOriginSet = new Set(
        (Array.isArray(allowedOrigins) ? allowedOrigins : [])
            .filter(origin => typeof origin === 'string' && origin.length > 0)
    );

    return function csrfProtection(req, res, next) {
        const method = String(req.method || '').toUpperCase();

        if (!UNSAFE_METHODS.has(method)) {
            return next();
        }

        // A. Validasi Origin jika header tersedia.
        const origin = req.get('Origin');

        if (origin && !allowedOriginSet.has(origin.replace(/\/+$/, ''))) {
            return res.status(403).json({
                status: 'error',
                code: 'CSRF_ORIGIN_DENIED',
                message: 'Permintaan ditolak karena origin tidak diizinkan.'
            });
        }

        // B. Token session harus tersedia dan valid.
        const sessionToken = req.session?.csrfToken;

        if (
            typeof sessionToken !== 'string' ||
            !CSRF_TOKEN_PATTERN.test(sessionToken)
        ) {
            return res.status(403).json({
                status: 'error',
                code: 'CSRF_SESSION_TOKEN_MISSING',
                message: 'CSRF token tidak tersedia. Silakan ambil token terlebih dahulu.'
            });
        }

        // C. Token request harus dikirim melalui header yang ditentukan.
        const requestToken = req.get(CSRF_HEADER_NAME);

        if (
            typeof requestToken !== 'string' ||
            !CSRF_TOKEN_PATTERN.test(requestToken)
        ) {
            return res.status(403).json({
                status: 'error',
                code: 'CSRF_REQUEST_TOKEN_INVALID_FORMAT',
                message: 'CSRF token tidak tersedia atau formatnya tidak valid.'
            });
        }

        // D. Perbandingan constant-time.
        const sessionBuffer = Buffer.from(sessionToken, 'hex');
        const requestBuffer = Buffer.from(requestToken, 'hex');

        if (
            sessionBuffer.length !== requestBuffer.length ||
            !crypto.timingSafeEqual(sessionBuffer, requestBuffer)
        ) {
            return res.status(403).json({
                status: 'error',
                code: 'CSRF_TOKEN_MISMATCH',
                message: 'CSRF token tidak valid.'
            });
        }

        return next();
    };
}

// =====================================================
// 5. AUTHENTICATION
// =====================================================

function requireAuth(req, res, next) {
    if (req.session?.userId) {
        return next();
    }

    return res.status(401).json({
        status: 'error',
        message: 'Sesi telah berakhir atau Anda belum login.'
    });
}

// =====================================================
// 6. ROLE AUTHORIZATION
// =====================================================

function requireAdmin(req, res, next) {
    if (!req.session?.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Silakan login terlebih dahulu.'
        });
    }

    if (String(req.session.role || '').toLowerCase() !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Akses hanya untuk administrator.'
        });
    }

    return next();
}

function requireCustomer(req, res, next) {
    if (!req.session?.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Silakan login terlebih dahulu.'
        });
    }

    if (String(req.session.role || '').toLowerCase() !== 'pelanggan') {
        return res.status(403).json({
            status: 'error',
            message: 'Akses hanya untuk pelanggan.'
        });
    }

    return next();
}

// =====================================================
// 7. REGISTRATION VALIDATION
// =====================================================

const validateRegister = [
    body('nama_lengkap')
        .isString()
        .withMessage('Nama lengkap wajib berupa teks.')
        .bail()
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage('Nama lengkap wajib diisi (2–150 karakter).'),

    body('email')
        .isEmail()
        .withMessage('Format email tidak valid.')
        .bail()
        .normalizeEmail(),

    body('password')
        .custom(isStrongPassword)
        .withMessage(
            'Password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, angka, serta karakter spesial.'
        ),

    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }

        return next();
    }
];

// =====================================================
// 8. IMAGE UPLOAD CONFIGURATION
// =====================================================

const imageDirectory = path.resolve(
    __dirname,
    '../../front-end/images'
);

fs.mkdirSync(imageDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, imageDirectory);
    },

    filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname || '').toLowerCase();
        const randomName = crypto.randomBytes(16).toString('hex');

        callback(null, `${Date.now()}-${randomName}${extension}`);
    }
});

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png']);
const allowedMimeTypes = new Set(['image/jpeg', 'image/png']);

const uploadConfig = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5
    },
    fileFilter: (_req, file, callback) => {
        const extension = path.extname(file.originalname || '').toLowerCase();

        if (
            !allowedExtensions.has(extension) ||
            !allowedMimeTypes.has(file.mimetype)
        ) {
            const error = new Error(
                'Format file tidak didukung. Gunakan JPEG atau PNG.'
            );
            error.code = 'INVALID_IMAGE_TYPE';
            return callback(error);
        }

        return callback(null, true);
    }
});

// =====================================================
// 9. IMAGE SIGNATURE VALIDATION
// =====================================================

async function validateUploadedImageSignatures(req, res, next) {
    const files = Array.isArray(req.files)
        ? req.files
        : (req.file ? [req.file] : []);

    if (files.length === 0) {
        return next();
    }

    try {
        for (const file of files) {
            const handle = await fs.promises.open(file.path, 'r');
            const header = Buffer.alloc(8);
            let bytesRead = 0;

            try {
                ({ bytesRead } = await handle.read(header, 0, 8, 0));
            } finally {
                await handle.close();
            }

            const isJpeg =
                bytesRead >= 3 &&
                header[0] === 0xff &&
                header[1] === 0xd8 &&
                header[2] === 0xff;

            const pngSignature = Buffer.from([
                0x89, 0x50, 0x4e, 0x47,
                0x0d, 0x0a, 0x1a, 0x0a
            ]);

            const isPng =
                bytesRead === 8 &&
                header.equals(pngSignature);

            if (!isJpeg && !isPng) {
                await Promise.all(
                    files.map(item =>
                        fs.promises.unlink(item.path).catch(() => {})
                    )
                );

                return res.status(400).json({
                    status: 'error',
                    message: 'Isi file bukan gambar JPEG/PNG yang valid.'
                });
            }
        }

        return next();
    } catch (error) {
        await Promise.all(
            files.map(file =>
                fs.promises.unlink(file.path).catch(() => {})
            )
        );

        return next(error);
    }
}

// =====================================================
// 10. EXPORT MIDDLEWARE
// =====================================================

module.exports = {
    customLoginLimiter,
    recordFailedLogin,
    resetLoginAttempts,

    xssProtection,

    generateCsrfToken,
    createCsrfProtection,

    requireAuth,
    requireAdmin,
    requireCustomer,

    validateRegister,
    isStrongPassword,

    uploadConfig,
    validateUploadedImageSignatures
};