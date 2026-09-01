// evngen-backend/src/models/EndToEndSetup.js
const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        required: true,
        default: 'Wrench'
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
        required: true,
        default: 'Book a Free Consultation'
    },
    link: {
        type: String,
        required: true,
        default: '/request-survey'
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const endToEndSetupSchema = new mongoose.Schema({
    headingPart1: {
        type: String,
        required: true,
        default: 'End-to-End'
    },
    headingPart2: {
        type: String,
        required: true,
        default: 'EV Charger Setup & Support'
    },
    steps: [stepSchema],
    ctaButton: ctaButtonSchema,
    isActive: {
        type: Boolean,
        default: true
    },
    backgroundColor: {
        type: String,
        default: '#ffffff'
    },
    textColor: {
        type: String,
        default: '#071322'
    },
    sectionId: {
        type: String,
        default: 'end-to-end-setup'
    }
}, {
    timestamps: true
});

// Ensure only one active End-to-End Setup section exists
endToEndSetupSchema.pre('save', async function(next) {
    if (this.isActive) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isActive: true },
            { isActive: false }
        );
    }
    next();
});

module.exports = mongoose.model('EndToEndSetup', endToEndSetupSchema);