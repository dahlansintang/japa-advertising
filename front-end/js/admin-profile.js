'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profileForm');
    const alertBox = document.getElementById('alert-box');
    const nameInput = document.getElementById('nama_lengkap');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('no_telp');
    const oldPasswordInput = document.getElementById('password_lama');
    const newPasswordInput = document.getElementById('password_baru');
    const submitButton = form?.querySelector('[type="submit"]');

    let currentAddress = '';

    let csrfToken = '';

    let csrfTokenPromise = null;

    function showMessage(message, success = false) {
        if (!alertBox) {
            window.alert(message);
            return;
        }

        alertBox.textContent = message;
        alertBox.className = `alert ${success ? 'alert-success' : 'alert-error'}`;
        alertBox.style.display = 'block';
    }

    async function loadCsrfToken(forceRefresh = false) {
        if (csrfToken && !forceRefresh) {
            return csrfToken;
        }

        if (csrfTokenPromise && !forceRefresh) {
            return csrfTokenPromise;
        }

        csrfTokenPromise = (async () => {
            const response = await fetch('/api/auth/csrf', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                },
                cache: 'no-store'
            });

            let result;

            try {
                result = await response.json();
            } catch (_) {
                throw new Error('Respons token CSRF dari server tidak valid.');
            }

            if (!response.ok) {
                throw new Error(
                    result.message || 'Gagal memperoleh token keamanan CSRF.'
                );
            }

            const token =
                result.csrfToken ||
                result.data?.csrfToken;

            if (
                typeof token !== 'string' ||
                token.trim() === ''
            ) {
                throw new Error('Token CSRF tidak tersedia dari server.');
            }

            csrfToken = token;
            return csrfToken;
        })();

        try {
            return await csrfTokenPromise;
        } finally {
            csrfTokenPromise = null;
        }
    }

    async function requestJSON(url, options = {}) {
        const method = (options.method || 'GET').toUpperCase();

        const headers = {
            'Accept': 'application/json',
            ...(options.headers || {})
        };

        const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

        if (!safeMethods.includes(method)) {
            if (!csrfToken) {
                await loadCsrfToken();
            }

            headers['X-CSRF-Token'] = csrfToken;
        }

        const response = await fetch(url, {
            ...options,
            method,
            credentials: 'include',
            headers,
            cache: options.cache || 'no-store'
        });

        let result;

        try {
            result = await response.json();
        } catch (_) {
            throw new Error('Respons server tidak valid.');
        }

        if (response.status === 403) {
            const message = result.message || 'Akses ditolak.';

            if (/csrf|token keamanan/i.test(message)) {
                csrfToken = '';
                throw new Error(
                    'Token keamanan tidak valid atau kedaluwarsa. Silakan muat ulang halaman.'
                );
            }

            throw new Error(message);
        }

        if (!response.ok) {
            throw new Error(result.message || 'Permintaan gagal.');
        }

        return result;
    }

    /**
     * Mengambil data profil admin dari backend.
     */
    async function loadProfile() {
        try {
            const result = await requestJSON('/api/admin/profile');

            if (
                result.status !== 'success' ||
                !result.data
            ) {
                throw new Error(
                    result.message || 'Data profil tidak ditemukan.'
                );
            }

            const user = result.data;

            if (nameInput) {
                nameInput.value = user.nama_lengkap || '';
            }

            if (emailInput) {
                emailInput.value = user.email || '';
            }

            if (phoneInput) {
                phoneInput.value = user.no_telp || '';
            }

            currentAddress =
                typeof user.alamat === 'string'
                    ? user.alamat
                    : '';

            const header = document.getElementById('adminEmailHeader');

            if (header) {
                header.textContent = user.email || '';
            }

        } catch (error) {
            showMessage(
                error.message || 'Sesi berakhir. Silakan login kembali.'
            );

            if (
                error.message &&
                /sesi|login|akses|unauthorized|forbidden/i.test(error.message)
            ) {
                window.setTimeout(() => {
                    window.location.href = '/pages/login.html';
                }, 1200);
            }
        }
    }

    /**
     * Memperbarui profil admin.
     */
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!form.reportValidity()) {
                return;
            }

            const nama_lengkap = nameInput?.value.trim() || '';
            const no_telp = phoneInput?.value.trim() || '';
            const password_lama = oldPasswordInput?.value || '';
            const password_baru = newPasswordInput?.value || '';

            if (!nama_lengkap) {
                showMessage('Nama lengkap wajib diisi.');
                return;
            }

            if (password_baru && !password_lama) {
                showMessage(
                    'Masukkan password lama untuk mengubah password.'
                );
                return;
            }

            if (
                password_baru &&
                !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password_baru)
            ) {
                showMessage(
                    'Password baru minimal 8 karakter serta mengandung huruf besar, huruf kecil, angka, dan karakter spesial.'
                );
                return;
            }

            if (alertBox) {
                alertBox.style.display = 'none';
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Menyimpan...';
            }

            try {

                await loadCsrfToken();

                const result = await requestJSON(
                    '/api/admin/profile',
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            nama_lengkap,
                            no_telp,
                            alamat: currentAddress,
                            password_lama,
                            password_baru
                        })
                    }
                );

                if (result.status !== 'success') {
                    throw new Error(
                        result.message || 'Gagal memperbarui profil.'
                    );
                }

                showMessage(
                    result.message || 'Profil berhasil diperbarui.',
                    true
                );

                if (oldPasswordInput) {
                    oldPasswordInput.value = '';
                }

                if (newPasswordInput) {
                    newPasswordInput.value = '';
                }

                await loadProfile();

            } catch (error) {
                showMessage(
                    error.message || 'Terjadi kesalahan jaringan.'
                );

            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Simpan Perubahan';
                }
            }
        });
    }

    loadProfile();
});