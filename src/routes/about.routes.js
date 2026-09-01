// src/routes/about.routes.js
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
const { 
    uploadToImgBBMiddleware,
    handleUploadErrors 
} = require('../middleware/upload');

// Configure multer for temporary upload
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

// ✅ Middleware to handle multiple about images
const uploadAboutImages = (req, res, next) => {
    const fields = [
        { name: 'headerImage', maxCount: 1 },
        { name: 'whoWeAreImage', maxCount: 1 },
        { name: 'missionImage', maxCount: 1 },
        ...Array.from({ length: 20 }, (_, i) => ({
            name: `partner_${i}`,
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
            
            if (req.files.headerImage && req.files.headerImage.length > 0) {
                newFiles.headerImage = req.files.headerImage;
            }
            if (req.files.whoWeAreImage && req.files.whoWeAreImage.length > 0) {
                newFiles.whoWeAreImage = req.files.whoWeAreImage;
            }
            if (req.files.missionImage && req.files.missionImage.length > 0) {
                newFiles.missionImage = req.files.missionImage;
            }
            
            // Handle partner logos
            const partnerLogos = [];
            for (const [key, files] of Object.entries(req.files)) {
                if (key.startsWith('partner_')) {
                    partnerLogos.push(...files);
                }
            }
            if (partnerLogos.length > 0) {
                newFiles.partnerLogos = partnerLogos;
            }
            
            req.files = newFiles;
        }
        
        next();
    });
};

// Convert single file upload to req.files format
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

// Public routes
router.get('/', getAbout);
router.get('/all', getAllAbout);

// Admin routes with ImgBB upload
router.post(
    '/',
    uploadAboutImages,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    createAbout
);

router.put(
    '/:id',
    uploadAboutImages,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    updateAbout
);

router.delete('/:id', deleteAbout);
router.put('/:id/toggle', toggleAboutStatus);

// Single image upload routes
router.post(
    '/:id/upload-header',
    uploadSingleImageToFiles,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadHeaderImage
);

router.post(
    '/:id/upload-who-we-are',
    uploadSingleImageToFiles,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadWhoWeAreImage
);

router.post(
    '/:id/upload-mission',
    uploadSingleImageToFiles,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadMissionImage
);

router.post(
    '/:id/upload-partner/:partnerIndex',
    uploadSingleImageToFiles,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadPartnerLogo
);

module.exports = router;