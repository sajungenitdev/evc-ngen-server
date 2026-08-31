// src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        
        console.log('🔍 Connecting to MongoDB...');
        
        if (!uri) {
            throw new Error('MONGODB_URI is not defined');
        }

        const conn = await mongoose.connect(uri);
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📦 Database: ${conn.connection.db.databaseName}`);
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;