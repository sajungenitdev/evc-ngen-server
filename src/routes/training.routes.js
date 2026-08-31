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
const { uploadIndustryImages, optimizeUploadedImages, handleUploadErrors } = require('../middleware/upload');

// ============================================
// TRAINING ROUTES
// ============================================

// Public routes
router.get('/', getTrainings);
router.get('/:id', getTraining);

// Admin only routes
router.post(
    '/',
    protect,
    admin,
    uploadIndustryImages,  // Reuse existing upload middleware
    optimizeUploadedImages,
    handleUploadErrors,
    createTraining
);

router.put(
    '/:id',
    protect,
    admin,
    uploadIndustryImages,
    optimizeUploadedImages,
    handleUploadErrors,
    updateTraining
);

router.delete('/:id', protect, admin, deleteTraining);
router.delete('/bulk', protect, admin, deleteMultipleTrainings);
router.put('/:id/toggle', protect, admin, toggleTrainingStatus);

module.exports = router;