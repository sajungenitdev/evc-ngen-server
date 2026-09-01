// src/controllers/product.controller.js
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Accessory = require('../models/Accessory');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { deleteFromImgBB } = require('../services/imgbb.service');

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
// HELPER: Delete product image from ImgBB
// ============================================
const deleteProductImageFromImgBB = async (deleteUrl) => {
    if (!deleteUrl) return;
    try {
        await deleteFromImgBB(deleteUrl);
        console.log(`✅ Deleted image from ImgBB: ${deleteUrl}`);
    } catch (error) {
        console.error(`❌ Failed to delete image from ImgBB:`, error);
    }
};

// ============================================
// CREATE - Create a new product
// ============================================
exports.createProduct = async (req, res) => {
    try {
        console.log('📦 Request body:', req.body);
        console.log('🖼️ ImgBB URLs:', {
            imageUrl: req.imgbbImageUrl,
            galleryUrls: req.imgbbGalleryUrls
        });

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

        // Parse JSON fields
        const specs = parseJSONField(req.body.specs, []);
        const features = parseJSONField(req.body.features, []);
        const technicalDetails = parseJSONField(req.body.technicalDetails, {});
        let galleryImages = parseJSONField(req.body.galleryImages, []);

        // ✅ Use ImgBB URLs
        let imageUrl = '';
        let imageDeleteUrl = null;

        if (req.imgbbImageUrl) {
            imageUrl = req.imgbbImageUrl;
            imageDeleteUrl = req.imgbbDeleteUrl;
        }

        // ✅ Handle gallery images from ImgBB
        let galleryDeleteUrls = [];
        if (req.imgbbGalleryUrls && req.imgbbGalleryUrls.length > 0) {
            if (Array.isArray(galleryImages) && galleryImages.length > 0) {
                galleryImages = [...galleryImages, ...req.imgbbGalleryUrls];
            } else {
                galleryImages = req.imgbbGalleryUrls;
            }
            galleryDeleteUrls = req.imgbbGalleryDeleteUrls || [];
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
                message: `Brand "${brand}" not found.`,
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
                message: `Category "${category}" not found.`,
                availableCategories: allCategories.map(c => ({ id: c.id, name: c.name })),
            });
        }

        // Ensure technical details
        const defaultTechDetails = {
            powerOutput: 'N/A',
            inputVoltage: 'N/A',
            connectorType: 'N/A',
            enclosureRating: 'N/A',
            warranty: 'N/A',
            dimensions: 'N/A',
            weight: 'N/A'
        };

        // ✅ Create product with ImgBB URLs
        const product = await Product.create({
            id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            name,
            model,
            brand: brandExists.id,
            brandId: brandExists._id,
            category: categoryExists.id,
            categoryId: categoryExists._id,
            categoryLabel: categoryLabel || categoryExists.name,
            imageUrl: imageUrl,
            imageDeleteUrl: imageDeleteUrl,
            galleryImages: galleryImages || [],
            galleryDeleteUrls: galleryDeleteUrls,
            price: price || 0,
            rating: rating || 0,
            specs: specs || [],
            shortDescription: shortDescription || '',
            description: description || '',
            features: features || [],
            technicalDetails: { ...defaultTechDetails, ...technicalDetails },
            stock: stock || 0,
            isActive: isActive !== undefined ? isActive : true,
        });

        // Update counts
        await Brand.findByIdAndUpdate(brandExists._id, { $inc: { productCount: 1 } });
        await Category.findByIdAndUpdate(categoryExists._id, { $inc: { productCount: 1 } });

        const populatedProduct = await Product.findById(product._id).lean();
        const [brandData, categoryData] = await Promise.all([
            Brand.findOne({ id: populatedProduct.brand }).lean(),
            Category.findOne({ id: populatedProduct.category }).lean(),
        ]);

        res.status(201).json({
            success: true,
            message: 'Product created successfully with ImgBB hosting',
            data: {
                ...populatedProduct,
                brandDetails: brandData,
                categoryDetails: categoryData,
            },
        });
    } catch (error) {
        console.error('Create product error:', error);
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

        res.json({
            success: true,
            data: products,
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
// READ - Get single product
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

        const accessories = await Accessory.find({
            parentProductId: product.id,
            isActive: true
        }).lean();

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

        // ✅ Handle new image from ImgBB
        if (req.imgbbImageUrl) {
            // Delete old image from ImgBB
            if (product.imageDeleteUrl) {
                await deleteProductImageFromImgBB(product.imageDeleteUrl);
            }
            updateData.imageUrl = req.imgbbImageUrl;
            updateData.imageDeleteUrl = req.imgbbDeleteUrl;
        }

        // ✅ Handle gallery images from ImgBB
        if (req.imgbbGalleryUrls && req.imgbbGalleryUrls.length > 0) {
            // Delete old gallery images from ImgBB
            if (product.galleryDeleteUrls && product.galleryDeleteUrls.length > 0) {
                for (const deleteUrl of product.galleryDeleteUrls) {
                    await deleteProductImageFromImgBB(deleteUrl);
                }
            }

            const existingGallery = updateData.galleryImages ?
                parseJSONField(updateData.galleryImages, []) :
                product.galleryImages || [];

            updateData.galleryImages = [...existingGallery, ...req.imgbbGalleryUrls];
            updateData.galleryDeleteUrls = req.imgbbGalleryDeleteUrls || [];
        }

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
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// DELETE - Delete product
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

        // ✅ Delete main image from ImgBB
        if (product.imageDeleteUrl) {
            await deleteProductImageFromImgBB(product.imageDeleteUrl);
        }

        // ✅ Delete gallery images from ImgBB
        if (product.galleryDeleteUrls && product.galleryDeleteUrls.length > 0) {
            for (const deleteUrl of product.galleryDeleteUrls) {
                await deleteProductImageFromImgBB(deleteUrl);
            }
        }

        // Delete accessories
        await Accessory.deleteMany({ parentProductId: product.id });

        // Update counts
        if (product.brandId) {
            await Brand.findByIdAndUpdate(product.brandId, { $inc: { productCount: -1 } });
        }
        if (product.categoryId) {
            await Category.findByIdAndUpdate(product.categoryId, { $inc: { productCount: -1 } });
        }

        await product.deleteOne();

        res.json({
            success: true,
            message: 'Product and its images deleted successfully from ImgBB',
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

        // ✅ Delete all images from ImgBB
        for (const product of products) {
            if (product.imageDeleteUrl) {
                await deleteProductImageFromImgBB(product.imageDeleteUrl);
            }
            if (product.galleryDeleteUrls && product.galleryDeleteUrls.length > 0) {
                for (const deleteUrl of product.galleryDeleteUrls) {
                    await deleteProductImageFromImgBB(deleteUrl);
                }
            }
        }

        // Delete accessories
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
            message: `${result.deletedCount} products and their images deleted successfully from ImgBB`,
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