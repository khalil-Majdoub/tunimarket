const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const authMiddleware = require('../middleware/auth'); // New!

// Apply JWT protection to ALL wishlist routes
router.use(authMiddleware);

// GET user's wishlist
router.get('/', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.userId })
      .populate('products');

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

    let wishlist = await Wishlist.findOne({ userId: req.user.userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.user.userId,
        products: []
      });
    }

    if (!wishlist.products.includes(productId)) {
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

    const wishlist = await Wishlist.findOne({ userId: req.user.userId });

    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        id => id.toString() !== productId
      );
      await wishlist.save();
    }

    res.json(wishlist || { products: [] });
  } catch (err) {
    console.error('REMOVE from wishlist error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;