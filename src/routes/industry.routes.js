// src/routes/industry.routes.js
const express = require('express');
const router = express.Router();
const {
    createIndustry,
    getIndustries,
    getIndustry,
    updateIndustry,
    deleteIndustry,
    toggleIndustryStatus,
    deleteMultipleIndustries
} = require('../controllers/industry.controller');
const { protect, admin } = require('../middleware/auth');
const {
    uploadIndustryImages,
    uploadToImgBBMiddleware,  // ✅ Add ImgBB upload
    optimizeUploadedImages,
    handleUploadErrors
} = require('../middleware/upload');

// ============================================
// ✅ INDUSTRY ROUTES
// ============================================

// Public routes
router.get('/', getIndustries);
router.get('/:id', getIndustry);

// Admin only routes with ImgBB upload
router.post(
    '/',
    protect,
    admin,
    uploadIndustryImages,        // 1. Handle files (image, caseStudyImage)
    optimizeUploadedImages,     // 2. Optimize images
    uploadToImgBBMiddleware,    // 3. Upload to ImgBB
    handleUploadErrors,         // 4. Handle errors
    createIndustry
);

router.put(
    '/:id',
    protect,
    admin,
    uploadIndustryImages,        // 1. Handle files (image, caseStudyImage)
    optimizeUploadedImages,     // 2. Optimize images
    uploadToImgBBMiddleware,    // 3. Upload to ImgBB
    handleUploadErrors,         // 4. Handle errors
    updateIndustry
);

router.delete('/:id', protect, admin, deleteIndustry);
router.delete('/bulk', protect, admin, deleteMultipleIndustries);
router.put('/:id/toggle', protect, admin, toggleIndustryStatus);

module.exports = router;