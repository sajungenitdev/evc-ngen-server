// scripts/update-accessories.js
require('dotenv').config();
const mongoose = require('mongoose');

async function updateAccessories() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dev3ngenit_db_user:p6YKLnqrvR1ACAS9@cluster0.ehgp8m0.mongodb.net/evngen?appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Product = require('../src/models/Product');

        // ✅ Get all products that should be accessories
        const accessoryNames = [
            'RFID Access Cards Pack',
            'Rerum omnis placeat',
            'Type 2 Cable 5m - Accessory Pro',
            'Type 2 Cable 5m - Accessory',
            'Type 2 Charging Cable 5m',
            'RFID Charging Cards - Pack of 5',
            'Type 1 to Type 2 Adapter',
            'Wall Mount Bracket - Heavy Duty',
            'Charging Cable 5m - Type 2',
            'Premium Type 2 Charging Cable 5m',
            'Heavy Duty Wall Mount Bracket',
            'Cable Management System',
            'Weatherproof Protective Cover'
        ];

        // ✅ Update all accessories
        const result = await Product.updateMany(
            {
                $or: [
                    { name: { $in: accessoryNames } },
                    { category: 'accessories' },
                    { categoryLabel: { $regex: 'Accessory', $options: 'i' } },
                    { accessoryType: { $ne: 'other' } },
                    { name: { $regex: 'Cable|RFID|Mount|Adapter|Charging|Accessory|Management|Cover', $options: 'i' } }
                ]
            },
            { $set: { isAccessory: true } }
        );

        console.log(`✅ Updated ${result.modifiedCount} accessories`);

        // ✅ Count accessories after update
        const count = await Product.countDocuments({ isAccessory: true });
        console.log(`📊 Total accessories now: ${count}`);

        // ✅ List all accessories
        const accessories = await Product.find(
            { isAccessory: true },
            { name: 1, isAccessory: 1, accessoryType: 1, _id: 0 }
        ).lean();

        console.log('\n📋 Accessories list:');
        accessories.forEach((acc, i) => {
            console.log(`  ${i + 1}. ${acc.name} (${acc.accessoryType || 'other'})`);
        });

        console.log('\n🎉 All accessories updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Update failed:', error);
        process.exit(1);
    }
}

updateAccessories();