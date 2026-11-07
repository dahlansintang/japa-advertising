
'use strict';

// =====================================================
// 1. LOAD ENVIRONMENT DAN VALIDASI
// =====================================================

const { validateEnvironment } = require('./config/env');

validateEnvironment();


// =====================================================
// 2. IMPORT DEPENDENCIES
// =====================================================

const db = require('./config/db');
const app = require('./app');

const PORT = Number(process.env.PORT) || 3000;


// =====================================================
// 3. START SERVER
// =====================================================

async function startServer() {
    let server;

    try {

        await db.query('SELECT 1');

        console.log('Koneksi database berhasil.');

        server = app.listen(PORT, () => {
            console.log('======================================');
            console.log('JAPA PRABU ADVERTISING');
            console.log('======================================');
            console.log(`Server berjalan pada port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('======================================');
        });

        let isShuttingDown = false;

        // =================================================
        // 4. GRACEFUL SHUTDOWN
        // =================================================

        const shutdown = signal => {
            if (isShuttingDown) {
                return;
            }

            isShuttingDown = true;

            console.log(
                `\n${signal} diterima. Server sedang ditutup...`
            );

            server.close(async error => {
                if (error) {
                    console.error(
                        'Gagal menutup HTTP server:',
                        error.message
                    );

                    try {
                        await db.end();
                    } catch (dbError) {
                        console.error(
                            'Gagal menutup koneksi database:',
                            dbError.message
                        );
                    }

                    process.exitCode = 1;
                    return;
                }

                try {
                    await db.end();

                    console.log('Koneksi database berhasil ditutup.');
                    console.log('Server berhasil dihentikan.');

                    process.exitCode = 0;
                } catch (dbError) {
                    console.error(
                        'Gagal menutup koneksi database:',
                        dbError.message
                    );

                    process.exitCode = 1;
                }
            });
        };

        process.once('SIGINT', () => shutdown('SIGINT'));
        process.once('SIGTERM', () => shutdown('SIGTERM'));

    } catch (error) {
        console.error(
            'Server gagal dijalankan:',
            error.message
        );

        if (server) {
            server.close();
        }

        try {
            await db.end();
        } catch (dbError) {
            console.error(
                'Gagal menutup koneksi database:',
                dbError.message
            );
        }

        process.exitCode = 1;
    }
}


// =====================================================
// 5. EXECUTE
// =====================================================

startServer();