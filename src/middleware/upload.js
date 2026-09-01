// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { uploadToImgBB } = require('../services/imgbb.service');

// Ensure temp directory exists
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Configure temporary storage
const tempStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../temp/uploads');
        ensureDirectoryExists(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `temp-${uniqueSuffix}${ext}`);
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

// Create multer instance
const upload = multer({
    storage: tempStorage,
    limits: {
        fileSize: 10 * 1024 * 1024,
        fieldSize: 10 * 1024 * 1024,
        fields: 30,
        files: 20,
    },
    fileFilter: fileFilter
});

// Combined upload for both main and gallery images
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

// src/middleware/upload.js - Updated uploadToImgBBMiddleware

// ✅ UPDATED: Upload to ImgBB middleware - handles ALL image fields
const uploadToImgBBMiddleware = async (req, res, next) => {
    try {
        console.log('🖼️ Starting ImgBB upload...');
        console.log('📁 req.files keys:', req.files ? Object.keys(req.files) : 'No files');

        // ✅ Process main image from req.files['image']
        if (req.files && req.files['image'] && req.files['image'].length > 0) {
            const file = req.files['image'][0];
            console.log(`📸 Uploading main image: ${file.originalname} (${file.size} bytes)`);
            
            if (!fs.existsSync(file.path)) {
                console.error('❌ Main image file not found:', file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Main image file not found'
                });
            }

            const result = await uploadToImgBB(
                file.path,
                `solution-${Date.now()}`
            );
            
            if (result.success) {
                req.imgbbImageUrl = result.url;
                req.imgbbDeleteUrl = result.deleteUrl;
                req.imgbbData = result;
                console.log('✅ Main image uploaded:', result.url);
            } else {
                console.error('❌ Main image upload failed:', result.error);
                return res.status(400).json({
                    success: false,
                    message: 'Failed to upload main image to ImgBB: ' + result.error
                });
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
            if (fs.existsSync(file.path)) {
                try {
                    fs.unlinkSync(file.path);
                    console.log('🗑️ Deleted temp main image');
                } catch (unlinkError) {
                    console.warn('Could not delete temp file:', unlinkError.message);
                }
            }
        }

        // ✅ Process section2 image from req.files['section2Image']
        if (req.files && req.files['section2Image'] && req.files['section2Image'].length > 0) {
            const file = req.files['section2Image'][0];
            console.log(`📸 Uploading section2 image: ${file.originalname} (${file.size} bytes)`);
            
            if (!fs.existsSync(file.path)) {
                console.warn('⚠️ Section2 image file not found:', file.path);
            } else {
                const result = await uploadToImgBB(
                    file.path,
                    `section2-${Date.now()}`
                );
                
                if (result.success) {
                    req.imgbbSection2Image = result.url;
                    req.imgbbSection2DeleteUrl = result.deleteUrl;
                    console.log('✅ Section2 image uploaded:', result.url);
                } else {
                    console.error('❌ Section2 image upload failed:', result.error);
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
                if (fs.existsSync(file.path)) {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (unlinkError) {
                        console.warn('Could not delete section2 temp file:', unlinkError.message);
                    }
                }
            }
        }

        // ✅ Process tab images from req.files['tabImage_*']
        // Find all tab image fields
        const tabImageKeys = Object.keys(req.files || {}).filter(key => key.startsWith('tabImage_'));
        
        if (tabImageKeys.length > 0) {
            req.imgbbTabImages = [];
            req.imgbbTabDeleteUrls = [];
            
            console.log(`📸 Uploading ${tabImageKeys.length} tab images...`);
            
            // Sort keys to maintain order
            tabImageKeys.sort((a, b) => {
                const indexA = parseInt(a.replace('tabImage_', ''));
                const indexB = parseInt(b.replace('tabImage_', ''));
                return indexA - indexB;
            });
            
            for (const key of tabImageKeys) {
                const file = req.files[key][0];
                
                if (!fs.existsSync(file.path)) {
                    console.warn(`⚠️ Tab image file not found: ${file.path}`);
                    continue;
                }
                
                const result = await uploadToImgBB(
                    file.path,
                    `tab-${Date.now()}-${key}`
                );
                
                if (result.success) {
                    req.imgbbTabImages.push(result.url);
                    req.imgbbTabDeleteUrls.push(result.deleteUrl);
                    console.log(`✅ ${key} uploaded:`, result.url);
                } else {
                    console.error(`❌ ${key} upload failed:`, result.error);
                    req.imgbbTabImages.push(null);
                    req.imgbbTabDeleteUrls.push(null);
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
                if (fs.existsSync(file.path)) {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (unlinkError) {
                        console.warn(`Could not delete ${key} temp file:`, unlinkError.message);
                    }
                }
            }
        }

        // ✅ Process gallery images (for products/accessories)
        if (req.files && req.files['galleryImages'] && req.files['galleryImages'].length > 0) {
            req.imgbbGalleryUrls = [];
            req.imgbbGalleryDeleteUrls = [];
            
            console.log(`📸 Uploading ${req.files['galleryImages'].length} gallery images...`);
            
            for (let i = 0; i < req.files['galleryImages'].length; i++) {
                const file = req.files['galleryImages'][i];
                
                if (!fs.existsSync(file.path)) {
                    console.warn(`⚠️ Gallery file ${i + 1} not found, skipping`);
                    continue;
                }
                
                const result = await uploadToImgBB(
                    file.path,
                    `gallery-${Date.now()}-${i + 1}`
                );
                
                if (result.success) {
                    req.imgbbGalleryUrls.push(result.url);
                    req.imgbbGalleryDeleteUrls.push(result.deleteUrl);
                    console.log(`✅ Gallery ${i + 1} uploaded:`, result.url);
                } else {
                    console.error(`❌ Gallery ${i + 1} upload failed:`, result.error);
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
                if (fs.existsSync(file.path)) {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (unlinkError) {
                        console.warn('Could not delete gallery temp file:', unlinkError.message);
                    }
                }
            }
        }
        
        console.log('✅ ImgBB upload completed');
        console.log('🖼️ Final URLs:', {
            imageUrl: req.imgbbImageUrl || '❌ MISSING',
            section2Image: req.imgbbSection2Image || '❌ MISSING',
            tabImages: req.imgbbTabImages?.length || 0,
            galleryCount: req.imgbbGalleryUrls?.length || 0
        });
        
        next();
    } catch (error) {
        console.error('❌ ImgBB upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload images: ' + error.message
        });
    }
};

// Image optimization
const optimizeImage = async (filePath, outputPath) => {
    try {
        await sharp(filePath)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80, progressive: true })
            .toFile(outputPath);

        // Wait a bit before deleting
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                console.warn('Could not delete original file:', e.message);
            }
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
        // Optimize main image
        if (req.files && req.files['image'] && req.files['image'].length > 0) {
            const file = req.files['image'][0];
            if (fs.existsSync(file.path)) {
                const filePath = file.path;
                const ext = path.extname(file.filename);
                const optimizedFileName = file.filename.replace(ext, '-optimized.jpg');
                const optimizedPath = path.join(path.dirname(filePath), optimizedFileName);
                
                await optimizeImage(filePath, optimizedPath);
                
                if (fs.existsSync(optimizedPath)) {
                    file.path = optimizedPath;
                    file.filename = optimizedFileName;
                }
            }
        }
        
        // Optimize gallery images
        if (req.files && req.files['galleryImages']) {
            for (const file of req.files['galleryImages']) {
                if (fs.existsSync(file.path)) {
                    const filePath = file.path;
                    const ext = path.extname(file.filename);
                    const optimizedFileName = file.filename.replace(ext, '-optimized.jpg');
                    const optimizedPath = path.join(path.dirname(filePath), optimizedFileName);
                    
                    await optimizeImage(filePath, optimizedPath);
                    
                    if (fs.existsSync(optimizedPath)) {
                        file.path = optimizedPath;
                        file.filename = optimizedFileName;
                    }
                }
            }
        }
        next();
    } catch (error) {
        console.error('Image optimization error:', error);
        next();
    }
};

// ✅ Upload for Solution modal
const uploadSolutionImages = (req, res, next) => {
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'section2Image', maxCount: 1 },
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

// ✅ Upload for Industry images
const uploadIndustryImages = (req, res, next) => {
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'caseStudyImage', maxCount: 1 },
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

// Single image upload
const uploadSingleImage = upload.single('image');

// Multiple images upload
const uploadMultipleImages = upload.array('galleryImages', 10);

// Error handling middleware
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
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next(err);
};

module.exports = {
    uploadSingleImage,
    uploadMultipleImages,
    uploadProductImages,
    uploadSolutionImages,
    uploadIndustryImages,
    uploadToImgBBMiddleware,
    optimizeUploadedImages,
    handleUploadErrors,
    upload
};