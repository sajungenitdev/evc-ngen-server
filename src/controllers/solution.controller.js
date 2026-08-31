// src/controllers/solution.controller.js
const Solution = require('../models/Solution');
const mongoose = require('mongoose');

// ============================================
// HELPER: Parse JSON fields
// ============================================
const parseJSONField = (field, defaultValue = null) => {
    if (!field) return defaultValue;
    try {
        if (typeof field === 'string') {
            // Handle empty strings
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
// CREATE - Create a new solution
// ============================================
// src/controllers/solution.controller.js - Updated createSolution

// ============================================
// CREATE - Create a new solution
// ============================================
exports.createSolution = async (req, res) => {
    try {
        console.log('📦 Creating solution with body:', req.body);
        console.log('📸 Files uploaded:', req.files);

        const {
            label,
            title,
            overview,
            id,
            link,
            desc,
            imageUrl,
            subtitle,
            section1,
            section2,
            section3,
            section4,
            features,
            isActive
        } = req.body;

        // ✅ Validate required fields
        if (!label || label.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Label is required'
            });
        }
        if (!title || title.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }
        if (!overview || overview.trim() === '' || overview === '<p></p>') {
            return res.status(400).json({
                success: false,
                message: 'Overview is required'
            });
        }

        // Generate ID from label if not provided
        const solutionId = id || label.toLowerCase().replace(/\s+/g, '-');

        // Check if solution already exists
        const existingSolution = await Solution.findOne({
            $or: [
                { id: solutionId },
                { label: { $regex: new RegExp(`^${label}$`, 'i') } }
            ]
        });

        if (existingSolution) {
            return res.status(400).json({
                success: false,
                message: 'Solution with this ID or label already exists'
            });
        }

        // ✅ Parse JSON fields with proper defaults
        let parsedSection1 = parseJSONField(section1, { tabs: [] });
        let parsedSection2 = parseJSONField(section2, { title: '', imageUrl: '', useCases: [] });
        let parsedSection3 = parseJSONField(section3, { badge: '', title: '', cards: [] });
        let parsedSection4 = parseJSONField(section4, { heading: '', subtext: '', buttonText: '', buttonLink: '/contact' });
        const parsedFeatures = parseJSONField(features, []);

        // ✅ Handle main image upload
        let mainImageUrl = imageUrl || '/images/help/EV Charging_1.jpg';
        if (req.files && req.files['image'] && req.files['image'].length > 0) {
            mainImageUrl = `/uploads/products/${req.files['image'][0].filename}`;
        }

        // ✅ Handle section2 image upload
        if (req.files && req.files['section2Image'] && req.files['section2Image'].length > 0) {
            parsedSection2.imageUrl = `/uploads/products/${req.files['section2Image'][0].filename}`;
        }

        // ✅ Handle tab image uploads
        if (req.files) {
            // Get all tab image files
            const tabImageKeys = Object.keys(req.files).filter(key => key.startsWith('tabImage_'));

            for (const key of tabImageKeys) {
                const index = parseInt(key.replace('tabImage_', ''));
                const file = req.files[key][0];

                if (parsedSection1.tabs && parsedSection1.tabs[index]) {
                    parsedSection1.tabs[index].imageUrl = `/uploads/products/${file.filename}`;
                }
            }
        }

        // ✅ Create solution
        const solution = await Solution.create({
            id: solutionId,
            label: label.trim(),
            link: link || `/solutions/${solutionId}`,
            desc: desc || '',
            imageUrl: mainImageUrl,
            title: title.trim(),
            subtitle: subtitle || '',
            overview: overview,
            section1: parsedSection1,
            section2: parsedSection2,
            section3: parsedSection3,
            section4: parsedSection4,
            features: parsedFeatures || [],
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            message: 'Solution created successfully',
            data: solution
        });
    } catch (error) {
        console.error('❌ Create solution error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ============================================
// READ - Get all solutions
// ============================================
exports.getSolutions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            isActive,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$text = { $search: search };
        }

        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        const [total, solutions] = await Promise.all([
            Solution.countDocuments(query),
            Solution.find(query)
                .select('-__v')
                .sort(search ? { score: { $meta: 'textScore' } } : { [sortBy]: sortDirection })
                .skip(skip)
                .limit(Number(limit))
                .lean()
        ]);

        res.json({
            success: true,
            data: solutions,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit)
            }
        });
    } catch (error) {
        console.error('Get solutions error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// READ - Get single solution
// ============================================
exports.getSolution = async (req, res) => {
    try {
        const id = req.params.id;

        // Try to find by id field first, then by _id
        let solution = await Solution.findOne({ id: id });

        if (!solution && mongoose.Types.ObjectId.isValid(id)) {
            solution = await Solution.findById(id);
        }

        if (!solution) {
            return res.status(404).json({
                success: false,
                message: 'Solution not found'
            });
        }

        res.json({
            success: true,
            data: solution
        });
    } catch (error) {
        console.error('Get solution error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// READ - Get solution by ID (alias)
// ============================================
exports.getSolutionById = async (req, res) => {
    try {
        const { id } = req.params;
        const solution = await Solution.findOne({ id: id });

        if (!solution) {
            return res.status(404).json({
                success: false,
                message: 'Solution not found'
            });
        }

        res.json({
            success: true,
            data: solution
        });
    } catch (error) {
        console.error('Get solution by ID error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// READ - Get solutions by category
// ============================================
exports.getSolutionsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        let query = { isActive: true };

        if (categoryId !== 'all') {
            query.id = categoryId;
        }

        const solutions = await Solution.find(query)
            .select('-__v')
            .lean();

        res.json({
            success: true,
            data: solutions,
            count: solutions.length
        });
    } catch (error) {
        console.error('Get solutions by category error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// READ - Get related solutions
// ============================================
exports.getRelatedSolutions = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 3 } = req.query;

        const current = await Solution.findOne({ id: id });
        if (!current) {
            return res.status(404).json({
                success: false,
                message: 'Solution not found'
            });
        }

        const solutions = await Solution.find({
            id: { $ne: id },
            isActive: true
        })
            .limit(Number(limit))
            .lean();

        res.json({
            success: true,
            data: solutions,
            count: solutions.length
        });
    } catch (error) {
        console.error('Get related solutions error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE - Update solution
// ============================================
exports.updateSolution = async (req, res) => {
    try {
        const id = req.params.id;
        console.log('📦 Updating solution with body:', req.body);
        console.log('📸 File uploaded:', req.file);

        let solution = await Solution.findOne({ id: id });
        if (!solution && mongoose.Types.ObjectId.isValid(id)) {
            solution = await Solution.findById(id);
        }

        if (!solution) {
            return res.status(404).json({
                success: false,
                message: 'Solution not found'
            });
        }

        const {
            label,
            title,
            overview,
            link,
            desc,
            imageUrl,
            subtitle,
            section1,
            section2,
            section3,
            section4,
            features,
            isActive
        } = req.body;

        // ✅ Parse JSON fields with fallback to existing values
        const parsedSection1 = parseJSONField(section1, solution.section1 || { tabs: [] });
        const parsedSection2 = parseJSONField(section2, solution.section2 || { title: '', imageUrl: '', useCases: [] });
        const parsedSection3 = parseJSONField(section3, solution.section3 || { badge: '', title: '', cards: [] });
        const parsedSection4 = parseJSONField(section4, solution.section4 || { heading: '', subtext: '', buttonText: '', buttonLink: '/contact' });
        const parsedFeatures = parseJSONField(features, solution.features || []);

        // ✅ Handle image upload
        let mainImageUrl = imageUrl || solution.imageUrl;
        if (req.file) {
            // Delete old image if exists
            if (solution.imageUrl && !solution.imageUrl.includes('default') && !solution.imageUrl.includes('EV Charging_1.jpg')) {
                // Optional: Delete file from filesystem
            }
            mainImageUrl = `/uploads/products/${req.file.filename}`;
        }

        // ✅ Update solution with proper fallbacks
        const updatedData = {
            label: label || solution.label,
            link: link || solution.link,
            desc: desc || solution.desc || '',
            imageUrl: mainImageUrl,
            title: title || solution.title,
            subtitle: subtitle || solution.subtitle || '',
            overview: overview || solution.overview,
            section1: parsedSection1,
            section2: parsedSection2,
            section3: parsedSection3,
            section4: parsedSection4,
            features: parsedFeatures || [],
            isActive: isActive !== undefined ? isActive : solution.isActive
        };

        // Update ID if label changed
        if (label && label !== solution.label) {
            updatedData.id = label.toLowerCase().replace(/\s+/g, '-');
            updatedData.link = `/solutions/${updatedData.id}`;
        }

        Object.assign(solution, updatedData);
        await solution.save();

        res.json({
            success: true,
            message: 'Solution updated successfully',
            data: solution
        });
    } catch (error) {
        console.error('❌ Update solution error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ============================================
// DELETE - Delete solution
// ============================================
exports.deleteSolution = async (req, res) => {
    try {
        const id = req.params.id;

        let solution = await Solution.findOne({ id: id });
        if (!solution && mongoose.Types.ObjectId.isValid(id)) {
            solution = await Solution.findById(id);
        }

        if (!solution) {
            return res.status(404).json({
                success: false,
                message: 'Solution not found'
            });
        }

        await solution.deleteOne();

        res.json({
            success: true,
            message: 'Solution deleted successfully'
        });
    } catch (error) {
        console.error('Delete solution error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// TOGGLE - Toggle solution status
// ============================================
exports.toggleSolutionStatus = async (req, res) => {
    try {
        const id = req.params.id;

        let solution = await Solution.findOne({ id: id });
        if (!solution && mongoose.Types.ObjectId.isValid(id)) {
            solution = await Solution.findById(id);
        }

        if (!solution) {
            return res.status(404).json({
                success: false,
                message: 'Solution not found'
            });
        }

        solution.isActive = !solution.isActive;
        await solution.save();

        res.json({
            success: true,
            message: `Solution ${solution.isActive ? 'activated' : 'deactivated'} successfully`,
            data: solution
        });
    } catch (error) {
        console.error('Toggle solution status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// BULK - Delete multiple solutions
// ============================================
exports.deleteMultipleSolutions = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of solution IDs'
            });
        }

        const result = await Solution.deleteMany({
            $or: [
                { id: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        res.json({
            success: true,
            message: `${result.deletedCount} solutions deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Delete multiple solutions error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};