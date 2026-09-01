// src/controllers/service.controller.js
const Service = require('../models/Service');
const mongoose = require('mongoose');
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
// CREATE - Create a new service with ImgBB
// ============================================
exports.createService = async (req, res) => {
    try {
        console.log('📦 Creating service with body:', req.body);
        console.log('🖼️ ImgBB URLs:', {
            imageUrl: req.imgbbImageUrl
        });

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

        // ✅ Handle image from ImgBB
        let mainImageUrl = imageUrl || '/images/services/default.jpg';
        let mainImageDeleteUrl = null;
        if (req.imgbbImageUrl) {
            mainImageUrl = req.imgbbImageUrl;
            mainImageDeleteUrl = req.imgbbDeleteUrl;
        }

        // Parse JSON fields if they come as strings
        const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features || [];
        const parsedProcess = typeof process === 'string' ? JSON.parse(process) : process || [];

        // Create service
        const service = await Service.create({
            id: title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            title,
            badge: badge || 'SERVICE',
            description: description || '',
            richDescription: richDescription || '',
            details: details || '',
            icon: icon || '📋',
            imageUrl: mainImageUrl,
            imageDeleteUrl: mainImageDeleteUrl,
            link: link || `/services/${title.toLowerCase().replace(/\s+/g, '-')}`,
            color: color || 'bg-[#0c1f38]',
            features: parsedFeatures,
            process: parsedProcess,
            price: price || '',
            duration: duration || '',
            actionText: actionText || 'Request a Service',
            isActive: isActive !== undefined ? isActive : true,
            category: category || 'assessment',
        });

        res.status(201).json({
            success: true,
            message: 'Service created successfully with ImgBB hosting',
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
exports.getServicesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 20, page = 1 } = req.query;

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
exports.getService = async (req, res) => {
    try {
        const id = req.params.id;
        const decodedId = decodeURIComponent(id);

        let service = await Service.findOne({ id: decodedId });
        if (!service && mongoose.Types.ObjectId.isValid(decodedId)) {
            service = await Service.findById(decodedId);
        }

        if (!service) {
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

        const relatedServices = await Service.find({
            _id: { $ne: service._id },
            category: service.category,
            isActive: true,
        })
            .limit(4)
            .select('id title description icon color link imageUrl');

        const categories = [
            { id: 'all', label: 'All Services' },
            { id: 'assessment', label: 'Assessment' },
            { id: 'installation', label: 'Installation' },
            { id: 'maintenance', label: 'Maintenance' },
            { id: 'support', label: 'Support' },
            { id: 'training', label: 'Training' },
            { id: 'custom', label: 'Custom' },
        ];

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
// UPDATE - Update service with ImgBB
// ============================================
exports.updateService = async (req, res) => {
    try {
        const id = req.params.id;
        console.log('📦 Updating service with body:', req.body);
        console.log('🖼️ ImgBB URLs:', {
            imageUrl: req.imgbbImageUrl
        });

        let service = await Service.findOne({ id: id });
        if (!service && mongoose.Types.ObjectId.isValid(id)) {
            service = await Service.findById(id);
        }

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found',
            });
        }

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

        // ✅ Handle image from ImgBB
        let mainImageUrl = imageUrl || service.imageUrl;
        let mainImageDeleteUrl = service.imageDeleteUrl;
        if (req.imgbbImageUrl) {
            // Delete old image from ImgBB
            if (service.imageDeleteUrl) {
                await deleteImageFromImgBB(service.imageDeleteUrl);
            }
            mainImageUrl = req.imgbbImageUrl;
            mainImageDeleteUrl = req.imgbbDeleteUrl;
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

        // Parse JSON fields if they come as strings
        const parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features || service.features;
        const parsedProcess = typeof process === 'string' ? JSON.parse(process) : process || service.process;

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
        service.imageUrl = mainImageUrl;
        service.imageDeleteUrl = mainImageDeleteUrl;
        if (link) service.link = link;
        if (color) service.color = color;
        if (features !== undefined) service.features = parsedFeatures;
        if (process !== undefined) service.process = parsedProcess;
        if (price !== undefined) service.price = price;
        if (duration !== undefined) service.duration = duration;
        if (actionText) service.actionText = actionText;
        if (isActive !== undefined) service.isActive = isActive;
        if (category) service.category = category;

        await service.save();

        const relatedServices = await Service.find({
            _id: { $ne: service._id },
            category: service.category,
            isActive: true,
        })
            .limit(4)
            .select('id title description icon color link imageUrl');

        res.json({
            success: true,
            message: 'Service updated successfully with ImgBB',
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
// DELETE - Delete service with ImgBB cleanup
// ============================================
exports.deleteService = async (req, res) => {
    try {
        const id = req.params.id;

        let service = await Service.findOne({ id: id });
        if (!service && mongoose.Types.ObjectId.isValid(id)) {
            service = await Service.findById(id);
        }

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found',
            });
        }

        // ✅ Delete image from ImgBB
        if (service.imageDeleteUrl) {
            await deleteImageFromImgBB(service.imageDeleteUrl);
        }

        await service.deleteOne();

        res.json({
            success: true,
            message: 'Service and its image deleted successfully from ImgBB',
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
exports.toggleServiceStatus = async (req, res) => {
    try {
        const id = req.params.id;

        let service = await Service.findOne({ id: id });
        if (!service && mongoose.Types.ObjectId.isValid(id)) {
            service = await Service.findById(id);
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
exports.deleteMultipleServices = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of service IDs',
            });
        }

        // ✅ Find all services first to delete their images
        const services = await Service.find({
            $or: [
                { id: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        // ✅ Delete all images from ImgBB
        for (const service of services) {
            if (service.imageDeleteUrl) {
                await deleteImageFromImgBB(service.imageDeleteUrl);
            }
        }

        const result = await Service.deleteMany({
            $or: [
                { id: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        res.json({
            success: true,
            message: `${result.deletedCount} services and their images deleted successfully from ImgBB`,
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