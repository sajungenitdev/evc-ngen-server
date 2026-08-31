// evngen-backend/src/models/Stats.js
const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    items: [{
        end: {
            type: Number,
            required: true,
            default: 0
        },
        suffix: {
            type: String,
            default: '+'
        },
        label: {
            type: String,
            required: true
        },
        duration: {
            type: Number,
            default: 2000
        },
        prefix: {
            type: String,
            default: ''
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    backgroundColor: {
        type: String,
        default: '#0c1b2e'
    },
    textColor: {
        type: String,
        default: '#ffffff'
    },
    borderColor: {
        type: String,
        default: 'rgba(255,255,255,0.1)'
    }
}, {
    timestamps: true
});

// Ensure only one active stats section exists
statsSchema.pre('save', async function(next) {
    if (this.isActive) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isActive: true },
            { isActive: false }
        );
    }
    next();
});

module.exports = mongoose.model('Stats', statsSchema);