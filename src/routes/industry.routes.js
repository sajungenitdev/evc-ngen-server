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
    uploadIndustryImages, // ✅ Changed from uploadSolutionImages
    optimizeUploadedImages,
    handleUploadErrors
} = require('../middleware/upload');

// ============================================
// ✅ INDUSTRY ROUTES
// ============================================

// Public routes
router.get('/', getIndustries);
router.get('/:id', getIndustry);

// Admin only routes with image upload
router.post(
    '/',
    protect,
    admin,
    uploadIndustryImages, // ✅ Changed from uploadSolutionImages
    optimizeUploadedImages,
    handleUploadErrors,
    createIndustry
);

router.put(
    '/:id',
    protect,
    admin,
    uploadIndustryImages, // ✅ Changed from uploadSolutionImages
    optimizeUploadedImages,
    handleUploadErrors,
    updateIndustry
);

router.delete('/:id', protect, admin, deleteIndustry);
router.delete('/bulk', protect, admin, deleteMultipleIndustries);
router.put('/:id/toggle', protect, admin, toggleIndustryStatus);

module.exports = router;