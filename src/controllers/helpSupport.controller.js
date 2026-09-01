// evngen-backend/src/controllers/helpSupport.controller.js
const HelpSupport = require('../models/HelpSupport');

// ============================================
// GET ACTIVE HELP & SUPPORT SECTION
// ============================================
exports.getHelpSupport = async (req, res) => {
    try {
        let helpSupport = await HelpSupport.findOne({ isActive: true });

        if (!helpSupport) {
            // Create default help support section
            helpSupport = await HelpSupport.create({
                salesCard: {
                    status: 'Sales Team Online',
                    title: 'Need help choosing a charger?',
                    highlightText: 'Talk to our team.',
                    buttonText: 'Call +1 (800) 555-0199',
                    phoneLink: '18005550199',
                    imageUrl: '/images/help/need-help.jpg',
                    isActive: true
                },
                ticketCard: {
                    description: 'Need something else? Raise a ticket and we\'ll get back to you.',
                    linkText: 'Raise a Ticket →',
                    link: '/contact',
                    imageUrl: '/images/help/Raise-Ticket.jpg',
                    isActive: true
                },
                supportHubCard: {
                    description: 'Find answers, guides, and advice, all in one place',
                    linkText: 'Visit our Support Hub →',
                    link: '/faq',
                    imageUrl: '/images/help/charge-ev_9-1.webp',
                    isActive: true
                },
                reviewCard: {
                    description: 'Help us continue to improve our network',
                    linkText: 'Leave a Review →',
                    link: '/contact',
                    imageUrl: '/images/help/improve-our-network.jpg',
                    isActive: true
                },
                socialCard: {
                    title: 'Stay connected',
                    imageUrl: '/images/help/Stay-connected.jpg',
                    socials: [
                        { name: 'X', link: 'https://twitter.com', isActive: true },
                        { name: 'in', link: 'https://linkedin.com', isActive: true },
                        { name: 'f', link: 'https://facebook.com', isActive: true }
                    ],
                    isActive: true
                },
                isActive: true,
                sectionId: 'help-support'
            });
        }

        res.status(200).json({
            success: true,
            data: helpSupport
        });
    } catch (error) {
        console.error('Error fetching help support:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch help support',
            error: error.message
        });
    }
};

// ============================================
// GET ALL HELP & SUPPORT SECTIONS
// ============================================
exports.getAllHelpSupport = async (req, res) => {
    try {
        const helpSupports = await HelpSupport.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: helpSupports.length,
            data: helpSupports
        });
    } catch (error) {
        console.error('Error fetching help support sections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch help support sections',
            error: error.message
        });
    }
};

// ============================================
// CREATE HELP & SUPPORT SECTION
// ============================================
exports.createHelpSupport = async (req, res) => {
    try {
        if (req.body.isActive) {
            await HelpSupport.updateMany(
                { isActive: true },
                { isActive: false }
            );
        }

        const helpSupport = await HelpSupport.create(req.body);
        res.status(201).json({
            success: true,
            data: helpSupport
        });
    } catch (error) {
        console.error('Error creating help support:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create help support',
            error: error.message
        });
    }
};

// ============================================
// UPDATE HELP & SUPPORT SECTION
// ============================================
exports.updateHelpSupport = async (req, res) => {
    try {
        let helpSupport = await HelpSupport.findById(req.params.id);

        if (!helpSupport) {
            return res.status(404).json({
                success: false,
                message: 'Help support section not found'
            });
        }

        if (req.body.isActive) {
            await HelpSupport.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }

        helpSupport = await HelpSupport.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: helpSupport
        });
    } catch (error) {
        console.error('Error updating help support:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update help support',
            error: error.message
        });
    }
};

// ============================================
// DELETE HELP & SUPPORT SECTION
// ============================================
exports.deleteHelpSupport = async (req, res) => {
    try {
        const helpSupport = await HelpSupport.findById(req.params.id);

        if (!helpSupport) {
            return res.status(404).json({
                success: false,
                message: 'Help support section not found'
            });
        }

        await helpSupport.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Help support section deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting help support:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete help support',
            error: error.message
        });
    }
};

// ============================================
// TOGGLE HELP & SUPPORT STATUS
// ============================================
exports.toggleHelpSupportStatus = async (req, res) => {
    try {
        const helpSupport = await HelpSupport.findById(req.params.id);

        if (!helpSupport) {
            return res.status(404).json({
                success: false,
                message: 'Help support section not found'
            });
        }

        const newStatus = !helpSupport.isActive;

        if (newStatus) {
            await HelpSupport.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }

        helpSupport.isActive = newStatus;
        await helpSupport.save();

        res.status(200).json({
            success: true,
            data: helpSupport
        });
    } catch (error) {
        console.error('Error toggling help support status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle help support status',
            error: error.message
        });
    }
};

