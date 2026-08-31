const Foundation = require('../models/Foundation');
const path = require('path');
const fs = require('fs');

// @desc    Get active foundation section
// @route   GET /api/foundation
// @access  Public
exports.getFoundation = async (req, res) => {
    try {
        let foundation = await Foundation.findOne({ isActive: true });
        
        if (!foundation) {
            // Create default foundation if none exists
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

// @desc    Create foundation section
// @route   POST /api/foundation
// @access  Public (for now)
exports.createFoundation = async (req, res) => {
    try {
        // If setting as active, deactivate others
        if (req.body.isActive) {
            await Foundation.updateMany(
                { isActive: true },
                { isActive: false }
            );
        }
        
        const foundation = await Foundation.create(req.body);
        res.status(201).json({
            success: true,
            data: foundation
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

// @desc    Update foundation section
// @route   PUT /api/foundation/:id
// @access  Public (for now)
exports.updateFoundation = async (req, res) => {
    try {
        let foundation = await Foundation.findById(req.params.id);
        
        if (!foundation) {
            return res.status(404).json({
                success: false,
                message: 'Foundation not found'
            });
        }
        
        // If setting as active, deactivate others
        if (req.body.isActive) {
            await Foundation.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }
        
        foundation = await Foundation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        res.status(200).json({
            success: true,
            data: foundation
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

// @desc    Delete foundation section
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
        
        await foundation.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'Foundation deleted successfully'
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
            data: foundation
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

// @desc    Upload foundation item image
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
        
        // Generate image URL
        const imageUrl = `/uploads/foundation/${req.file.filename}`;
        
        // Update the specific item's imageUrl
        foundation.items[index].imageUrl = imageUrl;
        await foundation.save();
        
        res.status(200).json({
            success: true,
            data: foundation,
            message: 'Image uploaded successfully'
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