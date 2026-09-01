// src/routes/evShop.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getEvShop,
    getAllEvShop,
    createEvShop,
    updateEvShop,
    deleteEvShop,
    toggleEvShopStatus,
    uploadShopItemImage,
    removeShopItemImage
} = require('../controllers/evShop.controller');
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

// ✅ Middleware to handle multiple shop item images
const uploadShopImages = (req, res, next) => {
    const fields = Array.from({ length: 10 }, (_, i) => ({
        name: `item_${i}`,
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
        
        // ✅ Convert to format ImgBB middleware expects
        if (req.files) {
            const galleryImages = [];
            for (const [key, files] of Object.entries(req.files)) {
                if (key.startsWith('item_')) {
                    galleryImages.push(...files);
                }
            }
            
            if (galleryImages.length > 0) {
                req.files = { galleryImages };
                console.log(`📸 ${galleryImages.length} shop item images found`);
            }
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
router.get('/', getEvShop);
router.get('/all', getAllEvShop);

// Admin routes with ImgBB upload
router.post(
    '/',
    uploadShopImages,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    createEvShop
);

router.put(
    '/:id',
    uploadShopImages,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    updateEvShop
);

router.delete('/:id', deleteEvShop);
router.put('/:id/toggle', toggleEvShopStatus);

// Single image upload routes
router.post(
    '/:id/upload-image/:itemIndex',
    uploadSingleImageToFiles,
    uploadToImgBBMiddleware,
    handleUploadErrors,
    uploadShopItemImage
);

router.delete('/:id/remove-image/:itemIndex', removeShopItemImage);

module.exports = router;