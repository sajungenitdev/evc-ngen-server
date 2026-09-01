// evngen-backend/src/routes/terms.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getTerms,
    getAllTerms,
    createTerms,
    updateTerms,
    deleteTerms,
    toggleTermsStatus,
    uploadHeaderImage,
    removeHeaderImage
} = require('../controllers/terms.controller');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads/terms');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `terms-${uniqueSuffix}${ext}`);
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
router.get('/', getTerms);
router.get('/all', getAllTerms);

// Admin routes
router.post('/', createTerms);
router.put('/:id', updateTerms);
router.delete('/:id', deleteTerms);
router.put('/:id/toggle', toggleTermsStatus);

// Image upload routes
router.post(
    '/:id/upload-header',
    upload.single('image'),
    uploadHeaderImage
);

router.delete(
    '/:id/remove-header',
    removeHeaderImage
);

module.exports = router;