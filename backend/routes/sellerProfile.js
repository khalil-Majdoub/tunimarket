// backend/routes/sellerProfile.js
// Mount in server.js:  app.use('/api/sellers', require('./routes/sellerProfile'));

const express = require('express');
const router  = express.Router();

// Safe imports — models use mongoose.models.X || mongoose.model(X, schema)
const Product = require('../models/Product');
const User    = require('../models/User');

// ── GET /api/sellers/:id/profile ──────────────────────────────────────────────
router.get('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID vendeur invalide' });
    }

    const [seller, products] = await Promise.all([
      User.findById(id).select('name email createdAt avatar').lean(),
      Product.find({ seller: id })
        .select('title image price stock category averageRating ratingCount discount discountedPrice')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    if (!seller) {
      return res.status(404).json({ message: 'Vendeur introuvable' });
    }

    res.json({ seller, products });
  } catch (err) {
    console.error('[SELLER PROFILE] Error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;