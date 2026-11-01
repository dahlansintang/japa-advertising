document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');

        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.innerText = '';
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password }),
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                
                const userRole = result.role ? String(result.role).toLowerCase().trim() : '';

                if (userRole === 'admin') {
                    window.location.href = '/pages/admin.html';
                } else {
                    window.location.href = '/pages/customer.html';
                }
            } else {
                if (errorMessage) {
                    errorMessage.innerText = result.message || 'Login gagal.';
                    errorMessage.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Terjadi kesalahan jaringan:', error);
            if (errorMessage) {
                errorMessage.innerText = 'Terjadi kesalahan jaringan.';
                errorMessage.style.display = 'block';
            }
        }
    });
});