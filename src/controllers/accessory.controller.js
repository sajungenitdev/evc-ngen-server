// src/controllers/accessory.controller.js
const Accessory = require('../models/Accessory');
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ============================================
// HELPER: Delete image
// ============================================
const deleteImage = (imageUrl) => {
    if (!imageUrl) return;
    const filename = imageUrl.split('/').pop();
    if (!filename) return;
    const imagePath = path.join(__dirname, '../../uploads/products', filename);
    if (fs.existsSync(imagePath)) {
        try {
            fs.unlinkSync(imagePath);
            console.log(`Deleted image: ${imagePath}`);
        } catch (error) {
            console.error(`Failed to delete image: ${imagePath}`, error);
        }
    }
};

// ============================================
// HELPER: Delete multiple images
// ============================================
const deleteMultipleImages = (imageUrls) => {
    if (!imageUrls || imageUrls.length === 0) return;
    imageUrls.forEach(url => deleteImage(url));
};

// ============================================
// HELPER: Parse JSON fields
// ============================================
const parseJSONField = (field, defaultValue = []) => {
    if (!field) return defaultValue;
    try {
        return typeof field === 'string' ? JSON.parse(field) : field;
    } catch (e) {
        return defaultValue;
    }
};

// ============================================
// HELPER: Get accessory details with relations
// ============================================
const getAccessoryDetails = async (accessories) => {
    if (!accessories || accessories.length === 0) return accessories;

    const brandIds = [...new Set(accessories.map(a => a.brand).filter(Boolean))];
    const categoryIds = [...new Set(accessories.map(a => a.category).filter(Boolean))];
    const productIds = [...new Set(accessories.map(a => a.parentProductId).filter(Boolean))];

    const [brands, categories, products] = await Promise.all([
        Brand.find({ id: { $in: brandIds } }).lean(),
        Category.find({ id: { $in: categoryIds } }).lean(),
        Product.find({ id: { $in: productIds } }).select('id name model').lean(),
    ]);

    const brandMap = {};
    brands.forEach(b => { brandMap[b.id] = b; });

    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.id] = c; });

    const productMap = {};
    products.forEach(p => { productMap[p.id] = p; });

    return accessories.map(accessory => ({
        ...accessory,
        brandDetails: brandMap[accessory.brand] || null,
        categoryDetails: categoryMap[accessory.category] || null,
        parentProductDetails: productMap[accessory.parentProductId] || null,
    }));
};

