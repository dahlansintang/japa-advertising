'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof getCsrfToken === 'function') {
        try { await getCsrfToken(); } catch (e) {}
    }
    tampilkanProduk();
});

// 1. Fungsi mengambil data produk dari Back-End
async function tampilkanProduk() {
    const container = document.getElementById('product-container');
    if (!container) return;
    
    try {
        const response = await fetch('/api/produk');
        const result = await response.json();
        
        if (result.status === 'success') {
            container.replaceChildren(); 
            
            result.data.forEach(produk => {
                const formatHarga = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(produk.harga_estimasi);
                
                const card = document.createElement('div');
                card.className = 'card';

                const image = document.createElement('img');
                image.src = `/${produk.gambar_url || ''}`;
                image.alt = produk.nama_produk || '';

                const title = document.createElement('h3');
                title.textContent = produk.nama_produk || '';

                const description = document.createElement('p');
                description.textContent = produk.deskripsi || '';

                const price = document.createElement('h4');
                price.style.color = '#003366';
                price.textContent = formatHarga;

                const orderButton = document.createElement('button');
                orderButton.className = 'btn-pesan';
                orderButton.textContent = 'Pesan Sekarang';
                orderButton.addEventListener('click', () => bukaModal(produk.id_produk, produk.nama_produk));

                card.appendChild(image);
                card.appendChild(title);
                card.appendChild(description);
                card.appendChild(price);
                card.appendChild(orderButton);
                container.appendChild(card);
            });
        }
    } catch (error) {
        const errorMessage = document.createElement('p');
        errorMessage.style.color = 'red';
        errorMessage.textContent = 'Gagal memuat katalog produk.';
        container.replaceChildren(errorMessage);
        console.error('Error fetching data:', error);
    }
}

// 2. Fungsi membuka dan menutup Modal
function bukaModal(id_produk, nama_produk) {
    const idInput = document.getElementById('id_produk');
    const nameEl = document.getElementById('modal-product-name');
    const modal = document.getElementById('orderModal');

    if (idInput) idInput.value = id_produk;
    if (nameEl) nameEl.innerText = 'Pesan: ' + nama_produk;
    if (modal) modal.style.display = 'block';
}

function tutupModal() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'none';
}

// 3. Fungsi mengirim data pesanan ke API Back-End (Tombol Submit) menggunakan csrfFetch
async function submitOrder(event) {
    event.preventDefault();
    
    const id_produk = document.getElementById('id_produk').value;
    const detail_ukuran = document.getElementById('detail_ukuran').value;
    const id_user = 1; 

    try {
        let response;
        const payload = {
            id_user: id_user,
            id_produk: id_produk,
            detail_ukuran: detail_ukuran
        };

        if (typeof csrfFetch === 'function') {
            response = await csrfFetch('/api/pesanan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } else {
            response = await fetch('/api/pesanan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
        }

        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
            alert('Berhasil! Pesanan Anda telah masuk sistem PT Japa Prabu.');
            tutupModal();
            const form = document.getElementById('orderForm');
            if (form) form.reset();
        } else {
            alert('Gagal mengirim pesanan: ' + (result.message || 'Kesalahan server.'));
        }
    } catch (error) {
        console.error('Error API:', error);
        alert('Terjadi kesalahan jaringan saat mengirim pesanan.');
    }
}