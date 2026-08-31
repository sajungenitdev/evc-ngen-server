// src/routes/serviceCategory.routes.js
const express = require('express');
const router = express.Router();
const {
    createServiceCategory,
    getServiceCategories,
    getServiceCategory,
    updateServiceCategory,
    deleteServiceCategory,
    toggleServiceCategoryStatus,
} = require('../controllers/serviceCategory.controller');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.get('/', getServiceCategories);
router.get('/:id', getServiceCategory);

// Admin only routes
router.post('/', protect, admin, createServiceCategory);
router.put('/:id', protect, admin, updateServiceCategory);
router.delete('/:id', protect, admin, deleteServiceCategory);
router.put('/:id/toggle', protect, admin, toggleServiceCategoryStatus);

module.exports = router;