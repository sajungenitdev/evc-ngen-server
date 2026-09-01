// src/controllers/solution.controller.js
const Solution = require('../models/Solution');
const mongoose = require('mongoose');
const { deleteFromImgBB } = require('../services/imgbb.service');

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
// HELPER: Delete image from ImgBB
// ============================================
const deleteImageFromImgBB = async (deleteUrl) => {
    if (!deleteUrl) return;
    try {
        await deleteFromImgBB(deleteUrl);
        console.log(`✅ Deleted image from ImgBB: ${deleteUrl}`);
    } catch (error) {
        console.error(`❌ Failed to delete image from ImgBB:`, error);
    }
};

// ============================================
// CREATE - Create a new solution with ImgBB
// ============================================
exports.createSolution = async (req, res) => {
    try {
        console.log('📦 Creating solution with body:', req.body);
        console.log('🖼️ ImgBB URLs:', {
            imageUrl: req.imgbbImageUrl,
            section2Image: req.imgbbSection2Image,
            tabImages: req.imgbbTabImages
        });

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

        // ✅ Handle main image from ImgBB
        let mainImageUrl = imageUrl || '/images/help/EV Charging_1.jpg';
        let mainImageDeleteUrl = null;
        if (req.imgbbImageUrl) {
            mainImageUrl = req.imgbbImageUrl;
            mainImageDeleteUrl = req.imgbbDeleteUrl;
        }

        // ✅ Handle section2 image from ImgBB
        let section2ImageDeleteUrl = null;
        if (req.imgbbSection2Image) {
            parsedSection2.imageUrl = req.imgbbSection2Image;
            section2ImageDeleteUrl = req.imgbbSection2DeleteUrl;
        }

        // ✅ Handle tab images from ImgBB
        if (req.imgbbTabImages && req.imgbbTabImages.length > 0) {
            if (parsedSection1.tabs && parsedSection1.tabs.length > 0) {
                for (let i = 0; i < req.imgbbTabImages.length; i++) {
                    if (parsedSection1.tabs[i]) {
                        parsedSection1.tabs[i].imageUrl = req.imgbbTabImages[i];
                        parsedSection1.tabs[i].imageDeleteUrl = req.imgbbTabDeleteUrls?.[i] || null;
                    }
                }
            }
        }

        // ✅ Create solution with ImgBB URLs
        const solution = await Solution.create({
            id: solutionId,
            label: label.trim(),
            link: link || `/solutions/${solutionId}`,
            desc: desc || '',
            imageUrl: mainImageUrl,
            imageDeleteUrl: mainImageDeleteUrl,
            title: title.trim(),
            subtitle: subtitle || '',
            overview: overview,
            section1: parsedSection1,
            section2: parsedSection2,
            section2ImageDeleteUrl: section2ImageDeleteUrl,
            section3: parsedSection3,
            section4: parsedSection4,
            features: parsedFeatures || [],
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            message: 'Solution created successfully with ImgBB hosting',
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
// UPDATE - Update solution with ImgBB
// ============================================
exports.updateSolution = async (req, res) => {
    try {
        const id = req.params.id;
        console.log('📦 Updating solution with body:', req.body);
        console.log('🖼️ ImgBB URLs:', {
            imageUrl: req.imgbbImageUrl,
            section2Image: req.imgbbSection2Image,
            tabImages: req.imgbbTabImages
        });

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
        let parsedSection1 = parseJSONField(section1, solution.section1 || { tabs: [] });
        let parsedSection2 = parseJSONField(section2, solution.section2 || { title: '', imageUrl: '', useCases: [] });
        let parsedSection3 = parseJSONField(section3, solution.section3 || { badge: '', title: '', cards: [] });
        let parsedSection4 = parseJSONField(section4, solution.section4 || { heading: '', subtext: '', buttonText: '', buttonLink: '/contact' });
        const parsedFeatures = parseJSONField(features, solution.features || []);

        // ✅ Handle main image from ImgBB
        let mainImageUrl = imageUrl || solution.imageUrl;
        let mainImageDeleteUrl = solution.imageDeleteUrl;
        if (req.imgbbImageUrl) {
            // Delete old image from ImgBB
            if (solution.imageDeleteUrl) {
                await deleteImageFromImgBB(solution.imageDeleteUrl);
            }
            mainImageUrl = req.imgbbImageUrl;
            mainImageDeleteUrl = req.imgbbDeleteUrl;
        }

        // ✅ Handle section2 image from ImgBB
        if (req.imgbbSection2Image) {
            // Delete old section2 image from ImgBB
            if (solution.section2ImageDeleteUrl) {
                await deleteImageFromImgBB(solution.section2ImageDeleteUrl);
            }
            parsedSection2.imageUrl = req.imgbbSection2Image;
            solution.section2ImageDeleteUrl = req.imgbbSection2DeleteUrl;
        }

        // ✅ Handle tab images from ImgBB
        if (req.imgbbTabImages && req.imgbbTabImages.length > 0) {
            // Delete old tab images from ImgBB
            if (solution.section1 && solution.section1.tabs) {
                for (const tab of solution.section1.tabs) {
                    if (tab.imageDeleteUrl) {
                        await deleteImageFromImgBB(tab.imageDeleteUrl);
                    }
                }
            }

            if (parsedSection1.tabs && parsedSection1.tabs.length > 0) {
                for (let i = 0; i < req.imgbbTabImages.length; i++) {
                    if (parsedSection1.tabs[i]) {
                        parsedSection1.tabs[i].imageUrl = req.imgbbTabImages[i];
                        parsedSection1.tabs[i].imageDeleteUrl = req.imgbbTabDeleteUrls?.[i] || null;
                    }
                }
            }
        }

        // ✅ Update solution with proper fallbacks
        const updatedData = {
            label: label || solution.label,
            link: link || solution.link,
            desc: desc || solution.desc || '',
            imageUrl: mainImageUrl,
            imageDeleteUrl: mainImageDeleteUrl,
            title: title || solution.title,
            subtitle: subtitle || solution.subtitle || '',
            overview: overview || solution.overview,
            section1: parsedSection1,
            section2: parsedSection2,
            section3: parsedSection3 || solution.section3,
            section4: parsedSection4 || solution.section4,
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
            message: 'Solution updated successfully with ImgBB',
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
// DELETE - Delete solution with ImgBB cleanup
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

        // ✅ Delete main image from ImgBB
        if (solution.imageDeleteUrl) {
            await deleteImageFromImgBB(solution.imageDeleteUrl);
        }

        // ✅ Delete section2 image from ImgBB
        if (solution.section2ImageDeleteUrl) {
            await deleteImageFromImgBB(solution.section2ImageDeleteUrl);
        }

        // ✅ Delete tab images from ImgBB
        if (solution.section1 && solution.section1.tabs) {
            for (const tab of solution.section1.tabs) {
                if (tab.imageDeleteUrl) {
                    await deleteImageFromImgBB(tab.imageDeleteUrl);
                }
            }
        }

        await solution.deleteOne();

        res.json({
            success: true,
            message: 'Solution and its images deleted successfully from ImgBB'
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

        // ✅ Find all solutions first to delete their images
        const solutions = await Solution.find({
            $or: [
                { id: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        // ✅ Delete all images from ImgBB
        for (const solution of solutions) {
            if (solution.imageDeleteUrl) {
                await deleteImageFromImgBB(solution.imageDeleteUrl);
            }
            if (solution.section2ImageDeleteUrl) {
                await deleteImageFromImgBB(solution.section2ImageDeleteUrl);
            }
            if (solution.section1 && solution.section1.tabs) {
                for (const tab of solution.section1.tabs) {
                    if (tab.imageDeleteUrl) {
                        await deleteImageFromImgBB(tab.imageDeleteUrl);
                    }
                }
            }
        }

        const result = await Solution.deleteMany({
            $or: [
                { id: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        res.json({
            success: true,
            message: `${result.deletedCount} solutions and their images deleted successfully from ImgBB`,
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