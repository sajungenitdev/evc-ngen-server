// src/models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
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
        description: {
            type: String,
            default: '',
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        icon: {
            type: String,
            default: '📂',
        },
        slug: {
            type: String,
            unique: true,
            trim: true,
        },
        parentId: {
            type: String,
            default: null,
            ref: 'Category',
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        level: {
            type: Number,
            default: 0, // 0 = main category, 1 = subcategory
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isActiveByParent: {
            type: Boolean,
            default: true, // Tracks if parent is active
        },
        productCount: {
            type: Number,
            default: 0,
        },
        metaTitle: {
            type: String,
            default: '',
        },
        metaDescription: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
CategorySchema.index({ name: 'text' });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ level: 1 });
CategorySchema.index({ slug: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ isActiveByParent: 1 });

// Pre-save middleware to generate slug and id
CategorySchema.pre('save', function (next) {
    if (!this.slug) {
        this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
    }
    if (!this.id) {
        this.id = this.slug;
    }
    next();
});

// Virtual for subcategories
CategorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: 'id',
    foreignField: 'parentId',
});

// Virtual for parent category
CategorySchema.virtual('parentCategory', {
    ref: 'Category',
    localField: 'parentId',
    foreignField: 'id',
    justOne: true,
});

// Virtual for effective status (considering parent status)
CategorySchema.virtual('effectiveStatus').get(function() {
    return this.isActive && this.isActiveByParent;
});

// Remove sensitive data from JSON response
CategorySchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    },
});

// Set toObject options to include virtuals
CategorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Category', CategorySchema);