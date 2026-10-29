const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const db = require('./config/db');

// Import modul keamanan terpusat
const { xssProtection } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mengarahkan Express untuk membaca folder front-end
app.use(express.static(path.join(__dirname, '../front-end')));

// Konfigurasi penyimpanan sesi ke MySQL
const sessionStore = new MySQLStore({}, db);

// Konfigurasi Sesi yang Diperketat (Keamanan CSRF & Cookie)
app.use(session({
    key: 'japa_session_cookie',
    secret: process.env.SESSION_SECRET || 'rahasia_japa_prabu_123',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Ubah menjadi true jika sudah menggunakan HTTPS di production
        httpOnly: true, // Mencegah akses cookie melalui JavaScript (XSS mitigation)
        sameSite: 'lax', // Melindungi dari serangan CSRF lintas situs
        maxAge: 1000 * 60 * 60 * 24 // Sesi berlaku selama 1 hari
    }
}));

// Proteksi XSS global untuk membersihkan input request dari skrip berbahaya
app.use(xssProtection);

// Import Routes
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Rute Manajemen Admin

// Gunakan Routes API Utama
app.use('/api/produk', productRoutes);
app.use('/api/pesanan', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api', shippingRoutes); // Menghasilkan endpoint /api/cek-ongkir
app.use('/api/admin', adminRoutes); // Menghasilkan endpoint manajemen admin (/api/admin/...)

// Penanganan Error Global untuk Upload File (Multer Error Handling)
const multer = require('multer');
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ status: 'error', message: 'Ukuran file terlalu besar! Maksimal 2 MB.' });
        }
        return res.status(400).json({ status: 'error', message: err.message });
    } else if (err) {
        return res.status(400).json({ status: 'error', message: err.message });
    }
    next();
});

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan aman di http://localhost:${PORT}`);
});