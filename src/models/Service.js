// src/models/Service.js
const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            minlength: [3, 'Title must be at least 3 characters'],
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        badge: {
            type: String,
            required: [true, 'Badge is required'],
            trim: true,
            maxlength: [50, 'Badge cannot exceed 50 characters'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [200, 'Description cannot exceed 200 characters'],
        },
        // ✅ Rich text description field
        richDescription: {
            type: String,
            default: '',
            trim: true,
        },
        details: {
            type: String,
            required: [true, 'Details are required'],
            trim: true,
            maxlength: [2000, 'Details cannot exceed 2000 characters'],
        },
        icon: {
            type: String,
            required: [true, 'Icon is required'],
            default: '📋',
        },
        imageUrl: {
            type: String,
            required: [true, 'Image URL is required'],
            trim: true,
        },
        link: {
            type: String,
            required: [true, 'Link is required'],
            trim: true,
            default: '/services/',
        },
        color: {
            type: String,
            required: [true, 'Color is required'],
            trim: true,
            default: 'bg-[#0c1f38]',
            enum: [
                'bg-[#0c1f38]',
                'bg-[#1f7a3d]',
                'bg-[#12946b]',
                'bg-[#2a3f66]',
                'bg-[#16493f]',
                'bg-[#0c2138]',
                'bg-[#7c3aed]',
                'bg-[#2563eb]',
                'bg-[#d97706]',
                'bg-[#0891b2]',
                'bg-[#059669]',
                'bg-[#dc2626]',
            ],
        },
        features: {
            type: [String],
            required: [true, 'Features are required'],
            default: [],
        },
        process: {
            type: [String],
            default: [],
        },
        price: {
            type: String,
            default: '',
            trim: true,
        },
        duration: {
            type: String,
            default: '',
            trim: true,
        },
        actionText: {
            type: String,
            default: 'Request a Service',
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
            // ❌ REMOVE THIS LINE:
            // enum: ['assessment', 'installation', 'maintenance', 'support', 'training', 'custom'],
            // ✅ Instead, add a reference comment or just keep it as string
        },
    },
    {
        timestamps: true,
    }
);

// src/models/Service.js
ServiceSchema.pre('save', function (next) {
    if (!this.id) {
        // Create a URL-friendly slug from the title
        const slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
            .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
        
        // Add timestamp to ensure uniqueness
        this.id = slug + '-' + Date.now();
    }
    if (!this.link || this.link === '/services/') {
        this.link = `/services/${this.id}`;
    }
    next();
});

// Indexes for better query performance
ServiceSchema.index({ title: 'text' });
ServiceSchema.index({ category: 1 });
ServiceSchema.index({ isActive: 1 });
ServiceSchema.index({ createdAt: -1 });

// Remove sensitive data from JSON response
ServiceSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model('Service', ServiceSchema);