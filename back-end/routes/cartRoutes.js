const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const { requireAuth, requireCustomer } = require('../middleware/security');

router.post('/add', requireAuth, requireCustomer, cartController.addToCart);
router.get('/', requireAuth, requireCustomer, cartController.getCart);
router.delete('/:id', requireAuth, requireCustomer, cartController.removeFromCart);
router.post('/checkout', requireAuth, requireCustomer, orderController.buatPesananKeranjang);

module.exports = router;