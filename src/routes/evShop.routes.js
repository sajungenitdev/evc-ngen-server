// evngen-backend/src/routes/evShop.routes.js
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

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads/ev-shop');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `evshop-${uniqueSuffix}${ext}`);
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
router.get('/', getEvShop);
router.get('/all', getAllEvShop);

// Admin routes
router.post('/', createEvShop);
router.put('/:id', updateEvShop);
router.delete('/:id', deleteEvShop);
router.put('/:id/toggle', toggleEvShopStatus);

// Image upload routes
router.post(
    '/:id/upload-image/:itemIndex',
    upload.single('image'),
    uploadShopItemImage
);

router.delete(
    '/:id/remove-image/:itemIndex',
    removeShopItemImage
);

module.exports = router;