// src/controllers/storiesSection.controller.js
const Stories = require('../models/Stories');
const { deleteFromImgBB } = require('../services/imgbb.service');
const fs = require('fs');

// ============================================
// HELPER: Delete image from ImgBB
// ============================================
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
        console.log('📦 Creating stories with body:', req.body);
        console.log('🖼️ ImgBB URLs:', req.imgbbUrls);

        if (req.body.isActive) {
            await Stories.updateMany(
                { isActive: true },
                { isActive: false }
            );
        }

        // Parse categories if they come as string
        let categories = req.body.categories;
        if (typeof categories === 'string') {
            try {
                categories = JSON.parse(categories);
            } catch (e) {
                categories = [];
            }
        }

        // Process main story image
        let mainStory = { ...req.body.mainStory };
        if (typeof mainStory === 'string') {
            try {
                mainStory = JSON.parse(mainStory);
            } catch (e) {
                mainStory = {};
            }
        }
        if (req.imgbbMainImageUrl) {
            mainStory.imageUrl = req.imgbbMainImageUrl;
            mainStory.imageDeleteUrl = req.imgbbMainDeleteUrl;
        }

        // Process category images
        const processedCategories = categories.map((category, index) => {
            const processed = { ...category };
            if (req.imgbbUrls && req.imgbbUrls[index]) {
                processed.imageUrl = req.imgbbUrls[index];
                processed.imageDeleteUrl = req.imgbbDeleteUrls?.[index] || null;
            }
            return processed;
        });

        const stories = await Stories.create({
            ...req.body,
            mainStory,
            categories: processedCategories
        });

        res.status(201).json({
            success: true,
            data: stories,
            message: 'Stories section created successfully with ImgBB hosting'
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
        const { id } = req.params;
        console.log('📦 Updating stories with body:', req.body);
        console.log('🖼️ ImgBB URLs:', req.imgbbUrls);

        let stories = await Stories.findById(id);

        if (!stories) {
            return res.status(404).json({
                success: false,
                message: 'Stories section not found'
            });
        }

        if (req.body.isActive) {
            await Stories.updateMany(
                { _id: { $ne: id }, isActive: true },
                { isActive: false }
            );
        }

        // Parse categories if they come as string
        let categories = req.body.categories;
        if (typeof categories === 'string') {
            try {
                categories = JSON.parse(categories);
            } catch (e) {
                categories = stories.categories || [];
            }
        }

        // Process main story image
        let mainStory = { ...req.body.mainStory };
        if (typeof mainStory === 'string') {
            try {
                mainStory = JSON.parse(mainStory);
            } catch (e) {
                mainStory = stories.mainStory || {};
            }
        }

        // Handle main story image from ImgBB
        if (req.imgbbMainImageUrl) {
            // Delete old main image from ImgBB
            if (stories.mainStory && stories.mainStory.imageDeleteUrl) {
                await deleteImageFromImgBB(stories.mainStory.imageDeleteUrl);
            }
            mainStory.imageUrl = req.imgbbMainImageUrl;
            mainStory.imageDeleteUrl = req.imgbbMainDeleteUrl;
        }

        // Process category images
        const processedCategories = categories.map((category, index) => {
            const processed = { ...category };
            
            // Handle new ImgBB URLs for categories
            if (req.imgbbUrls && req.imgbbUrls[index]) {
                // Delete old category image from ImgBB if it exists
                if (stories.categories && stories.categories[index] && 
                    stories.categories[index].imageDeleteUrl) {
                    deleteImageFromImgBB(stories.categories[index].imageDeleteUrl);
                }
                processed.imageUrl = req.imgbbUrls[index];
                processed.imageDeleteUrl = req.imgbbDeleteUrls?.[index] || null;
            }
            
            // Remove _id from items before updating
            const { _id, ...cleanItem } = processed;
            return cleanItem;
        });

        const updateData = {
            ...req.body,
            mainStory,
            categories: processedCategories
        };

        stories = await Stories.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: stories,
            message: 'Stories section updated successfully with ImgBB'
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

        // ✅ Delete main story image from ImgBB
        if (stories.mainStory && stories.mainStory.imageDeleteUrl) {
            await deleteImageFromImgBB(stories.mainStory.imageDeleteUrl);
        }

        // ✅ Delete category images from ImgBB
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
            message: 'Stories section and its images deleted successfully from ImgBB'
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

        // ✅ Upload to ImgBB
        const { uploadToImgBB } = require('../services/imgbb.service');
        const fileBuffer = fs.readFileSync(req.file.path);
        const base64Image = fileBuffer.toString('base64');

        const result = await uploadToImgBB(
            base64Image,
            `stories-main-${Date.now()}`
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload image to ImgBB: ' + result.error
            });
        }

        // Delete old image from ImgBB if exists
        if (stories.mainStory && stories.mainStory.imageDeleteUrl) {
            await deleteImageFromImgBB(stories.mainStory.imageDeleteUrl);
        }

        stories.mainStory.imageUrl = result.url;
        stories.mainStory.imageDeleteUrl = result.deleteUrl;
        await stories.save();

        // Clean up temp file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(200).json({
            success: true,
            data: stories,
            message: 'Main story image uploaded successfully to ImgBB'
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

        // ✅ Upload to ImgBB
        const { uploadToImgBB } = require('../services/imgbb.service');
        const fileBuffer = fs.readFileSync(req.file.path);
        const base64Image = fileBuffer.toString('base64');

        const result = await uploadToImgBB(
            base64Image,
            `stories-category-${Date.now()}-${index}`
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload image to ImgBB: ' + result.error
            });
        }

        // Delete old category image from ImgBB if exists
        if (stories.categories[index].imageDeleteUrl) {
            await deleteImageFromImgBB(stories.categories[index].imageDeleteUrl);
        }

        stories.categories[index].imageUrl = result.url;
        stories.categories[index].imageDeleteUrl = result.deleteUrl;
        await stories.save();

        // Clean up temp file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(200).json({
            success: true,
            data: stories,
            message: 'Category image uploaded successfully to ImgBB'
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

        // ✅ Delete image from ImgBB
        if (stories.mainStory && stories.mainStory.imageDeleteUrl) {
            await deleteImageFromImgBB(stories.mainStory.imageDeleteUrl);
        }

        stories.mainStory.imageUrl = '';
        stories.mainStory.imageDeleteUrl = null;
        await stories.save();

        res.status(200).json({
            success: true,
            data: stories,
            message: 'Main story image removed successfully from ImgBB'
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

        // ✅ Delete image from ImgBB
        if (stories.categories[index].imageDeleteUrl) {
            await deleteImageFromImgBB(stories.categories[index].imageDeleteUrl);
        }

        stories.categories[index].imageUrl = '';
        stories.categories[index].imageDeleteUrl = null;
        await stories.save();

        res.status(200).json({
            success: true,
            data: stories,
            message: 'Category image removed successfully from ImgBB'
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