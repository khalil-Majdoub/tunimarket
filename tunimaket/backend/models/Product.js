// Updated backend/models/Product.js - Add sales for best sellers
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  image: String,
  stock: { type: Number, default: 10 },
  seller: { type: String, required: true }, // e.g. user's email or ID
  sales: { type: Number, default: 0 }, // Added for best sellers
});

module.exports = mongoose.model('Product', ProductSchema);