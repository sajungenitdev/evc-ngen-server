// evngen-backend/src/models/Faq.js
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
        default: 'Frequently Asked Questions'
    },
    description: {
        type: String,
        required: true,
        default: 'Find answers regarding EV charger hardware specifications, OCPP software integration, billing, and site installation.'
    }
});

const faqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        required: true,
        trim: true
    },
    category: {
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

const ctaButtonSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const ctaBannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        default: 'Still have questions?'
    },
    description: {
        type: String,
        required: true,
        default: 'Our engineering and sales team are available to discuss your specific infrastructure and fleet requirements.'
    },
    primaryButton: ctaButtonSchema,
    secondaryButton: ctaButtonSchema,
    isActive: {
        type: Boolean,
        default: true
    }
});

const faqPageSchema = new mongoose.Schema({
    header: headerSchema,
    categories: [{
        type: String,
        required: true,
        trim: true
    }],
    faqs: [faqSchema],
    ctaBanner: ctaBannerSchema,
    isActive: {
        type: Boolean,
        default: true
    },
    seo: {
        metaTitle: {
            type: String,
            default: 'FAQ & Support - EV Charging Solutions'
        },
        metaDescription: {
            type: String,
            default: 'Find answers to frequently asked questions about EV charging hardware, software, installation, and support.'
        },
        metaKeywords: {
            type: String,
            default: 'EV charging FAQ, OCPP support, charging installation, EVSE questions'
        }
    }
}, {
    timestamps: true
});

// Ensure only one active FAQ page exists
faqPageSchema.pre('save', async function(next) {
    if (this.isActive) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isActive: true },
            { isActive: false }
        );
    }
    next();
});

module.exports = mongoose.model('Faq', faqPageSchema);