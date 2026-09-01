// evngen-backend/src/routes/solutionSection.routes.js
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

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads/solutions');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `solution-${uniqueSuffix}${ext}`);
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
router.get('/', getSolutionSection);
router.get('/all', getAllSolutionSections);

// Admin routes
router.post('/', createSolutionSection);
router.put('/:id', updateSolutionSection);
router.delete('/:id', deleteSolutionSection);
router.put('/:id/toggle', toggleSolutionSectionStatus);

// Image upload routes - Single image
router.post(
    '/:id/upload-image/:itemIndex',
    upload.single('image'),
    uploadSolutionImage
);

// Image upload routes - Multiple images
router.post(
    '/:id/upload-images/:itemIndex',
    upload.array('images', 10), // Max 10 images
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