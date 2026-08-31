// src/routes/accessory.routes.js
const express = require('express');
const router = express.Router();
const {
    createAccessory,
    getAccessories,
    getAccessory,
    updateAccessory,
    deleteAccessory,
    getAccessoriesByProduct,
    toggleAccessoryStatus,
} = require('../controllers/accessory.controller');
const { protect, admin } = require('../middleware/auth');
const {
    uploadProductImages, // ✅ Use this for multiple files
    handleUploadErrors
} = require('../middleware/upload');

// ============================================
// ✅ ACCESSORY ROUTES
// ============================================

// Public routes
router.get('/', getAccessories);
router.get('/product/:productId', getAccessoriesByProduct);
router.get('/:id', getAccessory);

// Admin only routes with image upload
router.post(
    '/',
    protect,
    admin,
    uploadProductImages, // ✅ Handles both 'image' and 'galleryImages'
    handleUploadErrors,
    createAccessory
);

router.put(
    '/:id',
    protect,
    admin,
    uploadProductImages, // ✅ Handles both 'image' and 'galleryImages'
    handleUploadErrors,
    updateAccessory
);

router.delete('/:id', protect, admin, deleteAccessory);
router.put('/:id/toggle', protect, admin, toggleAccessoryStatus);

module.exports = router;