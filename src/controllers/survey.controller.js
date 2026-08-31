// src/controllers/survey.controller.js
const Survey = require('../models/Survey');

// ============================================
// CREATE - Create a new survey or call request
// ============================================
// @desc    Create a new survey or consultation call request
// @route   POST /api/surveys
// @access  Public
exports.createSurvey = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            company,
            address,
            chargersCount,
            preferredDate,
            preferredTime,
            details,
            requestType, // 'survey' or 'call'
            callPurpose,
            callDuration,
        } = req.body;

        // Validate required fields
        if (!name || !phone || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name, phone, and email are required',
            });
        }

        // Validate request type
        if (!requestType || !['survey', 'call'].includes(requestType)) {
            return res.status(400).json({
                success: false,
                message: 'Request type must be either "survey" or "call"',
            });
        }

        // Check if request already exists with same email and pending status
        const existingRequest = await Survey.findOne({
            email,
            status: { $in: ['pending', 'contacted'] },
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: `You already have a pending ${existingRequest.requestType} request. We will contact you soon.`,
                data: existingRequest,
            });
        }

        // Build survey data based on request type
        const surveyData = {
            name,
            phone,
            email,
            company: company || '',
            address: requestType === 'survey' ? (address || '') : '',
            chargersCount: chargersCount || '1–2',
            preferredDate: preferredDate ? new Date(preferredDate) : null,
            preferredTime: preferredTime || 'any',
            details: details || '',
            requestType,
            status: 'pending',
            isActive: true,
        };

        // Add call-specific fields
        if (requestType === 'call') {
            surveyData.callPurpose = callPurpose || '';
            surveyData.callDuration = callDuration || '30min';
        }

        // Create survey
        const survey = await Survey.create(surveyData);

        // Custom success message
        const successMessage = requestType === 'survey'
            ? 'Site survey request submitted successfully! We will contact you within 24 hours.'
            : 'Consultation call request submitted successfully! We will call you at your preferred time.';

        res.status(201).json({
            success: true,
            message: successMessage,
            data: survey,
        });
    } catch (error) {
        console.error('Create survey error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get all surveys
// ============================================
// @desc    Get all surveys with filters
// @route   GET /api/surveys
// @access  Private/Admin
exports.getSurveys = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            status,
            requestType, // 'survey' or 'call'
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const query = {};
        if (status) query.status = status;
        if (requestType) query.requestType = requestType;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const surveys = await Survey.find(query)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit));

        const total = await Survey.countDocuments(query);

        // Get stats
        const stats = {
            total: await Survey.countDocuments({}),
            pending: await Survey.countDocuments({ status: 'pending' }),
            contacted: await Survey.countDocuments({ status: 'contacted' }),
            scheduled: await Survey.countDocuments({ status: 'scheduled' }),
            completed: await Survey.countDocuments({ status: 'completed' }),
            cancelled: await Survey.countDocuments({ status: 'cancelled' }),
            survey: await Survey.countDocuments({ requestType: 'survey' }),
            call: await Survey.countDocuments({ requestType: 'call' }),
        };

        res.json({
            success: true,
            data: surveys,
            stats,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit),
            },
        });
    } catch (error) {
        console.error('Get surveys error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get single survey
// ============================================
// @desc    Get single survey
// @route   GET /api/surveys/:id
// @access  Private/Admin
exports.getSurvey = async (req, res) => {
    try {
        const id = req.params.id;

        let survey = await Survey.findOne({ id: id });
        if (!survey) {
            survey = await Survey.findById(id);
        }

        if (!survey) {
            return res.status(404).json({
                success: false,
                message: 'Request not found',
            });
        }

        res.json({
            success: true,
            data: survey,
        });
    } catch (error) {
        console.error('Get survey error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// UPDATE - Update survey
// ============================================
// @desc    Update survey
// @route   PUT /api/surveys/:id
// @access  Private/Admin
exports.updateSurvey = async (req, res) => {
    try {
        const id = req.params.id;
        const {
            name,
            phone,
            email,
            company,
            address,
            chargersCount,
            preferredDate,
            preferredTime,
            details,
            requestType,
            status,
            callPurpose,
            callDuration,
            assignedTo,
            notes,
            isActive,
        } = req.body;

        let survey = await Survey.findOne({ id: id });
        if (!survey) {
            survey = await Survey.findById(id);
        }

        if (!survey) {
            return res.status(404).json({
                success: false,
                message: 'Request not found',
            });
        }

        // Update fields
        if (name) survey.name = name;
        if (phone) survey.phone = phone;
        if (email) survey.email = email;
        if (company !== undefined) survey.company = company;
        if (address !== undefined) survey.address = address;
        if (chargersCount) survey.chargersCount = chargersCount;
        if (preferredDate) survey.preferredDate = new Date(preferredDate);
        if (preferredTime) survey.preferredTime = preferredTime;
        if (details !== undefined) survey.details = details;
        if (requestType && ['survey', 'call'].includes(requestType)) survey.requestType = requestType;
        if (status) survey.status = status;
        if (callPurpose !== undefined) survey.callPurpose = callPurpose;
        if (callDuration) survey.callDuration = callDuration;
        if (assignedTo !== undefined) survey.assignedTo = assignedTo;
        if (notes !== undefined) survey.notes = notes;
        if (isActive !== undefined) survey.isActive = isActive;

        await survey.save();

        res.json({
            success: true,
            message: 'Request updated successfully',
            data: survey,
        });
    } catch (error) {
        console.error('Update survey error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// DELETE - Delete survey
// ============================================
// @desc    Delete survey
// @route   DELETE /api/surveys/:id
// @access  Private/Admin
exports.deleteSurvey = async (req, res) => {
    try {
        const id = req.params.id;

        let survey = await Survey.findOne({ id: id });
        if (!survey) {
            survey = await Survey.findById(id);
        }

        if (!survey) {
            return res.status(404).json({
                success: false,
                message: 'Request not found',
            });
        }

        await survey.deleteOne();

        res.json({
            success: true,
            message: 'Request deleted successfully',
        });
    } catch (error) {
        console.error('Delete survey error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// UPDATE - Update survey status
// ============================================
// @desc    Update survey status
// @route   PUT /api/surveys/:id/status
// @access  Private/Admin
exports.updateSurveyStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status, notes } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required',
            });
        }

        const validStatuses = ['pending', 'contacted', 'scheduled', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
        }

        let survey = await Survey.findOne({ id: id });
        if (!survey) {
            survey = await Survey.findById(id);
        }

        if (!survey) {
            return res.status(404).json({
                success: false,
                message: 'Request not found',
            });
        }

        survey.status = status;
        if (notes !== undefined) survey.notes = notes;
        await survey.save();

        res.json({
            success: true,
            message: `Request status updated to ${status}`,
            data: survey,
        });
    } catch (error) {
        console.error('Update survey status error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// BULK - Delete multiple surveys
// ============================================
// @desc    Delete multiple surveys
// @route   DELETE /api/surveys/bulk
// @access  Private/Admin
exports.deleteMultipleSurveys = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of request IDs',
            });
        }

        const result = await Survey.deleteMany({
            $or: [
                { id: { $in: ids } },
                { _id: { $in: ids } }
            ]
        });

        res.json({
            success: true,
            message: `${result.deletedCount} requests deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('Delete multiple surveys error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};