const SERVICES = {
    'JNE REG (2-3 Hari)': { courier: 'JNE', service: 'REG', etd: '2-3 Hari', base: 18000 },
    'JNE YES (1-2 Hari)': { courier: 'JNE', service: 'YES', etd: '1-2 Hari', base: 30000 },
    'JNE ECO (3-5 Hari)': { courier: 'JNE', service: 'ECO', etd: '3-5 Hari', base: 15000 },
    'J&T EZ (2-3 Hari)': { courier: 'J&T Express', service: 'EZ', etd: '2-3 Hari', base: 17000 },
    'J&T ECO (3-5 Hari)': { courier: 'J&T Express', service: 'ECO', etd: '3-5 Hari', base: 12000 },
    'SiCepat REG (2-3 Hari)': { courier: 'SiCepat', service: 'REG', etd: '2-3 Hari', base: 17500 },
    'SiCepat BEST (1 Hari)': { courier: 'SiCepat', service: 'BEST', etd: '1 Hari', base: 29000 },
    'AnterAja Reguler (2-3 Hari)': { courier: 'AnterAja', service: 'Reguler', etd: '2-3 Hari', base: 16000 },
    'PICKUP_STORE': { courier: 'Ambil di Toko / Workshop', service: 'Pickup', etd: 'Ambil sendiri', base: 0 }
};

function getMultiplier(destinationName, provinceName) {
    const dest = String(destinationName || '').trim().toUpperCase();
    const prov = String(provinceName || '').trim().toUpperCase();

    if (dest.includes('BOGOR')) return 1.0;
    if (prov.includes('JAWA BARAT') || prov.includes('DKI JAKARTA') || prov.includes('BANTEN')) return 1.2;
    if (prov.includes('JAWA TENGAH') || prov.includes('DI YOGYAKARTA') || prov.includes('JAWA TIMUR')) return 1.5;
    return 2.2;
}

function calculateShippingQuotes(destinationName, provinceName, weightGrams) {
    if (typeof destinationName !== 'string' || !destinationName.trim() ||
        typeof provinceName !== 'string' || !provinceName.trim()) {
        throw new Error('Kabupaten/kota dan provinsi tujuan wajib diisi.');
    }

    const weight = Number(weightGrams);
    if (!Number.isSafeInteger(weight) || weight < 1 || weight > 100000) {
        throw new Error('Berat pengiriman harus antara 1 sampai 100.000 gram.');
    }

    const kg = Math.ceil(weight / 1000);
    const multiplier = getMultiplier(destinationName, provinceName);

    return Object.entries(SERVICES).map(([code, item]) => {
        const costPerKg = Math.round(item.base * multiplier);
        return {
            code,
            courier: item.courier,
            service: item.service,
            etd: item.etd,
            weight_kg: kg,
            cost: costPerKg * kg
        };
    });
}

function calculateSelectedShipping(destinationName, provinceName, weightGrams, serviceCode) {
    const quotes = calculateShippingQuotes(destinationName, provinceName, weightGrams);
    const quote = quotes.find(item => item.code === serviceCode);
    if (!quote) throw new Error('Layanan pengiriman tidak valid.');
    return quote;
}

module.exports = { SERVICES, calculateShippingQuotes, calculateSelectedShipping };