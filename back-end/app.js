'use strict';

// =====================================================
// 1. IMPORT DEPENDENCIES
// =====================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const session = require('express-session');

require('./config/env');

const MySQLStore = require('express-mysql-session')(session);
const db = require('./config/db');

const {
    xssProtection,
    generateCsrfToken,
    createCsrfProtection
} = require('./middleware/security');

const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// =====================================================
// 2. VALIDASI ENVIRONMENT DAN PROXY
// =====================================================

if (
    typeof process.env.SESSION_SECRET !== 'string' ||
    process.env.SESSION_SECRET.length < 32
) {
    throw new Error(
        'SESSION_SECRET wajib diisi dan minimal 32 karakter.'
    );
}

if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
}

// =====================================================
// 3. KONFIGURASI CORS
// =====================================================

function normalizeOrigin(value) {
    return String(value || '').trim().replace(/\/+$/, '');
}

const allowedOrigins = (
    process.env.CORS_ORIGINS || 'http://localhost:3000'
)
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
    
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(normalizeOrigin(origin))) {
            return callback(null, true);
        }

        const error = new Error(
            'Origin tidak diizinkan oleh kebijakan CORS.'
        );
        error.status = 403;
        error.code = 'CORS_ORIGIN_DENIED';
        return callback(error);
    },

    credentials: true,

    methods: [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS'
    ],

    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token'
    ],

    optionsSuccessStatus: 204
}));

// =====================================================
// 4. HELMET DAN CONTENT SECURITY POLICY
// =====================================================

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://fonts.googleapis.com'
            ],
            fontSrc: [
                "'self'",
                'https://fonts.gstatic.com'
            ],
            imgSrc: [
                "'self'",
                'data:',
                'blob:',
                'https://via.placeholder.com'
            ],
            connectSrc: [
                "'self'",
                'https://www.emsifa.com'
            ],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'"]
        }
    },

    hidePoweredBy: true
}));

// =====================================================
// 5. REQUEST PARSING
// =====================================================

app.use(express.json({
    limit: '1mb'
}));

app.use(express.urlencoded({
    extended: true,
    limit: '1mb'
}));

// =====================================================
// 6. STATIC FRONTEND
// =====================================================

const frontendPath = path.resolve(
    __dirname,
    '../front-end'
);

app.use(express.static(frontendPath, {
    index: 'index.html',
    dotfiles: 'ignore',
    fallthrough: true
}));

// =====================================================
// 7. MYSQL SESSION STORE
// =====================================================

const sessionStore = new MySQLStore({
    createDatabaseTable: true,

    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    },

    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 24 * 60 * 60 * 1000
}, db);

// =====================================================
// 8. SESSION CONFIGURATION
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
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
    }
}));

// =====================================================
// 9. CSRF TOKEN ENDPOINT
// =====================================================

app.get('/api/auth/csrf', generateCsrfToken);

// =====================================================
// 10. GLOBAL CSRF PROTECTION
// =====================================================

app.use(createCsrfProtection(allowedOrigins));

// =====================================================
// 11. XSS PROTECTION
// =====================================================

app.use(xssProtection);

// =====================================================
// 12. ROOT ROUTE
// =====================================================

app.get('/', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// =====================================================
// 13. IMPORT ROUTES
// =====================================================

const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cartRoutes = require('./routes/cartRoutes');

// =====================================================
// 14. REGISTER API ROUTES
// =====================================================

app.use('/api/produk', productRoutes);
app.use('/api/pesanan', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api', shippingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);

// =====================================================
// 15. NOT FOUND HANDLER
// =====================================================

app.use(notFoundMiddleware);

// =====================================================
// 16. GLOBAL ERROR HANDLER
// =====================================================

app.use(errorMiddleware);

// =====================================================
// 17. EXPORT APPLICATION
// =====================================================

module.exports = app;