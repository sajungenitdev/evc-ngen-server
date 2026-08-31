// src/routes/product.routes.js
const express = require('express');
const router = express.Router();
const {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    deleteMultipleProducts,
} = require('../controllers/product.controller');
const { protect, admin } = require('../middleware/auth');
const { 
    uploadProductImages, 
    optimizeUploadedImages, 
    handleUploadErrors 
} = require('../middleware/upload');

// ============================================
// ✅ PRODUCT ROUTES
// ============================================

// Get all products
router.get('/', getProducts);

// Get single product
router.get('/:id', getProduct);

// ✅ Admin routes with image upload
router.post(
    '/', 
    protect, 
    admin, 
    uploadProductImages,  // Handle both image and galleryImages
    optimizeUploadedImages, // Optimize images
    handleUploadErrors,   // Handle upload errors
    createProduct
);

router.put(
    '/:id', 
    protect, 
    admin, 
    uploadProductImages,
    optimizeUploadedImages,
    handleUploadErrors,
    updateProduct
);

router.delete('/:id', protect, admin, deleteProduct);
router.delete('/bulk', protect, admin, deleteMultipleProducts);
router.put('/:id/toggle', protect, admin, toggleProductStatus);

module.exports = router;