// src/models/Accessory.js
const mongoose = require('mongoose');

const AccessorySchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'Accessory name is required'],
            trim: true,
            index: true,
        },
        model: {
            type: String,
            required: [true, 'Model is required'],
            trim: true,
        },
        brand: {
            type: String,
            required: [true, 'Brand is required'],
            trim: true,
        },
        brandId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Brand',
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
        },
        categoryLabel: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            default: '',
        },
        galleryImages: {
            type: [String],
            default: [],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
            default: 0,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        specs: {
            type: [String],
            default: [],
        },
        shortDescription: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            default: '',
        },
        features: {
            type: [String],
            default: [],
        },
        technicalDetails: {
            powerOutput: { type: String, default: 'N/A' },
            inputVoltage: { type: String, default: 'N/A' },
            connectorType: { type: String, default: 'N/A' },
            enclosureRating: { type: String, default: 'N/A' },
            warranty: { type: String, default: 'N/A' },
            dimensions: { type: String, default: 'N/A' },
            weight: { type: String, default: 'N/A' },
        },
        stock: {
            type: Number,
            default: 0,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        // Accessory specific fields with Product reference
        parentProductId: {
            type: String,
            ref: 'Product',
            required: [true, 'Parent product ID is required'],
            index: true,
        },
        compatibleWith: {
            type: [String],
            default: [],
        },
        accessoryType: {
            type: String,
            enum: ['cable', 'adapter', 'mount', 'rfid', 'management', 'cover', 'pedestal', 'meter', 'signage', 'replacement', 'other'],
            required: [true, 'Accessory type is required'],
            default: 'other',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
AccessorySchema.index({ name: 'text' });
AccessorySchema.index({ brand: 1, isActive: 1 });
AccessorySchema.index({ category: 1, isActive: 1 });
AccessorySchema.index({ price: 1, isActive: 1 });
AccessorySchema.index({ parentProductId: 1, isActive: 1 });
AccessorySchema.index({ accessoryType: 1, isActive: 1 });
AccessorySchema.index({ createdAt: -1 });

// Pre-save middleware
AccessorySchema.pre('save', function (next) {
    if (!this.id) {
        this.id = this.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    }
    next();
});

AccessorySchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model('Accessory', AccessorySchema);