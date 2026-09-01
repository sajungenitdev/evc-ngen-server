// src/controllers/industry.controller.js
const Industry = require('../models/Industry');
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
// CREATE - Create a new industry with ImgBB
// ============================================
exports.createIndustry = async (req, res) => {
    try {
        console.log('📦 Creating industry with body:', req.body);
        console.log('🖼️ ImgBB URLs:', {
            imageUrl: req.imgbbImageUrl,
            caseStudyImage: req.imgbbCaseStudyImage
        });

        const {
            label,
            desc,
            icon,
            title,
            subtitle,
            overview,
            challenges,
            solutions,
            benefits,
            caseStudy,
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

        // Generate ID and slug from label
        const slug = label.toLowerCase().replace(/\s+/g, '-');
        const id = label.toLowerCase().replace(/\s+/g, '-');

        // Check if industry already exists
        const existingIndustry = await Industry.findOne({
            $or: [
                { id: id },
                { slug: slug },
                { label: { $regex: new RegExp(`^${label}$`, 'i') } }
            ]
        });

        if (existingIndustry) {
            return res.status(400).json({
                success: false,
                message: 'Industry with this ID, slug, or label already exists'
            });
        }

        // ✅ Parse JSON fields
        const parsedChallenges = parseJSONField(challenges, []);
        const parsedSolutions = parseJSONField(solutions, []);
        const parsedBenefits = parseJSONField(benefits, []);
        const parsedFeatures = parseJSONField(features, []);
        const parsedCaseStudy = parseJSONField(caseStudy, { title: '', description: '', imageUrl: '', link: '' });

        // ✅ Handle main image from ImgBB
        let mainImageUrl = '/images/industries/default.jpg';
        let mainImageDeleteUrl = null;
        if (req.imgbbImageUrl) {
            mainImageUrl = req.imgbbImageUrl;
            mainImageDeleteUrl = req.imgbbDeleteUrl;
        }

        // ✅ Handle case study image from ImgBB
        let caseStudyImageUrl = parsedCaseStudy.imageUrl || '';
        let caseStudyImageDeleteUrl = null;
        if (req.imgbbCaseStudyImage) {
            caseStudyImageUrl = req.imgbbCaseStudyImage;
            caseStudyImageDeleteUrl = req.imgbbCaseStudyDeleteUrl;
        }

        const updatedCaseStudy = {
            ...parsedCaseStudy,
            imageUrl: caseStudyImageUrl,
            imageDeleteUrl: caseStudyImageDeleteUrl
        };

        // ✅ Create industry with ImgBB URLs
        const industry = await Industry.create({
            id: id,
            label: label.trim(),
            slug: slug,
            desc: desc || '',
            icon: icon || '🏢',
            imageUrl: mainImageUrl,
            imageDeleteUrl: mainImageDeleteUrl,
            title: title.trim(),
            subtitle: subtitle || '',
            overview: overview,
            challenges: parsedChallenges || [],
            solutions: parsedSolutions || [],
            benefits: parsedBenefits || [],
            caseStudy: updatedCaseStudy,
            features: parsedFeatures || [],
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            message: 'Industry created successfully with ImgBB hosting',
            data: industry
        });
    } catch (error) {
        console.error('❌ Create industry error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ============================================
// READ - Get all industries
// ============================================
exports.getIndustries = async (req, res) => {
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

        const [total, industries] = await Promise.all([
            Industry.countDocuments(query),
            Industry.find(query)
                .select('-__v')
                .sort(search ? { score: { $meta: 'textScore' } } : { [sortBy]: sortDirection })
                .skip(skip)
                .limit(Number(limit))
                .lean()
        ]);

        res.json({
            success: true,
            data: industries,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit)
            }
        });
    } catch (error) {
        console.error('Get industries error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// READ - Get single industry
// ============================================
exports.getIndustry = async (req, res) => {
    try {
        const id = req.params.id;

        let industry = await Industry.findOne({ id: id });
        if (!industry) {
            industry = await Industry.findOne({ slug: id });
        }
        if (!industry && mongoose.Types.ObjectId.isValid(id)) {
            industry = await Industry.findById(id);
        }

        if (!industry) {
            return res.status(404).json({
                success: false,
                message: 'Industry not found'
            });
        }

        res.json({
            success: true,
            data: industry
        });
    } catch (error) {
        console.error('Get industry error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE - Update industry with ImgBB
// ============================================
exports.updateIndustry = async (req, res) => {
    try {
        const id = req.params.id;
        console.log('📦 Updating industry with body:', req.body);
        console.log('🖼️ ImgBB URLs:', {
            imageUrl: req.imgbbImageUrl,
            caseStudyImage: req.imgbbCaseStudyImage
        });

        let industry = await Industry.findOne({ id: id });
        if (!industry) {
            industry = await Industry.findOne({ slug: id });
        }
        if (!industry && mongoose.Types.ObjectId.isValid(id)) {
            industry = await Industry.findById(id);
        }

        if (!industry) {
            return res.status(404).json({
                success: false,
                message: 'Industry not found'
            });
        }

        const {
            label,
            desc,
            icon,
            title,
            subtitle,
            overview,
            challenges,
            solutions,
            benefits,
            caseStudy,
            features,
            isActive
        } = req.body;

        // ✅ Parse JSON fields
        const parsedChallenges = parseJSONField(challenges, industry.challenges || []);
        const parsedSolutions = parseJSONField(solutions, industry.solutions || []);
        const parsedBenefits = parseJSONField(benefits, industry.benefits || []);
        const parsedFeatures = parseJSONField(features, industry.features || []);
        const parsedCaseStudy = parseJSONField(caseStudy, industry.caseStudy || { title: '', description: '', imageUrl: '', link: '' });

        // ✅ Handle main image from ImgBB
        let mainImageUrl = industry.imageUrl;
        let mainImageDeleteUrl = industry.imageDeleteUrl;
        if (req.imgbbImageUrl) {
            // Delete old image from ImgBB
            if (industry.imageDeleteUrl) {
                await deleteImageFromImgBB(industry.imageDeleteUrl);
            }
            mainImageUrl = req.imgbbImageUrl;
            mainImageDeleteUrl = req.imgbbDeleteUrl;
        }

        // ✅ Handle case study image from ImgBB
        let caseStudyImageUrl = parsedCaseStudy.imageUrl || industry.caseStudy?.imageUrl || '';
        let caseStudyImageDeleteUrl = parsedCaseStudy.imageDeleteUrl || industry.caseStudy?.imageDeleteUrl || null;
        if (req.imgbbCaseStudyImage) {
            // Delete old case study image from ImgBB
            if (industry.caseStudy?.imageDeleteUrl) {
                await deleteImageFromImgBB(industry.caseStudy.imageDeleteUrl);
            }
            caseStudyImageUrl = req.imgbbCaseStudyImage;
            caseStudyImageDeleteUrl = req.imgbbCaseStudyDeleteUrl;
        }

        const updatedCaseStudy = {
            ...parsedCaseStudy,
            imageUrl: caseStudyImageUrl,
            imageDeleteUrl: caseStudyImageDeleteUrl
        };

        // ✅ Update industry
        const updatedData = {
            label: label || industry.label,
            slug: (label || industry.label).toLowerCase().replace(/\s+/g, '-'),
            desc: desc || industry.desc || '',
            icon: icon || industry.icon || '🏢',
            imageUrl: mainImageUrl,
            imageDeleteUrl: mainImageDeleteUrl,
            title: title || industry.title,
            subtitle: subtitle || industry.subtitle || '',
            overview: overview || industry.overview,
            challenges: parsedChallenges,
            solutions: parsedSolutions,
            benefits: parsedBenefits,
            caseStudy: updatedCaseStudy,
            features: parsedFeatures,
            isActive: isActive !== undefined ? isActive : industry.isActive
        };

        // Update ID if label changed
        if (label && label !== industry.label) {
            updatedData.id = label.toLowerCase().replace(/\s+/g, '-');
        }

        Object.assign(industry, updatedData);
        await industry.save();

        res.json({
            success: true,
            message: 'Industry updated successfully with ImgBB',
            data: industry
        });
    } catch (error) {
        console.error('❌ Update industry error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ============================================
// DELETE - Delete industry with ImgBB cleanup
// ============================================
exports.deleteIndustry = async (req, res) => {
    try {
        const id = req.params.id;

        let industry = await Industry.findOne({ id: id });
        if (!industry) {
            industry = await Industry.findOne({ slug: id });
        }
        if (!industry && mongoose.Types.ObjectId.isValid(id)) {
            industry = await Industry.findById(id);
        }

        if (!industry) {
            return res.status(404).json({
                success: false,
                message: 'Industry not found'
            });
        }

        // ✅ Delete main image from ImgBB
        if (industry.imageDeleteUrl) {
            await deleteImageFromImgBB(industry.imageDeleteUrl);
        }

        // ✅ Delete case study image from ImgBB
        if (industry.caseStudy && industry.caseStudy.imageDeleteUrl) {
            await deleteImageFromImgBB(industry.caseStudy.imageDeleteUrl);
        }

        await industry.deleteOne();

        res.json({
            success: true,
            message: 'Industry and its images deleted successfully from ImgBB'
        });
    } catch (error) {
        console.error('Delete industry error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// TOGGLE - Toggle industry status
// ============================================
exports.toggleIndustryStatus = async (req, res) => {
    try {
        const id = req.params.id;

        let industry = await Industry.findOne({ id: id });
        if (!industry) {
            industry = await Industry.findOne({ slug: id });
        }
        if (!industry && mongoose.Types.ObjectId.isValid(id)) {
            industry = await Industry.findById(id);
        }

        if (!industry) {
            return res.status(404).json({
                success: false,
                message: 'Industry not found'
            });
        }

        industry.isActive = !industry.isActive;
        await industry.save();

        res.json({
            success: true,
            message: `Industry ${industry.isActive ? 'activated' : 'deactivated'} successfully`,
            data: industry
        });
    } catch (error) {
        console.error('Toggle industry status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// BULK - Delete multiple industries
// ============================================
exports.deleteMultipleIndustries = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of industry IDs'
            });
        }

        // ✅ Find all industries first to delete their images
        const industries = await Industry.find({
            $or: [
                { id: { $in: ids } },
                { slug: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        // ✅ Delete all images from ImgBB
        for (const industry of industries) {
            if (industry.imageDeleteUrl) {
                await deleteImageFromImgBB(industry.imageDeleteUrl);
            }
            if (industry.caseStudy && industry.caseStudy.imageDeleteUrl) {
                await deleteImageFromImgBB(industry.caseStudy.imageDeleteUrl);
            }
        }

        const result = await Industry.deleteMany({
            $or: [
                { id: { $in: ids } },
                { slug: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        res.json({
            success: true,
            message: `${result.deletedCount} industries and their images deleted successfully from ImgBB`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Delete multiple industries error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};