// evngen-backend/src/routes/about.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getAbout,
    getAllAbout,
    createAbout,
    updateAbout,
    deleteAbout,
    toggleAboutStatus,
    uploadHeaderImage,
    uploadWhoWeAreImage,
    uploadMissionImage,
    uploadPartnerLogo
} = require('../controllers/about.controller');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadDir = path.join(__dirname, '../../uploads/about');
        
        // If it's a partner logo, use partners subdirectory
        if (req.originalUrl.includes('partner')) {
            uploadDir = path.join(uploadDir, 'partners');
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `about-${uniqueSuffix}${ext}`);
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
router.get('/', getAbout);
router.get('/all', getAllAbout);

// Admin routes (with image upload)
router.post('/', createAbout);
router.put('/:id', updateAbout);
router.delete('/:id', deleteAbout);
router.put('/:id/toggle', toggleAboutStatus);

// Image upload routes
router.post(
    '/:id/upload-header',
    upload.single('image'),
    uploadHeaderImage
);

router.post(
    '/:id/upload-who-we-are',
    upload.single('image'),
    uploadWhoWeAreImage
);

router.post(
    '/:id/upload-mission',
    upload.single('image'),
    uploadMissionImage
);

router.post(
    '/:id/upload-partner/:partnerIndex',
    upload.single('image'),
    uploadPartnerLogo
);

module.exports = router;