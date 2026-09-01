// src/controllers/storiesSection.controller.js
const Stories = require('../models/Stories');
const { deleteFromImgBB } = require('../services/imgbb.service');

const deleteImageFromImgBB = async (deleteUrl) => {
    if (!deleteUrl) return;
    try {
        await deleteFromImgBB(deleteUrl);
        console.log(`✅ Deleted image from ImgBB: ${deleteUrl}`);
    } catch (error) {
        console.error(`❌ Failed to delete image from ImgBB:`, error);
    }
};

// ============================================
// GET ACTIVE STORIES SECTION
// ============================================
exports.getStories = async (req, res) => {
    try {
        let stories = await Stories.findOne({ isActive: true });

        if (!stories) {
            stories = await Stories.create({
                heading: 'Discover Our Stories',
                subtitle: 'Real deployments, real impact — a closer look at how our charging infrastructure performs in the field.',
                mainStory: {
                    quote: 'EVNGEN completed a 120kW DC fast-charging hub deployment in under six weeks, from site survey to grid commissioning — powering a commercial fleet depot around the clock.',
                    linkText: 'See All Deployment Stories →',
                    link: '/stories',
                    imageUrl: '/images/stories/EVNGEN completed.webp'
                },
                categories: [],
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
        console.log('📦 Creating stories');

        // Parse main story
        let mainStory = {};
        try {
            mainStory = typeof req.body.mainStory === 'string' 
                ? JSON.parse(req.body.mainStory) 
                : req.body.mainStory || {};
        } catch (e) {
            mainStory = {};
        }

        // Parse categories
        let categories = [];
        try {
            categories = typeof req.body.categories === 'string' 
                ? JSON.parse(req.body.categories) 
                : req.body.categories || [];
        } catch (e) {
            categories = [];
        }

        // Handle main image from ImgBB
        if (req.imgbbMainImageUrl) {
            mainStory.imageUrl = req.imgbbMainImageUrl;
            mainStory.imageDeleteUrl = req.imgbbMainDeleteUrl;
        }

        // Process category images
        if (req.imgbbUrls && req.imgbbUrls.length > 0) {
            categories = categories.map((cat, index) => ({
                title: cat.title || '',
                imageUrl: req.imgbbUrls[index] || cat.imageUrl || '',
                imageDeleteUrl: req.imgbbDeleteUrls?.[index] || null,
                link: cat.link || '/solutions',
                order: cat.order || index,
                isActive: cat.isActive !== undefined ? cat.isActive : true
            }));
        }

        const stories = await Stories.create({
            heading: req.body.heading || 'Discover Our Stories',
            subtitle: req.body.subtitle || '',
            mainStory: mainStory,
            categories: categories,
            isActive: req.body.isActive === 'true' || req.body.isActive === true,
            backgroundColor: req.body.backgroundColor || '#ffffff',
            textColor: req.body.textColor || '#071322',
            sectionId: req.body.sectionId || 'stories'
        });

        res.status(201).json({
            success: true,
            data: stories,
            message: 'Stories section created successfully'
        });
    } catch (error) {
        console.error('Error creating stories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create stories',
            error: error.message
        });
    }
};

// ============================================
// ✅ SIMPLIFIED UPDATE - THIS WORKS
// ============================================
exports.updateStories = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📦 Updating stories');

        // ✅ Find existing document
        const stories = await Stories.findById(id);
        if (!stories) {
            return res.status(404).json({
                success: false,
                message: 'Stories section not found'
            });
        }

        // ✅ Parse main story - just use what's sent or keep existing
        let mainStory = {};
        try {
            if (typeof req.body.mainStory === 'string') {
                mainStory = JSON.parse(req.body.mainStory);
            } else if (req.body.mainStory) {
                mainStory = req.body.mainStory;
            } else {
                mainStory = stories.mainStory || {};
            }
        } catch (e) {
            mainStory = stories.mainStory || {};
        }

        // ✅ Handle main image from ImgBB
        if (req.imgbbMainImageUrl) {
            if (stories.mainStory && stories.mainStory.imageDeleteUrl) {
                await deleteImageFromImgBB(stories.mainStory.imageDeleteUrl);
            }
            mainStory.imageUrl = req.imgbbMainImageUrl;
            mainStory.imageDeleteUrl = req.imgbbMainDeleteUrl;
        }

        // ✅ Parse categories
        let categories = [];
        try {
            if (typeof req.body.categories === 'string') {
                categories = JSON.parse(req.body.categories);
            } else if (req.body.categories) {
                categories = req.body.categories;
            } else {
                categories = stories.categories || [];
            }
        } catch (e) {
            categories = stories.categories || [];
        }

        // ✅ Process category images from ImgBB
        if (req.imgbbUrls && req.imgbbUrls.length > 0) {
            // Delete old category images
            for (let i = 0; i < Math.min(req.imgbbUrls.length, stories.categories.length); i++) {
                if (stories.categories[i] && stories.categories[i].imageDeleteUrl) {
                    await deleteImageFromImgBB(stories.categories[i].imageDeleteUrl);
                }
            }

            // Update categories with new ImgBB URLs
            categories = categories.map((cat, index) => ({
                title: cat.title || '',
                imageUrl: req.imgbbUrls[index] || cat.imageUrl || '',
                imageDeleteUrl: req.imgbbDeleteUrls?.[index] || null,
                link: cat.link || '/solutions',
                order: cat.order || index,
                isActive: cat.isActive !== undefined ? cat.isActive : true
            }));
        }

        // ✅ CRITICAL: Remove _id from each category
        categories = categories.map(cat => {
            const { _id, ...cleanCat } = cat;
            return cleanCat;
        });

        // ✅ Handle isActive
        const isActive = req.body.isActive === 'true' || req.body.isActive === true;

        if (isActive) {
            await Stories.updateMany(
                { _id: { $ne: id }, isActive: true },
                { isActive: false }
            );
        }

        // ✅ Build update object
        const updateData = {
            heading: req.body.heading || stories.heading,
            subtitle: req.body.subtitle || stories.subtitle,
            mainStory: mainStory,
            categories: categories,
            isActive: isActive || stories.isActive,
            backgroundColor: req.body.backgroundColor || stories.backgroundColor,
            textColor: req.body.textColor || stories.textColor,
            sectionId: req.body.sectionId || stories.sectionId
        };

        // ✅ Update the document
        const updatedStories = await Stories.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: updatedStories,
            message: 'Stories section updated successfully'
        });
    } catch (error) {
        console.error('❌ Error updating stories:', error);
        res.status(500).json({
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

        if (stories.mainStory && stories.mainStory.imageDeleteUrl) {
            await deleteImageFromImgBB(stories.mainStory.imageDeleteUrl);
        }

        if (stories.categories && stories.categories.length > 0) {
            for (const category of stories.categories) {
                if (category.imageDeleteUrl) {
                    await deleteImageFromImgBB(category.imageDeleteUrl);
                }
            }
        }

        await stories.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Stories section and its images deleted successfully'
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
            data: stories,
            message: `Stories section ${newStatus ? 'activated' : 'deactivated'} successfully`
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

        if (!req.imgbbImageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload image: No image URL returned'
            });
        }

        const stories = await Stories.findById(id);
        if (!stories) {
            return res.status(404).json({
                success: false,
                message: 'Stories section not found'
            });
        }

        if (stories.mainStory && stories.mainStory.imageDeleteUrl) {
            await deleteImageFromImgBB(stories.mainStory.imageDeleteUrl);
        }

        stories.mainStory.imageUrl = req.imgbbImageUrl;
        stories.mainStory.imageDeleteUrl = req.imgbbDeleteUrl;
        await stories.save();

        res.status(200).json({
            success: true,
            data: stories,
            message: 'Main story image uploaded successfully',
            imageUrl: req.imgbbImageUrl
        });
    } catch (error) {
        console.error('❌ Error uploading main story image:', error);
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

        if (!req.imgbbImageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload image: No image URL returned'
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
                message: `Invalid category index ${index}`
            });
        }

        if (stories.categories[index].imageDeleteUrl) {
            await deleteImageFromImgBB(stories.categories[index].imageDeleteUrl);
        }

        stories.categories[index].imageUrl = req.imgbbImageUrl;
        stories.categories[index].imageDeleteUrl = req.imgbbDeleteUrl;
        await stories.save();

        res.status(200).json({
            success: true,
            data: stories,
            message: 'Category image uploaded successfully',
            imageUrl: req.imgbbImageUrl
        });
    } catch (error) {
        console.error('❌ Error uploading category image:', error);
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

        if (stories.mainStory && stories.mainStory.imageDeleteUrl) {
            await deleteImageFromImgBB(stories.mainStory.imageDeleteUrl);
        }

        stories.mainStory.imageUrl = '';
        stories.mainStory.imageDeleteUrl = null;
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

        if (stories.categories[index].imageDeleteUrl) {
            await deleteImageFromImgBB(stories.categories[index].imageDeleteUrl);
        }

        stories.categories[index].imageUrl = '';
        stories.categories[index].imageDeleteUrl = null;
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