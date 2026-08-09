// backend/routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tunimarket/products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
  }
});

const upload = multer({ storage });

// ─────────────────────────────────────────────────────────────────────────────
// GET /search  ← MUST be before GET /:id or Express matches 'search' as an id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const {
      q, page = 1, limit = 24,
      sellers, minPrice, maxPrice,
      inStock, sort = 'price-asc'
    } = req.query;

    // ── Build filter ────────────────────────────────────────────────────────
    const filter = {};

    // Text search
    if (q && q.trim().length >= 1) {
      filter.$or = [
        { title:       { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
        { category:    { $regex: q.trim(), $options: 'i' } }
      ];
    }

    // Seller filter
    if (sellers) {
      const sellerIds = sellers.split(',').filter(Boolean);
      if (sellerIds.length) filter.seller = { $in: sellerIds };
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    // Stock filter
    if (inStock === 'true') filter.stock = { $gt: 0 };

    // ── Sort ────────────────────────────────────────────────────────────────
    const sortMap = {
      'price-asc':  { price: 1 },
      'price-desc': { price: -1 },
      'name-asc':   { title: 1 },
      'name-desc':  { title: -1 },
      'newest':     { createdAt: -1 }
    };
    const sortQuery = sortMap[sort] || { price: 1 };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .select('title image price stock category seller averageRating ratingCount createdAt')
      .populate('seller', 'name')
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // ── Sellers list (for sidebar filter) ──────────────────────────────────
    // Get all sellers that have matching products (without price/stock/seller filters)
    const baseFilter = {};
    if (q && q.trim().length >= 1) {
      baseFilter.$or = [
        { title:       { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
        { category:    { $regex: q.trim(), $options: 'i' } }
      ];
    }

    const sellerAgg = await Product.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$seller', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ['$sellerInfo.name', 'Anonyme'] },
          count: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // ── Price range (min/max across matching products) ──────────────────────
    const priceAgg = await Product.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    const minPriceVal = priceAgg[0]?.minPrice ?? 0;
    const maxPriceVal = priceAgg[0]?.maxPrice ?? 100000;

    res.json({
      success:  true,
      products: products || [],
      total,
      page:     Number(page),
      pages:    Math.ceil(total / Number(limit)),
      sellers:  sellerAgg,
      minPrice: minPriceVal,
      maxPrice: maxPriceVal
    });
  } catch (err) {
    console.error('[SEARCH] Error:', err.message, err.stack);
    res.status(500).json({ success: false, message: 'Erreur serveur recherche' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /  — all products with optional text query & pagination
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (query && query.trim().length >= 2) {
      filter.$or = [
        { title:       { $regex: query.trim(), $options: 'i' } },
        { description: { $regex: query.trim(), $options: 'i' } },
        { category:    { $regex: query.trim(), $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .select('title image colors price seller stock category createdAt averageRating ratingCount')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products: products || [],
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('GET /products error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /:id  — single product  (MUST come after /search and other named routes)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email')
      .populate('ratings.user', 'name')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    // Return product directly so frontend can use res.data directly
    res.json(product);
  } catch (err) {
    console.error('GET /products/:id error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /:id/can-rate
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/can-rate', authMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    const userId    = req.user.id || req.user._id;

    if (!userId) {
      return res.status(401).json({ canRate: false, message: 'Utilisateur non authentifié' });
    }

    const hasDelivered = await Order.exists({
      user:            userId,
      'items.product': productId,
      status:          'delivered'
    });

    res.json({ canRate: !!hasDelivered });
  } catch (err) {
    console.error('[CAN-RATE] Error:', err.message);
    res.status(500).json({ canRate: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /:id/rate
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/rate', authMiddleware, async (req, res) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'La note doit être entre 1 et 5' });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    const userId = req.user.id || req.user._id;

    const hasDelivered = await Order.exists({
      user:            userId,
      'items.product': product._id,
      status:          'delivered'
    });

    if (!hasDelivered) {
      return res.status(403).json({ success: false, message: 'Produit non encore livré' });
    }

    const alreadyRated = product.ratings?.some(
      r => r.user.toString() === userId.toString()
    );
    if (alreadyRated) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà noté ce produit' });
    }

    product.ratings = product.ratings || [];
    product.ratings.push({
      user:      userId,
      rating:    Number(rating),
      comment:   comment?.trim() || '',
      createdAt: new Date()
    });

    await product.save({ validateModifiedOnly: true });

    res.json({
      success:       true,
      message:       'Note ajoutée avec succès',
      averageRating: product.averageRating?.toFixed(1) || '0.0',
      ratingCount:   product.ratingCount || 0
    });
  } catch (err) {
    console.error('[RATE] Error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /  — create product (authenticated seller)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', authMiddleware, upload.array('images', 20), async (req, res) => {
  try {
    const { title, description, price, stock, category, colors } = req.body;
    const seller = req.user.id || req.user._id;

    if (!seller) {
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    const imageUrls = req.files?.map(file => file.path) || [];

    let parsedColors = [];
    if (colors) {
      try {
        parsedColors = JSON.parse(colors).map((color, idx) => ({
          name:   color.name,
          images: imageUrls.slice(idx * 5, (idx + 1) * 5)
        }));
      } catch (e) {
        console.error('Error parsing colors:', e);
      }
    }

    const product = new Product({
      title,
      description,
      price:  Number(price),
      stock:  Number(stock),
      category,
      seller,
      image:  imageUrls[0] || undefined,
      colors: parsedColors.length > 0 ? parsedColors : undefined
    });

    await product.save();

    res.status(201).json({ success: true, message: 'Produit créé avec succès', product });
  } catch (err) {
    console.error('POST /products error:', err.message);
    res.status(400).json({ success: false, message: err.message || 'Erreur création produit' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /:id  — update product (seller only)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', authMiddleware, upload.array('images', 20), async (req, res) => {
  try {
    const sellerId = req.user.id || req.user._id;

    const product = await Product.findOne({ _id: req.params.id, seller: sellerId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé ou non autorisé' });
    }

    if (req.body.title)       product.title       = req.body.title;
    if (req.body.description) product.description = req.body.description;
    if (req.body.price)       product.price       = Number(req.body.price);
    if (req.body.stock)       product.stock       = Number(req.body.stock);
    if (req.body.category)    product.category    = req.body.category;

    if (req.files?.length > 0) {
      product.image = req.files[0].path;
    }

    await product.save();
    res.json({ success: true, message: 'Produit mis à jour', product });
  } catch (err) {
    console.error('PUT /:id error:', err.message);
    res.status(400).json({ success: false, message: err.message || 'Erreur mise à jour' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /:id  — delete product (seller only)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const sellerId = req.user.id || req.user._id;

    const product = await Product.findOneAndDelete({ _id: req.params.id, seller: sellerId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé ou non autorisé' });
    }

    res.json({ success: true, message: 'Produit supprimé avec succès' });
  } catch (err) {
    console.error('DELETE /:id error:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;