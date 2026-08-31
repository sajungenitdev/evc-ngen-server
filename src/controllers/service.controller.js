// src/controllers/service.controller.js
const Service = require('../models/Service');

// ============================================
// CREATE - Create a new service
// ============================================
// @desc    Create a new service
// @route   POST /api/services
// @access  Private/Admin
exports.createService = async (req, res) => {
    try {
        const {
            title,
            badge,
            description,
            richDescription,
            details,
            icon,
            imageUrl,
            link,
            color,
            features,
            process,
            price,
            duration,
            actionText,
            isActive,
            category,
        } = req.body;

        // Validate required fields
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Title is required',
            });
        }

        // Check if service already exists
        const existingService = await Service.findOne({
            title: { $regex: new RegExp(`^${title}$`, 'i') },
        });

        if (existingService) {
            return res.status(400).json({
                success: false,
                message: 'Service with this title already exists',
            });
        }

        // Create service
        const service = await Service.create({
            id: title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            title,
            badge: badge || 'SERVICE',
            description: description || '',
            richDescription: richDescription || '',
            details: details || '',
            icon: icon || '📋',
            imageUrl: imageUrl || '/images/services/default.jpg',
            link: link || `/services/${title.toLowerCase().replace(/\s+/g, '-')}`,
            color: color || 'bg-[#0c1f38]',
            features: features || [],
            process: process || [],
            price: price || '',
            duration: duration || '',
            actionText: actionText || 'Request a Service',
            isActive: isActive !== undefined ? isActive : true,
            category: category || 'assessment',
        });

        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            data: service,
        });
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get all services with filters
// ============================================
// @desc    Get all services with filters
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            category,
            isActive,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const query = {};
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (category && category !== 'all') query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } },
                { badge: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const services = await Service.find(query)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit));

        const total = await Service.countDocuments(query);

        // Get category stats
        const stats = {
            total: await Service.countDocuments({}),
            assessment: await Service.countDocuments({ category: 'assessment' }),
            installation: await Service.countDocuments({ category: 'installation' }),
            maintenance: await Service.countDocuments({ category: 'maintenance' }),
            support: await Service.countDocuments({ category: 'support' }),
            training: await Service.countDocuments({ category: 'training' }),
            custom: await Service.countDocuments({ category: 'custom' }),
        };

        // Get color options for frontend
        const colorOptions = [
            { value: 'bg-[#0c1f38]', label: 'Dark Navy' },
            { value: 'bg-[#1f7a3d]', label: 'Green' },
            { value: 'bg-[#12946b]', label: 'Teal' },
            { value: 'bg-[#2a3f66]', label: 'Slate Blue' },
            { value: 'bg-[#16493f]', label: 'Dark Teal' },
            { value: 'bg-[#0c2138]', label: 'Deep Navy' },
            { value: 'bg-[#7c3aed]', label: 'Purple' },
            { value: 'bg-[#2563eb]', label: 'Blue' },
            { value: 'bg-[#d97706]', label: 'Amber' },
            { value: 'bg-[#0891b2]', label: 'Cyan' },
            { value: 'bg-[#059669]', label: 'Emerald' },
            { value: 'bg-[#dc2626]', label: 'Red' },
        ];

        res.json({
            success: true,
            data: services,
            stats,
            colorOptions,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit),
            },
        });
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get services by category
// ============================================
// @desc    Get services by category
// @route   GET /api/services/category/:category
// @access  Public
exports.getServicesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 20, page = 1 } = req.query;

        // Validate category
        const validCategories = ['assessment', 'installation', 'maintenance', 'support', 'training', 'custom'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category. Must be one of: ' + validCategories.join(', '),
            });
        }

        const skip = (page - 1) * limit;
        const services = await Service.find({ category, isActive: true })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Service.countDocuments({ category, isActive: true });

        res.json({
            success: true,
            data: services,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit),
            },
        });
    } catch (error) {
        console.error('Get services by category error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get single service with related services
// ============================================
// @desc    Get single service with related services
// @route   GET /api/services/:id
// @access  Public
exports.getService = async (req, res) => {
    try {
        const id = req.params.id;

        // Decode URL-encoded ID
        const decodedId = decodeURIComponent(id);

        // ✅ FIRST: Try to find by custom 'id' field
        let service = await Service.findOne({ id: decodedId });

        // ✅ SECOND: If not found, try to find by MongoDB _id
        if (!service) {
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(decodedId)) {
                service = await Service.findById(decodedId);
            }
        }

        // ✅ THIRD: Try to find by title (fallback)
        if (!service) {
            // Try to find by matching the slug part of the ID
            const slugPart = decodedId.split('-').slice(0, -1).join('-');
            if (slugPart) {
                service = await Service.findOne({
                    id: { $regex: new RegExp(`^${slugPart}`) }
                });
            }
        }

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found',
            });
        }

        // ✅ FIX: Get related services by category (excluding current)
        // Make sure we use the category field properly
        const relatedServices = await Service.find({
            _id: { $ne: service._id },
            category: service.category,
            isActive: true,
        })
            .limit(4)
            .select('id title description icon color link imageUrl');

        // Get all categories
        const categories = [
            { id: 'all', label: 'All Services' },
            { id: 'assessment', label: 'Assessment' },
            { id: 'installation', label: 'Installation' },
            { id: 'maintenance', label: 'Maintenance' },
            { id: 'support', label: 'Support' },
            { id: 'training', label: 'Training' },
            { id: 'custom', label: 'Custom' },
        ];

        // Get category stats
        const stats = {
            total: await Service.countDocuments({}),
            assessment: await Service.countDocuments({ category: 'assessment' }),
            installation: await Service.countDocuments({ category: 'installation' }),
            maintenance: await Service.countDocuments({ category: 'maintenance' }),
            support: await Service.countDocuments({ category: 'support' }),
            training: await Service.countDocuments({ category: 'training' }),
            custom: await Service.countDocuments({ category: 'custom' }),
        };

        res.json({
            success: true,
            data: {
                ...service.toObject(),
                related: relatedServices,
            },
            categories,
            stats,
        });
    } catch (error) {
        console.error('Get service error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// UPDATE - Update service
// ============================================
// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private/Admin
exports.updateService = async (req, res) => {
    try {
        const id = req.params.id;
        const {
            title,
            badge,
            description,
            richDescription,
            details,
            icon,
            imageUrl,
            link,
            color,
            features,
            process,
            price,
            duration,
            actionText,
            isActive,
            category,
        } = req.body;

        // ✅ FIRST: Try to find by custom 'id' field
        let service = await Service.findOne({ id: id });

        // ✅ SECOND: If not found, try to find by MongoDB _id
        if (!service) {
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(id)) {
                service = await Service.findById(id);
            }
        }

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found',
            });
        }

        // Check if new title conflicts
        if (title && title !== service.title) {
            const existingService = await Service.findOne({
                title: { $regex: new RegExp(`^${title}$`, 'i') },
                _id: { $ne: service._id }
            });
            if (existingService) {
                return res.status(400).json({
                    success: false,
                    message: 'Service with this title already exists',
                });
            }
        }

        // Update fields
        if (title) {
            service.title = title;
            service.id = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        }
        if (badge) service.badge = badge;
        if (description !== undefined) service.description = description;
        if (richDescription !== undefined) service.richDescription = richDescription;
        if (details !== undefined) service.details = details;
        if (icon) service.icon = icon;
        if (imageUrl) service.imageUrl = imageUrl;
        if (link) service.link = link;
        if (color) service.color = color;
        if (features) service.features = features;
        if (process !== undefined) service.process = process;
        if (price !== undefined) service.price = price;
        if (duration !== undefined) service.duration = duration;
        if (actionText) service.actionText = actionText;
        if (isActive !== undefined) service.isActive = isActive;
        if (category) service.category = category;

        await service.save();

        // Get updated related services
        const relatedServices = await Service.find({
            _id: { $ne: service._id },
            category: service.category,
            isActive: true,
        })
            .limit(4)
            .select('id title description icon color link imageUrl');

        res.json({
            success: true,
            message: 'Service updated successfully',
            data: {
                ...service.toObject(),
                related: relatedServices,
            },
        });
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// DELETE - Delete service
// ============================================
// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private/Admin
exports.deleteService = async (req, res) => {
    try {
        const id = req.params.id;

        // ✅ FIRST: Try to find by custom 'id' field
        let service = await Service.findOne({ id: id });

        // ✅ SECOND: If not found, try to find by MongoDB _id
        if (!service) {
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(id)) {
                service = await Service.findById(id);
            }
        }

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found',
            });
        }

        await service.deleteOne();

        res.json({
            success: true,
            message: 'Service deleted successfully',
        });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// TOGGLE - Toggle service status
