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

// Public routes
router.get('/', getServices);
router.get('/categories', getServiceCategories);
router.get('/category/:category', getServicesByCategory);
router.get('/:id', getService);

// Admin only routes
router.post('/', protect, admin, createService);
router.put('/:id', protect, admin, updateService);
router.delete('/:id', protect, admin, deleteService);
router.delete('/bulk', protect, admin, deleteMultipleServices);
router.put('/:id/toggle', protect, admin, toggleServiceStatus);

module.exports = router;