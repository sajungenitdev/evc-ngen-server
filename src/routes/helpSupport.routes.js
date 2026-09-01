// evngen-backend/src/routes/helpSupport.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getHelpSupport,
    getAllHelpSupport,
    createHelpSupport,
    updateHelpSupport,
    deleteHelpSupport,
    toggleHelpSupportStatus,
    uploadSalesCardImage,
    uploadTicketCardImage,
    uploadSupportHubCardImage,
    uploadReviewCardImage,
    uploadSocialCardImage,
    removeImage
} = require('../controllers/helpSupport.controller');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads/help-support');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `help-${uniqueSuffix}${ext}`);
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
router.get('/', getHelpSupport);
router.get('/all', getAllHelpSupport);

// Admin routes
router.post('/', createHelpSupport);
router.put('/:id', updateHelpSupport);
router.delete('/:id', deleteHelpSupport);
router.put('/:id/toggle', toggleHelpSupportStatus);

// Image upload routes
router.post(
    '/:id/upload-sales-image',
    upload.single('image'),
    uploadSalesCardImage
);

router.post(
    '/:id/upload-ticket-image',
    upload.single('image'),
    uploadTicketCardImage
);

router.post(
    '/:id/upload-support-image',
    upload.single('image'),
    uploadSupportHubCardImage
);

router.post(
    '/:id/upload-review-image',
    upload.single('image'),
    uploadReviewCardImage
);

router.post(
    '/:id/upload-social-image',
    upload.single('image'),
    uploadSocialCardImage
);

// Remove image routes
router.delete(
    '/:id/remove-image/:cardType',
    removeImage
);

module.exports = router;