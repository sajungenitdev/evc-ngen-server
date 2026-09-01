// src/routes/accessory.routes.js
const express = require('express');
const router = express.Router();
const {
    createAccessory,
    getAccessories,
    getAccessory,
    updateAccessory,
    deleteAccessory,
    getAccessoriesByProduct,
    toggleAccessoryStatus,
} = require('../controllers/accessory.controller');
const { protect, admin } = require('../middleware/auth');
const {
    uploadProductImages,     // ✅ Handles both 'image' and 'galleryImages'
    uploadToImgBBMiddleware,  // ✅ Upload to ImgBB
    optimizeUploadedImages,   // ✅ Optimize images
    handleUploadErrors
} = require('../middleware/upload');

// ============================================
// ✅ ACCESSORY ROUTES
// ============================================

// Public routes
router.get('/', getAccessories);
router.get('/product/:productId', getAccessoriesByProduct);
router.get('/:id', getAccessory);

// Admin only routes with ImgBB upload
router.post(
    '/',
    protect,
    admin,
    uploadProductImages,        // 1. Handle files
    optimizeUploadedImages,     // 2. Optimize images
    uploadToImgBBMiddleware,    // 3. Upload to ImgBB
    handleUploadErrors,         // 4. Handle errors
    createAccessory
);

router.put(
    '/:id',
    protect,
    admin,
    uploadProductImages,        // 1. Handle files
    optimizeUploadedImages,     // 2. Optimize images
    uploadToImgBBMiddleware,    // 3. Upload to ImgBB
    handleUploadErrors,         // 4. Handle errors
    updateAccessory
);

router.delete('/:id', protect, admin, deleteAccessory);
router.put('/:id/toggle', protect, admin, toggleAccessoryStatus);

module.exports = router;