// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads/products');
        ensureDirectoryExists(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `product-${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, WEBP, GIF, and SVG are allowed.`), false);
    }
};

// Create multer instance with increased limits
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        fieldSize: 10 * 1024 * 1024, // 10MB for text fields
        fields: 30,
        files: 20,
    },
    fileFilter: fileFilter
});

// ✅ Single image upload (for main image)
const uploadSingleImage = upload.single('image');

// ✅ Multiple images upload (for gallery)
const uploadMultipleImages = upload.array('galleryImages', 10);

// ✅ Combined upload for both main and gallery images
const uploadProductImages = (req, res, next) => {
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'galleryImages', maxCount: 10 }
    ])(req, res, function (err) {
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

// ✅ NEW: Upload for Solution modal with multiple image fields
const uploadSolutionImages = (req, res, next) => {
    // Handle dynamic fields like tabImage_0, tabImage_1, section2Image
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'section2Image', maxCount: 1 },
        // Allow any fields that start with 'tabImage_' - up to 10
        ...Array.from({ length: 10 }, (_, i) => ({ name: `tabImage_${i}`, maxCount: 1 }))
    ])(req, res, function (err) {
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

// Image optimization function
const optimizeImage = async (filePath, outputPath) => {
    try {
        await sharp(filePath)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80, progressive: true })
            .toFile(outputPath);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return true;
    } catch (error) {
        console.error('Image optimization error:', error);
        return false;
    }
};

// Optimize uploaded images
const optimizeUploadedImages = async (req, res, next) => {
    try {
        // Optimize all uploaded files
        if (req.files) {
            for (const fieldName of Object.keys(req.files)) {
                for (const file of req.files[fieldName]) {
                    const filePath = file.path;
                    const ext = path.extname(file.filename);
                    const optimizedFileName = file.filename.replace(ext, '-optimized.jpg');
                    const optimizedPath = path.join(path.dirname(filePath), optimizedFileName);

                    await optimizeImage(filePath, optimizedPath);

                    file.filename = optimizedFileName;
                    file.path = optimizedPath;
                }
            }
        }
        next();
    } catch (error) {
        console.error('Image optimization error:', error);
        next();
    }
};

// Error handling middleware for multer
const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 10 images.'
            });
        }
        if (err.code === 'LIMIT_FIELD_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many fields in the request.'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next(err);
};
const uploadIndustryImages = (req, res, next) => {
    upload.fields([
        { name: 'image', maxCount: 1 },           // Main image
        { name: 'caseStudyImage', maxCount: 1 },   // Case study image
    ])(req, res, function (err) {
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

module.exports = {
    uploadSingleImage,
    uploadMultipleImages,
    uploadProductImages,
    uploadSolutionImages,
    uploadIndustryImages,
    optimizeUploadedImages,
    handleUploadErrors,
    upload
};