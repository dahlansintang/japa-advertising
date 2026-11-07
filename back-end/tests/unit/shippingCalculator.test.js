'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateShippingQuotes, calculateSelectedShipping } = require('../../utils/shippingCalculator');

test('menghasilkan opsi ongkir untuk tujuan dan berat valid', () => {
    const quotes = calculateShippingQuotes('Sintang', 'Kalimantan Barat', 1500);
    assert.ok(Array.isArray(quotes));
    assert.ok(quotes.length > 0);
    assert.ok(quotes.every(q => Number.isFinite(q.cost) && q.cost >= 0));
});

test('menolak berat di luar batas', () => {
    assert.throws(() => calculateShippingQuotes('Sintang', 'Kalimantan Barat', 0));
    assert.throws(() => calculateShippingQuotes('Sintang', 'Kalimantan Barat', 100001));
});

test('memilih layanan ongkir dengan kode yang sama persis', () => {
    const quotes = calculateShippingQuotes('Sintang', 'Kalimantan Barat', 1000);
    const selected = calculateSelectedShipping('Sintang', 'Kalimantan Barat', 1000, quotes[0].code);
    assert.equal(selected.code, quotes[0].code);
});

test('menolak kode layanan parsial atau ambigu', () => {
    assert.throws(() => calculateSelectedShipping('Sintang', 'Kalimantan Barat', 1000, 'JNE'));
    assert.throws(() => calculateSelectedShipping('Sintang', 'Kalimantan Barat', 1000, 'REG'));
});
