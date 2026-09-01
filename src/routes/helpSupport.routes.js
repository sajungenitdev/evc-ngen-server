// src/routes/helpSupport.routes.js
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

// ✅ Middleware to handle multiple card images
const uploadHelpSupportImages = (req, res, next) => {
    const fields = [
        { name: 'salesImage', maxCount: 1 },
        { name: 'ticketImage', maxCount: 1 },
        { name: 'supportImage', maxCount: 1 },
        { name: 'reviewImage', maxCount: 1 },
        { name: 'socialImage', maxCount: 1 }
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
            
            if (req.files.salesImage && req.files.salesImage.length > 0) {
                newFiles.salesImage = req.files.salesImage;
            }
            if (req.files.ticketImage && req.files.ticketImage.length > 0) {
                newFiles.ticketImage = req.files.ticketImage;
            }
            if (req.files.supportImage && req.files.supportImage.length > 0) {
                newFiles.supportImage = req.files.supportImage;
            }
            if (req.files.reviewImage && req.files.reviewImage.length > 0) {
                newFiles.reviewImage = req.files.reviewImage;
            }
            if (req.files.socialImage && req.files.socialImage.length > 0) {
                newFiles.socialImage = req.files.socialImage;
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
router.get('/', getHelpSupport);
router.get('/all', getAllHelpSupport);

// Admin routes with ImgBB upload
router.post(
    '/',
    uploadHelpSupportImages,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    createHelpSupport
);

router.put(
    '/:id',
    uploadHelpSupportImages,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    updateHelpSupport
);

router.delete('/:id', deleteHelpSupport);
router.put('/:id/toggle', toggleHelpSupportStatus);

// Single image upload routes
router.post(
    '/:id/upload-sales-image',
    uploadSingleImageToFiles,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadSalesCardImage
);

router.post(
    '/:id/upload-ticket-image',
    uploadSingleImageToFiles,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadTicketCardImage
);

router.post(
    '/:id/upload-support-image',
    uploadSingleImageToFiles,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadSupportHubCardImage
);

router.post(
    '/:id/upload-review-image',
    uploadSingleImageToFiles,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadReviewCardImage
);

router.post(
    '/:id/upload-social-image',
    uploadSingleImageToFiles,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadSocialCardImage
);

// Remove image routes
router.delete('/:id/remove-image/:cardType', removeImage);

module.exports = router;