// src/routes/brand.routes.js
const express = require('express');
const router = express.Router();
const {
    createBrand,
    getBrands,
    getBrand,
    getBrandProducts,
    updateBrand,
    deleteBrand,
    deleteMultipleBrands,
    toggleBrandStatus,
} = require('../controllers/brand.controller');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.get('/', getBrands);
router.get('/:id', getBrand);
router.get('/:id/products', getBrandProducts);

// Admin only routes
router.post('/', protect, admin, createBrand);
router.put('/:id', protect, admin, updateBrand);
router.delete('/:id', protect, admin, deleteBrand);
router.delete('/bulk', protect, admin, deleteMultipleBrands);
router.put('/:id/toggle', protect, admin, toggleBrandStatus);

module.exports = router;