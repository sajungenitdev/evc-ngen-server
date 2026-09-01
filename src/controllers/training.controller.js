// src/controllers/training.controller.js
const Training = require('../models/Training');
const mongoose = require('mongoose');

// ============================================
// HELPER: Parse JSON fields
// ============================================
const parseJSONField = (field, defaultValue = null) => {
    if (!field) return defaultValue;
    try {
        if (typeof field === 'string') {
            if (field === '' || field === 'null' || field === 'undefined') {
                return defaultValue;
            }
            return JSON.parse(field);
        }
        return field;
    } catch (e) {
        console.error('❌ Failed to parse JSON field:', field, e.message);
        return defaultValue;
    }
};

// ============================================
// CREATE - Create a new training program
// ============================================
exports.createTraining = async (req, res) => {
    try {
        console.log('📦 Creating training with body:', req.body);
        console.log('📸 Files uploaded:', req.files);

        const {
            title,
            categoryId, // ✅ ADD THIS
            badge,
            description,
            details,
            duration,
            format,
            link,
            color,
            icon,
            features,
            price,
            schedule,
            prerequisites,
            actionText,
            isActive
        } = req.body;

        // ✅ Validate required fields
        if (!title || title.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        // Generate ID from title
        const id = title.toLowerCase().replace(/\s+/g, '-');

        // Check if training already exists
        const existingTraining = await Training.findOne({
            $or: [
                { id: id },
                { title: { $regex: new RegExp(`^${title}$`, 'i') } }
            ]
        });

        if (existingTraining) {
            return res.status(400).json({
                success: false,
                message: 'Training with this ID or title already exists'
            });
        }

        // ✅ Parse JSON fields
        const parsedFeatures = parseJSONField(features, []);
        const parsedPrerequisites = parseJSONField(prerequisites, []);

        // ✅ Handle image upload
        let mainImageUrl = '/images/training/default.jpg';
        if (req.files && req.files['image'] && req.files['image'].length > 0) {
            mainImageUrl = `/uploads/products/${req.files['image'][0].filename}`;
        }

        // ✅ Create training - ADD categoryId
        const training = await Training.create({
            id: id,
            title: title.trim(),
            categoryId: categoryId || '', // ✅ ADD THIS
            badge: badge || '',
            description: description || '',
            details: details || '',
            duration: duration || '',
            format: format || '',
            imageUrl: mainImageUrl,
            link: link || `/training/${id}`,
            color: color || '#0c1f38',
            icon: icon || '📋',
            features: parsedFeatures || [],
            price: price || '',
            schedule: schedule || '',
            prerequisites: parsedPrerequisites || [],
            actionText: actionText || 'Learn More →',
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            message: 'Training program created successfully',
            data: training
        });
    } catch (error) {
        console.error('❌ Create training error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};


// ============================================
// READ - Get all training programs
// ============================================
exports.getTrainings = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            isActive,
            categoryId,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (categoryId) query.categoryId = categoryId;
        if (search) {
            query.$text = { $search: search };
        }

        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        const [total, trainings] = await Promise.all([
            Training.countDocuments(query),
            Training.find(query)
                .select('-__v')
                .sort(search ? { score: { $meta: 'textScore' } } : { [sortBy]: sortDirection })
                .skip(skip)
                .limit(Number(limit))
                .lean()
        ]);

        res.json({
            success: true,
            data: trainings,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit)
            }
        });
    } catch (error) {
        console.error('Get trainings error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// READ - Get single training program
// ============================================
exports.getTraining = async (req, res) => {
    try {
        const id = req.params.id;

        let training = await Training.findOne({ id: id });
        if (!training && mongoose.Types.ObjectId.isValid(id)) {
            training = await Training.findById(id);
        }

        if (!training) {
            return res.status(404).json({
                success: false,
                message: 'Training program not found'
            });
        }

        res.json({
            success: true,
            data: training
        });
    } catch (error) {
        console.error('Get training error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE - Update training program
// ============================================
exports.updateTraining = async (req, res) => {
    try {
        const id = req.params.id;
        console.log('📦 Updating training with body:', req.body);
        console.log('🖼️ ImgBB URLs:', {
            imageUrl: req.imgbbImageUrl
        });

        let training = await Training.findOne({ id: id });
        if (!training && mongoose.Types.ObjectId.isValid(id)) {
            training = await Training.findById(id);
        }

        if (!training) {
            return res.status(404).json({
                success: false,
                message: 'Training program not found'
            });
        }

        const {
            title,
            categoryId,
            badge,
            description,
            details,
            duration,
            format,
            link,
            color,
            icon,
            features,
            price,
            schedule,
            prerequisites,
            actionText,
            isActive
        } = req.body;

        // ✅ Parse JSON fields
        const parsedFeatures = parseJSONField(features, training.features || []);
        const parsedPrerequisites = parseJSONField(prerequisites, training.prerequisites || []);

        // ✅ Handle image from ImgBB (NOT local path)
        let mainImageUrl = training.imageUrl;
        let mainImageDeleteUrl = training.imageDeleteUrl;
        if (req.imgbbImageUrl) {
            // Delete old image from ImgBB
            if (training.imageDeleteUrl) {
                await deleteImageFromImgBB(training.imageDeleteUrl);
            }
            mainImageUrl = req.imgbbImageUrl;
            mainImageDeleteUrl = req.imgbbDeleteUrl;
        }

        // ✅ Update training
        const updatedData = {
            title: title || training.title,
            categoryId: categoryId !== undefined ? categoryId : training.categoryId,
            badge: badge !== undefined ? badge : training.badge,
            description: description !== undefined ? description : training.description,
            details: details !== undefined ? details : training.details,
            duration: duration !== undefined ? duration : training.duration,
            format: format !== undefined ? format : training.format,
            imageUrl: mainImageUrl,
            imageDeleteUrl: mainImageDeleteUrl,  // ✅ Save delete URL
            link: link || training.link,
            color: color || training.color,
            icon: icon || training.icon,
            features: parsedFeatures,
            price: price !== undefined ? price : training.price,
            schedule: schedule !== undefined ? schedule : training.schedule,
            prerequisites: parsedPrerequisites,
            actionText: actionText !== undefined ? actionText : training.actionText,
            isActive: isActive !== undefined ? isActive : training.isActive
        };

        // Update ID if title changed
        if (title && title !== training.title) {
            updatedData.id = title.toLowerCase().replace(/\s+/g, '-');
            updatedData.link = `/training/${updatedData.id}`;
        }

        Object.assign(training, updatedData);
        await training.save();

        res.json({
            success: true,
            message: 'Training program updated successfully with ImgBB',
            data: training
        });
    } catch (error) {
        console.error('❌ Update training error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ============================================
// DELETE - Delete training program
// ============================================
exports.deleteTraining = async (req, res) => {
    try {
        const id = req.params.id;

        let training = await Training.findOne({ id: id });
        if (!training && mongoose.Types.ObjectId.isValid(id)) {
            training = await Training.findById(id);
        }

        if (!training) {
            return res.status(404).json({
                success: false,
                message: 'Training program not found'
            });
        }

        await training.deleteOne();

        res.json({
            success: true,
            message: 'Training program deleted successfully'
        });
    } catch (error) {
        console.error('Delete training error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// TOGGLE - Toggle training status
// ============================================
exports.toggleTrainingStatus = async (req, res) => {
    try {
        const id = req.params.id;

        let training = await Training.findOne({ id: id });
        if (!training && mongoose.Types.ObjectId.isValid(id)) {
            training = await Training.findById(id);
        }

        if (!training) {
            return res.status(404).json({
                success: false,
                message: 'Training program not found'
            });
        }

        training.isActive = !training.isActive;
        await training.save();

        res.json({
            success: true,
            message: `Training program ${training.isActive ? 'activated' : 'deactivated'} successfully`,
            data: training
        });
    } catch (error) {
        console.error('Toggle training status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// BULK - Delete multiple trainings
// ============================================
exports.deleteMultipleTrainings = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of training IDs'
            });
        }

        const result = await Training.deleteMany({
            $or: [
                { id: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        res.json({
            success: true,
            message: `${result.deletedCount} training programs deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Delete multiple trainings error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};