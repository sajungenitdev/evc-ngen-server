// src/controllers/foundation.controller.js
const Foundation = require('../models/Foundation');
const { deleteFromImgBB } = require('../services/imgbb.service');

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
// HELPER: Process foundation items with ImgBB URLs
// ============================================
const processFoundationItems = (items, imgbbUrls = []) => {
    if (!items || !Array.isArray(items)) return items;
    
    return items.map((item, index) => {
        const processedItem = { ...item };
        
        // If we have an ImgBB URL for this index, use it
        if (imgbbUrls && imgbbUrls[index]) {
            processedItem.imageUrl = imgbbUrls[index];
            processedItem.imageDeleteUrl = imgbbDeleteUrls[index] || null;
        }
        
        // Handle stringified JSON from form data
        if (typeof item === 'string') {
            try {
                return JSON.parse(item);
            } catch (e) {
                return item;
            }
        }
        
        return processedItem;
    });
};

// @desc    Get active foundation section
// @route   GET /api/foundation
// @access  Public
exports.getFoundation = async (req, res) => {
    try {
        let foundation = await Foundation.findOne({ isActive: true });
        
        if (!foundation) {
            // Create default foundation with placeholder images
            foundation = await Foundation.create({
                heading: 'Build Our Foundation',
                subtitle: 'EVNGEN is driven by a mission to make electric energy work harder for people and the planet — engineering every product around reliability, efficiency, and long-term value.',
                items: [
                    {
                        title: 'Values',
                        description: 'Sincerity, integrity, and long-termism guide every decision we make.',
                        bgClass: '#0c1f38',
                        imageUrl: '/images/foundation/EV-Article-Charging-RR.jpg',
                        imageAlt: 'Values - EVNGEN core principles',
                        order: 0,
                        isActive: true
                    },
                    {
                        title: 'Development',
                        description: 'Unceasing in effort, boundless in reach.',
                        bgClass: '#16493f',
                        imageUrl: '/images/foundation/ev-2-edit.min_.jpg',
                        imageAlt: 'Development - EVNGEN growth',
                        order: 1,
                        isActive: true
                    },
                    {
                        title: 'Technology',
                        description: 'Be the energy master in the grid.',
                        bgClass: '#0c2138',
                        imageUrl: '/images/foundation/innovations-voitures-electriques.jpg',
                        imageAlt: 'Technology - EVNGEN innovation',
                        order: 2,
                        isActive: true
                    },
                    {
                        title: 'Sustainability',
                        description: 'Driving the transition to a greener, sustainable future.',
                        bgClass: '#183a1f',
                        imageUrl: '/images/foundation/green_EV_charger_and_car_smart_city_Adobe_rt.jpg',
                        imageAlt: 'Sustainability - EVNGEN green future',
                        order: 3,
                        isActive: true
                    }
                ],
                isActive: true
            });
        }
        
        res.status(200).json({
            success: true,
            data: foundation
        });
    } catch (error) {
        console.error('Error fetching foundation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch foundation data',
            error: error.message
        });
    }
};

// @desc    Get all foundation sections (admin)
// @route   GET /api/foundation/all
// @access  Public (for now)
exports.getAllFoundation = async (req, res) => {
    try {
        const foundations = await Foundation.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: foundations.length,
            data: foundations
        });
    } catch (error) {
        console.error('Error fetching foundations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch foundations',
            error: error.message
        });
    }
};

// @desc    Create foundation section with ImgBB
// @route   POST /api/foundation
// @access  Public (for now)
exports.createFoundation = async (req, res) => {
    try {
        console.log('📦 Creating foundation with body:', req.body);
        console.log('🖼️ ImgBB URLs:', req.imgbbUrls);

        // If setting as active, deactivate others
        if (req.body.isActive) {
            await Foundation.updateMany(
                { isActive: true },
                { isActive: false }
            );
        }

        // Parse items if they come as string
        let items = req.body.items;
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                items = [];
            }
        }

        // ✅ Process items with ImgBB URLs
        const processedItems = items.map((item, index) => {
            const processedItem = { ...item };
            
            // If we have an ImgBB URL for this item, use it
            if (req.imgbbUrls && req.imgbbUrls[index]) {
                processedItem.imageUrl = req.imgbbUrls[index];
                processedItem.imageDeleteUrl = req.imgbbDeleteUrls?.[index] || null;
            }
            
            return processedItem;
        });

        const foundationData = {
            ...req.body,
            items: processedItems
        };

        const foundation = await Foundation.create(foundationData);
        
        res.status(201).json({
            success: true,
            data: foundation,
            message: 'Foundation created successfully with ImgBB hosting'
        });
    } catch (error) {
        console.error('Error creating foundation:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create foundation',
            error: error.message
        });
    }
};

