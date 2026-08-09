// backend/models/Wishlist.js
const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'userId est requis'],
      unique:   true,
    },
    products: {
      type:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      default: [],
    },
  },
  { timestamps: true }
);

wishlistSchema.index({ userId: 1 }, { unique: true });
wishlistSchema.index({ products: 1 });

// ── SAFE registration ─────────────────────────────────────────────────────────
module.exports = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);