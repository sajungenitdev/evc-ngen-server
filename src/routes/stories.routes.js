// evngen-backend/src/routes/stories.routes.js
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

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadDir = path.join(__dirname, '../../uploads/stories');
        
        // If it's a category image, use categories subdirectory
        if (req.originalUrl.includes('category')) {
            uploadDir = path.join(uploadDir, 'categories');
        }
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `stories-${uniqueSuffix}${ext}`);
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
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Public routes
router.get('/', getStories);
router.get('/all', getAllStories);

// Admin routes
router.post('/', createStories);
router.put('/:id', updateStories);
router.delete('/:id', deleteStories);
router.put('/:id/toggle', toggleStoriesStatus);

// Image upload routes - Main story
router.post(
    '/:id/upload-main-image',
    upload.single('image'),
    uploadMainStoryImage
);

// Image upload routes - Category
router.post(
    '/:id/upload-category-image/:categoryIndex',
    upload.single('image'),
    uploadCategoryImage
);

// Remove image routes
router.delete(
    '/:id/remove-main-image',
    removeMainStoryImage
);

router.delete(
    '/:id/remove-category-image/:categoryIndex',
    removeCategoryImage
);

module.exports = router;