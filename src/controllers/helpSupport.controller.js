// src/controllers/helpSupport.controller.js
const HelpSupport = require('../models/HelpSupport');
const { deleteFromImgBB } = require('../services/imgbb.service');

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
// GET ACTIVE HELP & SUPPORT SECTION
// ============================================
exports.getHelpSupport = async (req, res) => {
    try {
        let helpSupport = await HelpSupport.findOne({ isActive: true });

        if (!helpSupport) {
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

        // Parse and apply ImgBB URLs if they exist
        const data = { ...req.body };
        
        // Handle sales card image
        if (req.imgbbSalesImageUrl) {
            data.salesCard = {
                ...data.salesCard,
                imageUrl: req.imgbbSalesImageUrl,
                imageDeleteUrl: req.imgbbSalesDeleteUrl
            };
        }
        
        // Handle ticket card image
        if (req.imgbbTicketImageUrl) {
            data.ticketCard = {
                ...data.ticketCard,
                imageUrl: req.imgbbTicketImageUrl,
                imageDeleteUrl: req.imgbbTicketDeleteUrl
            };
        }
        
        // Handle support hub card image
        if (req.imgbbSupportImageUrl) {
            data.supportHubCard = {
                ...data.supportHubCard,
                imageUrl: req.imgbbSupportImageUrl,
                imageDeleteUrl: req.imgbbSupportDeleteUrl
            };
        }
        
        // Handle review card image
        if (req.imgbbReviewImageUrl) {
            data.reviewCard = {
                ...data.reviewCard,
                imageUrl: req.imgbbReviewImageUrl,
                imageDeleteUrl: req.imgbbReviewDeleteUrl
            };
        }
        
        // Handle social card image
        if (req.imgbbSocialImageUrl) {
            data.socialCard = {
                ...data.socialCard,
                imageUrl: req.imgbbSocialImageUrl,
                imageDeleteUrl: req.imgbbSocialDeleteUrl
            };
        }

        const helpSupport = await HelpSupport.create(data);
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

        const data = { ...req.body };
        
        // Handle sales card image
        if (req.imgbbSalesImageUrl) {
            if (helpSupport.salesCard && helpSupport.salesCard.imageDeleteUrl) {
                await deleteImageFromImgBB(helpSupport.salesCard.imageDeleteUrl);
            }
            data.salesCard = {
                ...data.salesCard,
                imageUrl: req.imgbbSalesImageUrl,
                imageDeleteUrl: req.imgbbSalesDeleteUrl
            };
        }
        
        // Handle ticket card image
        if (req.imgbbTicketImageUrl) {
            if (helpSupport.ticketCard && helpSupport.ticketCard.imageDeleteUrl) {
                await deleteImageFromImgBB(helpSupport.ticketCard.imageDeleteUrl);
            }
            data.ticketCard = {
                ...data.ticketCard,
                imageUrl: req.imgbbTicketImageUrl,
                imageDeleteUrl: req.imgbbTicketDeleteUrl
            };
        }
        
        // Handle support hub card image
        if (req.imgbbSupportImageUrl) {
            if (helpSupport.supportHubCard && helpSupport.supportHubCard.imageDeleteUrl) {
                await deleteImageFromImgBB(helpSupport.supportHubCard.imageDeleteUrl);
            }
            data.supportHubCard = {
                ...data.supportHubCard,
                imageUrl: req.imgbbSupportImageUrl,
                imageDeleteUrl: req.imgbbSupportDeleteUrl
            };
        }
        
        // Handle review card image
        if (req.imgbbReviewImageUrl) {
            if (helpSupport.reviewCard && helpSupport.reviewCard.imageDeleteUrl) {
                await deleteImageFromImgBB(helpSupport.reviewCard.imageDeleteUrl);
            }
            data.reviewCard = {
                ...data.reviewCard,
                imageUrl: req.imgbbReviewImageUrl,
                imageDeleteUrl: req.imgbbReviewDeleteUrl
            };
        }
        
        // Handle social card image
        if (req.imgbbSocialImageUrl) {
            if (helpSupport.socialCard && helpSupport.socialCard.imageDeleteUrl) {
                await deleteImageFromImgBB(helpSupport.socialCard.imageDeleteUrl);
            }
            data.socialCard = {
                ...data.socialCard,
                imageUrl: req.imgbbSocialImageUrl,
                imageDeleteUrl: req.imgbbSocialDeleteUrl
            };
        }

        helpSupport = await HelpSupport.findByIdAndUpdate(
            req.params.id,
            data,
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

        // Delete all images from ImgBB
        const cardTypes = ['salesCard', 'ticketCard', 'supportHubCard', 'reviewCard', 'socialCard'];
        for (const cardType of cardTypes) {
            if (helpSupport[cardType] && helpSupport[cardType].imageDeleteUrl) {
                await deleteImageFromImgBB(helpSupport[cardType].imageDeleteUrl);
            }
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

        if (!req.imgbbImageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload image: No image URL returned'
            });
        }

        const helpSupport = await HelpSupport.findById(id);
        if (!helpSupport) {
            return res.status(404).json({
                success: false,
                message: 'Help support section not found'
            });
        }

        if (helpSupport.salesCard && helpSupport.salesCard.imageDeleteUrl) {
            await deleteImageFromImgBB(helpSupport.salesCard.imageDeleteUrl);
        }

        helpSupport.salesCard.imageUrl = req.imgbbImageUrl;
        helpSupport.salesCard.imageDeleteUrl = req.imgbbDeleteUrl;
        await helpSupport.save();

        res.status(200).json({
            success: true,
            data: helpSupport,
            message: 'Sales card image uploaded successfully to ImgBB'
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

        if (!req.imgbbImageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload image: No image URL returned'
            });
        }

        const helpSupport = await HelpSupport.findById(id);
        if (!helpSupport) {
            return res.status(404).json({
                success: false,
                message: 'Help support section not found'
            });
        }

        if (helpSupport.ticketCard && helpSupport.ticketCard.imageDeleteUrl) {
            await deleteImageFromImgBB(helpSupport.ticketCard.imageDeleteUrl);
        }

        helpSupport.ticketCard.imageUrl = req.imgbbImageUrl;
        helpSupport.ticketCard.imageDeleteUrl = req.imgbbDeleteUrl;
        await helpSupport.save();

        res.status(200).json({
            success: true,
            data: helpSupport,
            message: 'Ticket card image uploaded successfully to ImgBB'
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

        if (!req.imgbbImageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload image: No image URL returned'
            });
        }

        const helpSupport = await HelpSupport.findById(id);
        if (!helpSupport) {
            return res.status(404).json({
                success: false,
                message: 'Help support section not found'
            });
        }

        if (helpSupport.supportHubCard && helpSupport.supportHubCard.imageDeleteUrl) {
            await deleteImageFromImgBB(helpSupport.supportHubCard.imageDeleteUrl);
        }

        helpSupport.supportHubCard.imageUrl = req.imgbbImageUrl;
        helpSupport.supportHubCard.imageDeleteUrl = req.imgbbDeleteUrl;
        await helpSupport.save();

        res.status(200).json({
            success: true,
            data: helpSupport,
            message: 'Support hub card image uploaded successfully to ImgBB'
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

        if (!req.imgbbImageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload image: No image URL returned'
            });
        }

        const helpSupport = await HelpSupport.findById(id);
        if (!helpSupport) {
            return res.status(404).json({
                success: false,
                message: 'Help support section not found'
            });
        }

        if (helpSupport.reviewCard && helpSupport.reviewCard.imageDeleteUrl) {
            await deleteImageFromImgBB(helpSupport.reviewCard.imageDeleteUrl);
        }

        helpSupport.reviewCard.imageUrl = req.imgbbImageUrl;
        helpSupport.reviewCard.imageDeleteUrl = req.imgbbDeleteUrl;
        await helpSupport.save();

        res.status(200).json({
            success: true,
            data: helpSupport,
            message: 'Review card image uploaded successfully to ImgBB'
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

        if (!req.imgbbImageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload image: No image URL returned'
            });
        }

        const helpSupport = await HelpSupport.findById(id);
        if (!helpSupport) {
            return res.status(404).json({
                success: false,
                message: 'Help support section not found'
            });
        }

        if (helpSupport.socialCard && helpSupport.socialCard.imageDeleteUrl) {
            await deleteImageFromImgBB(helpSupport.socialCard.imageDeleteUrl);
        }

        helpSupport.socialCard.imageUrl = req.imgbbImageUrl;
        helpSupport.socialCard.imageDeleteUrl = req.imgbbDeleteUrl;
        await helpSupport.save();

        res.status(200).json({
            success: true,
            data: helpSupport,
            message: 'Social card image uploaded successfully to ImgBB'
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

        // Delete image from ImgBB
        if (helpSupport[cardKey] && helpSupport[cardKey].imageDeleteUrl) {
            await deleteImageFromImgBB(helpSupport[cardKey].imageDeleteUrl);
        }

        helpSupport[cardKey].imageUrl = '';
        helpSupport[cardKey].imageDeleteUrl = null;
        helpSupport[cardKey].imageFile = '';
        await helpSupport.save();

        res.status(200).json({
            success: true,
            data: helpSupport,
            message: 'Image removed successfully from ImgBB'
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