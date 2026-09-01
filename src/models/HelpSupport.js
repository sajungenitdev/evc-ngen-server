// src/models/HelpSupport.js
const mongoose = require('mongoose');

const socialSchema = new mongoose.Schema({
    name: {
        type: String,
        enum: ['X', 'in', 'f', 'Instagram', 'YouTube'],
        required: true
    },
    link: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const salesCardSchema = new mongoose.Schema({
    status: {
        type: String,
        default: 'Sales Team Online'
    },
    title: {
        type: String,
        required: true,
        default: 'Need help choosing a charger?'
    },
    highlightText: {
        type: String,
        default: 'Talk to our team.'
    },
    buttonText: {
        type: String,
        default: 'Call +1 (800) 555-0199'
    },
    phoneLink: {
        type: String,
        default: '18005550199'
    },
    imageUrl: {
        type: String,
        default: '/images/help/need-help.jpg'
    },
    imageDeleteUrl: {  // ✅ ADD THIS
        type: String,
        default: null
    },
    imageFile: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const ticketCardSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        default: 'Need something else? Raise a ticket and we\'ll get back to you.'
    },
    linkText: {
        type: String,
        default: 'Raise a Ticket →'
    },
    link: {
        type: String,
        default: '/contact'
    },
    imageUrl: {
        type: String,
        default: '/images/help/Raise-Ticket.jpg'
    },
    imageDeleteUrl: {  // ✅ ADD THIS
        type: String,
        default: null
    },
    imageFile: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const supportHubCardSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        default: 'Find answers, guides, and advice, all in one place'
    },
    linkText: {
        type: String,
        default: 'Visit our Support Hub →'
    },
    link: {
        type: String,
        default: '/faq'
    },
    imageUrl: {
        type: String,
        default: '/images/help/charge-ev_9-1.webp'
    },
    imageDeleteUrl: {  // ✅ ADD THIS
        type: String,
        default: null
    },
    imageFile: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const reviewCardSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        default: 'Help us continue to improve our network'
    },
    linkText: {
        type: String,
        default: 'Leave a Review →'
    },
    link: {
        type: String,
        default: '/contact'
    },
    imageUrl: {
        type: String,
        default: '/images/help/improve-our-network.jpg'
    },
    imageDeleteUrl: {  // ✅ ADD THIS
        type: String,
        default: null
    },
    imageFile: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const socialCardSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'Stay connected'
    },
    imageUrl: {
        type: String,
        default: '/images/help/Stay-connected.jpg'
    },
    imageDeleteUrl: {  // ✅ ADD THIS
        type: String,
        default: null
    },
    imageFile: {
        type: String,
        default: ''
    },
    socials: [socialSchema],
    isActive: {
        type: Boolean,
        default: true
    }
});

const helpSupportSchema = new mongoose.Schema({
    salesCard: salesCardSchema,
    ticketCard: ticketCardSchema,
    supportHubCard: supportHubCardSchema,
    reviewCard: reviewCardSchema,
    socialCard: socialCardSchema,
    isActive: {
        type: Boolean,
        default: true
    },
    sectionId: {
        type: String,
        default: 'help-support'
    }
}, {
    timestamps: true
});

// Ensure only one active help support section exists
helpSupportSchema.pre('save', async function(next) {
    if (this.isActive) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isActive: true },
            { isActive: false }
        );
    }
    next();
});

module.exports = mongoose.model('HelpSupport', helpSupportSchema);