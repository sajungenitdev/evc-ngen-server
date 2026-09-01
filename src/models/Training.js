// src/models/Training.js
const mongoose = require('mongoose');

const TrainingSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        categoryId: {
            type: String,
            default: '',
            trim: true,
            index: true
        },
        badge: {
            type: String,
            default: '',
            trim: true
        },
        description: {
            type: String,
            default: '',
            trim: true
        },
        details: {
            type: String,
            default: '',
            trim: true
        },
        duration: {
            type: String,
            default: '',
            trim: true
        },
        format: {
            type: String,
            default: '',
            trim: true
        },
        imageUrl: {
            type: String,
            default: '/images/training/default.jpg'
        },
        link: {
            type: String,
            default: '',
            trim: true
        },
        color: {
            type: String,
            default: '#0c1f38'
        },
        icon: {
            type: String,
            default: '📋'
        },
        features: {
            type: [String],
            default: []
        },
        price: {
            type: String,
            default: ''
        },
        schedule: {
            type: String,
            default: ''
        },
        prerequisites: {
            type: [String],
            default: []
        },
        actionText: {
            type: String,
            default: 'Learn More →'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        imageDeleteUrl: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true
    }
);

// Indexes
TrainingSchema.index({ id: 1 });
TrainingSchema.index({ title: 'text' });
TrainingSchema.index({ isActive: 1 });
TrainingSchema.index({ categoryId: 1 }); // ✅ ADD THIS

// Pre-save middleware
TrainingSchema.pre('save', function (next) {
    if (!this.id && this.title) {
        this.id = this.title.toLowerCase().replace(/\s+/g, '-');
    }
    if (!this.link && this.id) {
        this.link = `/training/${this.id}`;
    }
    next();
});

TrainingSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Training', TrainingSchema);