// ============================================
// @desc    Toggle service active status
// @route   PUT /api/services/:id/toggle
// @access  Private/Admin
exports.toggleServiceStatus = async (req, res) => {
    try {
        const id = req.params.id;

        // ✅ FIRST: Try to find by custom 'id' field
        let service = await Service.findOne({ id: id });

        // ✅ SECOND: If not found, try to find by MongoDB _id
        if (!service) {
            const mongoose = require('mongoose');
            if (mongoose.Types.ObjectId.isValid(id)) {
                service = await Service.findById(id);
            }
        }

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found',
            });
        }

        service.isActive = !service.isActive;
        await service.save();

        res.json({
            success: true,
            message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
            data: service,
        });
    } catch (error) {
        console.error('Toggle service status error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// BULK - Delete multiple services
// ============================================
// @desc    Delete multiple services
// @route   DELETE /api/services/bulk
// @access  Private/Admin
exports.deleteMultipleServices = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of service IDs',
            });
        }

        const result = await Service.deleteMany({
            $or: [
                { id: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        res.json({
            success: true,
            message: `${result.deletedCount} services deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('Delete multiple services error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// GET - Get service categories
// ============================================
// @desc    Get all service categories
// @route   GET /api/services/categories
// @access  Public
exports.getServiceCategories = async (req, res) => {
    try {
        const categories = [
            { id: 'all', label: 'All Services' },
            { id: 'assessment', label: 'Assessment' },
            { id: 'installation', label: 'Installation' },
            { id: 'maintenance', label: 'Maintenance' },
            { id: 'support', label: 'Support' },
            { id: 'training', label: 'Training' },
            { id: 'custom', label: 'Custom' },
        ];

        const colorOptions = [
            { value: 'bg-[#0c1f38]', label: 'Dark Navy' },
            { value: 'bg-[#1f7a3d]', label: 'Green' },
            { value: 'bg-[#12946b]', label: 'Teal' },
            { value: 'bg-[#2a3f66]', label: 'Slate Blue' },
            { value: 'bg-[#16493f]', label: 'Dark Teal' },
            { value: 'bg-[#0c2138]', label: 'Deep Navy' },
            { value: 'bg-[#7c3aed]', label: 'Purple' },
            { value: 'bg-[#2563eb]', label: 'Blue' },
            { value: 'bg-[#d97706]', label: 'Amber' },
            { value: 'bg-[#0891b2]', label: 'Cyan' },
            { value: 'bg-[#059669]', label: 'Emerald' },
            { value: 'bg-[#dc2626]', label: 'Red' },
        ];

        // Get category stats
        const stats = {
            total: await Service.countDocuments({}),
            assessment: await Service.countDocuments({ category: 'assessment' }),
            installation: await Service.countDocuments({ category: 'installation' }),
            maintenance: await Service.countDocuments({ category: 'maintenance' }),
            support: await Service.countDocuments({ category: 'support' }),
            training: await Service.countDocuments({ category: 'training' }),
            custom: await Service.countDocuments({ category: 'custom' }),
        };

        res.json({
            success: true,
            data: {
                categories,
                colorOptions,
                stats,
            },
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};