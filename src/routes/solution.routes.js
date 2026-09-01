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
    uploadSolutionImages,
    uploadToImgBBMiddleware,  // ✅ Add ImgBB upload
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

// Admin only routes with ImgBB upload
router.post(
    '/',
    protect,
    admin,
    uploadSolutionImages,        // 1. Handle files
    optimizeUploadedImages,     // 2. Optimize images
    uploadToImgBBMiddleware,    // 3. Upload to ImgBB
    handleUploadErrors,         // 4. Handle errors
    createSolution
);

router.put(
    '/:id',
    protect,
    admin,
    uploadSolutionImages,        // 1. Handle files
    optimizeUploadedImages,     // 2. Optimize images
    uploadToImgBBMiddleware,    // 3. Upload to ImgBB
    handleUploadErrors,         // 4. Handle errors
    updateSolution
);

router.delete('/:id', protect, admin, deleteSolution);
router.delete('/bulk', protect, admin, deleteMultipleSolutions);
router.put('/:id/toggle', protect, admin, toggleSolutionStatus);

module.exports = router;