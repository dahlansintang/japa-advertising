const xss = require('xss-clean');
const { body, validationResult } = require('express-validator');

// 1. CUSTOM LOGIN LIMITER: Hanya menghitung kegagalan (maksimal 5 kali salah, reset jika berhasil)
const failedAttemptsMap = new Map(); // Menyimpan data percobaan gagal per IP sementara

const customLoginLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const lockTime = 15 * 60 * 1000; // Waktu blokir 15 menit jika lewat batas
    const maxAttempts = 5;

    const record = failedAttemptsMap.get(ip);

    // Cek apakah IP sedang diblokir
    if (record && record.isBlocked) {
        if (now < record.blockUntil) {
            const sisaMenit = Math.ceil((record.blockUntil - now) / 60000);
            return res.status(429).json({
                status: 'error',
                message: `Terlalu banyak percobaan salah (${maxAttempts}x). Silakan coba lagi setelah ${sisaMenit} menit.`
            });
        } else {
            // Waktu blokir habis, reset
            failedAttemptsMap.delete(ip);
        }
    }
    next();
};

// Fungsi helper untuk mencatat kesalahan login (dipanggil di controller auth saat password salah)
const recordFailedLogin = (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const maxAttempts = 5;
    const lockTime = 15 * 60 * 1000;

    let record = failedAttemptsMap.get(ip);
    if (!record) {
        record = { count: 0, isBlocked: false, blockUntil: null };
    }

    record.count += 1;
    if (record.count >= maxAttempts) {
        record.isBlocked = true;
        record.blockUntil = now + lockTime;
    }
    failedAttemptsMap.set(ip, record);
};

// Fungsi helper untuk mereset percobaan gagal saat login BERHASIL
const resetLoginAttempts = (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    failedAttemptsMap.delete(ip);
};

// 2. PROTEKSI XSS: Bersihkan input dari skrip berbahaya
const xssProtection = xss();

// 3. AUTENTIKASI & OTORISASI BERSAMA
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    if (req.headers['content-type'] === 'application/json' || req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ status: 'error', message: 'Akses ditolak. Sesi telah berakhir atau belum login.' });
    }
    return res.redirect('/pages/login.html');
};

const requireAdmin = (req, res, next) => {
    if (req.session && req.session.userId && req.session.role === 'admin') {
        return next();
    }
    return res.status(403).json({ status: 'error', message: 'Akses Ditolak! Hanya untuk Administrator.' });
};

const requireCustomer = (req, res, next) => {
    if (req.session && req.session.userId && req.session.role === 'pelanggan') {
        return next();
    }
    return res.status(403).json({ status: 'error', message: 'Akses Ditolak! Hanya untuk Pelanggan.' });
};

// 4. VALIDASI INPUT REGISTER / LOGIN
const validateRegister = [
    body('nama_lengkap').trim().notEmpty().withMessage('Nama lengkap wajib diisi').escape(),
    body('email').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password minimal harus 6 karakter'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
        }
        next();
    }
];

// 5. FILTER MIME / EKSTENSI & UKURAN UPLOAD FILE (Multer Config)
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'front-end/images/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format file tidak didukung! Hanya diperbolehkan .jpg, .jpeg, dan .png'), false);
    }
};

const uploadConfig = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Batasan ukuran upload maks 5 MB
    fileFilter: fileFilter
});

module.exports = {
    customLoginLimiter,
    recordFailedLogin,
    resetLoginAttempts,
    xssProtection,
    requireAuth,
    requireAdmin,
    requireCustomer,
    validateRegister,
    uploadConfig
};