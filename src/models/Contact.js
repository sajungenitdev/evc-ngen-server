// src/models/Contact.js
const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
        },
        company: {
            type: String,
            default: '',
            trim: true,
            maxlength: [100, 'Company name cannot exceed 100 characters'],
        },
        interest: {
            type: String,
            enum: ['Basic EV Charger', 'DC Fast Charger', 'Charging Station with OCPP', 'Dual-Port Wallbox', 'Other'],
            default: 'Basic EV Charger',
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            maxlength: [2000, 'Message cannot exceed 2000 characters'],
        },
        status: {
            type: String,
            enum: ['pending', 'contacted', 'resolved', 'cancelled'],
            default: 'pending',
        },
        assignedTo: {
            type: String,
            default: '',
            trim: true,
        },
        notes: {
            type: String,
            default: '',
            maxlength: [2000, 'Notes cannot exceed 2000 characters'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save middleware to generate id
ContactSchema.pre('save', function (next) {
    if (!this.id) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        this.id = `CONT-${timestamp}-${random}`;
    }
    next();
});

// Indexes
ContactSchema.index({ email: 1 });
ContactSchema.index({ status: 1 });
ContactSchema.index({ createdAt: -1 });

// Remove sensitive data from JSON response
ContactSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    },
});

// ✅ Make sure this is exported correctly
module.exports = mongoose.model('Contact', ContactSchema);