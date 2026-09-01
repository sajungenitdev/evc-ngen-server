// evngen-backend/src/models/Stories.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    imageUrl: {
        type: String,
        default: ''
    },
    imageFile: {
        type: String,
        default: ''
    },
    link: {
        type: String,
        default: '/solutions'
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

const mainStorySchema = new mongoose.Schema({
    quote: {
        type: String,
        required: true
    },
    linkText: {
        type: String,
        default: 'See All Deployment Stories →'
    },
    link: {
        type: String,
        default: '/stories'
    },
    imageUrl: {
        type: String,
        default: ''
    },
    imageFile: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const storiesSchema = new mongoose.Schema({
    heading: {
        type: String,
        required: true,
        default: 'Discover Our Stories'
    },
    subtitle: {
        type: String,
        required: true,
        default: 'Real deployments, real impact — a closer look at how our charging infrastructure performs in the field.'
    },
    mainStory: mainStorySchema,
    categories: [categorySchema],
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
        default: 'stories'
    }
}, {
    timestamps: true
});

// Ensure only one active stories section exists
storiesSchema.pre('save', async function(next) {
    if (this.isActive) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isActive: true },
            { isActive: false }
        );
    }
    next();
});

module.exports = mongoose.model('Stories', storiesSchema);