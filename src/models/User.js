// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
    {
        // Personal Information
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't return password by default
        },

        // Profile Information
        avatar: {
            type: String,
            default: '',
        },
        phone: {
            type: String,
            default: '',
        },
        company: {
            type: String,
            default: '',
        },
        jobTitle: {
            type: String,
            default: '',
        },

        // Role & Permissions
        role: {
            type: String,
            enum: ['admin', 'manager', 'technician', 'user'],
            default: 'user',
        },
        permissions: {
            type: [String],
            default: [],
        },

        // Account Status
        isActive: {
            type: Boolean,
            default: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: {
            type: String,
            default: '',
        },
        resetPasswordToken: {
            type: String,
            default: '',
        },
        resetPasswordExpire: {
            type: Date,
        },

        // Activity Tracking
        lastLogin: {
            type: Date,
        },
        loginCount: {
            type: Number,
            default: 0,
        },
        lastActive: {
            type: Date,
        },

        // Preferences
        preferences: {
            notifications: {
                email: { type: Boolean, default: true },
                push: { type: Boolean, default: false },
                sms: { type: Boolean, default: false },
            },
            language: {
                type: String,
                enum: ['en', 'es', 'fr', 'de'],
                default: 'en',
            },
            timezone: {
                type: String,
                default: 'UTC',
            },
        },

        // Address
        address: {
            street: { type: String, default: '' },
            city: { type: String, default: '' },
            state: { type: String, default: '' },
            country: { type: String, default: '' },
            zipCode: { type: String, default: '' },
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON response
UserSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        delete ret.verificationToken;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        return ret;
    },
});

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', UserSchema);