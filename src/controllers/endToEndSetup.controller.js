// evngen-backend/src/controllers/endToEndSetupController.js
const EndToEndSetup = require('../models/EndToEndSetup');

// ============================================
// GET ACTIVE END-TO-END SETUP SECTION
// ============================================
exports.getEndToEndSetup = async (req, res) => {
    try {
        let endToEndSetup = await EndToEndSetup.findOne({ isActive: true });

        if (!endToEndSetup) {
            // Create default End-to-End Setup section
            endToEndSetup = await EndToEndSetup.create({
                headingPart1: 'End-to-End',
                headingPart2: 'EV Charger Setup & Support',
                steps: [
                    {
                        title: 'Free Site Assessment',
                        description: 'End-to-end site planning to get your location deployment-ready.',
                        icon: 'Wrench',
                        order: 0,
                        isActive: true
                    },
                    {
                        title: 'Execution Plan & Pricing',
                        description: 'Hardware recommendations, pricing, and a full installation plan.',
                        icon: 'ClipboardList',
                        order: 1,
                        isActive: true
                    },
                    {
                        title: 'Installation & Testing',
                        description: 'Certified technicians install and test for safety and compliance.',
                        icon: 'Construction',
                        order: 2,
                        isActive: true
                    },
                    {
                        title: 'Onboarding & Activation',
                        description: 'KYC, platform onboarding, and activation with dashboard access.',
                        icon: 'Wifi',
                        order: 3,
                        isActive: true
                    },
                    {
                        title: '24/7 Customer Support',
                        description: 'Our team is available around the clock for technical queries.',
                        icon: 'Headphones',
                        order: 4,
                        isActive: true
                    },
                    {
                        title: 'Software & Billing Integration',
                        description: 'Configure custom pricing, payment gateways, and automated billing controls.',
                        icon: 'CreditCard',
                        order: 5,
                        isActive: true
                    },
                    {
                        title: 'Preventative Maintenance',
                        description: 'Routine hardware inspections and firmware updates to ensure maximum uptime.',
                        icon: 'ShieldCheck',
                        order: 6,
                        isActive: true
                    },
                    {
                        title: 'Analytics & Fleet Reporting',
                        description: 'Track energy consumption, revenue metrics, and overall charger utilization.',
                        icon: 'BarChart3',
                        order: 7,
                        isActive: true
                    }
                ],
                ctaButton: {
                    text: 'Book a Free Consultation',
                    link: '/request-survey',
                    isActive: true
                },
                isActive: true,
                backgroundColor: '#ffffff',
                textColor: '#071322',
                sectionId: 'end-to-end-setup'
            });
        }

        res.status(200).json({
            success: true,
            data: endToEndSetup
        });
    } catch (error) {
        console.error('Error fetching End-to-End Setup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch End-to-End Setup',
            error: error.message
        });
    }
};

// ============================================
// GET ALL END-TO-END SETUP SECTIONS
// ============================================
exports.getAllEndToEndSetup = async (req, res) => {
    try {
        const endToEndSetups = await EndToEndSetup.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: endToEndSetups.length,
            data: endToEndSetups
        });
    } catch (error) {
        console.error('Error fetching End-to-End Setup sections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch End-to-End Setup sections',
            error: error.message
        });
    }
};

// ============================================
// CREATE END-TO-END SETUP SECTION
// ============================================
exports.createEndToEndSetup = async (req, res) => {
    try {
        if (req.body.isActive) {
            await EndToEndSetup.updateMany(
                { isActive: true },
                { isActive: false }
            );
        }

        const endToEndSetup = await EndToEndSetup.create(req.body);
        res.status(201).json({
            success: true,
            data: endToEndSetup
        });
    } catch (error) {
        console.error('Error creating End-to-End Setup:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create End-to-End Setup',
            error: error.message
        });
    }
};

// ============================================
// UPDATE END-TO-END SETUP SECTION
// ============================================
exports.updateEndToEndSetup = async (req, res) => {
    try {
        let endToEndSetup = await EndToEndSetup.findById(req.params.id);

        if (!endToEndSetup) {
            return res.status(404).json({
                success: false,
                message: 'End-to-End Setup section not found'
            });
        }

        if (req.body.isActive) {
            await EndToEndSetup.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }

        // Remove _id from steps before updating
        if (req.body.steps) {
            req.body.steps = req.body.steps.map(step => {
                const { _id, ...cleanStep } = step;
                return cleanStep;
            });
        }

        endToEndSetup = await EndToEndSetup.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: endToEndSetup
        });
    } catch (error) {
        console.error('Error updating End-to-End Setup:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update End-to-End Setup',
            error: error.message
        });
    }
};

// ============================================
// DELETE END-TO-END SETUP SECTION
// ============================================
exports.deleteEndToEndSetup = async (req, res) => {
    try {
        const endToEndSetup = await EndToEndSetup.findById(req.params.id);

        if (!endToEndSetup) {
            return res.status(404).json({
                success: false,
                message: 'End-to-End Setup section not found'
            });
        }

        await endToEndSetup.deleteOne();

        res.status(200).json({
            success: true,
            message: 'End-to-End Setup section deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting End-to-End Setup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete End-to-End Setup',
            error: error.message
        });
    }
};

// ============================================
// TOGGLE END-TO-END SETUP STATUS
// ============================================
exports.toggleEndToEndSetupStatus = async (req, res) => {
    try {
        const endToEndSetup = await EndToEndSetup.findById(req.params.id);

        if (!endToEndSetup) {
            return res.status(404).json({
                success: false,
                message: 'End-to-End Setup section not found'
            });
        }

        const newStatus = !endToEndSetup.isActive;

        if (newStatus) {
            await EndToEndSetup.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }

        endToEndSetup.isActive = newStatus;
        await endToEndSetup.save();

        res.status(200).json({
            success: true,
            data: endToEndSetup
        });
    } catch (error) {
        console.error('Error toggling End-to-End Setup status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle End-to-End Setup status',
            error: error.message
        });
    }
};