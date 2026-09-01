// src/routes/foundation.routes.js
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
const { 
    uploadToImgBBMiddleware,
    handleUploadErrors 
} = require('../middleware/upload');

// Configure multer for temporary image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../temp/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `temp-${uniqueSuffix}${ext}`);
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

// ✅ Middleware to handle foundation image uploads (multiple items)
const uploadFoundationImages = (req, res, next) => {
    // Allow multiple image fields: image_0, image_1, image_2, image_3
    const fields = Array.from({ length: 10 }, (_, i) => ({
        name: `image_${i}`,
        maxCount: 1
    }));
    
    upload.fields(fields)(req, res, function (err) {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload failed'
            });
        }
        next();
    });
};

// Public routes
router.get('/', getFoundation);
router.get('/all', getAllFoundation);

// Admin routes with ImgBB upload
router.post(
    '/',
    uploadFoundationImages,     // Handle multiple image fields
    uploadToImgBBMiddleware,   // Upload to ImgBB
    handleUploadErrors,
    createFoundation
);

router.put(
    '/:id',
    uploadFoundationImages,     // Handle multiple image fields
    uploadToImgBBMiddleware,   // Upload to ImgBB
    handleUploadErrors,
    updateFoundation
);

router.delete('/:id', deleteFoundation);
router.put('/:id/toggle', toggleFoundationStatus);

// Single image upload route for foundation items
router.post(
    '/:id/upload-image/:itemIndex',
    upload.single('image'),
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadFoundationImage
);

module.exports = router;