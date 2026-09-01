// src/routes/training.routes.js
const express = require('express');
const router = express.Router();
const {
    createTraining,
    getTrainings,
    getTraining,
    updateTraining,
    deleteTraining,
    toggleTrainingStatus,
    deleteMultipleTrainings
} = require('../controllers/training.controller');
const { protect, admin } = require('../middleware/auth');
const {
    uploadIndustryImages,      // Handles 'image' field
    uploadToImgBBMiddleware,   // ✅ Add ImgBB upload
    optimizeUploadedImages,
    handleUploadErrors
} = require('../middleware/upload');

// ============================================
// TRAINING ROUTES
// ============================================

// Public routes
router.get('/', getTrainings);
router.get('/:id', getTraining);

// Admin only routes with ImgBB upload
router.post(
    '/',
    protect,
    admin,
    uploadIndustryImages,        // 1. Handle files
    optimizeUploadedImages,     // 2. Optimize images
    uploadToImgBBMiddleware,    // 3. Upload to ImgBB
    handleUploadErrors,         // 4. Handle errors
    createTraining
);

router.put(
    '/:id',
    protect,
    admin,
    uploadIndustryImages,        // 1. Handle files
    optimizeUploadedImages,     // 2. Optimize images
    uploadToImgBBMiddleware,    // 3. Upload to ImgBB
    handleUploadErrors,         // 4. Handle errors
    updateTraining
);

router.delete('/:id', protect, admin, deleteTraining);
router.delete('/bulk', protect, admin, deleteMultipleTrainings);
router.put('/:id/toggle', protect, admin, toggleTrainingStatus);

module.exports = router;