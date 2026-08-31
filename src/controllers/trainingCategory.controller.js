// src/controllers/trainingCategory.controller.js
const TrainingCategory = require('../models/TrainingCategory');
const Training = require('../models/Training');
const mongoose = require('mongoose');

// ============================================
// CREATE - Create a new training category
// ============================================
exports.createCategory = async (req, res) => {
    try {
        console.log('📦 Creating training category with body:', req.body);

        const { name, description, icon, color, order, isActive } = req.body;

        // ✅ Validate required fields
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        // Generate ID and slug from name
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        const id = name.toLowerCase().replace(/\s+/g, '-');

        // Check if category already exists
        const existingCategory = await TrainingCategory.findOne({
            $or: [
                { id: id },
                { slug: slug },
                { name: { $regex: new RegExp(`^${name}$`, 'i') } }
            ]
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this ID, slug, or name already exists'
            });
        }

        // ✅ Create category
        const category = await TrainingCategory.create({
            id: id,
            name: name.trim(),
            slug: slug,
            description: description || '',
            icon: icon || '📋',
            color: color || '#1b7936',
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            message: 'Training category created successfully',
            data: category
        });
    } catch (error) {
        console.error('❌ Create training category error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ============================================
// READ - Get all training categories
// ============================================
exports.getCategories = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            isActive,
            sortBy = 'order',
            sortOrder = 'asc'
        } = req.query;

        const query = {};
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$text = { $search: search };
        }

        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        const [total, categories] = await Promise.all([
            TrainingCategory.countDocuments(query),
            TrainingCategory.find(query)
                .select('-__v')
                .sort(search ? { score: { $meta: 'textScore' } } : { [sortBy]: sortDirection })
                .skip(skip)
                .limit(Number(limit))
                .lean()
        ]);

        // Get training count for each category
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const count = await Training.countDocuments({
                    categoryId: category.id,
                    isActive: true
                });
                return {
                    ...category,
                    trainingCount: count
                };
            })
        );

        res.json({
            success: true,
            data: categoriesWithCount,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit)
            }
        });
    } catch (error) {
        console.error('Get training categories error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// READ - Get single training category
// ============================================
exports.getCategory = async (req, res) => {
    try {
        const id = req.params.id;

        let category = await TrainingCategory.findOne({ id: id });
        if (!category) {
            category = await TrainingCategory.findOne({ slug: id });
        }
        if (!category && mongoose.Types.ObjectId.isValid(id)) {
            category = await TrainingCategory.findById(id);
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Training category not found'
            });
        }

        // Get trainings in this category
        const trainings = await Training.find({
            categoryId: category.id,
            isActive: true
        })
            .select('-__v')
            .sort({ title: 1 })
            .lean();

        res.json({
            success: true,
            data: {
                ...category.toJSON(),
                trainings,
                trainingCount: trainings.length
            }
        });
    } catch (error) {
        console.error('Get training category error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE - Update training category
// ============================================
exports.updateCategory = async (req, res) => {
    try {
        const id = req.params.id;
        console.log('📦 Updating training category with body:', req.body);

        let category = await TrainingCategory.findOne({ id: id });
        if (!category) {
            category = await TrainingCategory.findOne({ slug: id });
        }
        if (!category && mongoose.Types.ObjectId.isValid(id)) {
            category = await TrainingCategory.findById(id);
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Training category not found'
            });
        }

        const { name, description, icon, color, order, isActive } = req.body;

        // ✅ Update category
        const updatedData = {
            name: name || category.name,
            description: description !== undefined ? description : category.description,
            icon: icon || category.icon,
            color: color || category.color,
            order: order !== undefined ? order : category.order,
            isActive: isActive !== undefined ? isActive : category.isActive
        };

        // Update ID and slug if name changed
        if (name && name !== category.name) {
            const newSlug = name.toLowerCase().replace(/\s+/g, '-');
            updatedData.id = newSlug;
            updatedData.slug = newSlug;
        }

        Object.assign(category, updatedData);
        await category.save();

        res.json({
            success: true,
            message: 'Training category updated successfully',
            data: category
        });
    } catch (error) {
        console.error('❌ Update training category error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ============================================
// DELETE - Delete training category
// ============================================
exports.deleteCategory = async (req, res) => {
    try {
        const id = req.params.id;

        let category = await TrainingCategory.findOne({ id: id });
        if (!category) {
            category = await TrainingCategory.findOne({ slug: id });
        }
        if (!category && mongoose.Types.ObjectId.isValid(id)) {
            category = await TrainingCategory.findById(id);
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Training category not found'
            });
        }

        // Check if category has trainings
        const trainingCount = await Training.countDocuments({
            categoryId: category.id
        });

        if (trainingCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It has ${trainingCount} training programs associated with it.`
            });
        }

        await category.deleteOne();

        res.json({
            success: true,
            message: 'Training category deleted successfully'
        });
    } catch (error) {
        console.error('Delete training category error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// TOGGLE - Toggle category status
// ============================================
exports.toggleCategoryStatus = async (req, res) => {
    try {
        const id = req.params.id;

        let category = await TrainingCategory.findOne({ id: id });
        if (!category) {
            category = await TrainingCategory.findOne({ slug: id });
        }
        if (!category && mongoose.Types.ObjectId.isValid(id)) {
            category = await TrainingCategory.findById(id);
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Training category not found'
            });
        }

        category.isActive = !category.isActive;
        await category.save();

        res.json({
            success: true,
            message: `Training category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
            data: category
        });
    } catch (error) {
        console.error('Toggle training category status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// BULK - Delete multiple categories
// ============================================
exports.deleteMultipleCategories = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of category IDs'
            });
        }

        // Check if any category has trainings
        const categoriesWithTrainings = await TrainingCategory.find({
            id: { $in: ids }
        });

        let hasTrainings = false;
        for (const category of categoriesWithTrainings) {
            const count = await Training.countDocuments({
                categoryId: category.id
            });
            if (count > 0) {
                hasTrainings = true;
                break;
            }
        }

        if (hasTrainings) {
            return res.status(400).json({
                success: false,
                message: 'Some categories have training programs associated. Please remove them first.'
            });
        }

        const result = await TrainingCategory.deleteMany({
            $or: [
                { id: { $in: ids } },
                { slug: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        res.json({
            success: true,
            message: `${result.deletedCount} training categories deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Delete multiple training categories error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};