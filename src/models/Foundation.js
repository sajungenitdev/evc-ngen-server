// evngen-backend/src/models/Foundation.js
const mongoose = require('mongoose');

const foundationItemSchema = new mongoose.Schema({
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
    bgClass: {
        type: String,
        default: '#0c1f38'
    },
    imageUrl: {
        type: String,
        default: ''
    },
    imageAlt: {
        type: String,
        default: ''
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

const foundationSchema = new mongoose.Schema({
    heading: {
        type: String,
        required: true,
        default: 'Build Our Foundation'
    },
    subtitle: {
        type: String,
        required: true,
        default: 'EVNGEN is driven by a mission to make electric energy work harder for people and the planet — engineering every product around reliability, efficiency, and long-term value.'
    },
    items: [foundationItemSchema],
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
    }
}, {
    timestamps: true
});

// Ensure only one active foundation section exists
foundationSchema.pre('save', async function(next) {
    if (this.isActive) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isActive: true },
            { isActive: false }
        );
    }
    next();
});

module.exports = mongoose.model('Foundation', foundationSchema);