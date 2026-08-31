// evngen-backend/src/routes/foundation.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getFoundation,
    getAllFoundation,
    createFoundation,
    updateFoundation,
    deleteFoundation,
    toggleFoundationStatus,
    uploadFoundationImage
} = require('../controllers/foundation.controller');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads/foundation');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `foundation-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Public routes
router.get('/', getFoundation);
router.get('/all', getAllFoundation);

// Admin routes (with image upload)
router.post('/', createFoundation);
router.put('/:id', updateFoundation);
router.delete('/:id', deleteFoundation);
router.put('/:id/toggle', toggleFoundationStatus);

// Image upload route
router.post(
    '/:id/upload-image/:itemIndex',
    upload.single('image'),
    uploadFoundationImage
);

module.exports = router;