// @desc    Update foundation section with ImgBB
// @route   PUT /api/foundation/:id
// @access  Public (for now)
exports.updateFoundation = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📦 Updating foundation with body:', req.body);
        console.log('🖼️ ImgBB URLs:', req.imgbbUrls);

        let foundation = await Foundation.findById(id);
        
        if (!foundation) {
            return res.status(404).json({
                success: false,
                message: 'Foundation not found'
            });
        }
        
        // If setting as active, deactivate others
        if (req.body.isActive) {
            await Foundation.updateMany(
                { _id: { $ne: id }, isActive: true },
                { isActive: false }
            );
        }

        // Parse items if they come as string
        let items = req.body.items;
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                items = foundation.items || [];
            }
        }

        // ✅ Process items with ImgBB URLs
        // Delete old images from ImgBB for items being replaced
        if (req.imgbbUrls && req.imgbbUrls.length > 0) {
            // Delete old images for items that are being updated
            for (let i = 0; i < Math.min(req.imgbbUrls.length, foundation.items.length); i++) {
                if (foundation.items[i] && foundation.items[i].imageDeleteUrl) {
                    await deleteImageFromImgBB(foundation.items[i].imageDeleteUrl);
                }
            }
        }

        const processedItems = items.map((item, index) => {
            const processedItem = { ...item };
            
            // If we have an ImgBB URL for this item, use it
            if (req.imgbbUrls && req.imgbbUrls[index]) {
                processedItem.imageUrl = req.imgbbUrls[index];
                processedItem.imageDeleteUrl = req.imgbbDeleteUrls?.[index] || null;
            }
            
            return processedItem;
        });

        const foundationData = {
            ...req.body,
            items: processedItems
        };

        foundation = await Foundation.findByIdAndUpdate(
            id,
            foundationData,
            { new: true, runValidators: true }
        );
        
        res.status(200).json({
            success: true,
            data: foundation,
            message: 'Foundation updated successfully with ImgBB'
        });
    } catch (error) {
        console.error('Error updating foundation:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update foundation',
            error: error.message
        });
    }
};

// @desc    Delete foundation section with ImgBB cleanup
// @route   DELETE /api/foundation/:id
// @access  Public (for now)
exports.deleteFoundation = async (req, res) => {
    try {
        const foundation = await Foundation.findById(req.params.id);
        
        if (!foundation) {
            return res.status(404).json({
                success: false,
                message: 'Foundation not found'
            });
        }

        // ✅ Delete all item images from ImgBB
        if (foundation.items && foundation.items.length > 0) {
            for (const item of foundation.items) {
                if (item.imageDeleteUrl) {
                    await deleteImageFromImgBB(item.imageDeleteUrl);
                }
            }
        }
        
        await foundation.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'Foundation and its images deleted successfully from ImgBB'
        });
    } catch (error) {
        console.error('Error deleting foundation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete foundation',
            error: error.message
        });
    }
};

// @desc    Toggle foundation status
// @route   PUT /api/foundation/:id/toggle
// @access  Public (for now)
exports.toggleFoundationStatus = async (req, res) => {
    try {
        const foundation = await Foundation.findById(req.params.id);
        
        if (!foundation) {
            return res.status(404).json({
                success: false,
                message: 'Foundation not found'
            });
        }
        
        const newStatus = !foundation.isActive;
        
        // If activating, deactivate others
        if (newStatus) {
            await Foundation.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }
        
        foundation.isActive = newStatus;
        await foundation.save();
        
        res.status(200).json({
            success: true,
            data: foundation,
            message: `Foundation ${newStatus ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('Error toggling foundation status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle foundation status',
            error: error.message
        });
    }
};

// @desc    Upload foundation item image to ImgBB
// @route   POST /api/foundation/:id/upload-image/:itemIndex
// @access  Public (for now)
exports.uploadFoundationImage = async (req, res) => {
    try {
        const { id, itemIndex } = req.params;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }
        
        const foundation = await Foundation.findById(id);
        
        if (!foundation) {
            return res.status(404).json({
                success: false,
                message: 'Foundation not found'
            });
        }
        
        const index = parseInt(itemIndex);
        if (isNaN(index) || index < 0 || index >= foundation.items.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid item index'
            });
        }

        // ✅ Upload to ImgBB using the service
        const { uploadToImgBB } = require('../services/imgbb.service');
        
        // Read the file and convert to base64
        const fs = require('fs');
        const fileBuffer = fs.readFileSync(req.file.path);
        const base64Image = fileBuffer.toString('base64');
        
        const result = await uploadToImgBB(
            base64Image,
            `foundation-${Date.now()}-${index}`
        );
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload image to ImgBB: ' + result.error
            });
        }

        // Delete old image from ImgBB if exists
        if (foundation.items[index].imageDeleteUrl) {
            await deleteImageFromImgBB(foundation.items[index].imageDeleteUrl);
        }

        // Update the specific item's imageUrl  
        foundation.items[index].imageUrl = result.url;
        foundation.items[index].imageDeleteUrl = result.deleteUrl;
        await foundation.save();

        // Clean up temp file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(200).json({
            success: true,
            data: foundation,
            message: 'Image uploaded successfully to ImgBB'
        });
    } catch (error) {
        console.error('Error uploading foundation image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};