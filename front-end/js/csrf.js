'use strict';

/*
 * CSRF client helper - Japa Prabu Advertising
 *
 * Pastikan file ini dimuat pada halaman yang melakukan request API.
 * Untuk request mutasi gunakan csrfFetch(), bukan fetch() langsung.
 */

let csrfToken = null;
let csrfTokenPromise = null;
let csrfGeneration = 0;

const CSRF_ENDPOINT = '/api/auth/csrf';
const CSRF_HEADER = 'X-CSRF-Token';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_ERROR_MESSAGES = new Set([
    'CSRF token tidak tersedia. Silakan ambil token terlebih dahulu.',
    'CSRF token tidak tersedia atau formatnya tidak valid.',
    'CSRF token tidak valid.'
]);

/**
 * Mengambil token dari server. Hasil hanya disimpan jika belum ada
 * perubahan session selama proses pengambilan token berlangsung.
 */
async function refreshCsrfToken() {
    if (csrfTokenPromise) {
        return csrfTokenPromise;
    }

    const generationAtStart = csrfGeneration;

    const requestPromise = (async () => {
        const response = await fetch(CSRF_ENDPOINT, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: {
                'Accept': 'application/json'
            }
        });

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error('Respons server untuk CSRF tidak valid.');
        }

        if (!response.ok || !data || typeof data.csrfToken !== 'string') {
            throw new Error(
                data?.message || 'Gagal mendapatkan CSRF token.'
            );
        }

        if (!/^[a-f0-9]{64}$/i.test(data.csrfToken)) {
            throw new Error('Format CSRF token dari server tidak valid.');
        }

        if (generationAtStart !== csrfGeneration) {
            throw new Error(
                'Session berubah saat mengambil CSRF token. Silakan coba kembali.'
            );
        }

        csrfToken = data.csrfToken;
        return csrfToken;
    })();

    csrfTokenPromise = requestPromise;

    try {
        return await requestPromise;
    } finally {

        if (csrfTokenPromise === requestPromise) {
            csrfTokenPromise = null;
        }
    }
}

async function getCsrfToken() {
    if (csrfToken) {
        return csrfToken;
    }

    return refreshCsrfToken();
}

function clearCsrfToken() {
    csrfGeneration += 1;
    csrfToken = null;
    csrfTokenPromise = null;
}

async function csrfFetch(url, options = {}) {
    const method = String(options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers || {});

    if (UNSAFE_METHODS.has(method)) {
        const token = await getCsrfToken();
        headers.set(CSRF_HEADER, token);
    }

    const response = await fetch(url, {
        ...options,
        method,
        headers,
        credentials: options.credentials || 'same-origin'
    });

    if (response.status === 403 && UNSAFE_METHODS.has(method)) {

        let responseData = null;
        try {
            responseData = await response.clone().json();
        } catch {
        }

        if (
            responseData &&
            (
                CSRF_ERROR_MESSAGES.has(responseData.message) ||
                /csrf/i.test(String(responseData.code || ''))
            )
        ) {
            clearCsrfToken();
        }
    }

    return response;
}

/**
 * Dipanggil setelah login/logout sukses atau setelah aplikasi mengganti akun.
 * Mengambil token baru yang terikat pada session terbaru.
 */
async function renewCsrfToken() {
    clearCsrfToken();
    return refreshCsrfToken();
}

/*
 * Ekspos fungsi secara eksplisit agar dapat digunakan dari file JavaScript
 * frontend lain. Nama fungsi global yang sudah dipakai tetap dipertahankan.
 */
if (typeof window !== 'undefined') {
    window.refreshCsrfToken = refreshCsrfToken;
    window.getCsrfToken = getCsrfToken;
    window.csrfFetch = csrfFetch;
    window.clearCsrfToken = clearCsrfToken;
    window.renewCsrfToken = renewCsrfToken;

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await getCsrfToken();
            console.info('CSRF token berhasil disiapkan.');
        } catch (error) {
            console.error('Gagal menyiapkan CSRF token:', error);
        }
    });
}
