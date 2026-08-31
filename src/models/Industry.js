// src/models/Industry.js
const mongoose = require('mongoose');

const CaseStudySchema = new mongoose.Schema({
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    link: { type: String, default: '' }
});

const IndustrySchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },
        label: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },
        desc: {
            type: String,
            default: '',
            trim: true
        },
        icon: {
            type: String,
            default: '🏢'
        },
        imageUrl: {
            type: String,
            default: '/images/industries/default.jpg'
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        subtitle: {
            type: String,
            default: '',
            trim: true
        },
        overview: {
            type: String,
            required: true,
            trim: true
        },
        challenges: {
            type: [String],
            default: []
        },
        solutions: {
            type: [String],
            default: []
        },
        benefits: {
            type: [String],
            default: []
        },
        caseStudy: {
            type: CaseStudySchema,
            default: { title: '', description: '', imageUrl: '', link: '' }
        },
        features: {
            type: [String],
            default: []
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
IndustrySchema.index({ id: 1, slug: 1 });
IndustrySchema.index({ label: 'text' });
IndustrySchema.index({ isActive: 1 });

// Pre-save middleware
IndustrySchema.pre('save', function (next) {
    if (!this.id && this.label) {
        this.id = this.label.toLowerCase().replace(/\s+/g, '-');
    }
    if (!this.slug && this.label) {
        this.slug = this.label.toLowerCase().replace(/\s+/g, '-');
    }
    next();
});

IndustrySchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Industry', IndustrySchema);