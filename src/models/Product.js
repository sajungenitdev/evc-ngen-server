// src/models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'Product name is required'],
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
            required: [true, 'Image URL is required'],
        },
        galleryImages: {
            type: [String],
            default: [],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        specs: {
            type: [String],
            required: [true, 'Specs are required'],
        },
        shortDescription: {
            type: String,
            required: [true, 'Short description is required'],
            maxlength: [2000, 'Short description cannot exceed 2000 characters'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
        },
        features: {
            type: [String],
            required: [true, 'Features are required'],
        },
        technicalDetails: {
            powerOutput: { type: String, required: true },
            inputVoltage: { type: String, required: true },
            connectorType: { type: String, required: true },
            enclosureRating: { type: String, required: true },
            warranty: { type: String, required: true },
            dimensions: { type: String, required: true },
            weight: { type: String, required: true },
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
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ✅ Virtual populate for accessories
ProductSchema.virtual('accessories', {
    ref: 'Accessory',
    localField: 'id',
    foreignField: 'parentProductId',
});

// Indexes
ProductSchema.index({ name: 'text' });
ProductSchema.index({ brand: 1, isActive: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ price: 1, isActive: 1 });
ProductSchema.index({ createdAt: -1 });

// Pre-save middleware
ProductSchema.pre('save', function (next) {
    if (!this.id) {
        this.id = this.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    }
    next();
});

ProductSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model('Product', ProductSchema);