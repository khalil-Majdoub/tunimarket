// backend/routes/seller.js
// Mount in server.js:  app.use('/api/seller', require('./routes/seller'));

const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const Product  = require('../models/Product');
const Order    = require('../models/Order');
const Wishlist = require('../models/Wishlist');
const authMiddleware   = require('../middleware/auth');
const sellerMiddleware = require('../middleware/seller');

// ── Cloudinary storage via multer ─────────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'tunimarket/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' }],
  },
});

const upload    = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB
const uploadAny = upload.any();

// ── Apply auth + seller middleware to all routes ────────────────────────────────
router.use(authMiddleware);
router.use(sellerMiddleware);

// ── Helper ────────────────────────────────────────────────────────────────────
const getUserId = (req) => req.user.id || req.user._id;

// ── Wrap multer to use as middleware inside route handler ────────────────────
const runUpload = (req, res) =>
  new Promise((resolve, reject) => {
    uploadAny(req, res, err => (err ? reject(err) : resolve()));
  });

// ── Build a productId → Cloudinary URL map from req.files ────────────────────
const buildFileMap = (files = []) => {
  const map = {};
  files.forEach(f => { map[f.fieldname] = f.path; });
  return map;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/seller/products — Create a new product
// Body (multipart/form-data):
//   title, description, price, stock, category, discount
//   image_0 ... image_N      (plain images, no colour variants)
//   imageCount               (number of plain images)
//   OR
//   variant_0_0 ... variant_V_I  (colour variant images)
//   variantMeta              (JSON: [{hex, name, count}, ...])
// ─────────────────────────────────────────────────────────────────────────────
router.post('/products', async (req, res) => {
  try {
    await runUpload(req, res);
  } catch (err) {
    console.error('[SELLER] Upload error:', err.message);
    return res.status(400).json({ message: err.message || 'Erreur upload image' });
  }

  try {
    const sellerId = getUserId(req);
    const { title, description, price, stock, category, discount, variantMeta, imageCount } = req.body;

    // Validate required fields
    if (!title?.trim()) return res.status(400).json({ message: 'Titre requis' });
    if (!price)         return res.status(400).json({ message: 'Prix requis' });
    if (stock === undefined || stock === '') return res.status(400).json({ message: 'Stock requis' });
    if (!category?.trim()) return res.status(400).json({ message: 'Catégorie requise' });

    const fileMap     = buildFileMap(req.files);
    const discountPct = Math.min(99, Math.max(0, parseFloat(discount) || 0));

    let mainImage    = '';
    let colorVariants;

    if (variantMeta) {
      // ── Colour variant mode ────────────────────────────────────────────────
      let meta;
      try { meta = JSON.parse(variantMeta); } catch { return res.status(400).json({ message: 'variantMeta JSON invalide' }); }

      colorVariants = meta.map((v, vi) => {
        const images = [];
        for (let fi = 0; fi < v.count; fi++) {
          const url = fileMap[`variant_${vi}_${fi}`];
          if (url) images.push(url);
        }
        return { hex: v.hex, name: v.name, images };
      });

      // Primary image = first image of first variant
      mainImage = colorVariants[0]?.images[0] || '';

    } else {
      // ── Plain images mode ──────────────────────────────────────────────────
      const count  = parseInt(imageCount) || 1;
      const allImgs = [];
      for (let i = 0; i < count; i++) {
        const url = fileMap[`image_${i}`];
        if (url) allImgs.push(url);
      }
      mainImage = allImgs[0] || '';
    }

    const product = new Product({
      title:        title.trim(),
      description:  description?.trim() || '',
      price:        parseFloat(price),
      stock:        parseInt(stock),
      category:     category.trim(),
      seller:       sellerId,
      image:        mainImage,
      discount:     discountPct,
      ...(colorVariants ? { colorVariants } : {}),
    });

    await product.save();

    console.log(`[SELLER] ✅ Product created: "${product.title}" (id: ${product._id})`);
    res.status(201).json(product);

  } catch (err) {
    console.error('[SELLER] POST /products error:', err.message);
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/seller/products/:id — Edit an existing product
// Body (multipart/form-data) — all fields optional, only updates what you send:
//   title, description, price, stock, category, discount
//   image_0  (optional new main image — replaces existing main image)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/products/:id', async (req, res) => {
  try {
    await runUpload(req, res);
  } catch (err) {
    return res.status(400).json({ message: err.message || 'Erreur upload image' });
  }

  try {
    const sellerId = getUserId(req);

    // Verify ownership
    const product = await Product.findOne({ _id: req.params.id, seller: sellerId });
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable ou vous n\'êtes pas le vendeur' });
    }

    const { title, description, price, stock, category, discount } = req.body;
    const fileMap = buildFileMap(req.files);

    // Update only provided fields
    if (title?.trim())       product.title       = title.trim();
    if (description !== undefined) product.description = description.trim();

    if (price !== undefined && price !== '') {
      product.price = parseFloat(price);
    }
    if (stock !== undefined && stock !== '') {
      product.stock = parseInt(stock);
    }
    if (category?.trim()) product.category = category.trim();

    if (discount !== undefined && discount !== '') {
      product.discount = Math.min(99, Math.max(0, parseFloat(discount) || 0));
    }

    // Replace main image if a new one was uploaded
    if (fileMap['image_0']) {
      product.image = fileMap['image_0'];
    }

    // pre-save hook will recompute discountedPrice
    await product.save();

    console.log(`[SELLER] ✅ Product updated: "${product.title}" (id: ${product._id})`);
    res.json(product);

  } catch (err) {
    console.error('[SELLER] PUT /products/:id error:', err.message);
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/seller/products/:id — Delete a product
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/products/:id', async (req, res) => {
  try {
    const sellerId = getUserId(req);
    const product  = await Product.findOneAndDelete({ _id: req.params.id, seller: sellerId });

    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable ou vous n\'êtes pas le vendeur' });
    }

    console.log(`[SELLER] 🗑️  Product deleted: "${product.title}" (id: ${product._id})`);
    res.json({ message: 'Produit supprimé avec succès' });

  } catch (err) {
    console.error('[SELLER] DELETE /products/:id error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/seller/products — Get all products for the logged-in seller
// ─────────────────────────────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ seller: getUserId(req) })
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('[SELLER] GET /products error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/seller/stats — Dashboard statistics for the logged-in seller
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const sellerId = getUserId(req);

    // Get all products belonging to this seller
    const sellerProducts = await Product.find({ seller: sellerId }).select('_id price');
    const productIds     = sellerProducts.map(p => p._id);

    if (productIds.length === 0) {
      return res.json({
        overallRating:  0,
        wishlistCount:  0,
        totalRevenue:   0,
        totalOrders:    0,
        dailyOrders:    [],
        weeklyOrders:   [],
      });
    }

    // ── Wishlist count ────────────────────────────────────────────────────────
    const wishlistAgg = await Wishlist.aggregate([
      { $unwind: '$products' },
      { $match:  { products: { $in: productIds } } },
      { $count:  'total' },
    ]);
    const wishlistCount = wishlistAgg[0]?.total || 0;

    // ── Orders: revenue + count ───────────────────────────────────────────────
    const orders = await Order.find({
      'items.product': { $in: productIds },
      status:          { $ne: 'cancelled' },
    });

    const totalOrders  = orders.length;
    const totalRevenue = orders.reduce((sum, order) => {
      const myItems = order.items.filter(item =>
        productIds.some(pid => pid.toString() === item.product?.toString())
      );
      return sum + myItems.reduce((s, item) => s + item.price * item.quantity, 0);
    }, 0);

    // ── Daily orders (last 7 days) ─────────────────────────────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyOrders = await Order.aggregate([
      {
        $match: {
          'items.product': { $in: productIds },
          createdAt:       { $gte: sevenDaysAgo },
          status:          { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id:     { $dateToString: { format: '%d/%m', date: '$createdAt' } },
          count:   { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ── Weekly orders (last 4 weeks) ───────────────────────────────────────────
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const weeklyOrders = await Order.aggregate([
      {
        $match: {
          'items.product': { $in: productIds },
          createdAt:       { $gte: fourWeeksAgo },
          status:          { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id:     { $week: '$createdAt' },
          count:   { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      overallRating:  0,      // TODO: implement when review model is ready
      wishlistCount,
      totalRevenue:   parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      dailyOrders,
      weeklyOrders,
    });

  } catch (err) {
    console.error('[SELLER] GET /stats error:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;