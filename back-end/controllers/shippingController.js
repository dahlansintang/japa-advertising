const axios = require('axios');

// =====================================================
// KALKULATOR TARIF ONGKIR OTOMATIS (Titik Asal: Bogor)
// =====================================================
exports.cekOngkir = async (req, res) => {
    try {
        const { destinationName, provinceName, weight } = req.body;
        
        const dest = (destinationName || '').toUpperCase();
        const prov = (provinceName || '').toUpperCase();
        const beratKg = Math.ceil((weight || 1000) / 1000); // Berat dalam kg

        let baseReg = 30000;
        let baseExpedited = 60000;

        // Logika dasar tarif dengan titik asal dari Bogor
        if (dest.includes('BOGOR')) {
            baseReg = 14000;
            baseExpedited = 24000;
        } else if (prov.includes('JAWA BARAT') || prov.includes('DKI JAKARTA') || prov.includes('BANTEN')) {
            baseReg = 18000;
            baseExpedited = 30000;
        } else if (prov.includes('JAWA TENGAH') || prov.includes('DI YOGYAKARTA') || prov.includes('JAWA TIMUR')) {
            baseReg = 32000;
            baseExpedited = 55000;
        } else {
            baseReg = 50000;
            baseExpedited = 90000;
        }

        // Variasi tarif ekspedisi
        const results = [
            // JNE
            { service: 'JNE REG', cost: baseReg * beratKg, etd: '2-3 Hari' },
            { service: 'JNE YES', cost: baseExpedited * beratKg, etd: '1-2 Hari' },
            
            // J&T Express
            { service: 'J&T EZ', cost: (baseReg - 2000) * beratKg, etd: '2-3 Hari' },
            { service: 'J&T ECO', cost: (baseReg - 7000) * beratKg, etd: '3-5 Hari' },

            // SiCepat
            { service: 'SiCepat REG', cost: (baseReg - 1000) * beratKg, etd: '2-3 Hari' },
            { service: 'SiCepat BEST', cost: (baseExpedited - 5000) * beratKg, etd: '1 Hari' },

            // AnterAja
            { service: 'AnterAja Reguler', cost: baseReg * beratKg, etd: '2-3 Hari' }
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