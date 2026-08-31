// src/models/Solution.js
const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
    label: { type: String, default: '' },
    url: { type: String, default: '/contact' }
});

const TabSchema = new mongoose.Schema({
    tabLabel: { type: String, default: '' },
    badge: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    links: { type: [LinkSchema], default: [] }
});

const UseCaseSchema = new mongoose.Schema({
    label: { type: String, default: '' },
    icon: { type: String, default: '📌' },
    imageUrl: { type: String, default: '' },
    link: { type: String, default: '/contact' }
});

const CardSchema = new mongoose.Schema({
    icon: { type: String, default: '📌' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    actionText: { type: String, default: '' },
    actionLink: { type: String, default: '/contact' },
    theme: { type: String, enum: ['dark', 'green', 'light'], default: 'dark' }
});

const Section1Schema = new mongoose.Schema({
    tabs: { type: [TabSchema], default: [] }
});

const Section2Schema = new mongoose.Schema({
    title: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    useCases: { type: [UseCaseSchema], default: [] }
});

const Section3Schema = new mongoose.Schema({
    badge: { type: String, default: '' },
    title: { type: String, default: '' },
    cards: { type: [CardSchema], default: [] }
});

const Section4Schema = new mongoose.Schema({
    heading: { type: String, default: '' },
    subtext: { type: String, default: '' },
    buttonText: { type: String, default: '' },
    buttonLink: { type: String, default: '/contact' }
});

const SolutionSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },
        label: {
            type: String,
            required: true,
            trim: true
        },
        link: {
            type: String,
            default: '',
            trim: true
        },
        desc: {
            type: String,
            default: '',
            trim: true
        },
        imageUrl: {
            type: String,
            default: '/images/help/EV Charging_1.jpg'
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        subtitle: {
            type: String,
            default: '',
            trim: true
        },
        overview: {
            type: String,
            required: true,
            trim: true
        },
        section1: {
            type: Section1Schema,
            default: { tabs: [] }
        },
        section2: {
            type: Section2Schema,
            default: { title: '', imageUrl: '', useCases: [] }
        },
        section3: {
            type: Section3Schema,
            default: { badge: '', title: '', cards: [] }
        },
        section4: {
            type: Section4Schema,
            default: { heading: '', subtext: '', buttonText: '', buttonLink: '/contact' }
        },
        features: {
            type: [String],
            default: []
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Indexes
SolutionSchema.index({ id: 1 });
SolutionSchema.index({ label: 'text' });
SolutionSchema.index({ isActive: 1 });

// Pre-save middleware
SolutionSchema.pre('save', function (next) {
    if (!this.id && this.label) {
        this.id = this.label.toLowerCase().replace(/\s+/g, '-');
    }
    if (!this.link && this.id) {
        this.link = `/solutions/${this.id}`;
    }
    next();
});

SolutionSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Solution', SolutionSchema);