// src/models/Survey.js
const mongoose = require('mongoose');

const SurveySchema = new mongoose.Schema(
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
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
            match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
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
        address: {
            type: String,
            default: '',
            trim: true,
            maxlength: [500, 'Address cannot exceed 500 characters'],
        },
        chargersCount: {
            type: String,
            enum: ['1–2', '3–10', '11–50', '50+'],
            default: '1–2',
        },
        preferredDate: {
            type: Date,
            default: null,
        },
        preferredTime: {
            type: String,
            enum: ['morning', 'afternoon', 'evening', 'any'],
            default: 'any',
        },
        details: {
            type: String,
            default: '',
            maxlength: [1000, 'Details cannot exceed 1000 characters'],
        },
        requestType: {
            type: String,
            enum: ['survey', 'call'],
            required: [true, 'Request type is required'],
            default: 'survey',
        },
        status: {
            type: String,
            enum: ['pending', 'contacted', 'scheduled', 'completed', 'cancelled'],
            default: 'pending',
        },
        callPurpose: {
            type: String,
            default: '',
            maxlength: [500, 'Call purpose cannot exceed 500 characters'],
        },
        callDuration: {
            type: String,
            enum: ['15min', '30min', '45min', '60min'],
            default: '30min',
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

// ✅ FIX: Pre-save middleware to generate id
SurveySchema.pre('save', function (next) {
    // Only generate id if it's not already set
    if (!this.id) {
        const prefix = this.requestType === 'survey' ? 'SRV' : 'CALL';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        this.id = `${prefix}-${timestamp}-${random}`;
    }
    next();
});

// Indexes for better query performance
SurveySchema.index({ email: 1 });
SurveySchema.index({ phone: 1 });
SurveySchema.index({ status: 1 });
SurveySchema.index({ requestType: 1 });
SurveySchema.index({ createdAt: -1 });

// Remove sensitive data from JSON response
SurveySchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model('Survey', SurveySchema);