'use strict';

document.addEventListener('DOMContentLoaded', async () => {

    if (typeof getCsrfToken === 'function') {
        try { await getCsrfToken(); } catch (e) {}
    }

    try {
        const res = await fetch('/api/auth/profile', { credentials: 'include' });
        const result = await res.json();
        if (result.status === 'success') {
            const u = result.data;
            document.getElementById('nama_lengkap').value = u.nama_lengkap || '';
            document.getElementById('email').value = u.email || '';
            document.getElementById('no_telp').value = u.no_telp || '';
            document.getElementById('alamat').value = u.alamat || '';
            document.getElementById('customerEmailHeader').innerText = u.email;
        } else {
            alert('Sesi habis, silakan login kembali.');
            window.location.href = '/pages/login.html';
        }
    } catch (err) {
        console.error(err);
    }
});

const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nama_lengkap = document.getElementById('nama_lengkap').value;
        const no_telp = document.getElementById('no_telp').value;
        const alamat = document.getElementById('alamat').value;
        const password_lama = document.getElementById('password_lama').value;
        const password_baru = document.getElementById('password_baru').value;
        const alertBox = document.getElementById('alert-box');

        alertBox.style.display = 'none';

        try {
            let res;
            const payload = { nama_lengkap, no_telp, alamat, password_lama, password_baru };

            if (typeof csrfFetch === 'function') {
                res = await csrfFetch('/api/auth/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/auth/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });
            }

            const result = await res.json();

            alertBox.style.display = 'block';
            if (res.ok && result.status === 'success') {
                alertBox.className = 'alert alert-success';
                alertBox.innerText = result.message;

                document.getElementById('password_lama').value = '';
                document.getElementById('password_baru').value = '';
            } else {
                alertBox.className = 'alert alert-error';
                alertBox.innerText = result.message || 'Gagal memperbarui profil.';
            }
        } catch (err) {
            console.error(err);
            alertBox.style.display = 'block';
            alertBox.className = 'alert alert-error';
            alertBox.innerText = 'Terjadi kesalahan jaringan.';
        }
    });
}