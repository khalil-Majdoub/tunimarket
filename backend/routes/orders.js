// backend/routes/orders.js
const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');
const { sendWhatsApp, buildOrderMessage } = require('../utils/whatsapp');

// ── Helper: get user ID from JWT (payload uses { id } not { userId }) ─────────
const getUserId = (req) => req.user.id || req.user._id;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders
// Create a new order and send WhatsApp notification to admin
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      items,
      total,
      shippingAddress,
      paymentMethod = 'paiement à la livraison',
    } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Le panier est vide' });
    }
    if (!total || Number(total) <= 0) {
      return res.status(400).json({ message: 'Montant total invalide' });
    }
    if (
      !shippingAddress?.fullName ||
      !shippingAddress?.address  ||
      !shippingAddress?.city     ||
      !shippingAddress?.postalCode ||
      !shippingAddress?.phone
    ) {
      return res.status(400).json({ message: 'Adresse de livraison incomplète' });
    }

    // ── Build order items ────────────────────────────────────────────────────
    const orderItems = items.map(item => ({
      product:  item.productId || item.product,
      quantity: Number(item.quantity),
      price:    Number(item.price),
    }));

    // ── Create and save order ────────────────────────────────────────────────
    const order = new Order({
      user:        getUserId(req),
      items:       orderItems,
      totalAmount: Number(total),
      shippingAddress: {
        fullName:   shippingAddress.fullName,
        address:    shippingAddress.address,
        city:       shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country:    shippingAddress.country || 'Tunisie',
        phone:      shippingAddress.phone,
      },
      paymentMethod,
      status:        'pending',
      paymentStatus: 'pending',
    });

    await order.save();

    console.log(`[ORDERS] ✅ Order created: #${String(order._id).slice(-8).toUpperCase()}`);

    // ── WhatsApp notification (non-blocking — never crashes order flow) ──────
    const adminPhone = process.env.ADMIN_PHONE;
    console.log('[ORDERS] ADMIN_PHONE from env:', adminPhone || '❌ NOT SET');

    if (adminPhone) {
      const msg = buildOrderMessage(order, shippingAddress, items, total, paymentMethod);
      // Fire-and-forget: do NOT await — we don't want to delay the response
      sendWhatsApp(adminPhone, msg);
    } else {
      console.warn('[ORDERS] ⚠️ ADMIN_PHONE not set in .env — WhatsApp skipped');
    }

    // ── Respond immediately ──────────────────────────────────────────────────
    res.status(201).json({
      message: 'Commande créée avec succès',
      orderId: order._id,
      order,
    });

  } catch (err) {
    console.error('[ORDERS] POST error:', err.message);
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/my
// Get all orders for the currently logged-in buyer
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: getUserId(req) })
      .populate('items.product', 'title price image discount discountedPrice')
      .sort({ createdAt: -1 })
      .lean();

    res.json(orders);
  } catch (err) {
    console.error('[ORDERS] GET /my error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/seller
// Seller sees orders containing their products; admin sees all orders
// ─────────────────────────────────────────────────────────────────────────────
router.get('/seller', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.isAdmin === true;
    const userId  = getUserId(req);

    let orders;

    if (isAdmin) {
      // Admin: all orders
      orders = await Order.find({})
        .populate('items.product', 'title price image seller discount discountedPrice')
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // Seller: only orders that contain their products
      const sellerProductIds = await Product.find({ seller: userId }).distinct('_id');

      orders = await Order.find({
        'items.product': { $in: sellerProductIds },
      })
        .populate('items.product', 'title price image seller discount discountedPrice')
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .lean();
    }

    res.json(orders);
  } catch (err) {
    console.error('[ORDERS] GET /seller error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/orders/:id/status
// Update order status (seller or admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Statut invalide. Valeurs acceptées : ${validStatuses.join(', ')}` });
  }

  try {
    const userId  = getUserId(req);
    const isAdmin = req.user.isAdmin === true;

    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });

    // Non-admin sellers may only update orders containing their own products
    if (!isAdmin) {
      const sellerProductIds = await Product.find({ seller: userId }).distinct('_id');
      const sellerIds        = sellerProductIds.map(String);
      const hasOwnership     = order.items.some(i => sellerIds.includes(String(i.product)));

      if (!hasOwnership) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette commande' });
      }
    }

    order.status = status;
    if (status === 'delivered') order.deliveredAt = new Date();
    await order.save();

    // Re-fetch with population for complete response
    const populated = await Order.findById(order._id)
      .populate('items.product', 'title price image seller discount discountedPrice')
      .populate('user', 'name email phone')
      .lean();

    res.json({
      message: `Statut mis à jour : ${status}`,
      order:   populated,
    });

  } catch (err) {
    console.error('[ORDERS] PUT /:id/status error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:id
// Get a single order by ID (owner or admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'title price image discount discountedPrice')
      .populate('user', 'name email')
      .lean();

    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });

    const isOwner = String(order.user?._id || order.user) === String(getUserId(req));
    const isAdmin = req.user.isAdmin === true;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    res.json(order);
  } catch (err) {
    console.error('[ORDERS] GET /:id error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;