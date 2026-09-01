// src/routes/service.routes.js
const express = require('express');
const router = express.Router();
const {
    createService,
    getServices,
    getServicesByCategory,
    getService,
    updateService,
    deleteService,
    toggleServiceStatus,
    deleteMultipleServices,
    getServiceCategories,
} = require('../controllers/service.controller');
const { protect, admin } = require('../middleware/auth');
const {
    uploadIndustryImages,      // Handles 'image' field
    uploadToImgBBMiddleware,   // Upload to ImgBB
    optimizeUploadedImages,
    handleUploadErrors
} = require('../middleware/upload');

// Public routes
router.get('/', getServices);
router.get('/categories', getServiceCategories);
router.get('/category/:category', getServicesByCategory);
router.get('/:id', getService);

// Admin only routes with ImgBB upload
router.post(
    '/',
    protect,
    admin,
    uploadIndustryImages,        // 1. Handle files
    optimizeUploadedImages,     // 2. Optimize images
    uploadToImgBBMiddleware,    // 3. Upload to ImgBB
    handleUploadErrors,         // 4. Handle errors
    createService
);

router.put(
    '/:id',
    protect,
    admin,
    uploadIndustryImages,        // 1. Handle files
    optimizeUploadedImages,     // 2. Optimize images
    uploadToImgBBMiddleware,    // 3. Upload to ImgBB
    handleUploadErrors,         // 4. Handle errors
    updateService
);

router.delete('/:id', protect, admin, deleteService);
router.delete('/bulk', protect, admin, deleteMultipleServices);
router.put('/:id/toggle', protect, admin, toggleServiceStatus);

module.exports = router;