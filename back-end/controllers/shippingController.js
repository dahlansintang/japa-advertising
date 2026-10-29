const axios = require('axios');

// Data 38 Provinsi di Indonesia (Lokal & Mandiri)
const wilayahData = [
    { id: "11", name: "ACEH", kabupaten: ["KAB. ACEH BARAT", "KAB. ACEH BESAR", "KOTA BANDA ACEH", "KAB. ACEH SELATAN", "KAB. ACEH UTARA"] },
    { id: "12", name: "SUMATERA UTARA", kabupaten: ["KOTA MEDAN", "KAB. DELI SERDANG", "KAB. BATU BARA", "KOTA PEMATANGSIANTAR"] },
    { id: "13", name: "SUMATERA BARAT", kabupaten: ["KOTA PADANG", "KAB. PADANG PARIAMAN", "KOTA BUKITTINGGI"] },
    { id: "14", name: "RIAU", kabupaten: ["KOTA PEKANBARU", "KAB. KAMPAR", "KOTA DUMAI"] },
    { id: "15", name: "JAMBI", kabupaten: ["KOTA JAMBI", "KAB. BATANGHARI"] },
    { id: "16", name: "SUMATERA SELATAN", kabupaten: ["KOTA PALEMBANG", "KAB. BANYUASIN", "KOTA LUBUKLINGGAU"] },
    { id: "17", name: "BENGKULU", kabupaten: ["KOTA BENGKULU", "KAB. REJANG LEBONG"] },
    { id: "18", name: "LAMPUNG", kabupaten: ["KOTA BANDAR LAMPUNG", "KAB. LAMPUNG SELATAN", "KOTA METRO"] },
    { id: "19", name: "KEPULAUAN BANGKA BELITUNG", kabupaten: ["KOTA PANGKAL PINANG", "KAB. BANGKA"] },
    { id: "21", name: "KEPULAUAN RIAU", kabupaten: ["KOTA BATAM", "KOTA TANJUNG PINANG", "KAB. BINTAN"] },
    { id: "31", name: "DKI JAKARTA", kabupaten: ["KOTA JAKARTA PUSAT", "KOTA JAKARTA UTARA", "KOTA JAKARTA BARAT", "KOTA JAKARTA SELATAN", "KOTA JAKARTA TIMUR", "KAB. KEPULAUAN SERIBU"] },
    { id: "32", name: "JAWA BARAT", kabupaten: ["KAB. BOGOR", "KOTA BOGOR", "KAB. BEKASI", "KOTA BEKASI", "KOTA BANDUNG", "KAB. BANDUNG", "KAB. KARAWANG", "KAB. SUKABUMI", "KOTA DEPOK", "KOTA CIMAHI", "KOTA TASIKMALAYA"] },
    { id: "33", name: "JAWA TENGAH", kabupaten: ["KOTA SEMARANG", "KAB. SEMARANG", "KOTA SURAKARTA", "KAB. TEGAL", "KOTA TEGAL", "KAB. BANYUMAS", "KOTA SALATIGA", "KAB. KUDUS"] },
    { id: "34", name: "DI YOGYAKARTA", kabupaten: ["KOTA YOGYAKARTA", "KAB. SLEMAN", "KAB. BANTUL", "KAB. KULON PROGO", "KAB. GUNUNGKIDUL"] },
    { id: "35", name: "JAWA TIMUR", kabupaten: ["KOTA SURABAYA", "KAB. SIDOARJO", "KOTA MALANG", "KAB. MALANG", "KAB. JEMBER", "KOTA KEDIRI", "KOTA MADIUN", "KAB. BANYUWANGI"] },
    { id: "36", name: "BANTEN", kabupaten: ["KOTA TANGERANG", "KAB. TANGERANG", "KOTA TANGERANG SELATAN", "KOTA SERANG", "KAB. SERANG", "KAB. PANDEGLANG", "KAB. LEBAK"] },
    { id: "51", name: "BALI", kabupaten: ["KOTA DENPASAR", "KAB. BADUNG", "KAB. GIANYAR", "KAB. TABANAN", "KAB. BULELENG"] },
    { id: "52", name: "NUSA TENGGARA BARAT", kabupaten: ["KOTA MATARAM", "KOTA BIMA", "KAB. LOMBOK BARAT", "KAB. LOMBOK TIMUR"] },
    { id: "53", name: "NUSA TENGGARA TIMUR", kabupaten: ["KOTA KUPANG", "KAB. KUPANG", "KAB. MANGGARAI"] },
    { id: "61", name: "KALIMANTAN BARAT", kabupaten: ["KAB. SINTANG", "KOTA PONTIANAK", "KOTA SINGKAWANG", "KAB. KETAPANG", "KAB. SAMBAS", "KAB. SANGGAU", "KAB. MELAWI", "KAB. KAPUAS HULU"] },
    { id: "62", name: "KALIMANTAN TENGAH", kabupaten: ["KOTA PALANGKARAYA", "KAB. KOTAWARINGIN BARAT"] },
    { id: "63", name: "KALIMANTAN SELATAN", kabupaten: ["KOTA BANJARMASIN", "KOTA BANJARBARU"] },
    { id: "64", name: "KALIMANTAN TIMUR", kabupaten: ["KOTA SAMARINDA", "KOTA BALIKPAPAN"] },
    { id: "65", name: "KALIMANTAN UTARA", kabupaten: ["KOTA TARAKAN"] },
    { id: "71", name: "SULAWESI UTARA", kabupaten: ["KOTA MANADO", "KOTA BITUNG"] },
    { id: "72", name: "SULAWESI TENGAH", kabupaten: ["KOTA PALU"] },
    { id: "73", name: "SULAWESI SELATAN", kabupaten: ["KOTA MAKASSAR", "KOTA PAREPARE"] },
    { id: "74", name: "SULAWESI TENGGARA", kabupaten: ["KOTA KENDARI"] },
    { id: "75", name: "GORONTALO", kabupaten: ["KOTA GORONTALO"] },
    { id: "76", name: "SULAWESI BARAT", kabupaten: ["KAB. MAMUJU"] },
    { id: "81", name: "MALUKU", kabupaten: ["KOTA AMBON"] },
    { id: "82", name: "MALUKU UTARA", kabupaten: ["KOTA TERNATE"] },
    { id: "91", name: "PAPUA", kabupaten: ["KOTA JAYAPURA"] },
    { id: "92", name: "PAPUA BARAT", kabupaten: ["KOTA SORONG"] },
    { id: "93", name: "PAPUA SELATAN", kabupaten: ["KAB. MERAUKE"] },
    { id: "94", name: "PAPUA TENGAH", kabupaten: ["KAB. NABIRE"] },
    { id: "95", name: "PAPUA PEGUNUNGAN", kabupaten: ["KAB. JAYAWIJAYA"] },
    { id: "96", name: "PAPUA BARAT DAYA", kabupaten: ["KOTA SORONG"] }
];

