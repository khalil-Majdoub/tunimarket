const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET user's cart
router.get('/', async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.userId })
      .populate({
        path: 'items.productId',
        select: 'title price image seller'
      });

    if (!cart) {
      return res.json({ items: [], total: 0 });
    }

    // Calculate total safely
    const total = cart.items.reduce((sum, item) => {
      const price = item.productId?.price || 0;
      return sum + (price * item.quantity);
    }, 0);

    res.json({
      items: cart.items,
      total: total.toFixed(2) // Return as string with 2 decimals
    });
  } catch (err) {
    console.error('GET cart error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST add item
router.post('/add', async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  try {
    let cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      cart = new Cart({ userId: req.user.userId, items: [] });
    }

    const existing = cart.items.find(i => i.productId.toString() === productId);
    if (existing) {
      existing.quantity += Number(quantity);
    } else {
      cart.items.push({ productId, quantity: Number(quantity) });
    }

    cart.updatedAt = Date.now();
    await cart.save();

    // Return populated cart with total
    const populated = await Cart.findById(cart._id).populate('items.productId');
    const total = populated.items.reduce((sum, item) => {
      return sum + (item.productId?.price * item.quantity || 0);
    }, 0);

    res.json({ ...populated.toObject(), total: total.toFixed(2) });
  } catch (err) {
    console.error('ADD to cart error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST remove item
router.post('/remove', async (req, res) => {
  const { productId } = req.body;

  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) return res.json({ items: [], total: 0 });

    cart.items = cart.items.filter(i => i.productId.toString() !== productId);
    cart.updatedAt = Date.now();
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.productId');
    const total = populated.items.reduce((sum, item) => {
      return sum + (item.productId?.price * item.quantity || 0);
    }, 0);

    res.json({ ...populated.toObject(), total: total.toFixed(2) });
  } catch (err) {
    console.error('REMOVE error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST clear cart
router.post('/clear', async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { items: [], updatedAt: Date.now() },
      { new: true }
    );
    res.json({ items: [], total: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;