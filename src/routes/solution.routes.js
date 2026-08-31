// src/routes/solution.routes.js
const express = require('express');
const router = express.Router();
const {
    createSolution,
    getSolutions,
    getSolution,
    getSolutionById,
    getSolutionsByCategory,
    getRelatedSolutions,
    updateSolution,
    deleteSolution,
    toggleSolutionStatus,
    deleteMultipleSolutions
} = require('../controllers/solution.controller');
const { protect, admin } = require('../middleware/auth');
const { 
    uploadSolutionImages, // ✅ Use the new middleware
    optimizeUploadedImages,
    handleUploadErrors 
} = require('../middleware/upload');

// ============================================
// ✅ SOLUTION ROUTES
// ============================================

// Public routes
router.get('/', getSolutions);
router.get('/category/:categoryId', getSolutionsByCategory);
router.get('/related/:id', getRelatedSolutions);
router.get('/id/:id', getSolutionById);
router.get('/:id', getSolution);

// Admin only routes with image upload
router.post(
    '/',
    protect,
    admin,
    uploadSolutionImages, // ✅ Handles image, tabImage_*, section2Image
    optimizeUploadedImages,
    handleUploadErrors,
    createSolution
);

router.put(
    '/:id',
    protect,
    admin,
    uploadSolutionImages,
    optimizeUploadedImages,
    handleUploadErrors,
    updateSolution
);

router.delete('/:id', protect, admin, deleteSolution);
router.delete('/bulk', protect, admin, deleteMultipleSolutions);
router.put('/:id/toggle', protect, admin, toggleSolutionStatus);

module.exports = router;