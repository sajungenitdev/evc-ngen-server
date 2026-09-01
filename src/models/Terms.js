// evngen-backend/src/models/Terms.js
const mongoose = require('mongoose');

const headerSchema = new mongoose.Schema({
    breadcrumbs: [{
        label: {
            type: String,
            required: true
        },
        link: {
            type: String,
            default: ''
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    imageUrl: {
        type: String,
        default: '/images/help/EV Charging_1.jpg'
    },
    imageFile: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        required: true,
        default: 'Terms & Conditions'
    },
    description: {
        type: String,
        required: true,
        default: 'Review our terms of service, hardware warranties, and commercial usage policies.'
    }
});

const sectionSchema = new mongoose.Schema({
    heading: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
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

const termsSchema = new mongoose.Schema({
    header: headerSchema,
    lastUpdated: {
        type: String,
        default: `Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
    },
    sections: [sectionSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    seo: {
        metaTitle: {
            type: String,
            default: 'Terms & Conditions - EVNGEN'
        },
        metaDescription: {
            type: String,
            default: 'Review our terms of service, hardware warranties, and commercial usage policies.'
        },
        metaKeywords: {
            type: String,
            default: 'terms and conditions, EV charging terms, warranty policy, legal'
        }
    }
}, {
    timestamps: true
});

// Ensure only one active Terms page exists
termsSchema.pre('save', async function(next) {
    if (this.isActive) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isActive: true },
            { isActive: false }
        );
    }
    next();
});

module.exports = mongoose.model('Terms', termsSchema);