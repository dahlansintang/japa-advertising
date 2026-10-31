const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { requireAuth } = require('../middleware/security');

router.post('/add', requireAuth, cartController.addToCart);
router.get('/', requireAuth, cartController.getCart);
router.delete('/:id', requireAuth, cartController.removeFromCart);
router.post('/checkout', requireAuth, cartController.checkoutCart);

module.exports = router;