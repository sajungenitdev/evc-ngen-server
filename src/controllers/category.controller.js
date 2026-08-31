// src/controllers/category.controller.js
const Category = require('../models/Category');
let Product = null;

// Try to load Product model, but don't fail if it doesn't exist
try {
    Product = require('../models/Product');
} catch (error) {
    console.warn('⚠️ Product model not found, category product counts will be 0');
}

// Helper function to safely get product count
const getProductCount = async (categoryId) => {
    try {
        if (Product && Product.countDocuments) {
            return await Product.countDocuments({ category: categoryId });
        }
        return 0;
    } catch (error) {
        console.error('Error getting product count:', error);
        return 0;
    }
};

// ============================================
// CREATE - Create a new category
// ============================================
// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
    try {
        const { name, description, icon, parentId, order, metaTitle, metaDescription } = req.body;

        // Check if category already exists
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists',
            });
        }

        // Check parent category
        let parent = null;
        let level = 0;
        if (parentId) {
            parent = await Category.findOne({ id: parentId });
            if (!parent) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent category not found',
                });
            }
            level = parent.level + 1;
        }

        // Create category
        const category = await Category.create({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            description: description || '',
            icon: icon || '📂',
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            parentId: parentId || null,
            parent: parent ? parent._id : null,
            level,
            order: order || 0,
            isActive: true,
            metaTitle: metaTitle || '',
            metaDescription: metaDescription || '',
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category,
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get all categories
// ============================================
// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            level,
            parentId,
            isActive,
            sortBy = 'order',
            sortOrder = 'asc'
        } = req.query;

        const query = {};
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (level !== undefined) query.level = parseInt(level);
        if (parentId !== undefined) query.parentId = parentId;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const categories = await Category.find(query)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit));

        const total = await Category.countDocuments(query);

        // Get categories with subcategories count and product count
        const categoriesWithDetails = await Promise.all(
            categories.map(async (category) => {
                const subcategories = await Category.find({ parentId: category.id });
                const productCount = await getProductCount(category.id);
                return {
                    ...category.toObject(),
                    subcategories: subcategories || [],
                    subcategoryCount: subcategories.length,
                    productCount,
                };
            })
        );

        // Get main categories with their subcategories
        const mainCategories = await Category.find({ level: 0, isActive: true });
        const categoriesTree = await Promise.all(
            mainCategories.map(async (cat) => {
                const subs = await Category.find({ parentId: cat.id, isActive: true });
                return {
                    ...cat.toObject(),
                    subcategories: subs,
                    subcategoryCount: subs.length,
                };
            })
        );

        res.json({
            success: true,
            data: categoriesWithDetails,
            tree: categoriesTree,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit),
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

// ============================================
// READ - Get category tree
// ============================================
// @desc    Get category tree with subcategories
// @route   GET /api/categories/tree
// @access  Public
exports.getCategoryTree = async (req, res) => {
    try {
        const mainCategories = await Category.find({ level: 0, isActive: true })
            .sort({ order: 1, name: 1 });

        const tree = await Promise.all(
            mainCategories.map(async (category) => {
                const subcategories = await Category.find({ parentId: category.id, isActive: true })
                    .sort({ order: 1, name: 1 });

                const subcategoriesWithProducts = await Promise.all(
                    subcategories.map(async (sub) => {
                        const productCount = await getProductCount(sub.id);
                        return {
                            ...sub.toObject(),
                            productCount,
                        };
                    })
                );

                const productCount = await getProductCount(category.id);

                return {
                    ...category.toObject(),
                    subcategories: subcategoriesWithProducts,
                    subcategoryCount: subcategoriesWithProducts.length,
                    productCount,
                };
            })
        );

        res.json({
            success: true,
            data: tree,
        });
    } catch (error) {
        console.error('Get category tree error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get single category
// ============================================
// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
    try {
        const id = req.params.id;

        let category = await Category.findOne({ id: id });
        if (!category) {
            category = await Category.findById(id);
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        // Get subcategories
        const subcategories = await Category.find({ parentId: category.id, isActive: true });
        const productCount = await getProductCount(category.id);

        // Get parent category if exists
        let parentCategory = null;
        if (category.parentId) {
            parentCategory = await Category.findOne({ id: category.parentId });
        }

        res.json({
            success: true,
            data: {
                ...category.toObject(),
                subcategories,
                subcategoryCount: subcategories.length,
                productCount,
                parentCategory,
            },
        });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// UPDATE - Update category
// ============================================
// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, icon, parentId, order, isActive, metaTitle, metaDescription } = req.body;

        let category = await Category.findOne({ id: id });
        if (!category) {
            category = await Category.findById(id);
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        // Check if new name conflicts
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: category._id }
            });
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Category with this name already exists',
                });
            }
        }

        // Check parent category (prevent circular reference)
        if (parentId && parentId !== category.id) {
            const parent = await Category.findOne({ id: parentId });
            if (!parent) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent category not found',
                });
            }
            if (parentId === category.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot set a category as its own parent',
                });
            }
            if (category.level === 0 && parent.level > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Main category cannot have a subcategory as parent',
                });
            }
        }

        // Update fields
        if (name) {
            category.name = name;
            category.id = name.toLowerCase().replace(/\s+/g, '-');
            category.slug = name.toLowerCase().replace(/\s+/g, '-');
        }
        if (description !== undefined) category.description = description;
        if (icon !== undefined) category.icon = icon;
        if (parentId !== undefined) {
            category.parentId = parentId;
            if (parentId) {
                const parent = await Category.findOne({ id: parentId });
                category.parent = parent ? parent._id : null;
                category.level = parent ? parent.level + 1 : 0;
            } else {
                category.parent = null;
                category.level = 0;
            }
        }
        if (order !== undefined) category.order = order;
        if (isActive !== undefined) category.isActive = isActive;
        if (metaTitle !== undefined) category.metaTitle = metaTitle;
        if (metaDescription !== undefined) category.metaDescription = metaDescription;

        await category.save();

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category,
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// DELETE - Delete category
// ============================================
// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
    try {
        const id = req.params.id;

        let category = await Category.findOne({ id: id });
        if (!category) {
            category = await Category.findById(id);
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        // Check if category has subcategories
        const subcategories = await Category.find({ parentId: category.id });
        if (subcategories.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It has ${subcategories.length} subcategories. Please reassign or delete them first.`,
                subcategories: subcategories.map(sub => ({ id: sub.id, name: sub.name })),
            });
        }

        // Check if category has products
        const productCount = await getProductCount(category.id);
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. It has ${productCount} products associated. Please reassign or delete the products first.`,
            });
        }

        await category.deleteOne();

        res.json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// TOGGLE - Toggle category status
