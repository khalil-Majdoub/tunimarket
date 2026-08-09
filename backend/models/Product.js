// backend/models/Product.js
const mongoose = require('mongoose');

const colorVariantSchema = new mongoose.Schema({
  hex:    { type: String, required: true },
  name:   { type: String, required: true },
  images: [{ type: String }],
});

const productSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Le titre est requis'],
      trim:      true,
      maxlength: [200, 'Titre trop long'],
    },
    description: {
      type:    String,
      default: '',
      trim:    true,
    },
    price: {
      type:     Number,
      required: [true, 'Le prix est requis'],
      min:      [0, 'Le prix ne peut pas être négatif'],
    },
    stock: {
      type:    Number,
      default: 0,
      min:     [0, 'Le stock ne peut pas être négatif'],
    },
    category: {
      type:    String,
      default: 'Autre',
      trim:    true,
    },
    image: {
      type:    String,
      default: '',
    },
    images: [{ type: String }],

    seller: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Le vendeur est requis'],
    },

    colorVariants: [colorVariantSchema],

    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount:   { type: Number, default: 0 },
    sales:         { type: Number, default: 0 },

    // ── Discount ──────────────────────────────────────────────────────────
    // 0 = no discount. e.g. 20 = 20% off.
    discount: {
      type:    Number,
      default: 0,
      min:     [0,  'La remise ne peut pas être négative'],
      max:     [99, 'La remise ne peut pas dépasser 99%'],
    },
    // Auto-computed in pre-save — NEVER set manually
    discountedPrice: {
      type:    Number,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
productSchema.index({ title: 'text', description: 'text', category: 'text' });
productSchema.index({ seller:    1 });
productSchema.index({ category:  1 });
productSchema.index({ price:     1 });
productSchema.index({ createdAt: -1 });

// ── Pre-save: auto-compute discountedPrice ─────────────────────────────────────
productSchema.pre('save', function (next) {
  if (this.discount > 0) {
    this.discountedPrice = parseFloat(
      (this.price * (1 - this.discount / 100)).toFixed(2)
    );
  } else {
    this.discount        = 0;
    this.discountedPrice = null;
  }
  next();
});

// ── Pre findOneAndUpdate: recompute discountedPrice on updates too ─────────────
productSchema.pre('findOneAndUpdate', function (next) {
  const update   = this.getUpdate();
  const price    = update.price    ?? update.$set?.price;
  const discount = update.discount ?? update.$set?.discount;

  if (price !== undefined || discount !== undefined) {
    const p = parseFloat(price    ?? 0);
    const d = parseFloat(discount ?? 0);
    const discountedPrice = d > 0
      ? parseFloat((p * (1 - d / 100)).toFixed(2))
      : null;

    if (!update.$set) update.$set = {};
    update.$set.discountedPrice = discountedPrice;
    this.setUpdate(update);
  }
  next();
});

// ── Virtual: effective price (what buyer pays) ─────────────────────────────────
productSchema.virtual('effectivePrice').get(function () {
  return this.discountedPrice ?? this.price;
});

// ── SAFE registration: prevents OverwriteModelError on hot-reload ─────────────
module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);