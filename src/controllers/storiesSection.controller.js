// evngen-backend/src/controllers/storiesController.js
const Stories = require('../models/Stories');

// ============================================
// GET ACTIVE STORIES SECTION
// ============================================
exports.getStories = async (req, res) => {
    try {
        let stories = await Stories.findOne({ isActive: true });

        if (!stories) {
            // Create default stories section
            stories = await Stories.create({
                heading: 'Discover Our Stories',
                subtitle: 'Real deployments, real impact — a closer look at how our charging infrastructure performs in the field.',
                mainStory: {
                    quote: 'EVNGEN completed a 120kW DC fast-charging hub deployment in under six weeks, from site survey to grid commissioning — powering a commercial fleet depot around the clock.',
                    linkText: 'See All Deployment Stories →',
                    link: '/stories',
                    imageUrl: '/images/stories/EVNGEN completed.webp'
                },
                categories: [
                    {
                        title: 'At Home',
                        imageUrl: '/images/stories/at-home.jpg',
                        link: '/solutions?tab=home',
                        order: 0,
                        isActive: true
                    },
                    {
                        title: 'At Work',
                        imageUrl: '/images/stories/at-work.avif',
                        link: '/solutions?tab=work',
                        order: 1,
                        isActive: true
                    },
                    {
                        title: 'On the Road',
                        imageUrl: '/images/stories/on-the-road.jpg',
                        link: '/solutions?tab=road',
                        order: 2,
                        isActive: true
                    },
                    {
                        title: 'At Retail',
                        imageUrl: '/images/stories/At-Retail.webp',
                        link: '/solutions?tab=retail',
                        order: 3,
                        isActive: true
                    }
                ],
                isActive: true,
                backgroundColor: '#ffffff',
                textColor: '#071322',
                sectionId: 'stories'
            });
        }

        res.status(200).json({
            success: true,
            data: stories
        });
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stories',
            error: error.message
        });
    }
};

// ============================================
// GET ALL STORIES SECTIONS
// ============================================
exports.getAllStories = async (req, res) => {
    try {
        const stories = await Stories.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: stories.length,
            data: stories
        });
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stories',
            error: error.message
        });
    }
};

// ============================================
// CREATE STORIES SECTION
// ============================================
exports.createStories = async (req, res) => {
    try {
        if (req.body.isActive) {
            await Stories.updateMany(
                { isActive: true },
                { isActive: false }
            );
        }

        const stories = await Stories.create(req.body);
        res.status(201).json({
            success: true,
            data: stories
        });
    } catch (error) {
        console.error('Error creating stories:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create stories',
            error: error.message
        });
    }
};

// ============================================
// UPDATE STORIES SECTION
// ============================================
exports.updateStories = async (req, res) => {
    try {
        let stories = await Stories.findById(req.params.id);

        if (!stories) {
            return res.status(404).json({
                success: false,
                message: 'Stories section not found'
            });
        }

        if (req.body.isActive) {
            await Stories.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }

        // Remove _id from items before updating
        if (req.body.categories) {
            req.body.categories = req.body.categories.map(item => {
                const { _id, ...cleanItem } = item;
                return cleanItem;
            });
        }

        stories = await Stories.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: stories
        });
    } catch (error) {
        console.error('Error updating stories:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update stories',
            error: error.message
        });
    }
};

// ============================================
// DELETE STORIES SECTION
// ============================================
exports.deleteStories = async (req, res) => {
    try {
        const stories = await Stories.findById(req.params.id);

        if (!stories) {
            return res.status(404).json({
                success: false,
                message: 'Stories section not found'
            });
        }

        await stories.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Stories section deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting stories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete stories',
            error: error.message
        });
    }
};

// ============================================
// TOGGLE STORIES STATUS
// ============================================
exports.toggleStoriesStatus = async (req, res) => {
    try {
        const stories = await Stories.findById(req.params.id);

        if (!stories) {
            return res.status(404).json({
                success: false,
                message: 'Stories section not found'
            });
        }

        const newStatus = !stories.isActive;

        if (newStatus) {
            await Stories.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }

        stories.isActive = newStatus;
        await stories.save();

        res.status(200).json({
            success: true,
            data: stories
        });
    } catch (error) {
        console.error('Error toggling stories status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle stories status',
            error: error.message
        });
    }
};

// ============================================
// IMAGE UPLOAD - MAIN STORY IMAGE
// ============================================
exports.uploadMainStoryImage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const stories = await Stories.findById(id);

        if (!stories) {
            return res.status(404).json({
                success: false,
                message: 'Stories section not found'
            });
        }

        const imageUrl = `/uploads/stories/${req.file.filename}`;
        stories.mainStory.imageUrl = imageUrl;
        stories.mainStory.imageFile = req.file.filename;
        await stories.save();

        res.status(200).json({
            success: true,
            data: stories,
            message: 'Main story image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading main story image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};

// ============================================
// IMAGE UPLOAD - CATEGORY IMAGE
// ============================================
exports.uploadCategoryImage = async (req, res) => {
    try {
        const { id, categoryIndex } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const stories = await Stories.findById(id);

        if (!stories) {
            return res.status(404).json({
                success: false,
                message: 'Stories section not found'
            });
        }

        const index = parseInt(categoryIndex);
        if (isNaN(index) || index < 0 || index >= stories.categories.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category index'
            });
        }

        const imageUrl = `/uploads/stories/categories/${req.file.filename}`;
        stories.categories[index].imageUrl = imageUrl;
        stories.categories[index].imageFile = req.file.filename;
        await stories.save();

        res.status(200).json({
            success: true,
            data: stories,
            message: 'Category image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading category image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};

// ============================================
// REMOVE MAIN STORY IMAGE
// ============================================
exports.removeMainStoryImage = async (req, res) => {
    try {
        const { id } = req.params;

        const stories = await Stories.findById(id);

        if (!stories) {
            return res.status(404).json({
                success: false,
                message: 'Stories section not found'
            });
        }

        stories.mainStory.imageUrl = '';
        stories.mainStory.imageFile = '';
        await stories.save();

        res.status(200).json({
            success: true,
            data: stories,
            message: 'Main story image removed successfully'
        });
    } catch (error) {
        console.error('Error removing main story image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove image',
            error: error.message
        });
    }
};

// ============================================
// REMOVE CATEGORY IMAGE
// ============================================
exports.removeCategoryImage = async (req, res) => {
    try {
        const { id, categoryIndex } = req.params;

        const stories = await Stories.findById(id);

        if (!stories) {
            return res.status(404).json({
                success: false,
                message: 'Stories section not found'
            });
        }

        const index = parseInt(categoryIndex);
        if (isNaN(index) || index < 0 || index >= stories.categories.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category index'
            });
        }

        stories.categories[index].imageUrl = '';
        stories.categories[index].imageFile = '';
        await stories.save();

        res.status(200).json({
            success: true,
            data: stories,
            message: 'Category image removed successfully'
        });
    } catch (error) {
        console.error('Error removing category image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove image',
            error: error.message
        });
    }
};