// ============================================
// @desc    Toggle category active status
// @route   PUT /api/categories/:id/toggle
// @access  Private/Admin
exports.toggleCategoryStatus = async (req, res) => {
    try {
        const id = req.params.id;

        let category = await Category.findOne({ id: id });
        if (!category) {
            category = await Category.findById(id);
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        category.isActive = !category.isActive;
        await category.save();

        res.json({
            success: true,
            message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
            data: category,
        });
    } catch (error) {
        console.error('Toggle category status error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// BULK - Delete multiple categories
// ============================================
// @desc    Delete multiple categories
// @route   DELETE /api/categories/bulk
// @access  Private/Admin
exports.deleteMultipleCategories = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of category IDs',
            });
        }

        const categoriesWithIssues = [];
        for (const id of ids) {
            const category = await Category.findOne({ $or: [{ id }, { _id: id }] });
            if (category) {
                const subcategories = await Category.find({ parentId: category.id });
                const productCount = await getProductCount(category.id);
                if (subcategories.length > 0 || productCount > 0) {
                    categoriesWithIssues.push({
                        id: category.id,
                        name: category.name,
                        subcategoryCount: subcategories.length,
                        productCount,
                    });
                }
            }
        }

        if (categoriesWithIssues.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some categories have subcategories or products associated.',
                categoriesWithIssues,
            });
        }

        const result = await Category.deleteMany({
            $or: [
                { id: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        res.json({
            success: true,
            message: `${result.deletedCount} categories deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('Delete multiple categories error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};