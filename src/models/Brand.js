// src/models/Brand.js
const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'Brand name is required'],
            unique: true,
            trim: true,
            minlength: [2, 'Brand name must be at least 2 characters'],
            maxlength: [50, 'Brand name cannot exceed 50 characters'],
        },
        description: {
            type: String,
            default: '',
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        icon: {
            type: String,
            default: '⚡',
        },
        logo: {
            type: String,
            default: '',
        },
        website: {
            type: String,
            default: '',
            match: [/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, 'Please enter a valid URL'],
        },
        email: {
            type: String,
            default: '',
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
        },
        phone: {
            type: String,
            default: '',
        },
        address: {
            street: { type: String, default: '' },
            city: { type: String, default: '' },
            state: { type: String, default: '' },
            country: { type: String, default: '' },
            zipCode: { type: String, default: '' },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        productCount: {
            type: Number,
            default: 0,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
BrandSchema.index({ name: 'text' });
BrandSchema.index({ isActive: 1 });

// Pre-save middleware to generate id if not provided
BrandSchema.pre('save', function (next) {
    if (!this.id) {
        this.id = this.name.toLowerCase().replace(/\s+/g, '-');
    }
    next();
});

// Remove sensitive data from JSON response
BrandSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model('Brand', BrandSchema);