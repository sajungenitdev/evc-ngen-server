// src/models/EvShop.js
const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    buttonText: {
        type: String,
        default: 'Shop'
    },
    link: {
        type: String,
        required: true,
        default: '/ev-chargers'
    },
    bgClass: {
        type: String,
        default: 'bg-gradient-to-br from-[#1b854a] to-[#125530]'
    },
    imageUrl: {
        type: String,
        default: ''
    },
    imageDeleteUrl: {  // ✅ ADD THIS
        type: String,
        default: null
    },
    imageFile: {
        type: String,
        default: ''
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const viewAllButtonSchema = new mongoose.Schema({
    text: {
        type: String,
        default: 'View All'
    },
    link: {
        type: String,
        default: '/ev-chargers'
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const evShopSchema = new mongoose.Schema({
    heading: {
        type: String,
        required: true,
        default: 'EV Shop Online'
    },
    items: [shopItemSchema],
    viewAllButton: viewAllButtonSchema,
    isActive: {
        type: Boolean,
        default: true
    },
    backgroundColor: {
        type: String,
        default: '#ffffff'
    },
    textColor: {
        type: String,
        default: '#071322'
    },
    sectionId: {
        type: String,
        default: 'ev-shop'
    }
}, {
    timestamps: true
});

// Ensure only one active EV Shop section exists
evShopSchema.pre('save', async function(next) {
    if (this.isActive) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isActive: true },
            { isActive: false }
        );
    }
    next();
});

module.exports = mongoose.model('EvShop', evShopSchema);