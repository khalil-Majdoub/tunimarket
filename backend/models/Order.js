// backend/models/Order.js
const mongoose = require('mongoose');

// ── Sub-schemas ────────────────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Product',   // Reference only — Product model is NOT imported here
    },
    quantity: {
      type:     Number,
      required: [true, 'Quantité requise'],
      min:      [1,    'La quantité doit être au moins 1'],
    },
    price: {
      type:     Number,
      required: [true, 'Prix requis'],
      min:      [0,    'Le prix ne peut pas être négatif'],
    },
    // Snapshot fields: survive product deletion
    productTitle: { type: String, default: '' },
    productImage: { type: String, default: '' },
  },
  { _id: true }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName:   { type: String, required: [true, 'Nom complet requis'], trim: true },
    address:    { type: String, required: [true, 'Adresse requise'],    trim: true },
    city:       { type: String, required: [true, 'Ville requise'],      trim: true },
    postalCode: { type: String, required: [true, 'Code postal requis'], trim: true },
    country:    { type: String, default: 'Tunisie',                     trim: true },
    phone:      { type: String, required: [true, 'Téléphone requis'],   trim: true },
  },
  { _id: false }
);

// ── Main schema ────────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Utilisateur requis'],
    },

    items: {
      type:     [orderItemSchema],
      validate: {
        validator: v => Array.isArray(v) && v.length > 0,
        message:   'La commande doit contenir au moins un article',
      },
    },

    totalAmount: {
      type:     Number,
      required: [true, 'Montant total requis'],
      min:      [0,   'Le montant ne peut pas être négatif'],
    },

    shippingAddress: {
      type:     shippingAddressSchema,
      required: true,
    },

    paymentMethod: {
      type:    String,
      default: 'paiement à la livraison',
      trim:    true,
    },

    paymentStatus: {
      type:    String,
      enum:    ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },

    status: {
      type:    String,
      enum:    ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },

    // Delivery tracking timestamps
    processedAt: { type: Date, default: null },
    shippedAt:   { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    cancelReason: { type: String, default: '', trim: true },
    notes:        { type: String, default: '', trim: true },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true, versionKey: false },
    toObject:   { virtuals: true, versionKey: false },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
orderSchema.index({ user:            1, createdAt: -1 });
orderSchema.index({ status:          1 });
orderSchema.index({ 'items.product': 1 });
orderSchema.index({ createdAt:       -1 });

// ── Pre-save: auto-set delivery timestamps ─────────────────────────────────────
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    const now = new Date();
    if (this.status === 'processing' && !this.processedAt) this.processedAt = now;
    if (this.status === 'shipped'    && !this.shippedAt)   this.shippedAt   = now;
    if (this.status === 'delivered'  && !this.deliveredAt) this.deliveredAt  = now;
    if (this.status === 'cancelled'  && !this.cancelledAt) this.cancelledAt  = now;
  }
  next();
});

// ── Virtual: status in French ──────────────────────────────────────────────────
orderSchema.virtual('statusFr').get(function () {
  const map = {
    pending:    'En attente',
    processing: 'En traitement',
    shipped:    'Expédiée',
    delivered:  'Livrée',
    cancelled:  'Annulée',
  };
  return map[this.status] || this.status;
});

// ── SAFE registration: THIS is the critical fix ────────────────────────────────
// mongoose.models.Order checks if the model is already compiled.
// Without this, nodemon hot-reload causes OverwriteModelError.
module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);