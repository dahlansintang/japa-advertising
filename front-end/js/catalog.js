'use strict';

async function muatKatalogPublik() {
    const container = document.getElementById('catalog-container');
    if (!container) return;

    try {
        const response = await fetch('/api/produk');
        const result = await response.json();

        if (result.status === 'success') {
            container.replaceChildren();
            if (!Array.isArray(result.data) || result.data.length === 0) {
                const emptyMessage = document.createElement('p');
                emptyMessage.style.cssText = 'grid-column: 1 / -1; text-align: center; color: #64748b;';
                emptyMessage.textContent = 'Belum ada produk tersedia.';
                container.appendChild(emptyMessage);
                return;
            }

            result.data.forEach(produk => {
                const card = document.createElement('div');
                card.className = 'product-card';

                const bodyDiv = document.createElement('div');
                bodyDiv.className = 'product-body';

                const title = document.createElement('h3');
                title.className = 'product-title';
                title.textContent = produk.nama_produk;

                const desc = document.createElement('p');
                desc.className = 'product-desc';
                desc.textContent = produk.deskripsi || 'Tidak ada deskripsi.';

                const meta = document.createElement('p');
                meta.className = 'product-meta';
                const metaLabel = document.createElement('strong');
                metaLabel.textContent = 'Bahan: ';
                meta.appendChild(metaLabel);
                meta.appendChild(document.createTextNode(produk.bahan || '-'));

                const price = document.createElement('div');
                price.className = 'product-price';
                price.textContent = `Rp ${Number(produk.harga_estimasi).toLocaleString('id-ID')}`;

                bodyDiv.appendChild(title);
                bodyDiv.appendChild(desc);
                bodyDiv.appendChild(meta);
                bodyDiv.appendChild(price);

                const footerDiv = document.createElement('div');
                footerDiv.className = 'product-footer';

                const btnOrder = document.createElement('button');
                btnOrder.className = 'btn-order';
                btnOrder.textContent = 'Pesan Sekarang';
                btnOrder.addEventListener('click', () => openModal(produk.id_produk, produk.nama_produk));

                footerDiv.appendChild(btnOrder);

                card.appendChild(bodyDiv);
                card.appendChild(footerDiv);
                container.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Gagal memuat katalog:', error);
        const errorMessage = document.createElement('p');
        errorMessage.style.cssText = 'grid-column: 1 / -1; text-align: center; color: red;';
        errorMessage.textContent = 'Gagal terhubung ke server produk.';
        container.replaceChildren(errorMessage);
    }
}

function openModal(idProduk, namaProduk) {
    const idInput = document.getElementById('selected_id_produk');
    const nameHeader = document.getElementById('modalProductName');
    const modal = document.getElementById('orderModal');

    if (idInput) idInput.value = idProduk;
    if (nameHeader) nameHeader.innerText = 'Pesan: ' + namaProduk;
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('orderModal');
    const form = document.getElementById('orderForm');

    if (modal) modal.style.display = 'none';
    if (form) form.reset();
}

document.addEventListener('DOMContentLoaded', () => {
    muatKatalogPublik();

    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id_produk = document.getElementById('selected_id_produk').value;
            const detail_ukuran = document.getElementById('order_detail')?.value || '';

            try {

                if (typeof getCsrfToken === 'function') {
                    await getCsrfToken();
                }

                const authResponse = await fetch('/api/auth/check', { credentials: 'include' });
                if (!authResponse.ok) {
                    window.location.href = '/pages/login.html';
                    return;
                }

                const params = new URLSearchParams({ id: id_produk, detail: detail_ukuran });
                window.location.href = `/pages/checkout.html?${params.toString()}`;
            } catch (error) {
                console.error('Gagal memulai checkout:', error);
                alert('Tidak dapat menghubungi server. Silakan coba kembali.');
            }
        });
    }

    const btnCancel = document.getElementById('btnCancelOrder');
    if (btnCancel) {
        btnCancel.addEventListener('click', closeModal);
    }
});