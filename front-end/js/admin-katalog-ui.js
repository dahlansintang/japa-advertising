/* JAPA Advertising: perapian kartu katalog admin. Tidak melakukan request API atau mengubah data. */
(() => {
        'use strict';
        const grid = document.getElementById('admin-catalog-grid');
        if (!grid) return;

        const aksi = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        const cariTombol = (card, kata) => Array.from(card.querySelectorAll('button, a, input[type="button"]'))
            .find(el => (el.tagName === 'INPUT' ? (el.value || '').toLowerCase() : aksi(el)) === kata);

        function rapikan(card) {
            if (card.tagName === 'P' || card.matches('template, style, script')) return;
            if (card.dataset.japaCatalogStyled === '1') return;

            const edit = cariTombol(card, 'edit');
            const hapus = cariTombol(card, 'hapus');

            if (!edit || !hapus) return;
            card.dataset.japaCatalogStyled = '1';
            card.classList.add('japa-catalog-card');

            let footer = edit.parentElement === hapus.parentElement ? edit.parentElement : null;
            if (!footer || footer === card || footer.children.length !== 2 ||
                Array.from(footer.children).some(el => el !== edit && el !== hapus)) {
                footer = document.createElement('div');
                card.appendChild(footer);
                footer.appendChild(edit);
                footer.appendChild(hapus);
            }
            footer.classList.add('japa-catalog-footer');
            edit.classList.add('japa-btn-edit');
            hapus.classList.add('japa-btn-hapus');
            if (footer.parentElement !== card) card.appendChild(footer);
            else if (card.lastElementChild !== footer) card.appendChild(footer);

            const img = card.querySelector('img');
            let media = null;
            if (img) {
                if (img.parentElement === card) {
                    media = document.createElement('div');
                    media.className = 'japa-catalog-media';
                    card.insertBefore(media, img);
                    media.appendChild(img);
                } else if (img.parentElement.parentElement === card &&
                           img.parentElement.children.length === 1 &&
                           !img.parentElement.textContent.trim()) {
                    media = img.parentElement;
                    media.classList.add('japa-catalog-media');
                }
            } else {
                const first = card.firstElementChild;
                if (first && first !== footer && /gambar tidak valid|gambar tidak tersedia|no image/i.test(first.textContent || '')) {
                    first.classList.add('japa-catalog-media', 'japa-catalog-empty-image');
                    media = first;
                }
            }

            const content = Array.from(card.childNodes).filter(n =>
                n !== footer && n !== media && (n.nodeType !== Node.TEXT_NODE || n.textContent.trim()));
            if (content.length === 1 && content[0].nodeType === Node.ELEMENT_NODE &&
                content[0].tagName === 'DIV' && !content[0].contains(img) &&
                content[0].querySelectorAll('button, a').length === 0) {
                content[0].classList.add('japa-catalog-body');
            } else if (content.length > 0) {
                const body = document.createElement('div');
                body.className = 'japa-catalog-body';
                card.insertBefore(body, footer);
                for (const node of content) body.appendChild(node);
            }

            if (!media && img) {
                const body = card.querySelector('.japa-catalog-body');
                if (body && body.contains(img) && body.firstElementChild &&
                    (body.firstElementChild === img || body.firstElementChild.contains(img))) {
                    const first = body.firstElementChild;
                    const wrap = document.createElement('div');
                    wrap.className = 'japa-catalog-media';
                    card.insertBefore(wrap, body);
                    wrap.appendChild(first);
                }
            }

            const body = card.querySelector('.japa-catalog-body');
            if (body) {
                for (const el of body.querySelectorAll('p, span, strong, b, div')) {

                    if (el.children.length === 0 && /^Rp\s*[\d.,]+$/i.test(aksi(el))) {
                        el.classList.add('japa-catalog-price');
                    }
                }

                for (const node of Array.from(body.childNodes)) {
                    if (node.nodeType === Node.TEXT_NODE && /^\s*Rp\s*[\d.,]+\s*$/i.test(node.textContent)) {
                        const span = document.createElement('span');
                        span.className = 'japa-catalog-price';
                        node.replaceWith(span);
                        span.textContent = node.textContent;
                    }
                }
            }
        }

        function semuaKartu() {
            for (const item of Array.from(grid.children)) {
                if (item.nodeType === Node.ELEMENT_NODE) rapikan(item);
            }
        }
        let dijadwalkan = false;
        const observer = new MutationObserver(() => {
            if (dijadwalkan) return;
            dijadwalkan = true;
            queueMicrotask(() => { dijadwalkan = false; semuaKartu(); });
        });
        observer.observe(grid, { childList: true, subtree: true });
        semuaKartu();
    })();
