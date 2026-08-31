// src/models/TrainingCategory.js
const mongoose = require('mongoose');

const TrainingCategorySchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },
        description: {
            type: String,
            default: '',
            trim: true
        },
        icon: {
            type: String,
            default: '📋'
        },
        color: {
            type: String,
            default: '#1b7936'
        },
        order: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Indexes
TrainingCategorySchema.index({ id: 1, slug: 1 });
TrainingCategorySchema.index({ name: 'text' });
TrainingCategorySchema.index({ isActive: 1 });
TrainingCategorySchema.index({ order: 1 });

// Pre-save middleware
TrainingCategorySchema.pre('save', function (next) {
    if (!this.id && this.name) {
        this.id = this.name.toLowerCase().replace(/\s+/g, '-');
    }
    if (!this.slug && this.name) {
        this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
    }
    next();
});

TrainingCategorySchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('TrainingCategory', TrainingCategorySchema);