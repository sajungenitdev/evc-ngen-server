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
// ✅ FIXED: MIDDLEWARE FOR STORY IMAGES
// ============================================

// ✅ Convert category_0, category_1 to galleryImages format for ImgBB middleware
const uploadStoryImages = (req, res, next) => {
    const fields = [
        { name: 'mainImage', maxCount: 1 },
        ...Array.from({ length: 10 }, (_, i) => ({
            name: `category_${i}`,
            maxCount: 1
        }))
    ];
    
    upload.fields(fields)(req, res, function (err) {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload failed'
            });
        }
        
        // ✅ Convert to format ImgBB middleware expects
        if (req.files) {
            const newFiles = {};
            
            // Handle main image
            if (req.files.mainImage && req.files.mainImage.length > 0) {
                newFiles.image = req.files.mainImage;
                console.log('📸 Main image found:', req.files.mainImage[0].originalname);
            }
            
            // Handle category images
            const categoryImages = [];
            for (const [key, files] of Object.entries(req.files)) {
                if (key.startsWith('category_')) {
                    categoryImages.push(...files);
                }
            }
            
            if (categoryImages.length > 0) {
                newFiles.galleryImages = categoryImages;
                console.log(`📸 ${categoryImages.length} category images found`);
            }
            
            req.files = newFiles;
        }
        
        next();
    });
};

// Convert single file upload to req.files format (for single image uploads)
const uploadSingleImageToFiles = (req, res, next) => {
    upload.single('image')(req, res, function (err) {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload failed'
            });
        }
        
        if (req.file) {
            req.files = {
                image: [req.file]
            };
            console.log('📸 Single image converted:', req.file.originalname);
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

// ✅ FIXED: Admin routes with ImgBB upload
router.post(
    '/',
    uploadStoryImages,          // ✅ Handles mainImage + category_0, category_1...
    uploadToImgBBMiddleware,    // Upload to ImgBB
    handleUploadErrors,
    createStories
);

router.put(
    '/:id',
    uploadStoryImages,          // ✅ Handles mainImage + category_0, category_1...
    uploadToImgBBMiddleware,    // Upload to ImgBB
    handleUploadErrors,
    updateStories
);

router.delete('/:id', deleteStories);
router.put('/:id/toggle', toggleStoriesStatus);

// Single image upload routes
router.post(
    '/:id/upload-main-image',
    uploadSingleImageToFiles,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadMainStoryImage
);

router.post(
    '/:id/upload-category-image/:categoryIndex',
    uploadSingleImageToFiles,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadCategoryImage
);

// Remove image routes
router.delete('/:id/remove-main-image', removeMainStoryImage);
router.delete('/:id/remove-category-image/:categoryIndex', removeCategoryImage);

module.exports = router;