// ============================================
// IMAGE UPLOAD - SALES CARD
// ============================================
exports.uploadSalesCardImage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const helpSupport = await HelpSupport.findById(id);

        if (!helpSupport) {
            return res.status(404).json({
                success: false,
                message: 'Help support section not found'
            });
        }

        const imageUrl = `/uploads/help-support/${req.file.filename}`;
        helpSupport.salesCard.imageUrl = imageUrl;
        helpSupport.salesCard.imageFile = req.file.filename;
        await helpSupport.save();

        res.status(200).json({
            success: true,
            data: helpSupport,
            message: 'Sales card image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading sales card image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};

// ============================================
// IMAGE UPLOAD - TICKET CARD
// ============================================
exports.uploadTicketCardImage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const helpSupport = await HelpSupport.findById(id);

        if (!helpSupport) {
            return res.status(404).json({
                success: false,
                message: 'Help support section not found'
            });
        }

        const imageUrl = `/uploads/help-support/${req.file.filename}`;
        helpSupport.ticketCard.imageUrl = imageUrl;
        helpSupport.ticketCard.imageFile = req.file.filename;
        await helpSupport.save();

        res.status(200).json({
            success: true,
            data: helpSupport,
            message: 'Ticket card image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading ticket card image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};

// ============================================
// IMAGE UPLOAD - SUPPORT HUB CARD
// ============================================
exports.uploadSupportHubCardImage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const helpSupport = await HelpSupport.findById(id);

        if (!helpSupport) {
            return res.status(404).json({
                success: false,
                message: 'Help support section not found'
            });
        }

        const imageUrl = `/uploads/help-support/${req.file.filename}`;
        helpSupport.supportHubCard.imageUrl = imageUrl;
        helpSupport.supportHubCard.imageFile = req.file.filename;
        await helpSupport.save();

        res.status(200).json({
            success: true,
            data: helpSupport,
            message: 'Support hub card image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading support hub card image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};

// ============================================
// IMAGE UPLOAD - REVIEW CARD
// ============================================
exports.uploadReviewCardImage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const helpSupport = await HelpSupport.findById(id);

        if (!helpSupport) {
            return res.status(404).json({
                success: false,
                message: 'Help support section not found'
            });
        }

        const imageUrl = `/uploads/help-support/${req.file.filename}`;
        helpSupport.reviewCard.imageUrl = imageUrl;
        helpSupport.reviewCard.imageFile = req.file.filename;
        await helpSupport.save();

        res.status(200).json({
            success: true,
            data: helpSupport,
            message: 'Review card image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading review card image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};

// ============================================
// IMAGE UPLOAD - SOCIAL CARD
// ============================================
exports.uploadSocialCardImage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const helpSupport = await HelpSupport.findById(id);

        if (!helpSupport) {
            return res.status(404).json({
                success: false,
                message: 'Help support section not found'
            });
        }

        const imageUrl = `/uploads/help-support/${req.file.filename}`;
        helpSupport.socialCard.imageUrl = imageUrl;
        helpSupport.socialCard.imageFile = req.file.filename;
        await helpSupport.save();

        res.status(200).json({
            success: true,
            data: helpSupport,
            message: 'Social card image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading social card image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};

// ============================================
// REMOVE IMAGES
// ============================================
exports.removeImage = async (req, res) => {
    try {
        const { id, cardType } = req.params;

        const helpSupport = await HelpSupport.findById(id);

        if (!helpSupport) {
            return res.status(404).json({
                success: false,
                message: 'Help support section not found'
            });
        }

        // ✅ FIXED: Use a regular object without TypeScript type annotation
        const cardMap = {
            'sales': 'salesCard',
            'ticket': 'ticketCard',
            'support': 'supportHubCard',
            'review': 'reviewCard',
            'social': 'socialCard'
        };

        const cardKey = cardMap[cardType];
        if (!cardKey) {
            return res.status(400).json({
                success: false,
                message: 'Invalid card type. Must be: sales, ticket, support, review, or social'
            });
        }

        // Remove the image
        helpSupport[cardKey].imageUrl = '';
        helpSupport[cardKey].imageFile = '';
        await helpSupport.save();

        res.status(200).json({
            success: true,
            data: helpSupport,
            message: 'Image removed successfully'
        });
    } catch (error) {
        console.error('Error removing image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove image',
            error: error.message
        });
    }
};