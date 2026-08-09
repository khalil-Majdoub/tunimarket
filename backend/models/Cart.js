// backend/models/Cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Product',
      required: [true, 'productId est requis'],
    },
    quantity: {
      type:    Number,
      default: 1,
      min:     [1,   'La quantité doit être au moins 1'],
      max:     [100, 'La quantité ne peut pas dépasser 100'],
      validate: {
        validator: Number.isInteger,
        message:   'La quantité doit être un entier',
      },
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'userId est requis'],
      unique:   true,
    },
    items: {
      type:    [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

cartSchema.index({ userId: 1 }, { unique: true });

// ── SAFE registration ─────────────────────────────────────────────────────────
module.exports = mongoose.models.Cart || mongoose.model('Cart', cartSchema);