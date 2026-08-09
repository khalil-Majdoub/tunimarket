require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const Product = require('./models/Product');

async function importProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB!');

    const productsData = JSON.parse(fs.readFileSync('./data/sample-products.json', 'utf-8'));

    // Clear existing products (optional: comment out if you don't want to delete old ones)
    await Product.deleteMany({});

    const inserted = await Product.insertMany(productsData);
    console.log(`Successfully added ${inserted.length} products!`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error adding products:', error.message);
  }
}

importProducts();