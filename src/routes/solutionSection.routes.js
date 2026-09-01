// src/routes/solutionSection.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getSolutionSection,
    getAllSolutionSections,
    createSolutionSection,
    updateSolutionSection,
    deleteSolutionSection,
    toggleSolutionSectionStatus,
    uploadSolutionImage,
    uploadSolutionImages,
    removeSolutionImage,
    removeGalleryImage
} = require('../controllers/solutionSection.controller');
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

// ✅ Middleware to handle multiple item images
const uploadItemImages = (req, res, next) => {
    // Allow multiple image fields: image_0, image_1, image_2, etc.
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
router.get('/', getSolutionSection);
router.get('/all', getAllSolutionSections);

// Admin routes with ImgBB upload
router.post(
    '/',
    uploadItemImages,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    createSolutionSection
);

router.put(
    '/:id',
    uploadItemImages,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    updateSolutionSection
);

router.delete('/:id', deleteSolutionSection);
router.put('/:id/toggle', toggleSolutionSectionStatus);

// Image upload routes - Single image
router.post(
    '/:id/upload-image/:itemIndex',
    upload.single('image'),
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadSolutionImage
);

// Image upload routes - Multiple images (gallery)
router.post(
    '/:id/upload-images/:itemIndex',
    upload.array('images', 10),
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadSolutionImages
);

router.delete(
    '/:id/remove-image/:itemIndex',
    removeSolutionImage
);

router.delete(
    '/:id/remove-gallery-image/:itemIndex/:imageIndex',
    removeGalleryImage
);

module.exports = router;