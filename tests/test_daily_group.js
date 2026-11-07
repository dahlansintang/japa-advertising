'use strict';
/* Regression test terisolasi: tidak mengubah database localhost. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const controllerPath = path.resolve(__dirname, '../back-end/controllers/orderController.js');
const source = fs.readFileSync(controllerPath, 'utf8');

function sampleCart() {
    return [
        { id_keranjang: 1, id_produk: 31, nama_produk: 'Neon Box', jumlah: 2, detail_ukuran: '2x1', harga_estimasi: 100000, berat: 1000 },
        { id_keranjang: 2, id_produk: 32, nama_produk: 'Banner', jumlah: 1, detail_ukuran: '1x2', harga_estimasi: 50000, berat: 1500 }
    ];
}

function testHarness({ items = sampleCart(), isoNow = '2026-11-07T05:00:00.000Z', counter = new Map(), failAtInsert = 0, rejectCounter = false } = {}) {
    const log = { inserts: [], statements: [], committed: false, rolledBack: false, released: false };
    let pendingCounter = null;
    let insertNumber = 0;
    class FixedDate extends Date {
        constructor(...args) { super(...(args.length ? args : [isoNow])); }
        static now() { return new Date(isoNow).valueOf(); }
    }
    const connection = {
        async beginTransaction() { log.began = true; },
        async commit() {
            if (pendingCounter) counter.set(pendingCounter.date, pendingCounter.value);
            log.committed = true;
        },
        async rollback() { log.rolledBack = true; },
        release() { log.released = true; },
        async query(sql, params = []) {
            log.statements.push({ sql, params });
            if (/FROM keranjang k/i.test(sql)) return [items];
            if (/INSERT INTO checkout_group_counter/i.test(sql)) {
                if (rejectCounter) throw new Error('counter table missing');
                const date = params[0];
                const value = (counter.get(date) || 0) + 1;
                pendingCounter = { date, value };
                return [{ affectedRows: 1 }];
            }
            if (/SELECT LAST_INSERT_ID\(\)/i.test(sql)) {
                if (!pendingCounter) throw new Error('Counter tidak diupdate');
                return [[{nomor_urut: pendingCounter.value}]];
            }
            if (/INSERT INTO pesanan/i.test(sql)) {
                insertNumber++;
                if (failAtInsert === insertNumber) throw new Error('Simulasi DB insert gagal');
                log.inserts.push(params);
                return [{ insertId: 100 + insertNumber }];
            }
            if (/SELECT id_user FROM users/i.test(sql)) return [[{ id_user: 999 }]];
            if (/INSERT INTO notifikasi/i.test(sql)) return [{ insertId: 1 }];
            if (/DELETE FROM keranjang/i.test(sql)) return [{ affectedRows: items.length }];
            throw new Error('Query tak terduga: ' + sql.slice(0, 80));
        }
    };
    const db = { getConnection: async () => connection };
    const exports = {};
    vm.runInNewContext(source, {
        exports, Date: FixedDate, Intl,
        console: { ...console, error: () => {} },
        require: (dependency) => {
            if (dependency === '../config/db') return db;
            if (dependency === '../utils/shippingCalculator') return {
                calculateSelectedShipping: () => ({ cost: 9000, courier: 'Lokal', service: 'Standar', code: 'LOCAL' })
            };
            throw new Error('Dependensi di luar scope: ' + dependency);
        }
    }, { filename: 'orderController.js' });
    const req = {
        session: { userId: 12, role: 'pelanggan' },
        body: { alamat_pengiriman: 'Jalan Contoh No. 1', metode_pembayaran: 'Transfer Bank BCA', destinationName: 'Sintang', provinceName: 'Kalimantan Barat', serviceCode: 'LOCAL' }
    };
    const res = {
        statusCode: 200, payload: null,
        status(code) { this.statusCode = code; return this; },
        json(value) { this.payload = value; return this; }
    };
    return { exports, req, res, log, counter };
}

(async () => {
    const counter = new Map();
    const one = testHarness({ counter });
    await one.exports.buatPesananKeranjang(one.req, one.res);
    assert.equal(one.res.statusCode, 201);
    assert.equal(one.res.payload.data.id_grup_pesanan, 'JAPA-20261107-0001');
    assert.equal(one.log.inserts.length, 2);
    assert.equal(one.log.inserts[0][0], one.log.inserts[1][0]);
    assert.equal(one.log.inserts[0][0], one.res.payload.data.id_grup_pesanan);
    assert.equal(one.log.committed, true);
    assert.equal(one.log.released, true);
    assert.equal(one.res.payload.data.total_harga, 259000);
    assert.equal(one.res.payload.data.items.reduce((sum, item) => sum + item.total_harga, 0), 259000);

    const two = testHarness({ counter });
    await two.exports.buatPesananKeranjang(two.req, two.res);
    assert.equal(two.res.payload.data.id_grup_pesanan, 'JAPA-20261107-0002');

    const tomorrow = testHarness({ counter, isoNow: '2026-11-07T17:00:05Z' });
    await tomorrow.exports.buatPesananKeranjang(tomorrow.req, tomorrow.res);
    assert.equal(tomorrow.res.payload.data.id_grup_pesanan, 'JAPA-20261108-0001');

    const failed = testHarness({ counter, failAtInsert: 2 });
    await failed.exports.buatPesananKeranjang(failed.req, failed.res);
    assert.equal(failed.res.statusCode, 500);
    assert.equal(failed.log.rolledBack, true);
    assert.equal(failed.log.committed, false);
    assert.equal(counter.get('2026-11-07'), 2);

    const afterFailed = testHarness({ counter });
    await afterFailed.exports.buatPesananKeranjang(afterFailed.req, afterFailed.res);
    assert.equal(afterFailed.res.payload.data.id_grup_pesanan, 'JAPA-20261107-0003');

    const empty = testHarness({ items: [] });
    await empty.exports.buatPesananKeranjang(empty.req, empty.res);
    assert.equal(empty.res.statusCode, 400);
    assert.equal(empty.log.rolledBack, true);
    assert.equal(empty.log.statements.some(s => /checkout_group_counter/.test(s.sql)), false);

    const tooMany = testHarness({ counter: new Map([['2026-11-07', 9999]]) });
    await tooMany.exports.buatPesananKeranjang(tooMany.req, tooMany.res);
    assert.equal(tooMany.res.statusCode, 500);
    assert.equal(tooMany.log.rolledBack, true);
    assert.equal(tooMany.log.inserts.length, 0);

    const noMigration = testHarness({ rejectCounter: true });
    await noMigration.exports.buatPesananKeranjang(noMigration.req, noMigration.res);
    assert.equal(noMigration.res.statusCode, 500);
    assert.equal(noMigration.log.rolledBack, true);

    console.log('OK: format JAPA-YYYYMMDD-NNNN, 2 item satu grup, urut harian, reset tanggal Asia/Pontianak, jumlah benar, rollback, batas 9999, migrasi wajib.');
})().catch(err => { console.error(err); process.exitCode = 1; });
