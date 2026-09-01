// evngen-backend/src/controllers/termsController.js
const Terms = require('../models/Terms');

// ============================================
// GET ACTIVE TERMS PAGE
// ============================================
exports.getTerms = async (req, res) => {
    try {
        let terms = await Terms.findOne({ isActive: true });

        if (!terms) {
            // Create default Terms page
            terms = await Terms.create({
                header: {
                    breadcrumbs: [
                        { label: 'Home', link: '/' },
                        { label: 'Terms & Conditions' }
                    ],
                    imageUrl: '/images/help/EV Charging_1.jpg',
                    title: 'Terms & Conditions',
                    description: 'Review our terms of service, hardware warranties, and commercial usage policies.'
                },
                lastUpdated: `Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
                sections: [
                    {
                        heading: '1. Acceptance of Terms',
                        content: 'By accessing and using EVNGEN\'s website, products, and services, you agree to comply with and be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must not use our services.',
                        order: 0,
                        isActive: true
                    },
                    {
                        heading: '2. Hardware & Equipment Warranty',
                        content: 'EVNGEN warrants that all EV charging hardware and equipment shall be free from defects in materials and workmanship for a period of 2 to 5 years from the date of purchase, depending on the specific product model. Warranty claims must be submitted through our official support portal and are subject to verification by our engineering team.',
                        order: 1,
                        isActive: true
                    },
                    {
                        heading: '3. Commercial & Fleet Services',
                        content: 'Services provided to commercial operators and fleet clients are governed by mutually agreed statements of work and service-level agreements. Additional terms apply to site installation, load balancing, grid integration, and OCPP backend connectivity.',
                        order: 2,
                        isActive: true
                    },
                    {
                        heading: '4. Intellectual Property Rights',
                        content: 'All content on this website, including but not limited to text, graphics, logos, images, software, and source code, is the property of EVNGEN and protected by international copyright and trademark laws.',
                        order: 3,
                        isActive: true
                    },
                    {
                        heading: '5. Software Licensing & OCPP Compliance',
                        content: 'EVNGEN\'s OCPP-compliant backend software and cloud management platform are licensed on a subscription basis. Users are granted a non-exclusive, non-transferable right to access and use the software strictly in accordance with the subscription terms and conditions.',
                        order: 4,
                        isActive: true
                    },
                    {
                        heading: '6. Limitation of Liability',
                        content: 'To the fullest extent permitted by law, EVNGEN shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from the use or inability to use our products or services.',
                        order: 5,
                        isActive: true
                    },
                    {
                        heading: '7. Governing Law',
                        content: 'These Terms & Conditions are governed by and construed in accordance with the laws of the jurisdiction in which EVNGEN operates. Any disputes arising out of or relating to these terms shall be resolved through binding arbitration.',
                        order: 6,
                        isActive: true
                    }
                ],
                isActive: true
            });
        }

        res.status(200).json({
            success: true,
            data: terms
        });
    } catch (error) {
        console.error('Error fetching Terms:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Terms',
            error: error.message
        });
    }
};

// ============================================
// GET ALL TERMS PAGES
// ============================================
exports.getAllTerms = async (req, res) => {
    try {
        const terms = await Terms.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: terms.length,
            data: terms
        });
    } catch (error) {
        console.error('Error fetching Terms pages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Terms pages',
            error: error.message
        });
    }
};

// ============================================
// CREATE TERMS PAGE
// ============================================
exports.createTerms = async (req, res) => {
    try {
        if (req.body.isActive) {
            await Terms.updateMany(
                { isActive: true },
                { isActive: false }
            );
        }

        const terms = await Terms.create(req.body);
        res.status(201).json({
            success: true,
            data: terms
        });
    } catch (error) {
        console.error('Error creating Terms:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create Terms',
            error: error.message
        });
    }
};

// ============================================
// UPDATE TERMS PAGE
// ============================================
exports.updateTerms = async (req, res) => {
    try {
        let terms = await Terms.findById(req.params.id);

        if (!terms) {
            return res.status(404).json({
                success: false,
                message: 'Terms page not found'
            });
        }

        if (req.body.isActive) {
            await Terms.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }

        // Remove _id from sections before updating
        if (req.body.sections) {
            req.body.sections = req.body.sections.map(item => {
                const { _id, ...cleanItem } = item;
                return cleanItem;
            });
        }

        // Update lastUpdated if not provided
        if (!req.body.lastUpdated) {
            req.body.lastUpdated = `Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        }

        terms = await Terms.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: terms
        });
    } catch (error) {
        console.error('Error updating Terms:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update Terms',
            error: error.message
        });
    }
};

// ============================================
// DELETE TERMS PAGE
// ============================================
exports.deleteTerms = async (req, res) => {
    try {
        const terms = await Terms.findById(req.params.id);

        if (!terms) {
            return res.status(404).json({
                success: false,
                message: 'Terms page not found'
            });
        }

        await terms.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Terms page deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting Terms:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete Terms',
            error: error.message
        });
    }
};

// ============================================
// TOGGLE TERMS STATUS
// ============================================
exports.toggleTermsStatus = async (req, res) => {
    try {
        const terms = await Terms.findById(req.params.id);

        if (!terms) {
            return res.status(404).json({
                success: false,
                message: 'Terms page not found'
            });
        }

        const newStatus = !terms.isActive;

        if (newStatus) {
            await Terms.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }

        terms.isActive = newStatus;
        await terms.save();

        res.status(200).json({
            success: true,
            data: terms
        });
    } catch (error) {
        console.error('Error toggling Terms status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle Terms status',
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

        const terms = await Terms.findById(id);

        if (!terms) {
            return res.status(404).json({
                success: false,
                message: 'Terms page not found'
            });
        }

        const imageUrl = `/uploads/terms/${req.file.filename}`;
        terms.header.imageUrl = imageUrl;
        terms.header.imageFile = req.file.filename;
        await terms.save();

        res.status(200).json({
            success: true,
            data: terms,
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

        const terms = await Terms.findById(id);

        if (!terms) {
            return res.status(404).json({
                success: false,
                message: 'Terms page not found'
            });
        }

        terms.header.imageUrl = '';
        terms.header.imageFile = '';
        await terms.save();

        res.status(200).json({
            success: true,
            data: terms,
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