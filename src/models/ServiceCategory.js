// src/models/ServiceCategory.js
const mongoose = require('mongoose');

const ServiceCategorySchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'Category name is required'],
            unique: true,
            trim: true,
            minlength: [2, 'Category name must be at least 2 characters'],
            maxlength: [50, 'Category name cannot exceed 50 characters'],
        },
        slug: {
            type: String,
            unique: true,
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
            default: '',
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        icon: {
            type: String,
            default: '📂',
        },
        color: {
            type: String,
            default: 'bg-[#0c1f38]',
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        serviceCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save middleware to generate slug and id
ServiceCategorySchema.pre('save', function (next) {
    if (!this.slug) {
        this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
    }
    if (!this.id) {
        this.id = this.slug;
    }
    next();
});

// Indexes
ServiceCategorySchema.index({ name: 'text' });
ServiceCategorySchema.index({ slug: 1 });
ServiceCategorySchema.index({ isActive: 1 });

// Remove sensitive data from JSON response
ServiceCategorySchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model('ServiceCategory', ServiceCategorySchema);