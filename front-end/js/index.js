'use strict';

let globalProduk = [];

async function muatKatalogPublik() {
    const container = document.getElementById('product-container');
    if (!container) return;

    try {
        const response = await fetch('/api/produk');
        const result = await response.json();

        if (result.status === 'success') {
            globalProduk = result.data;
            container.replaceChildren();

            if (!Array.isArray(globalProduk) || globalProduk.length === 0) {
                const emptyMessage = document.createElement('p');
                emptyMessage.style.cssText = 'grid-column: 1 / -1; text-align: center; color: #64748b;';
                emptyMessage.textContent = 'Belum ada produk.';
                container.appendChild(emptyMessage);
                return;
            }

            globalProduk.forEach(p => {
                let imgSrc = 'https://via.placeholder.com/400x300?text=Tanpa+Gambar';
                if (p.gambar_url) {
                    try {
                        const imgs = JSON.parse(p.gambar_url);
                        if (Array.isArray(imgs) && imgs.length > 0) imgSrc = `/${imgs[0]}`;
                        else imgSrc = `/${p.gambar_url}`;
                    } catch(e) {
                        imgSrc = `/${p.gambar_url}`;
                    }
                }

                const card = document.createElement('div');
                card.className = 'product-card';

                const imgEl = document.createElement('img');
                imgEl.src = imgSrc;
                imgEl.className = 'product-img';
                imgEl.alt = p.nama_produk;
                imgEl.addEventListener('click', () => bukaModal(p.id_produk));
                imgEl.addEventListener('error', function() {
                    this.src = 'https://via.placeholder.com/400x300?text=Error';
                });

                const bodyDiv = document.createElement('div');
                bodyDiv.className = 'product-body';

                const titleEl = document.createElement('h3');
                titleEl.className = 'product-title';
                titleEl.textContent = p.nama_produk;
                titleEl.addEventListener('click', () => bukaModal(p.id_produk));

                const descEl = document.createElement('p');
                descEl.className = 'product-desc';
                descEl.textContent = p.deskripsi || 'Tidak ada deskripsi';

                const bahanEl = document.createElement('p');
                bahanEl.style.cssText = 'font-size:13px; color:#334155;';
                const bahanLabel = document.createElement('strong');
                bahanLabel.textContent = 'Bahan: ';
                bahanEl.appendChild(bahanLabel);
                bahanEl.appendChild(document.createTextNode(p.bahan || '-'));

                const beratEl = document.createElement('p');
                beratEl.style.cssText = 'font-size:13px; color:#334155; margin-top: 4px;';
                const beratLabel = document.createElement('strong');
                beratLabel.textContent = 'Berat: ';
                beratEl.appendChild(beratLabel);
                beratEl.appendChild(document.createTextNode(p.berat ? `${p.berat} Gram` : '-'));

                const priceEl = document.createElement('div');
                priceEl.className = 'product-price';
                priceEl.textContent = `Rp ${Number(p.harga_estimasi).toLocaleString('id-ID')}`;

                bodyDiv.appendChild(titleEl);
                bodyDiv.appendChild(descEl);
                bodyDiv.appendChild(bahanEl);
                bodyDiv.appendChild(beratEl);
                bodyDiv.appendChild(priceEl);

                const footerDiv = document.createElement('div');
                footerDiv.className = 'product-footer';

                const btnPesan = document.createElement('button');
                btnPesan.className = 'btn-pesan';
                btnPesan.textContent = 'Pesan Sekarang';
                btnPesan.addEventListener('click', () => bukaModal(p.id_produk));

                footerDiv.appendChild(btnPesan);

                card.appendChild(imgEl);
                card.appendChild(bodyDiv);
                card.appendChild(footerDiv);
                container.appendChild(card);
            });
        }
    } catch (err) {
        console.error(err);
        const errorMessage = document.createElement('p');
        errorMessage.style.cssText = 'grid-column: 1 / -1; text-align: center; color: red;';
        errorMessage.textContent = 'Gagal memuat katalog produk.';
        container.replaceChildren(errorMessage);
    }
}

function bukaModal(id_produk) {
    const produk = globalProduk.find(p => p.id_produk === id_produk);
    if (!produk) return;

    let images = [];
    if (produk.gambar_url) {
        try {
            images = JSON.parse(produk.gambar_url);
            if (!Array.isArray(images)) images = [produk.gambar_url];
        } catch (e) {
            images = [produk.gambar_url];
        }
    }

    const mainImg = images.length > 0 ? `/${images[0]}` : 'https://via.placeholder.com/600x400?text=Tanpa+Gambar';

    const nameEl = document.getElementById('modal-product-name');
    const imgEl = document.getElementById('modal-product-img');
    const descEl = document.getElementById('modal-product-desc');
    const bahanEl = document.getElementById('modal-product-bahan');
    const priceEl = document.getElementById('modal-product-price');

    if (nameEl) nameEl.innerText = produk.nama_produk;
    if (imgEl) imgEl.src = mainImg;
    if (descEl) descEl.innerText = produk.deskripsi || 'Tidak ada deskripsi rinci.';
    if (bahanEl) bahanEl.innerText = produk.bahan || '-';
    if (priceEl) priceEl.innerText = 'Rp ' + Number(produk.harga_estimasi).toLocaleString('id-ID');

    const thumbContainer = document.getElementById('modal-thumbnails');
    if (thumbContainer) {
        thumbContainer.replaceChildren();
        if (images.length > 1) {
            images.forEach(img => {
                const thumb = document.createElement('img');
                thumb.src = `/${img}`;
                thumb.className = 'thumbnail-img';
                thumb.addEventListener('click', () => {
                    if (imgEl) imgEl.src = `/${img}`;
                });
                thumbContainer.appendChild(thumb);
            });
        }
    }

    const btnPesan = document.getElementById('btnPesanSekarang');
    if (btnPesan) {
        btnPesan.onclick = () => {
            window.location.href = '/pages/login.html';
        };
    }

    const modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'flex';
}

function tutupModal() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', async () => {

    if (typeof getCsrfToken === 'function') {
        try { await getCsrfToken(); } catch (e) {}
    }

    muatKatalogPublik();

    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', tutupModal);
    }

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('orderModal');
        if (e.target === modal) {
            tutupModal();
        }
    });
});