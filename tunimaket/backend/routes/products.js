const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET all products
router.get('/', async (req, res) => {
  const { query } = req.query; // Get search query from ?query=...
  let filter = {};
  if (query) {
    filter = {
      $or: [
        { title: { $regex: query, $options: 'i' } }, // Case-insensitive search in title
        { description: { $regex: query, $options: 'i' } }, // And description
      ],
    };
  }
  const list = await Product.find(filter).limit(100);
  res.json(list);
});

// GET one product
router.get('/:id', async (req, res) => {
  const prod = await Product.findById(req.params.id);
  if (!prod) return res.status(404).json({ message: 'Product not found' });
  res.json(prod);
});

// POST create product (for sellers)
router.post('/', async (req, res) => {
  const p = new Product(req.body);
  await p.save();
  res.json(p);
});

// PUT update product (for sellers)
router.put('/:id', async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// DELETE product
router.delete('/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
});

module.exports = router;