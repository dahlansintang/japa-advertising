const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController'); // <-- Diimpor untuk menangani checkout
const { requireAuth } = require('../middleware/security');

router.post('/add', requireAuth, cartController.addToCart);
router.get('/', requireAuth, cartController.getCart);
router.delete('/:id', requireAuth, cartController.removeFromCart);

// Eksekusi checkout diarahkan ke orderController untuk menghindari duplikasi kode
router.post('/checkout', requireAuth, orderController.buatPesananKeranjang);

module.exports = router;