// ============================================
// CREATE - Create a new accessory with images
// ============================================
exports.createAccessory = async (req, res) => {
    try {
        console.log('📦 Creating accessory with body:', req.body);
        console.log('📸 Files uploaded:', req.files);

        const {
            name,
            model,
            brand,
            category,
            categoryLabel,
            price,
            rating,
            specs,
            shortDescription,
            description,
            features,
            technicalDetails,
            stock,
            isActive,
            parentProductId,
            compatibleWith,
            accessoryType,
        } = req.body;

        // Parse JSON fields
        const parsedSpecs = parseJSONField(specs, []);
        const parsedFeatures = parseJSONField(features, []);
        const parsedTechnicalDetails = parseJSONField(technicalDetails, {});
        const parsedCompatibleWith = parseJSONField(compatibleWith, []);

        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Accessory name is required'
            });
        }
        if (!model || !model.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Model is required'
            });
        }
        if (!brand) {
            return res.status(400).json({
                success: false,
                message: 'Brand is required'
            });
        }
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category is required'
            });
        }
        if (!parentProductId) {
            return res.status(400).json({
                success: false,
                message: 'Parent product is required'
            });
        }
        if (!accessoryType) {
            return res.status(400).json({
                success: false,
                message: 'Accessory type is required'
            });
        }

        // Validate parent product exists
        const parentProduct = await Product.findOne({ id: parentProductId });
        if (!parentProduct) {
            return res.status(404).json({
                success: false,
                message: `Parent product "${parentProductId}" not found`,
            });
        }

        // Check if accessory already exists
        const existingAccessory = await Accessory.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${name}$`, 'i') } },
                { model: { $regex: new RegExp(`^${model}$`, 'i') } }
            ]
        });

        if (existingAccessory) {
            return res.status(400).json({
                success: false,
                message: 'Accessory with this name or model already exists',
            });
        }

        // Validate brand exists
        let brandExists = await Brand.findOne({ id: brand });
        if (!brandExists) {
            brandExists = await Brand.findOne({
                name: { $regex: new RegExp(`^${brand}$`, 'i') }
            });
        }

        if (!brandExists) {
            const allBrands = await Brand.find({}, 'id name').lean();
            return res.status(404).json({
                success: false,
                message: `Brand "${brand}" not found. Available brands: ${allBrands.map(b => b.name).join(', ')}`,
                availableBrands: allBrands.map(b => ({ id: b.id, name: b.name })),
            });
        }

        // Validate category exists
        let categoryExists = await Category.findOne({ id: category });
        if (!categoryExists) {
            categoryExists = await Category.findOne({
                name: { $regex: new RegExp(`^${category}$`, 'i') }
            });
        }

        if (!categoryExists) {
            const allCategories = await Category.find({}, 'id name').lean();
            return res.status(404).json({
                success: false,
                message: `Category "${category}" not found. Available categories: ${allCategories.map(c => c.name).join(', ')}`,
                availableCategories: allCategories.map(c => ({ id: c.id, name: c.name })),
            });
        }

        // ✅ Handle main image upload
        let imageUrl = '';
        if (req.files && req.files['image'] && req.files['image'].length > 0) {
            imageUrl = `/uploads/products/${req.files['image'][0].filename}`;
        }

        // ✅ Handle gallery images upload
        let galleryImages = [];
        if (req.files && req.files['galleryImages'] && req.files['galleryImages'].length > 0) {
            galleryImages = req.files['galleryImages'].map(file => `/uploads/products/${file.filename}`);
        }

        // ✅ If galleryImages was sent as JSON string, parse it
        let parsedGalleryImages = parseJSONField(req.body.galleryImages, []);
        // Merge with uploaded files
        if (galleryImages.length > 0) {
            galleryImages = [...parsedGalleryImages, ...galleryImages];
        } else {
            galleryImages = parsedGalleryImages;
        }

        // Create accessory
        const accessory = await Accessory.create({
            id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            name: name.trim(),
            model: model.trim(),
            brand: brandExists.id,
            brandId: brandExists._id,
            category: categoryExists.id,
            categoryId: categoryExists._id,
            categoryLabel: categoryLabel || categoryExists.name,
            imageUrl: imageUrl || '',
            galleryImages: galleryImages || [],
            price: price || 0,
            rating: rating || 0,
            specs: parsedSpecs || [],
            shortDescription: shortDescription || '',
            description: description || '',
            features: parsedFeatures || [],
            technicalDetails: parsedTechnicalDetails || {},
            stock: stock || 0,
            isActive: isActive !== undefined ? isActive : true,
            parentProductId: parentProductId,
            compatibleWith: parsedCompatibleWith || [],
            accessoryType: accessoryType || 'other',
        });

        const populatedAccessory = await Accessory.findById(accessory._id).lean();
        const [brandData, categoryData, parentProductData] = await Promise.all([
            Brand.findOne({ id: populatedAccessory.brand }).lean(),
            Category.findOne({ id: populatedAccessory.category }).lean(),
            Product.findOne({ id: populatedAccessory.parentProductId }).lean(),
        ]);

        res.status(201).json({
            success: true,
            message: 'Accessory created successfully',
            data: {
                ...populatedAccessory,
                brandDetails: brandData,
                categoryDetails: categoryData,
                parentProductDetails: parentProductData,
            },
        });
    } catch (error) {
        console.error('Create accessory error:', error);
        // If there's an error and files were uploaded, delete them
        if (req.files) {
            if (req.files['image']) {
                deleteImage(`/uploads/products/${req.files['image'][0].filename}`);
            }
            if (req.files['galleryImages']) {
                req.files['galleryImages'].forEach(file => {
                    deleteImage(`/uploads/products/${file.filename}`);
                });
            }
        }
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get all accessories
// ============================================
exports.getAccessories = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            brand,
            accessoryType,
            parentProductId,
            minPrice,
            maxPrice,
            isActive,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        const query = {};

        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (brand) query.brand = brand;
        if (accessoryType) query.accessoryType = accessoryType;
        if (parentProductId) query.parentProductId = parentProductId;

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (search) {
            query.$text = { $search: search };
        }

        const [total, accessories] = await Promise.all([
            Accessory.countDocuments(query),
            Accessory.find(query)
                .select('-__v')
                .sort(search ? { score: { $meta: 'textScore' } } : { [sortBy]: sortDirection })
                .skip(skip)
                .limit(Number(limit))
                .lean()
        ]);

        const accessoriesWithDetails = await getAccessoryDetails(accessories);

        // Stats
        const stats = {
            total: await Accessory.countDocuments(),
            active: await Accessory.countDocuments({ isActive: true }),
            inactive: await Accessory.countDocuments({ isActive: false }),
            byType: await Accessory.aggregate([
                { $group: { _id: '$accessoryType', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
        };

        res.json({
            success: true,
            data: accessoriesWithDetails,
            stats,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit),
            },
        });
    } catch (error) {
        console.error('Get accessories error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get single accessory
// ============================================
exports.getAccessory = async (req, res) => {
    try {
        const id = req.params.id;

        let accessory = await Accessory.findOne({ id: id }).lean();
        if (!accessory && mongoose.Types.ObjectId.isValid(id)) {
            accessory = await Accessory.findById(id).lean();
        }

        if (!accessory) {
            return res.status(404).json({
                success: false,
                message: 'Accessory not found',
            });
        }

        const [brandData, categoryData, parentProduct] = await Promise.all([
            Brand.findOne({ id: accessory.brand }).lean(),
            Category.findOne({ id: accessory.category }).lean(),
            Product.findOne({ id: accessory.parentProductId }).lean(),
        ]);

        res.json({
            success: true,
            data: {
                ...accessory,
                brandDetails: brandData || null,
                categoryDetails: categoryData || null,
                parentProductDetails: parentProduct || null,
            },
        });
    } catch (error) {
        console.error('Get accessory error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// UPDATE - Update accessory
// ============================================
exports.updateAccessory = async (req, res) => {
    try {
        const id = req.params.id;
        console.log('📦 Updating accessory with body:', req.body);
        console.log('📸 Files uploaded:', req.files);

        let accessory = await Accessory.findOne({ id: id });
        if (!accessory && mongoose.Types.ObjectId.isValid(id)) {
            accessory = await Accessory.findById(id);
        }

        if (!accessory) {
            return res.status(404).json({
                success: false,
                message: 'Accessory not found',
            });
        }

        const updateData = { ...req.body };

        // Parse JSON fields
        if (updateData.specs) {
            updateData.specs = parseJSONField(updateData.specs, []);
        }
        if (updateData.features) {
            updateData.features = parseJSONField(updateData.features, []);
        }
        if (updateData.technicalDetails) {
            updateData.technicalDetails = parseJSONField(updateData.technicalDetails, {});
        }
        if (updateData.compatibleWith) {
            updateData.compatibleWith = parseJSONField(updateData.compatibleWith, []);
        }
        if (updateData.galleryImages) {
            updateData.galleryImages = parseJSONField(updateData.galleryImages, []);
        }

        // If parent product is being changed, validate new parent
        if (updateData.parentProductId && updateData.parentProductId !== accessory.parentProductId) {
            const parentProduct = await Product.findOne({ id: updateData.parentProductId });
            if (!parentProduct) {
                return res.status(404).json({
                    success: false,
                    message: `Parent product "${updateData.parentProductId}" not found`,
                });
            }
        }

        // ✅ Handle main image upload
        if (req.files && req.files['image'] && req.files['image'].length > 0) {
            // Delete old image if it exists
            if (accessory.imageUrl) {
                deleteImage(accessory.imageUrl);
            }
            updateData.imageUrl = `/uploads/products/${req.files['image'][0].filename}`;
        }

        // ✅ Handle gallery images upload
        if (req.files && req.files['galleryImages'] && req.files['galleryImages'].length > 0) {
            // Delete old gallery images
            if (accessory.galleryImages && accessory.galleryImages.length > 0) {
                deleteMultipleImages(accessory.galleryImages);
            }
            // Set new gallery images
            updateData.galleryImages = req.files['galleryImages'].map(file => `/uploads/products/${file.filename}`);
        }

        // Update fields
        Object.keys(updateData).forEach(key => {
            if (key !== '_id' && key !== 'id') {
                accessory[key] = updateData[key];
            }
        });

        if (updateData.name) {
            accessory.id = updateData.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        }

        await accessory.save();

        const updatedAccessory = await Accessory.findById(accessory._id).lean();
        const [brandData, categoryData, parentProduct] = await Promise.all([
            Brand.findOne({ id: updatedAccessory.brand }).lean(),
            Category.findOne({ id: updatedAccessory.category }).lean(),
            Product.findOne({ id: updatedAccessory.parentProductId }).lean(),
        ]);

        res.json({
            success: true,
            message: 'Accessory updated successfully',
            data: {
                ...updatedAccessory,
                brandDetails: brandData,
                categoryDetails: categoryData,
                parentProductDetails: parentProduct,
            },
        });
    } catch (error) {
        console.error('Update accessory error:', error);
        if (req.files) {
            if (req.files['image']) {
                deleteImage(`/uploads/products/${req.files['image'][0].filename}`);
            }
            if (req.files['galleryImages']) {
                req.files['galleryImages'].forEach(file => {
                    deleteImage(`/uploads/products/${file.filename}`);
                });
            }
        }
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// DELETE - Delete accessory
// ============================================
exports.deleteAccessory = async (req, res) => {
    try {
        const id = req.params.id;

        let accessory = await Accessory.findOne({ id: id });
        if (!accessory && mongoose.Types.ObjectId.isValid(id)) {
            accessory = await Accessory.findById(id);
        }

        if (!accessory) {
            return res.status(404).json({
                success: false,
                message: 'Accessory not found',
            });
        }

        // Delete main image if exists
        if (accessory.imageUrl) {
            deleteImage(accessory.imageUrl);
        }

        // Delete gallery images if exist
        if (accessory.galleryImages && accessory.galleryImages.length > 0) {
            deleteMultipleImages(accessory.galleryImages);
        }

        await accessory.deleteOne();

        res.json({
            success: true,
            message: 'Accessory deleted successfully',
        });
    } catch (error) {
        console.error('Delete accessory error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// GET - Get accessories by parent product
// ============================================
exports.getAccessoriesByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findOne({ id: productId }).lean();
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        const accessories = await Accessory.find({
            parentProductId: productId,
            isActive: true
        }).lean();

        const accessoriesWithDetails = await getAccessoryDetails(accessories);

        res.json({
            success: true,
            data: {
                product,
                accessories: accessoriesWithDetails,
                count: accessoriesWithDetails.length,
            },
        });
    } catch (error) {
        console.error('Get accessories by product error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// TOGGLE - Toggle accessory status
// ============================================
exports.toggleAccessoryStatus = async (req, res) => {
    try {
        const id = req.params.id;

        let accessory = await Accessory.findOne({ id: id });
        if (!accessory && mongoose.Types.ObjectId.isValid(id)) {
            accessory = await Accessory.findById(id);
        }

        if (!accessory) {
            return res.status(404).json({
                success: false,
                message: 'Accessory not found',
            });
        }

        accessory.isActive = !accessory.isActive;
        await accessory.save();

        res.json({
            success: true,
            message: `Accessory ${accessory.isActive ? 'activated' : 'deactivated'} successfully`,
            data: accessory,
        });
    } catch (error) {
        console.error('Toggle accessory status error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};