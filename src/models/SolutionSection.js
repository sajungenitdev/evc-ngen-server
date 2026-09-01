// evngen-backend/src/models/SolutionSection.js
const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
    url: {
        type: String,
        default: ''
    },
    filename: {
        type: String,
        default: ''
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    imageDeleteUrl: {
        type: String,
        default: null
    },
});

const solutionItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    subtitle: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    link: {
        type: String,
        required: true,
        default: '/solutions'
    },
    imageUrl: {
        type: String,
        default: ''
    },
     imageDeleteUrl: {  // ✅ ADD THIS - for main item image
        type: String,
        default: null
    },
    imageFile: {
        type: String,
        default: ''
    },
    galleryImages: [galleryImageSchema],
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const solutionSectionSchema = new mongoose.Schema({
    heading: {
        type: String,
        required: true,
        default: 'Deliver Our Solutions'
    },
    subtitle: {
        type: String,
        required: true,
        default: 'We deliver cutting-edge technologies across Power Quality, EV Charging, Energy Storage, and Battery Testing.'
    },
    items: [solutionItemSchema],
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
        default: 'solutions'
    }
}, {
    timestamps: true
});

// Ensure only one active solution section exists
solutionSectionSchema.pre('save', async function (next) {
    if (this.isActive) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isActive: true },
            { isActive: false }
        );
    }
    next();
});

module.exports = mongoose.model('SolutionSection', solutionSectionSchema);