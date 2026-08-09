// backend/routes/wishlist.js
const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// ── JWT payload has { id } not { userId } ───────────────────────────────────
const getUserId = (req) => req.user.id || req.user._id;

// GET user's wishlist
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const wishlist = await Wishlist.findOne({ userId }).populate('products');
    res.json(wishlist || { products: [] });
  } catch (err) {
    console.error('GET wishlist error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST add product to wishlist
router.post('/add', async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = getUserId(req);

    if (!userId) return res.status(401).json({ message: 'User ID not found in token' });

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) wishlist = new Wishlist({ userId, products: [] });

    if (!wishlist.products.map(String).includes(String(productId))) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    res.json(wishlist);
  } catch (err) {
    console.error('ADD to wishlist error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST remove product from wishlist
router.post('/remove', async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = getUserId(req);

    const wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
      await wishlist.save();
    }

    res.json(wishlist || { products: [] });
  } catch (err) {
    console.error('REMOVE from wishlist error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;