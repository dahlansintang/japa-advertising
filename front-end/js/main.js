document.addEventListener('DOMContentLoaded', () => {
    tampilkanProduk();
});

// 1. Fungsi mengambil data produk dari Back-End
async function tampilkanProduk() {
    const container = document.getElementById('product-container');
    
    try {
        const response = await fetch('/api/produk');
        const result = await response.json();
        
        if (result.status === 'success') {
            container.innerHTML = ''; 
            
            result.data.forEach(produk => {
                const formatHarga = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(produk.harga_estimasi);
                
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <img src="${produk.gambar_url}" alt="${produk.nama_produk}">
                    <h3>${produk.nama_produk}</h3>
                    <p>${produk.deskripsi}</p>
                    <h4 style="color: #003366;">${formatHarga}</h4>
                    <button class="btn-pesan" onclick="bukaModal(${produk.id_produk}, '${produk.nama_produk}')">Pesan Sekarang</button>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        container.innerHTML = '<p style="color:red;">Gagal memuat katalog produk.</p>';
        console.error('Error fetching data:', error);
    }
}

// 2. Fungsi membuka dan menutup Modal
function bukaModal(id_produk, nama_produk) {
    document.getElementById('id_produk').value = id_produk;
    document.getElementById('modal-product-name').innerText = 'Pesan: ' + nama_produk;
    document.getElementById('orderModal').style.display = 'block';
}

function tutupModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// 3. Fungsi mengirim data pesanan ke API Back-End (Tombol Submit)
async function submitOrder(event) {
    event.preventDefault();
    
    const id_produk = document.getElementById('id_produk').value;
    const detail_ukuran = document.getElementById('detail_ukuran').value;
    
    const id_user = 1; 

    try {
        const response = await fetch('/api/pesanan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_user: id_user,
                id_produk: id_produk,
                detail_ukuran: detail_ukuran
            })
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            alert('Berhasil! Pesanan Anda telah masuk sistem PT Japa Prabu.');
            tutupModal();
            document.getElementById('orderForm').reset();
        } else {
            alert('Gagal mengirim pesanan: ' + result.message);
        }
    } catch (error) {
        console.error('Error API:', error);
        alert('Terjadi kesalahan jaringan saat mengirim pesanan.');
    }
}