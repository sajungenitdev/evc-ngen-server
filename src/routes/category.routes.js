// src/routes/category.routes.js
const express = require('express');
const router = express.Router();
const {
    createCategory,
    getCategories,
    getCategoryTree,
    getCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    toggleCategoryStatusOnly,
    deleteMultipleCategories,
    bulkUpdateStatus,
} = require('../controllers/category.controller');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/:id', getCategory);

// Admin only routes
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);
router.delete('/bulk', protect, admin, deleteMultipleCategories);

// Status toggle routes
router.put('/:id/toggle', protect, admin, toggleCategoryStatus); // With cascade
router.put('/:id/toggle-only', protect, admin, toggleCategoryStatusOnly); // Without cascade

// Bulk operations
router.put('/bulk/status', protect, admin, bulkUpdateStatus);

module.exports = router;