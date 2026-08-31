// evngen-backend/src/models/About.js
const mongoose = require('mongoose');

const breadcrumbSchema = new mongoose.Schema({
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
});

const statSchema = new mongoose.Schema({
    value: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const highlightSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const whoWeAreSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    paragraph1: {
        type: String,
        required: true
    },
    paragraph2: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        default: ''
    },
    imageFile: {
        type: String,
        default: ''
    },
    highlights: [highlightSchema]
});

const missionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    paragraph1: {
        type: String,
        required: true
    },
    paragraph2: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        default: ''
    },
    imageFile: {
        type: String,
        default: ''
    },
    highlights: [highlightSchema]
});

const partnerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    logo: {
        type: String,
        default: ''
    },
    logoFile: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
});

const timelineSchema = new mongoose.Schema({
    year: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
});

const aboutSchema = new mongoose.Schema({
    header: {
        breadcrumbs: [breadcrumbSchema],
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
            default: 'About EVNGEN'
        },
        description: {
            type: String,
            required: true,
            default: 'Leading the transition to sustainable energy and electric vehicle infrastructure with reliable, high-performance charging solutions.'
        }
    },
    headerLabel: {
        type: String,
        default: 'ABOUT'
    },
    title: {
        type: String,
        required: true,
        default: 'Engineering electric energy freedom'
    },
    introParagraph1: {
        type: String,
        required: true
    },
    introParagraph2: {
        type: String,
        required: true
    },
    sidebarNav: [breadcrumbSchema],
    stats: [statSchema],
    whoWeAre: whoWeAreSchema,
    mission: missionSchema,
    partners: [partnerSchema],
    timeline: [timelineSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    seo: {
        metaTitle: {
            type: String,
            default: 'About EVNGEN - Leading EV Charging Solutions'
        },
        metaDescription: {
            type: String,
            default: 'Learn about EVNGEN, a leader in EV charging infrastructure, power quality, and sustainable energy solutions.'
        },
        metaKeywords: {
            type: String,
            default: 'EV charging, sustainable energy, power electronics, EV infrastructure'
        }
    }
}, {
    timestamps: true
});

// Ensure only one active about page exists
aboutSchema.pre('save', async function(next) {
    if (this.isActive) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isActive: true },
            { isActive: false }
        );
    }
    next();
});

module.exports = mongoose.model('About', aboutSchema);