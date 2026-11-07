'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

function validateEnvironment() {
    const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'SESSION_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length) {
        throw new Error(`Konfigurasi environment belum lengkap: ${missing.join(', ')}`);
    }
    if (process.env.SESSION_SECRET.length < 32 || /GANTI|CHANGE_ME|YOUR_SECRET/i.test(process.env.SESSION_SECRET)) {
        throw new Error('SESSION_SECRET wajib berupa nilai acak baru minimal 32 karakter, bukan placeholder.');
    }
}

module.exports = { validateEnvironment };
