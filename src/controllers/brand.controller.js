// src/controllers/brand.controller.js
const Brand = require('../models/Brand');
const Product = require('../models/Product');

// ============================================
// CREATE - Create a new brand
// ============================================
// @desc    Create a new brand
// @route   POST /api/brands
// @access  Private/Admin
exports.createBrand = async (req, res) => {
    try {
        const { name, description, icon, logo, website, email, phone, address } = req.body;

        // Check if brand already exists
        const existingBrand = await Brand.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${name}$`, 'i') } },
                { id: name.toLowerCase().replace(/\s+/g, '-') }
            ]
        });

        if (existingBrand) {
            return res.status(400).json({
                success: false,
                message: 'Brand with this name already exists',
            });
        }

        // Create brand
        const brand = await Brand.create({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            description: description || '',
            icon: icon || '⚡',
            logo: logo || '',
            website: website || '',
            email: email || '',
            phone: phone || '',
            address: address || {},
            isActive: true,
        });

        res.status(201).json({
            success: true,
            message: 'Brand created successfully',
            data: brand,
        });
    } catch (error) {
        console.error('Create brand error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get all brands
// ============================================
// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
exports.getBrands = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            isActive,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        const query = {};
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const brands = await Brand.find(query)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit));

        const total = await Brand.countDocuments(query);

        // Get product count for each brand
        const brandsWithCount = await Promise.all(
            brands.map(async (brand) => {
                let count = 0;
                try {
                    if (Product && Product.countDocuments) {
                        count = await Product.countDocuments({ brand: brand.id });
                    }
                } catch (err) {
                    console.error('Error counting products for brand:', brand.id, err.message);
                }
                return {
                    ...brand.toObject(),
                    productCount: count,
                };
            })
        );

        res.json({
            success: true,
            data: brandsWithCount,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit),
            },
        });
    } catch (error) {
        console.error('Get brands error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// src/controllers/brand.controller.js

// ============================================
// READ - Get single brand (UPDATED)
// ============================================
// @desc    Get single brand
// @route   GET /api/brands/:id
// @access  Public
exports.getBrand = async (req, res) => {
    try {
        const id = req.params.id;

        // Try multiple lookup methods
        let brand = null;

        // 1. Try by id field
        brand = await Brand.findOne({ id: id });

        // 2. If not found, try by slug
        if (!brand) {
            brand = await Brand.findOne({ slug: id });
        }

        // 3. If not found, try by _id (MongoDB ObjectId)
        if (!brand && /^[0-9a-fA-F]{24}$/.test(id)) {
            brand = await Brand.findById(id);
        }

        // 4. If still not found, try by name (case insensitive)
        if (!brand) {
            brand = await Brand.findOne({
                name: { $regex: new RegExp(`^${id}$`, 'i') }
            });
        }

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found',
            });
        }

        // Get product count
        let productCount = 0;
        try {
            if (Product && Product.countDocuments) {
                productCount = await Product.countDocuments({ brand: brand.id });
            }
        } catch (err) {
            console.error('Error counting products for brand:', brand.id, err.message);
        }

        res.json({
            success: true,
            data: {
                ...brand.toObject(),
                productCount,
            },
        });
    } catch (error) {
        console.error('Get brand error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Also update getBrandProducts to support slug
exports.getBrandProducts = async (req, res) => {
    try {
        const id = req.params.id;

        // Try multiple lookup methods
        let brand = null;

        // 1. Try by id field
        brand = await Brand.findOne({ id: id });

        // 2. If not found, try by slug
        if (!brand) {
            brand = await Brand.findOne({ slug: id });
        }

        // 3. If not found, try by _id
        if (!brand && /^[0-9a-fA-F]{24}$/.test(id)) {
            brand = await Brand.findById(id);
        }

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found',
            });
        }

        let products = [];
        try {
            if (Product && Product.find) {
                products = await Product.find({ brand: brand.id });
            }
        } catch (err) {
            console.error('Error fetching products for brand:', brand.id, err.message);
        }

        res.json({
            success: true,
            data: products,
            count: products.length,
        });
    } catch (error) {
        console.error('Get brand products error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// UPDATE - Update brand
// ============================================
// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
exports.updateBrand = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, icon, logo, website, email, phone, address, isActive } = req.body;

        // Try to find by id field first, then by _id
        let brand = await Brand.findOne({ id: id });
        if (!brand) {
            brand = await Brand.findById(id);
        }

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found',
            });
        }

        // Check if new name conflicts with another brand
        if (name && name !== brand.name) {
            const existingBrand = await Brand.findOne({
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: brand._id }
            });
            if (existingBrand) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand with this name already exists',
                });
            }
        }

        // Update fields
        if (name) {
            brand.name = name;
            brand.id = name.toLowerCase().replace(/\s+/g, '-');
        }
        if (description !== undefined) brand.description = description;
        if (icon !== undefined) brand.icon = icon;
        if (logo !== undefined) brand.logo = logo;
        if (website !== undefined) brand.website = website;
        if (email !== undefined) brand.email = email;
        if (phone !== undefined) brand.phone = phone;
        if (address !== undefined) brand.address = address;
        if (isActive !== undefined) brand.isActive = isActive;

        await brand.save();

        res.json({
            success: true,
            message: 'Brand updated successfully',
            data: brand,
        });
    } catch (error) {
        console.error('Update brand error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// DELETE - Delete brand
// ============================================
// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
exports.deleteBrand = async (req, res) => {
    try {
        const id = req.params.id;

        // Try to find by id field first, then by _id
        let brand = await Brand.findOne({ id: id });
        if (!brand) {
            brand = await Brand.findById(id);
        }

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found',
            });
        }

        // Check if brand has products
        let productCount = 0;
        try {
            if (Product && Product.countDocuments) {
                productCount = await Product.countDocuments({ brand: brand.id });
            }
        } catch (err) {
            console.error('Error counting products for brand:', brand.id, err.message);
        }

        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete brand. It has ${productCount} products associated. Please reassign or delete the products first.`,
            });
        }

        await brand.deleteOne();

        res.json({
            success: true,
            message: 'Brand deleted successfully',
        });
    } catch (error) {
        console.error('Delete brand error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// BULK - Delete multiple brands
// ============================================
// @desc    Delete multiple brands
// @route   DELETE /api/brands/bulk
// @access  Private/Admin
exports.deleteMultipleBrands = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of brand IDs',
            });
        }

        // Check if any brand has products
        const brandsWithProducts = await Brand.find({
            $or: [
                { id: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        let hasProducts = [];
        for (const brand of brandsWithProducts) {
            let count = 0;
            try {
                if (Product && Product.countDocuments) {
                    count = await Product.countDocuments({ brand: brand.id });
                }
            } catch (err) {
                console.error('Error counting products for brand:', brand.id, err.message);
            }
            if (count > 0) {
                hasProducts.push({ brand, count });
            }
        }

        if (hasProducts.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete brands: ${hasProducts.map(item => item.brand.name).join(', ')} have products associated.`,
                brandsWithProducts: hasProducts.map(item => ({
                    id: item.brand.id,
                    name: item.brand.name,
                    productCount: item.count,
                })),
            });
        }

        const result = await Brand.deleteMany({
            $or: [
                { id: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        res.json({
            success: true,
            message: `${result.deletedCount} brands deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('Delete multiple brands error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// UPDATE - Toggle brand status
// ============================================
// @desc    Toggle brand active status
// @route   PUT /api/brands/:id/toggle
// @access  Private/Admin
exports.toggleBrandStatus = async (req, res) => {
    try {
        const id = req.params.id;

        // Try to find by id field first, then by _id
        let brand = await Brand.findOne({ id: id });
        if (!brand) {
            brand = await Brand.findById(id);
        }

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found',
            });
        }

        brand.isActive = !brand.isActive;
        await brand.save();

        res.json({
            success: true,
            message: `Brand ${brand.isActive ? 'activated' : 'deactivated'} successfully`,
            data: brand,
        });
    } catch (error) {
        console.error('Toggle brand status error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};