const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');

// Protect all seller routes
router.use(authMiddleware);

// GET seller's own products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.userId.toString() });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST add new product
router.post('/products', async (req, res) => {
  const { title, description, price, image, stock = 10 } = req.body;

  try {
    const product = new Product({
      title,
      description,
      price,
      image,
      stock,
      seller: req.user.userId.toString() // Link to user
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de l\'ajout' });
  }
});

// PUT update product
router.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, price, image, stock } = req.body;

  try {
    const product = await Product.findOne({ _id: id, seller: req.user.userId.toString() });
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé ou non autorisé' });
    }

    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price || product.price;
    product.image = image || product.image;
    product.stock = stock || product.stock;

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
});

// DELETE product
router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findOneAndDelete({
      _id: id,
      seller: req.user.userId.toString()
    });

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé ou non autorisé' });
    }

    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
});
const requireSeller = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.isSeller) {
      return res.status(403).json({ message: 'Accès réservé aux vendeurs' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Apply both middlewares
router.use(authMiddleware, requireSeller);

module.exports = router;