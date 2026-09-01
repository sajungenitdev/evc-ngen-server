// src/routes/stories.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getStories,
    getAllStories,
    createStories,
    updateStories,
    deleteStories,
    toggleStoriesStatus,
    uploadMainStoryImage,
    uploadCategoryImage,
    removeMainStoryImage,
    removeCategoryImage
} = require('../controllers/storiesSection.controller');
const { 
    uploadToImgBBMiddleware,
    handleUploadErrors 
} = require('../middleware/upload');

// ============================================
// CONFIGURE MULTER FOR TEMPORARY UPLOAD
// ============================================

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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, GIF, and SVG are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: fileFilter
});

// ============================================
// MIDDLEWARE FOR MULTIPLE CATEGORY IMAGES
// ============================================

const uploadCategoryImages = (req, res, next) => {
    const fields = Array.from({ length: 10 }, (_, i) => ({
        name: `category_${i}`,
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

// ✅ Handle main story image (single file, field name 'mainImage')
const uploadMainImage = upload.single('mainImage');

// ✅ NEW: Middleware to convert single file upload to req.files format
const uploadSingleImageToFiles = (req, res, next) => {
    upload.single('image')(req, res, function (err) {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload failed'
            });
        }
        
        // ✅ Convert req.file to req.files format for ImgBB middleware compatibility
        if (req.file) {
            req.files = {
                image: [req.file]
            };
            console.log('📸 Single image converted to req.files format:', req.file.originalname);
        }
        
        next();
    });
};

// ============================================
// ROUTES
// ============================================

// Public routes
router.get('/', getStories);
router.get('/all', getAllStories);

// Admin routes with ImgBB upload (for create/update with multiple images)
router.post(
    '/',
    uploadCategoryImages,      // Handle category images
    uploadMainImage,           // Handle main story image
    uploadToImgBBMiddleware,   // Upload to ImgBB
    handleUploadErrors,        // Handle errors
    createStories
);

router.put(
    '/:id',
    uploadCategoryImages,      // Handle category images
    uploadMainImage,           // Handle main story image
    uploadToImgBBMiddleware,   // Upload to ImgBB
    handleUploadErrors,        // Handle errors
    updateStories
);

router.delete('/:id', deleteStories);
router.put('/:id/toggle', toggleStoriesStatus);

// ✅ FIXED: Single image upload routes - Main story
router.post(
    '/:id/upload-main-image',
    uploadSingleImageToFiles,  // ✅ Uses converter middleware
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadMainStoryImage
);

// ✅ FIXED: Single image upload routes - Category
router.post(
    '/:id/upload-category-image/:categoryIndex',
    uploadSingleImageToFiles,  // ✅ Uses converter middleware
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadCategoryImage
);

// Remove image routes
router.delete('/:id/remove-main-image', removeMainStoryImage);
router.delete('/:id/remove-category-image/:categoryIndex', removeCategoryImage);

module.exports = router;