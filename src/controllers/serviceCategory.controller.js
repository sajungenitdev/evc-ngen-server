// src/controllers/serviceCategory.controller.js
const ServiceCategory = require('../models/ServiceCategory');
const Service = require('../models/Service');

// ============================================
// CREATE - Create a new service category
// ============================================
// @desc    Create a new service category
// @route   POST /api/service-categories
// @access  Private/Admin
exports.createServiceCategory = async (req, res) => {
    try {
        const { name, description, icon, color, order, isActive } = req.body;

        // Check if category already exists
        const existingCategory = await ServiceCategory.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Service category with this name already exists',
            });
        }

        // Create category
        const category = await ServiceCategory.create({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            description: description || '',
            icon: icon || '📂',
            color: color || 'bg-[#0c1f38]',
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true,
        });

        res.status(201).json({
            success: true,
            message: 'Service category created successfully',
            data: category,
        });
    } catch (error) {
        console.error('Create service category error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get all service categories
// ============================================
// @desc    Get all service categories
// @route   GET /api/service-categories
// @access  Public
exports.getServiceCategories = async (req, res) => {
    try {
        const { isActive, search } = req.query;

        const query = {};
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const categories = await ServiceCategory.find(query)
            .sort({ order: 1, name: 1 });

        // Get service count for each category
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const count = await Service.countDocuments({ 
                    category: category.id,
                    isActive: true 
                });
                return {
                    ...category.toObject(),
                    serviceCount: count,
                };
            })
        );

        res.json({
            success: true,
            data: categoriesWithCount,
        });
    } catch (error) {
        console.error('Get service categories error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get single service category
// ============================================
// @desc    Get single service category
// @route   GET /api/service-categories/:id
// @access  Public
exports.getServiceCategory = async (req, res) => {
    try {
        const id = req.params.id;

        let category = await ServiceCategory.findOne({ id: id });
        if (!category) {
            category = await ServiceCategory.findById(id);
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Service category not found',
            });
        }

        // Get services in this category
        const services = await Service.find({ 
            category: category.id,
            isActive: true 
        }).select('id title icon description');

        res.json({
            success: true,
            data: {
                ...category.toObject(),
                services,
                serviceCount: services.length,
            },
        });
    } catch (error) {
        console.error('Get service category error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// UPDATE - Update service category
// ============================================
// @desc    Update service category
// @route   PUT /api/service-categories/:id
// @access  Private/Admin
exports.updateServiceCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, icon, color, order, isActive } = req.body;

        let category = await ServiceCategory.findOne({ id: id });
        if (!category) {
            category = await ServiceCategory.findById(id);
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Service category not found',
            });
        }

        // Check if new name conflicts
        if (name && name !== category.name) {
            const existingCategory = await ServiceCategory.findOne({
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: category._id }
            });
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Service category with this name already exists',
                });
            }
        }

        // Update fields
        if (name) {
            category.name = name;
            category.slug = name.toLowerCase().replace(/\s+/g, '-');
            category.id = name.toLowerCase().replace(/\s+/g, '-');
        }
        if (description !== undefined) category.description = description;
        if (icon !== undefined) category.icon = icon;
        if (color !== undefined) category.color = color;
        if (order !== undefined) category.order = order;
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();

        res.json({
            success: true,
            message: 'Service category updated successfully',
            data: category,
        });
    } catch (error) {
        console.error('Update service category error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// DELETE - Delete service category
// ============================================
// @desc    Delete service category
// @route   DELETE /api/service-categories/:id
// @access  Private/Admin
exports.deleteServiceCategory = async (req, res) => {
    try {
        const id = req.params.id;

        let category = await ServiceCategory.findOne({ id: id });
        if (!category) {
            category = await ServiceCategory.findById(id);
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Service category not found',
            });
        }

        // Check if category has services
        const serviceCount = await Service.countDocuments({ category: category.id });
        if (serviceCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It has ${serviceCount} services associated. Please reassign or delete the services first.`,
            });
        }

        await category.deleteOne();

        res.json({
            success: true,
            message: 'Service category deleted successfully',
        });
    } catch (error) {
        console.error('Delete service category error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// TOGGLE - Toggle category status
// ============================================
// @desc    Toggle service category status
// @route   PUT /api/service-categories/:id/toggle
// @access  Private/Admin
exports.toggleServiceCategoryStatus = async (req, res) => {
    try {
        const id = req.params.id;

        let category = await ServiceCategory.findOne({ id: id });
        if (!category) {
            category = await ServiceCategory.findById(id);
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Service category not found',
            });
        }

        category.isActive = !category.isActive;
        await category.save();

        res.json({
            success: true,
            message: `Service category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
            data: category,
        });
    } catch (error) {
        console.error('Toggle service category status error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};