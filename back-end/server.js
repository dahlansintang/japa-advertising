
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const db = require('./config/db');

const { xssProtection } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// =====================================================
// 1. VALIDASI KONFIGURASI ENVIRONMENT
// =====================================================

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    console.error('ERROR: SESSION_SECRET wajib diisi dan minimal 32 karakter.');
    process.exit(1);
}

// Daftar origin frontend yang diizinkan.
// Contoh: http://localhost:3000,http://127.0.0.1:3000
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

// aktifkan TRUST_PROXY=true hanya jika proxy tersebut tepercaya.
if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
}

// =====================================================
// 2. CORS
// =====================================================

app.use(cors({
    origin: function (origin, callback) {
        // Permintaan tanpa Origin, misalnya dari aplikasi server,
        // tetap dapat diproses.
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Origin tidak diizinkan oleh kebijakan CORS.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
}));

// =====================================================
// 3. PARSING REQUEST
// =====================================================

app.use(express.json({
    limit: '1mb'
}));

app.use(express.urlencoded({
    extended: true,
    limit: '1mb'
}));

// =====================================================
// 4. SESSION STORE MYSQL
// =====================================================

const sessionStore = new MySQLStore({}, db);

// =====================================================
// 5. SESSION CONFIGURATION
// =====================================================

app.use(session({
    key: 'japa_session_cookie',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: false,
    cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// =====================================================
// 6. PROTEKSI CSRF BERBASIS ORIGIN
// =====================================================

const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

app.use((req, res, next) => {
    if (!unsafeMethods.includes(req.method)) {
        return next();
    }

    const origin = req.get('Origin');

    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({
            status: 'error',
            message: 'Permintaan ditolak karena origin tidak diizinkan.'
        });
    }

    return next();
});

// =====================================================
// 7. XSS PROTECTION
// =====================================================

app.use(xssProtection);

// =====================================================
// 8. STATIC FRONTEND
// =====================================================

app.use(express.static(
    path.join(__dirname, '../front-end')
));

// =====================================================
// 9. IMPORT ROUTES
// =====================================================

const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cartRoutes = require('./routes/cartRoutes');

// =====================================================
// 10. REGISTER API ROUTES
// =====================================================

app.use('/api/produk', productRoutes);
app.use('/api/pesanan', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api', shippingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);

// =====================================================
// 11. API 404 HANDLER
// =====================================================

app.use('/api', (req, res) => {
    return res.status(404).json({
        status: 'error',
        message: 'Endpoint API tidak ditemukan.'
    });
});

// =====================================================
// 12. GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: 'error',
                message: 'Ukuran file terlalu besar. Maksimal 5 MB.'
            });
        }

        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                status: 'error',
                message: 'Jumlah file yang diunggah melebihi batas.'
            });
        }

        return res.status(400).json({
            status: 'error',
            message: 'Upload file gagal. Periksa file yang dikirim.'
        });
    }

    console.error('Global server error:', err);

    if (err.message === 'Origin tidak diizinkan oleh kebijakan CORS.') {
        return res.status(403).json({
            status: 'error',
            message: 'Akses dari origin ini tidak diizinkan.'
        });
    }

    return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan pada server.'
    });
});

// =====================================================
// 13. START SERVER
// =====================================================

app.listen(PORT, () => {
    console.log(`Server berjalan pada port ${PORT}`);
    console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
});