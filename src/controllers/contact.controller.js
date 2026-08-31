// src/controllers/contact.controller.js
const Contact = require('../models/Contact');

// ============================================
// CREATE - Create a new contact inquiry
// ============================================
// @desc    Create a new contact inquiry
// @route   POST /api/contacts
// @access  Public
exports.createContact = async (req, res) => {
    try {
        const {
            name,
            email,
            company,
            interest,
            message,
        } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required',
            });
        }

        // Check if contact already exists with same email and pending status
        const existingContact = await Contact.findOne({
            email,
            status: { $in: ['pending', 'contacted'] },
        });

        if (existingContact) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending inquiry. We will contact you soon.',
                data: existingContact,
            });
        }

        // Create contact
        const contact = await Contact.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            company: company || '',
            interest: interest || 'Basic EV Charger',
            message: message.trim(),
            status: 'pending',
            isActive: true,
        });

        res.status(201).json({
            success: true,
            message: 'Inquiry submitted successfully! We will contact you soon.',
            data: contact,
        });
    } catch (error) {
        console.error('Create contact error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get all contacts
// ============================================
// @desc    Get all contacts with filters
// @route   GET /api/contacts
// @access  Private/Admin
exports.getContacts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            status,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const query = {};
        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const contacts = await Contact.find(query)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit));

        const total = await Contact.countDocuments(query);

        // Get stats
        const stats = {
            total: await Contact.countDocuments({}),
            pending: await Contact.countDocuments({ status: 'pending' }),
            contacted: await Contact.countDocuments({ status: 'contacted' }),
            resolved: await Contact.countDocuments({ status: 'resolved' }),
            cancelled: await Contact.countDocuments({ status: 'cancelled' }),
        };

        res.json({
            success: true,
            data: contacts,
            stats,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit),
            },
        });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// READ - Get single contact
// ============================================
// @desc    Get single contact
// @route   GET /api/contacts/:id
// @access  Private/Admin
exports.getContact = async (req, res) => {
    try {
        const id = req.params.id;

        let contact = await Contact.findOne({ id: id });
        if (!contact) {
            contact = await Contact.findById(id);
        }

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found',
            });
        }

        res.json({
            success: true,
            data: contact,
        });
    } catch (error) {
        console.error('Get contact error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// UPDATE - Update contact
// ============================================
// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private/Admin
exports.updateContact = async (req, res) => {
    try {
        const id = req.params.id;
        const {
            name,
            email,
            company,
            interest,
            message,
            status,
            assignedTo,
            notes,
            isActive,
        } = req.body;

        let contact = await Contact.findOne({ id: id });
        if (!contact) {
            contact = await Contact.findById(id);
        }

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found',
            });
        }

        // Update fields
        if (name) contact.name = name;
        if (email) contact.email = email;
        if (company !== undefined) contact.company = company;
        if (interest) contact.interest = interest;
        if (message) contact.message = message;
        if (status) contact.status = status;
        if (assignedTo !== undefined) contact.assignedTo = assignedTo;
        if (notes !== undefined) contact.notes = notes;
        if (isActive !== undefined) contact.isActive = isActive;

        await contact.save();

        res.json({
            success: true,
            message: 'Contact updated successfully',
            data: contact,
        });
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// DELETE - Delete contact
// ============================================
// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private/Admin
exports.deleteContact = async (req, res) => {
    try {
        const id = req.params.id;

        let contact = await Contact.findOne({ id: id });
        if (!contact) {
            contact = await Contact.findById(id);
        }

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found',
            });
        }

        await contact.deleteOne();

        res.json({
            success: true,
            message: 'Contact deleted successfully',
        });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// UPDATE - Update contact status
// ============================================
// @desc    Update contact status
// @route   PUT /api/contacts/:id/status
// @access  Private/Admin
exports.updateContactStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status, notes } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required',
            });
        }

        const validStatuses = ['pending', 'contacted', 'resolved', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
        }

        let contact = await Contact.findOne({ id: id });
        if (!contact) {
            contact = await Contact.findById(id);
        }

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found',
            });
        }

        contact.status = status;
        if (notes !== undefined) contact.notes = notes;
        await contact.save();

        res.json({
            success: true,
            message: `Contact status updated to ${status}`,
            data: contact,
        });
    } catch (error) {
        console.error('Update contact status error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};