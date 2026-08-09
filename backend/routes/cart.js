// backend/routes/cart.js
const express = require('express');
const router  = express.Router();
const Cart    = require('../models/Cart');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// ── Helper: get user ID from JWT payload (uses { id } not { userId }) ─────────
const getUserId = (req) => req.user.id || req.user._id;

// ── Helper: populate cart and compute total (respects discountedPrice) ─────────
const buildCartResponse = async (cartId) => {
  const cart = await Cart.findById(cartId).populate({
    path:   'items.productId',
    select: 'title price image stock discount discountedPrice colorVariants',
  });

  if (!cart) return { items: [], total: '0.00' };

  const total = cart.items.reduce((sum, item) => {
    // Use discounted price if available, otherwise use regular price
    const unitPrice = item.productId?.discountedPrice ?? item.productId?.price ?? 0;
    return sum + unitPrice * (item.quantity || 1);
  }, 0);

  return { ...cart.toObject(), total: total.toFixed(2) };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cart
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);

    const cart = await Cart.findOne({ userId }).populate({
      path:   'items.productId',
      select: 'title price image stock discount discountedPrice colorVariants',
    });

    if (!cart) return res.json({ items: [], total: '0.00' });

    const total = cart.items.reduce((sum, item) => {
      const unitPrice = item.productId?.discountedPrice ?? item.productId?.price ?? 0;
      return sum + unitPrice * (item.quantity || 1);
    }, 0);

    res.json({ items: cart.items, total: total.toFixed(2) });

  } catch (err) {
    console.error('[CART] GET error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cart/add
// ─────────────────────────────────────────────────────────────────────────────
router.post('/add', async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ message: 'productId requis' });
  }

  try {
    const userId = getUserId(req);

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(
      i => i.productId.toString() === String(productId)
    );

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      cart.items.push({ productId, quantity: Number(quantity) });
    }

    cart.updatedAt = Date.now();
    await cart.save();

    res.json(await buildCartResponse(cart._id));

  } catch (err) {
    console.error('[CART] ADD error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cart/remove
// ─────────────────────────────────────────────────────────────────────────────
router.post('/remove', async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: 'productId requis' });
  }

  try {
    const userId = getUserId(req);

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.json({ items: [], total: '0.00' });

    cart.items     = cart.items.filter(i => i.productId.toString() !== String(productId));
    cart.updatedAt = Date.now();
    await cart.save();

    res.json(await buildCartResponse(cart._id));

  } catch (err) {
    console.error('[CART] REMOVE error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cart/clear
// ─────────────────────────────────────────────────────────────────────────────
router.post('/clear', async (req, res) => {
  try {
    const userId = getUserId(req);

    await Cart.findOneAndUpdate(
      { userId },
      { items: [], updatedAt: Date.now() },
      { new: true }
    );

    res.json({ items: [], total: '0.00' });

  } catch (err) {
    console.error('[CART] CLEAR error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;