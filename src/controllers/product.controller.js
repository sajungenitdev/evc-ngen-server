// src/controllers/product.controller.js
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Accessory = require('../models/Accessory');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ============================================
// HELPER: Get brand and category details
// ============================================
const getProductDetails = async (products) => {
    if (!products || products.length === 0) return products;

    const brandIds = [...new Set(products.map(p => p.brand).filter(Boolean))];
    const categoryIds = [...new Set(products.map(p => p.category).filter(Boolean))];

    const [brands, categories] = await Promise.all([
        Brand.find({ id: { $in: brandIds } }).lean(),
        Category.find({ id: { $in: categoryIds } }).lean(),
    ]);

    const brandMap = {};
    brands.forEach(b => { brandMap[b.id] = b; });

    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.id] = c; });

    return products.map(product => ({
        ...product,
        brandDetails: brandMap[product.brand] || null,
        categoryDetails: categoryMap[product.category] || null,
    }));
};

// ============================================
// HELPER: Delete product image
// ============================================
const deleteProductImage = (imageUrl) => {
    if (!imageUrl) return;

    // Extract filename from URL
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
    imageUrls.forEach(url => deleteProductImage(url));
};

// ============================================
// HELPER: Parse JSON fields from FormData
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
// CREATE - Create a new product
// ============================================
// src/controllers/product.controller.js - Updated createProduct

