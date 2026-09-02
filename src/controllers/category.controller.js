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
// HELPER: Recursively update children status
// ============================================
async function updateChildrenStatus(parentId, isActive, isActiveByParent) {
    let count = 0;
    
    // Find all direct children
    const children = await Category.find({ parentId: parentId });
    
    for (const child of children) {
        // Update child status
        child.isActive = isActive;
        child.isActiveByParent = isActiveByParent;
        await child.save();
        count++;
        
        // Recursively update grandchildren
        const grandChildrenCount = await updateChildrenStatus(child.id, isActive, isActiveByParent);
        count += grandChildrenCount;
    }
    
    return count;
}

// ============================================
// HELPER: Get all descendant IDs
// ============================================
async function getAllDescendantIds(categoryId) {
    let ids = [];
    const children = await Category.find({ parentId: categoryId });
    
    for (const child of children) {
        ids.push(child.id);
        const descendantIds = await getAllDescendantIds(child.id);
        ids = [...ids, ...descendantIds];
    }
    
    return ids;
}

// ============================================
// CREATE - Create a new category
// ============================================
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
        let isActiveByParent = true;
        let isActive = true;
        
        if (parentId) {
            parent = await Category.findOne({ id: parentId });
            if (!parent) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent category not found',
                });
            }
            level = parent.level + 1;
            // If parent is inactive, child should also be inactive
            isActive = parent.isActive && parent.isActiveByParent;
            isActiveByParent = parent.isActive && parent.isActiveByParent;
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
            isActive: isActive,
            isActiveByParent: isActiveByParent,
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
                    effectiveStatus: category.isActive && category.isActiveByParent,
                };
            })
        );

        // Get main categories with their subcategories
        const mainCategories = await Category.find({ level: 0 });
        const categoriesTree = await Promise.all(
            mainCategories.map(async (cat) => {
                const subs = await Category.find({ parentId: cat.id });
                return {
                    ...cat.toObject(),
                    subcategories: subs,
                    subcategoryCount: subs.length,
                    effectiveStatus: cat.isActive && cat.isActiveByParent,
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
exports.getCategoryTree = async (req, res) => {
    try {
        const mainCategories = await Category.find({ level: 0 })
            .sort({ order: 1, name: 1 });

        const tree = await Promise.all(
            mainCategories.map(async (category) => {
                const subcategories = await Category.find({ parentId: category.id })
                    .sort({ order: 1, name: 1 });

                const subcategoriesWithProducts = await Promise.all(
                    subcategories.map(async (sub) => {
                        const productCount = await getProductCount(sub.id);
                        return {
                            ...sub.toObject(),
                            productCount,
                            effectiveStatus: sub.isActive && sub.isActiveByParent,
                        };
                    })
                );

                const productCount = await getProductCount(category.id);

                return {
                    ...category.toObject(),
                    subcategories: subcategoriesWithProducts,
                    subcategoryCount: subcategoriesWithProducts.length,
                    productCount,
                    effectiveStatus: category.isActive && category.isActiveByParent,
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
        const subcategories = await Category.find({ parentId: category.id });
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
                effectiveStatus: category.isActive && category.isActiveByParent,
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
        let newParent = null;
        let newLevel = 0;
        let newIsActiveByParent = true;
        
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
            // Check if parent is in the category's descendants (circular reference)
            const descendants = await getAllDescendantIds(category.id);
            if (descendants.includes(parentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot set a descendant as parent (would create circular reference)',
                });
            }
            newParent = parent;
            newLevel = parent.level + 1;
            newIsActiveByParent = parent.isActive && parent.isActiveByParent;
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
                category.parent = newParent ? newParent._id : null;
                category.level = newLevel;
                category.isActiveByParent = newIsActiveByParent;
                // If parent is inactive, child should be inactive
                if (!newIsActiveByParent) {
                    category.isActive = false;
                }
            } else {
                category.parent = null;
                category.level = 0;
                category.isActiveByParent = true;
            }
        }
        if (order !== undefined) category.order = order;
        if (isActive !== undefined) {
            // Only allow activation if parent is active
            if (isActive && !category.isActiveByParent) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot activate category because parent is inactive',
                });
            }
            category.isActive = isActive;
        }
        if (metaTitle !== undefined) category.metaTitle = metaTitle;
        if (metaDescription !== undefined) category.metaDescription = metaDescription;

        await category.save();

        // If category status changed, update all children
        if (isActive !== undefined) {
            const childrenUpdated = await updateChildrenStatus(
                category.id, 
                category.isActive && category.isActiveByParent,
                category.isActiveByParent
            );
        }

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
// TOGGLE - Toggle category status with cascade
// ============================================
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

        // Check if parent is inactive and we're trying to activate
        const newStatus = !category.isActive;
        if (newStatus && !category.isActiveByParent) {
            return res.status(400).json({
                success: false,
                message: 'Cannot activate category because parent is inactive',
                parentInactive: true,
            });
        }

        // Toggle the status
        category.isActive = newStatus;
        await category.save();

        // Recursively update all children with the same status
        const childrenUpdated = await updateChildrenStatus(
            category.id,
            newStatus,
            category.isActiveByParent
        );

        // Get updated category with children
        const updatedCategory = await Category.findOne({ id: category.id });
        const children = await Category.find({ parentId: category.id });

        res.json({
            success: true,
            message: `Category ${newStatus ? 'activated' : 'deactivated'} with ${childrenUpdated} subcategories`,
            data: {
                category: {
                    ...updatedCategory.toObject(),
                    childrenUpdated,
                    children: children,
                },
            },
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
// TOGGLE - Toggle category status without cascade
// ============================================
exports.toggleCategoryStatusOnly = async (req, res) => {
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

// ============================================
// BULK - Update multiple categories status with cascade
// ============================================
exports.bulkUpdateStatus = async (req, res) => {
    try {
        const { categoryIds, isActive, cascade = true } = req.body;

        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of category IDs',
            });
        }

        let allCategoryIds = [...categoryIds];
        let totalUpdated = 0;

        // If cascade is true, get all descendants
        if (cascade) {
            for (const id of categoryIds) {
                const descendants = await getAllDescendantIds(id);
                allCategoryIds = [...allCategoryIds, ...descendants];
            }
        }

        // Remove duplicates
        allCategoryIds = [...new Set(allCategoryIds)];

        // Check if any category has inactive parent when trying to activate
        if (isActive) {
            for (const id of allCategoryIds) {
                const category = await Category.findOne({ id: id });
                if (category && !category.isActiveByParent) {
                    return res.status(400).json({
                        success: false,
                        message: `Cannot activate category "${category.name}" because parent is inactive`,
                        categoryId: id,
                        categoryName: category.name,
                    });
                }
            }
        }

        // Update all categories
        for (const id of allCategoryIds) {
            const category = await Category.findOne({ id: id });
            if (category) {
                category.isActive = isActive;
                // If deactivating, children will be handled by cascade
                await category.save();
                totalUpdated++;
            }
        }

        // If cascade is true, update all children recursively
        if (cascade) {
            for (const id of allCategoryIds) {
                const category = await Category.findOne({ id: id });
                if (category) {
                    const childrenUpdated = await updateChildrenStatus(
                        category.id,
                        isActive,
                        category.isActiveByParent
                    );
                    totalUpdated += childrenUpdated;
                }
            }
        }

        res.json({
            success: true,
            message: `Updated ${totalUpdated} categories`,
            data: {
                totalUpdated,
                categoryIds: allCategoryIds,
            },
        });
    } catch (error) {
        console.error('Bulk update status error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};