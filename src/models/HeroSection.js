// backend/models/HeroSection.js
const mongoose = require('mongoose');

const heroSectionSchema = new mongoose.Schema({
    // Badge
    badge: {
        text: {
            type: String,
            default: 'EV Charging Infrastructure'
        },
        color: {
            type: String,
            default: '#22c55e'
        },
        bgColor: {
            type: String,
            default: 'transparent'
        }
    },
    
    // Headline
    headline: {
        main: {
            type: String,
            required: true,
            default: 'Supply. Install.'
        },
        highlight: {
            type: String,
            required: true,
            default: 'Train. Support.'
        },
        highlightColor: {
            type: String,
            default: '#22c55e'
        }
    },
    
    // Description
    description: {
        type: String,
        required: true,
        default: 'EVNGEN delivers end-to-end EV charging infrastructure — charger supply, installation, OCPP software, technical training, and long-term O&M support for government, commercial, and fleet projects.'
    },
    
    // CTA Buttons
    buttons: [{
        label: {
            type: String,
            required: true
        },
        link: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['primary', 'secondary', 'outline'],
            default: 'primary'
        },
        icon: {
            type: String,
            default: ''
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    
    // Feature Cards
    cards: [{
        title: {
            type: String,
            required: true
        },
        subtitle: {
            type: String,
            required: true
        },
        link: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            required: true // Icon name from lucide-react
        },
        iconBgColor: {
            type: String,
            default: '#22c55e'
        },
        iconTextColor: {
            type: String,
            default: '#ffffff'
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    
    // Background
    background: {
        imageUrl: {
            type: String,
            default: ''
        },
        color: {
            type: String,
            default: '#0B192C' // ev-dark-blue
        },
        overlay: {
            type: Boolean,
            default: true
        }
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Meta
    version: {
        type: Number,
        default: 1
    },
    lastUpdatedBy: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Ensure only one active hero section exists
heroSectionSchema.pre('save', async function(next) {
    if (this.isActive) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isActive: true },
            { isActive: false }
        );
    }
    next();
});

module.exports = mongoose.model('HeroSection', heroSectionSchema);