exports.createProduct = async (req, res) => {
    try {
        // Log what was received
        console.log('📦 Request body:', req.body);
        console.log('📸 Files received:', req.files);

        const {
            name,
            model,
            brand,
            category,
            categoryLabel,
            price,
            rating,
            shortDescription,
            description,
            stock,
            isActive,
        } = req.body;

        // ✅ Parse JSON fields from FormData
        const specs = parseJSONField(req.body.specs, []);
        const features = parseJSONField(req.body.features, []);
        const technicalDetails = parseJSONField(req.body.technicalDetails, {});
        let galleryImages = parseJSONField(req.body.galleryImages, []);

        // ✅ Handle gallery images from files
        if (req.files && req.files['galleryImages'] && req.files['galleryImages'].length > 0) {
            const galleryUrls = req.files['galleryImages'].map(file => `/uploads/products/${file.filename}`);
            // If galleryImages already has values, merge them (keeping both)
            if (Array.isArray(galleryImages) && galleryImages.length > 0) {
                galleryImages = [...galleryImages, ...galleryUrls];
            } else {
                galleryImages = galleryUrls;
            }
        }

        // ✅ Handle main image
        let imageUrl = '';
        if (req.files && req.files['image'] && req.files['image'].length > 0) {
            imageUrl = `/uploads/products/${req.files['image'][0].filename}`;
        }

        // ✅ Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Product name is required'
            });
        }
        if (!model) {
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
        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Main image is required'
            });
        }

        // Check if product already exists
        const existingProduct = await Product.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${name}$`, 'i') } },
                { model: { $regex: new RegExp(`^${model}$`, 'i') } }
            ]
        });

        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: 'Product with this name or model already exists',
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

        // ✅ Ensure all technical details have default values
        const defaultTechDetails = {
            powerOutput: 'N/A',
            inputVoltage: 'N/A',
            connectorType: 'N/A',
            enclosureRating: 'N/A',
            warranty: 'N/A',
            dimensions: 'N/A',
            weight: 'N/A'
        };

        const mergedTechnicalDetails = {
            ...defaultTechDetails,
            ...technicalDetails
        };

        // Create product
        const product = await Product.create({
            id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            name,
            model,
            brand: brandExists.id,
            brandId: brandExists._id,
            category: categoryExists.id,
            categoryId: categoryExists._id,
            categoryLabel: categoryLabel || categoryExists.name,
            imageUrl: imageUrl || '/uploads/products/default-product.jpg',
            galleryImages: galleryImages || [],
            price: price || 0,
            rating: rating || 0,
            specs: specs || [],
            shortDescription: shortDescription || '',
            description: description || '',
            features: features || [],
            technicalDetails: mergedTechnicalDetails,
            stock: stock || 0,
            isActive: isActive !== undefined ? isActive : true,
        });

        // Update brand product count
        await Brand.findByIdAndUpdate(brandExists._id, {
            $inc: { productCount: 1 }
        });

        // Update category product count
        await Category.findByIdAndUpdate(categoryExists._id, {
            $inc: { productCount: 1 }
        });

        const populatedProduct = await Product.findById(product._id).lean();
        const [brandData, categoryData] = await Promise.all([
            Brand.findOne({ id: populatedProduct.brand }).lean(),
            Category.findOne({ id: populatedProduct.category }).lean(),
        ]);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: {
                ...populatedProduct,
                brandDetails: brandData,
                categoryDetails: categoryData,
            },
        });
    } catch (error) {
        console.error('Create product error:', error);
        // If there's an error and files were uploaded, delete them
        if (req.files) {
            if (req.files['image']) {
                deleteProductImage(`/uploads/products/${req.files['image'][0].filename}`);
            }
            if (req.files['galleryImages']) {
                req.files['galleryImages'].forEach(file => {
                    deleteProductImage(`/uploads/products/${file.filename}`);
                });
            }
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create product',
        });
    }
};

// ============================================
// READ - Get all products
// ============================================
exports.getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            brand,
            category,
            minPrice,
            maxPrice,
            minRating,
            isActive,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        const query = {};

        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (brand) query.brand = brand;
        if (category) query.category = category;
        if (minRating) query.rating = { $gte: Number(minRating) };

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (search) {
            query.$text = { $search: search };
        }

        const [total, products] = await Promise.all([
            Product.countDocuments(query),
            Product.find(query)
                .select('-__v')
                .sort(search ? { score: { $meta: 'textScore' } } : { [sortBy]: sortDirection })
                .skip(skip)
                .limit(Number(limit))
                .lean()
        ]);

        const productsWithDetails = await getProductDetails(products);

        res.json({
            success: true,
            data: productsWithDetails,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit),
            },
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get single product with accessories
// ============================================
exports.getProduct = async (req, res) => {
    try {
        const id = req.params.id;

        let product = await Product.findOne({ id: id }).lean();

        if (!product && mongoose.Types.ObjectId.isValid(id)) {
            product = await Product.findById(id).lean();
        }

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Get accessories for this product
        const accessories = await Accessory.find({
            parentProductId: product.id,
            isActive: true
        }).lean();

        // Get brand and category
        const [brandData, categoryData] = await Promise.all([
            Brand.findOne({ id: product.brand }).lean(),
            Category.findOne({ id: product.category }).lean(),
        ]);

        res.json({
            success: true,
            data: {
                ...product,
                brandDetails: brandData || null,
                categoryDetails: categoryData || null,
                accessories: accessories || [],
                accessoriesCount: accessories?.length || 0,
            },
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// UPDATE - Update product
// ============================================
exports.updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const updateData = req.body;

        let product = await Product.findOne({ id: id });
        if (!product && mongoose.Types.ObjectId.isValid(id)) {
            product = await Product.findById(id);
        }

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Check name conflicts
        if (updateData.name && updateData.name !== product.name) {
            const existing = await Product.findOne({
                name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
                _id: { $ne: product._id }
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Product with this name already exists',
                });
            }
        }

        // ✅ Handle new image upload
        if (req.file) {
            // Delete old image if it exists and is not default
            if (product.imageUrl && !product.imageUrl.includes('default-product.jpg')) {
                deleteProductImage(product.imageUrl);
            }
            updateData.imageUrl = `/uploads/products/${req.file.filename}`;
        }

        // ✅ Parse JSON fields from FormData
        if (updateData.specs) {
            updateData.specs = parseJSONField(updateData.specs, []);
        }
        if (updateData.features) {
            updateData.features = parseJSONField(updateData.features, []);
        }
        if (updateData.technicalDetails) {
            updateData.technicalDetails = parseJSONField(updateData.technicalDetails, {});
        }
        if (updateData.galleryImages) {
            updateData.galleryImages = parseJSONField(updateData.galleryImages, []);
        }

        // Update fields
        Object.keys(updateData).forEach(key => {
            if (key !== '_id' && key !== 'id') {
                product[key] = updateData[key];
            }
        });

        if (updateData.name) {
            product.id = updateData.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        }

        await product.save();

        const updatedProduct = await Product.findById(product._id).lean();
        const [brandData, categoryData] = await Promise.all([
            Brand.findOne({ id: updatedProduct.brand }).lean(),
            Category.findOne({ id: updatedProduct.category }).lean(),
        ]);

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: {
                ...updatedProduct,
                brandDetails: brandData,
                categoryDetails: categoryData,
            },
        });
    } catch (error) {
        console.error('Update product error:', error);
        // If there's an error and a file was uploaded, delete it
        if (req.file) {
            deleteProductImage(`/uploads/products/${req.file.filename}`);
        }
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// DELETE - Delete product (and its accessories)
// ============================================
exports.deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;

        let product = await Product.findOne({ id: id });
        if (!product && mongoose.Types.ObjectId.isValid(id)) {
            product = await Product.findById(id);
        }

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // ✅ Delete product image
        if (product.imageUrl && !product.imageUrl.includes('default-product.jpg')) {
            deleteProductImage(product.imageUrl);
        }

        // ✅ Delete gallery images
        if (product.galleryImages && product.galleryImages.length > 0) {
            deleteMultipleImages(product.galleryImages);
        }

        // Delete all accessories belonging to this product
        await Accessory.deleteMany({ parentProductId: product.id });

        // Update brand count
        if (product.brandId) {
            await Brand.findByIdAndUpdate(product.brandId, { $inc: { productCount: -1 } });
        }

        // Update category count
        if (product.categoryId) {
            await Category.findByIdAndUpdate(product.categoryId, { $inc: { productCount: -1 } });
        }

        await product.deleteOne();

        res.json({
            success: true,
            message: 'Product and its accessories deleted successfully',
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// TOGGLE - Toggle product status
// ============================================
exports.toggleProductStatus = async (req, res) => {
    try {
        const id = req.params.id;

        let product = await Product.findOne({ id: id });
        if (!product && mongoose.Types.ObjectId.isValid(id)) {
            product = await Product.findById(id);
        }

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        product.isActive = !product.isActive;
        await product.save();

        res.json({
            success: true,
            message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
            data: product,
        });
    } catch (error) {
        console.error('Toggle product status error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// BULK - Delete multiple products
// ============================================
exports.deleteMultipleProducts = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of product IDs',
            });
        }

        const products = await Product.find({
            $or: [
                { id: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        // ✅ Delete all images for these products
        for (const product of products) {
            if (product.imageUrl && !product.imageUrl.includes('default-product.jpg')) {
                deleteProductImage(product.imageUrl);
            }
            if (product.galleryImages && product.galleryImages.length > 0) {
                deleteMultipleImages(product.galleryImages);
            }
        }

        // Delete all accessories for these products
        const productIds = products.map(p => p.id);
        await Accessory.deleteMany({ parentProductId: { $in: productIds } });

        // Update counts
        for (const product of products) {
            if (product.brandId) {
                await Brand.findByIdAndUpdate(product.brandId, { $inc: { productCount: -1 } });
            }
            if (product.categoryId) {
                await Category.findByIdAndUpdate(product.categoryId, { $inc: { productCount: -1 } });
            }
        }

        const result = await Product.deleteMany({
            $or: [
                { id: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        res.json({
            success: true,
            message: `${result.deletedCount} products and their accessories deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('Delete multiple products error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};