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
    uploadToImgBBMiddleware,
    optimizeUploadedImages, 
    handleUploadErrors 
} = require('../middleware/upload');

// ============================================
// PUBLIC ROUTES
// ============================================
router.get('/', getProducts);
router.get('/:id', getProduct);

// ============================================
// ADMIN ROUTES (with ImgBB upload)
// ============================================
router.post(
    '/', 
    protect, 
    admin, 
    uploadProductImages,        // Handle files
    optimizeUploadedImages,     // Optimize images
    uploadToImgBBMiddleware,    // Upload to ImgBB
    handleUploadErrors,         // Handle errors
    createProduct
);

router.put(
    '/:id', 
    protect, 
    admin, 
    uploadProductImages,
    optimizeUploadedImages,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    updateProduct
);

router.delete('/:id', protect, admin, deleteProduct);
router.delete('/bulk', protect, admin, deleteMultipleProducts);
router.put('/:id/toggle', protect, admin, toggleProductStatus);

module.exports = router;