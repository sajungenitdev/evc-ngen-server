// scripts/add-product-indexes.js
require('dotenv').config();
const mongoose = require('mongoose');

async function addIndexes() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dev3ngenit_db_user:p6YKLnqrvR1ACAS9@cluster0.ehgp8m0.mongodb.net/evngen?appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Product = require('../src/models/Product');

        // ✅ Create indexes for faster queries
        console.log('📦 Creating indexes...');
        
        await Product.collection.createIndex({ id: 1 }, { unique: true });
        await Product.collection.createIndex({ name: 'text' });
        await Product.collection.createIndex({ model: 1 });
        await Product.collection.createIndex({ brand: 1 });
        await Product.collection.createIndex({ category: 1 });
        await Product.collection.createIndex({ isActive: 1 });
        await Product.collection.createIndex({ price: 1 });
        await Product.collection.createIndex({ rating: 1 });
        await Product.collection.createIndex({ createdAt: -1 });

        console.log('✅ All indexes created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to create indexes:', error);
        process.exit(1);
    }
}

addIndexes();