// evngen-backend/src/controllers/faqController.js
const Faq = require('../models/Faq');

// ============================================
// GET ACTIVE FAQ PAGE
// ============================================
exports.getFaq = async (req, res) => {
    try {
        let faq = await Faq.findOne({ isActive: true });

        if (!faq) {
            // Create default FAQ page
            faq = await Faq.create({
                header: {
                    breadcrumbs: [
                        { label: 'Home', link: '/' },
                        { label: 'FAQ & Support' }
                    ],
                    imageUrl: '/images/help/EV Charging_1.jpg',
                    title: 'Frequently Asked Questions',
                    description: 'Find answers regarding EV charger hardware specifications, OCPP software integration, billing, and site installation.'
                },
                categories: ['All', 'Hardware & Installation', 'Software & OCPP', 'Pricing & Billing', 'Maintenance'],
                faqs: [
                    {
                        question: 'What is the typical installation timeline for a commercial DC fast charger?',
                        answer: 'A standard commercial DC fast-charging hub deployment typically takes between 4 to 6 weeks from initial site survey and electrical assessment to grid commissioning and final software activation.',
                        category: 'Hardware & Installation',
                        order: 0,
                        isActive: true
                    },
                    {
                        question: 'Do your EV chargers support OCPP standards?',
                        answer: 'Yes, all our smart AC wallboxes and DC fast-charging stations are fully Open Charge Point Protocol (OCPP 1.6J and 2.0.1) compliant, allowing seamless integration with third-party backend management platforms.',
                        category: 'Software & OCPP',
                        order: 1,
                        isActive: true
                    },
                    {
                        question: 'How does dynamic load balancing work across multiple chargers?',
                        answer: 'Dynamic load balancing automatically distributes the available electrical capacity among active vehicles in real-time, preventing peak load surcharges and protecting your site\'s main electrical infrastructure from overloading.',
                        category: 'Hardware & Installation',
                        order: 2,
                        isActive: true
                    },
                    {
                        question: 'Can I monitor energy usage and manage driver billing remotely?',
                        answer: 'Yes, our cloud-based monitoring dashboard and driver mobile apps provide real-time session tracking, remote firmware updates, flexible pricing configuration, and automated RFID or app-based billing.',
                        category: 'Software & OCPP',
                        order: 3,
                        isActive: true
                    },
                    {
                        question: 'What kind of warranty and maintenance support do you offer?',
                        answer: 'We provide comprehensive 24/7 technical customer support, remote diagnostics, and standard multi-year hardware warranties with optional on-site SLA maintenance packages.',
                        category: 'Maintenance',
                        order: 4,
                        isActive: true
                    },
                    {
                        question: 'Are there government grants or rebates available for installing EV chargers?',
                        answer: 'Many federal, regional, and utility-specific programs offer financial incentives, tax credits, and rebates for commercial and fleet EV infrastructure deployment. Our team can help guide you through the consultation and application process.',
                        category: 'Pricing & Billing',
                        order: 5,
                        isActive: true
                    }
                ],
                ctaBanner: {
                    title: 'Still have questions?',
                    description: 'Our engineering and sales team are available to discuss your specific infrastructure and fleet requirements.',
                    primaryButton: { text: 'Contact Our Team', link: '/contact', isActive: true },
                    secondaryButton: { text: 'Request Site Survey', link: '/request-survey', isActive: true },
                    isActive: true
                },
                isActive: true
            });
        }

        res.status(200).json({
            success: true,
            data: faq
        });
    } catch (error) {
        console.error('Error fetching FAQ:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch FAQ',
            error: error.message
        });
    }
};

// ============================================
// GET ALL FAQ PAGES
// ============================================
exports.getAllFaq = async (req, res) => {
    try {
        const faqs = await Faq.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: faqs.length,
            data: faqs
        });
    } catch (error) {
        console.error('Error fetching FAQ pages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch FAQ pages',
            error: error.message
        });
    }
};

// ============================================
// CREATE FAQ PAGE
// ============================================
exports.createFaq = async (req, res) => {
    try {
        if (req.body.isActive) {
            await Faq.updateMany(
                { isActive: true },
                { isActive: false }
            );
        }

        const faq = await Faq.create(req.body);
        res.status(201).json({
            success: true,
            data: faq
        });
    } catch (error) {
        console.error('Error creating FAQ:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create FAQ',
            error: error.message
        });
    }
};

// ============================================
// UPDATE FAQ PAGE
// ============================================
exports.updateFaq = async (req, res) => {
    try {
        let faq = await Faq.findById(req.params.id);

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ page not found'
            });
        }

        if (req.body.isActive) {
            await Faq.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }

        // Remove _id from faqs before updating
        if (req.body.faqs) {
            req.body.faqs = req.body.faqs.map(item => {
                const { _id, ...cleanItem } = item;
                return cleanItem;
            });
        }

        faq = await Faq.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: faq
        });
    } catch (error) {
        console.error('Error updating FAQ:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update FAQ',
            error: error.message
        });
    }
};

// ============================================
// DELETE FAQ PAGE
// ============================================
exports.deleteFaq = async (req, res) => {
    try {
        const faq = await Faq.findById(req.params.id);

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ page not found'
            });
        }

        await faq.deleteOne();

        res.status(200).json({
            success: true,
            message: 'FAQ page deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete FAQ',
            error: error.message
        });
    }
};

// ============================================
// TOGGLE FAQ STATUS
// ============================================
exports.toggleFaqStatus = async (req, res) => {
    try {
        const faq = await Faq.findById(req.params.id);

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ page not found'
            });
        }

        const newStatus = !faq.isActive;

        if (newStatus) {
            await Faq.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }

        faq.isActive = newStatus;
        await faq.save();

        res.status(200).json({
            success: true,
            data: faq
        });
    } catch (error) {
        console.error('Error toggling FAQ status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle FAQ status',
            error: error.message
        });
    }
};

// ============================================
// IMAGE UPLOAD - HEADER IMAGE
// ============================================
exports.uploadHeaderImage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const faq = await Faq.findById(id);

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ page not found'
            });
        }

        const imageUrl = `/uploads/faq/${req.file.filename}`;
        faq.header.imageUrl = imageUrl;
        faq.header.imageFile = req.file.filename;
        await faq.save();

        res.status(200).json({
            success: true,
            data: faq,
            message: 'Header image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading header image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};

// ============================================
// REMOVE HEADER IMAGE
// ============================================
exports.removeHeaderImage = async (req, res) => {
    try {
        const { id } = req.params;

        const faq = await Faq.findById(id);

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ page not found'
            });
        }

        faq.header.imageUrl = '';
        faq.header.imageFile = '';
        await faq.save();

        res.status(200).json({
            success: true,
            data: faq,
            message: 'Header image removed successfully'
        });
    } catch (error) {
        console.error('Error removing header image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove image',
            error: error.message
        });
    }
};