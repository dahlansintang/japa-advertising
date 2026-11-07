'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // =========================================
    // ELEMEN HALAMAN
    // =========================================

    const alertBox = document.getElementById('alert-message');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');

    // =========================================
    // FUNGSI ALERT
    // =========================================

    function showAlert(message, type = 'error') {
        if (!alertBox) return;

        alertBox.className = `alert-msg alert-${type}`;
        alertBox.textContent = message;
        alertBox.style.display = 'block';
    }

    function hideAlert() {
        if (!alertBox) return;

        alertBox.style.display = 'none';
        alertBox.textContent = '';
    }

    // =========================================
    // FUNGSI MEMBACA RESPONSE JSON
    // =========================================

    async function readResponse(response) {
        try {
            return await response.json();
        } catch {
            throw new Error('Respons server tidak dapat dibaca.');
        }
    }

    // =========================================
    // FUNGSI PERGANTIAN TAB
    // =========================================

    function switchTab(tabName) {
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });

        hideAlert();

        if (tabName === 'login') {
            document.getElementById('tabLoginBtn')?.classList.add('active');
            document.getElementById('section-login')?.classList.add('active');
        } else {
            document.getElementById('tabRegisterBtn')?.classList.add('active');
            document.getElementById('section-register')?.classList.add('active');
        }
    }

    document.getElementById('tabLoginBtn')?.addEventListener('click', () => {
        switchTab('login');
    });

    document.getElementById('tabRegisterBtn')?.addEventListener('click', () => {
        switchTab('register');
    });

    // =========================================
    // LUPA PASSWORD
    // =========================================

    document.getElementById('forgotPasswordLink')?.addEventListener('click', event => {
        event.preventDefault();

        alert(
            'Fitur pemulihan password silakan hubungi admin via WhatsApp atau Email.'
        );
    });

    // =========================================
    // PROSES LOGIN
    // =========================================

    if (loginForm) {
        loginForm.addEventListener('submit', async event => {
            event.preventDefault();

            hideAlert();

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                showAlert('Email dan password wajib diisi.');
                return;
            }

            if (loginSubmitBtn) {
                loginSubmitBtn.disabled = true;
                loginSubmitBtn.textContent = 'Memproses...';
            }

            try {

                if (typeof getCsrfToken === 'function') {
                    await getCsrfToken();
                }

                let response;
                const payload = { email, password };

                if (typeof csrfFetch === 'function') {
                    response = await csrfFetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });
                } else {
                    response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify(payload)
                    });
                }

                const result = await readResponse(response);

                if (response.ok && result.status === 'success') {
                    const userRole = String(result.role || '')
                        .toLowerCase()
                        .trim();

                    if (typeof clearCsrfToken === 'function') {
                        clearCsrfToken();
                    }

                    if (userRole === 'admin') {
                        window.location.replace('/pages/admin.html');
                    } else if (userRole === 'customer'|| userRole === 'pelanggan') {
                        window.location.replace('/pages/customer.html');
                    } else {
                        showAlert(
                            'Login berhasil, tetapi role akun tidak dikenali. Hubungi administrator.'
                        );
                    }

                    return;
                }

                showAlert(result.message || 'Login gagal.');

            } catch (error) {
                console.error('Kesalahan login:', error);

                showAlert(
                    error.message || 'Terjadi kesalahan saat menghubungi server.'
                );

            } finally {
                if (loginSubmitBtn) {
                    loginSubmitBtn.disabled = false;
                    loginSubmitBtn.textContent = 'Masuk';
                }
            }
        });
    }

    // =========================================
    // PROSES PENDAFTARAN PELANGGAN
    // =========================================

    if (registerForm) {
        registerForm.addEventListener('submit', async event => {
            event.preventDefault();

            hideAlert();

            const nama_lengkap = document
                .getElementById('reg-nama')
                .value.trim();

            const email = document
                .getElementById('reg-email')
                .value.trim();

            const no_telp = document
                .getElementById('reg-telp')
                .value.trim();

            const alamat = document
                .getElementById('reg-alamat')
                .value.trim();

            const password = document
                .getElementById('reg-password')
                .value;

            if (!nama_lengkap || !email || !password) {
                showAlert('Nama lengkap, email, dan password wajib diisi.');
                return;
            }

            if (!registerForm.checkValidity()) {
                registerForm.reportValidity();
                return;
            }

            if (registerSubmitBtn) {
                registerSubmitBtn.disabled = true;
                registerSubmitBtn.textContent = 'Mendaftarkan...';
            }

            try {

                if (typeof getCsrfToken === 'function') {
                    await getCsrfToken();
                }

                let response;
                const payload = { nama_lengkap, email, no_telp, alamat, password };

                if (typeof csrfFetch === 'function') {
                    response = await csrfFetch('/api/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });
                } else {
                    response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify(payload)
                    });
                }

                const result = await readResponse(response);

                if (response.ok && result.status === 'success') {
                    showAlert(
                        'Pendaftaran berhasil! Silakan masuk menggunakan akun Anda.',
                        'success'
                    );

                    registerForm.reset();

                    setTimeout(() => {
                        switchTab('login');
                    }, 2000);

                    return;
                }

                showAlert(result.message || 'Pendaftaran gagal.');

            } catch (error) {
                console.error('Kesalahan pendaftaran:', error);

                showAlert(
                    error.message || 'Terjadi kesalahan saat menghubungi server.'
                );

            } finally {
                if (registerSubmitBtn) {
                    registerSubmitBtn.disabled = false;
                    registerSubmitBtn.textContent = 'Daftar Akun';
                }
            }
        });
    }

});