// 1. Ambil Data Provinsi
exports.getProvinces = async (req, res) => {
    try {
        const provinces = wilayahData.map(p => ({ id: p.id, name: p.name }));
        return res.status(200).json({
            status: 'success',
            data: provinces
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: 'Gagal memuat data provinsi.' });
    }
};

// 2. Ambil Data Kabupaten/Kota berdasarkan Provinsi
exports.getCities = async (req, res) => {
    try {
        const { provId } = req.params;
        const prov = wilayahData.find(p => p.id === provId);
        const cities = prov ? prov.kabupaten.map((kab, index) => ({ id: `${provId}-${index + 1}`, name: kab })) : [];
        
        return res.status(200).json({
            status: 'success',
            data: cities
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: 'Gagal memuat data kota.' });
    }
};

// 3. Kalkulator Tarif Ongkir Otomatis (Titik Asal: Bogor)
exports.cekOngkir = async (req, res) => {
    try {
        const { destinationName, provinceName, weight } = req.body;
        
        const dest = (destinationName || '').toUpperCase();
        const prov = (provinceName || '').toUpperCase();
        const beratKg = Math.ceil((weight || 1000) / 1000); // Berat dalam kg

        let tarifReg = 30000;
        let tarifYes = 60000;

        // Logika tarif dengan titik asal dari Bogor
        if (dest.includes('BOGOR')) {
            tarifReg = 15000;
            tarifYes = 25000;
        } else if (prov.includes('JAWA BARAT') || prov.includes('DKI JAKARTA') || prov.includes('BANTEN')) {
            tarifReg = 20000;
            tarifYes = 35000;
        } else if (prov.includes('JAWA TENGAH') || prov.includes('DI YOGYAKARTA') || prov.includes('JAWA TIMUR')) {
            tarifReg = 35000;
            tarifYes = 60000;
        } else {
            tarifReg = 55000;
            tarifYes = 95000;
        }

        const results = [
            { service: 'REG', cost: tarifReg * beratKg, etd: '2-3 Hari' },
            { service: 'YES', cost: tarifYes * beratKg, etd: '1-2 Hari' }
        ];

        return res.status(200).json({
            status: 'success',
            data: results
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Gagal menghitung ongkos kirim.'
        });
    }
};