// evngen-backend/src/controllers/aboutController.js
const About = require('../models/About');
const path = require('path');
const fs = require('fs');

// @desc    Get active about page
// @route   GET /api/about
// @access  Public
exports.getAbout = async (req, res) => {
    try {
        let about = await About.findOne({ isActive: true });
        
        if (!about) {
            // Create default about page if none exists
            about = await About.create({
                header: {
                    breadcrumbs: [
                        { label: 'Home', link: '/' },
                        { label: 'About Us' }
                    ],
                    imageUrl: '/images/help/EV Charging_1.jpg',
                    title: 'About EVNGEN',
                    description: 'Leading the transition to sustainable energy and electric vehicle infrastructure with reliable, high-performance charging solutions.'
                },
                headerLabel: 'ABOUT',
                title: 'Engineering electric energy freedom',
                introParagraph1: 'EVNGEN is dedicated to controlling the movement of electric energy — across AC, DC, frequency, and voltage — to serve people and industry with greater efficiency. Since our founding, we\'ve focused on Power Quality, EV Charging, Energy Storage, and Battery Testing, delivering technology that helps partners run more reliable, sustainable operations.',
                introParagraph2: 'Our EV charging division designs and manufactures AC and DC chargers from 3.5kW residential wallboxes to 180kW fast-charging stations, backed by an engineering team offering full OEM/ODM customization — brand logo printing, shell design, power configuration, and regional certification support.',
                sidebarNav: [
                    { label: 'About EVNGEN', link: '/about', active: true },
                    { label: 'Senior Leadership', link: '/about/leadership', active: false }
                ],
                stats: [
                    { value: '15+', label: 'Years in Power Electronics' },
                    { value: '50+', label: 'Countries Served' },
                    { value: '200k+', label: 'Chargers Online' },
                    { value: '24/7', label: 'Global Support' }
                ],
                whoWeAre: {
                    title: 'Who We Are',
                    paragraph1: 'Established as a pioneering provider of sustainable energy infrastructure solutions, EVNGEN specializes in advanced Electric Vehicle (EV) charging infrastructure, power quality, and energy storage systems.',
                    paragraph2: 'As a trusted leader in the green tech industry, we pride ourselves on delivering practical, future-proof engineering and software solutions that meet the evolving needs of commercial operators, fleets, and residential drivers.',
                    imageUrl: '/images/help/who-we-are.webp',
                    highlights: [
                        { text: '15+ years of power electronics and energy expertise' },
                        { text: 'Full end-to-end OEM/ODM hardware customization' },
                        { text: 'Certified chargers meeting international safety standards' }
                    ]
                },
                mission: {
                    title: 'Our Mission',
                    paragraph1: 'As one of the most trusted EV charger providers and charge point operators (CPO), we are dedicated to delivering a seamless, end-to-end charging ecosystem.',
                    paragraph2: 'To accelerate green mobility, we operate a robust digital network and mobile platform, granting drivers instant access to reliable fast-charging stations across our growing infrastructure.',
                    imageUrl: '/images/help/mission.webp',
                    highlights: [
                        { text: 'Seamless driver experience via OCCP-compliant cloud app' },
                        { text: 'Robust, scalable infrastructure for commercial and municipal fleets' },
                        { text: '24/7 global support and real-time remote network monitoring' }
                    ]
                },
                partners: [
                    { name: 'EcoDrive', logo: '/images/partners/ecodrive.webp', order: 0 },
                    { name: 'VoltGrid', logo: '/images/partners/voltgrid.jpg', order: 1 },
                    { name: 'ChargePoint Inc.', logo: '/images/partners/chargepoint.png', order: 2 },
                    { name: 'GreenMotion', logo: '/images/partners/greenmotion.png', order: 3 },
                    { name: 'EcoPower Global', logo: '/images/partners/ecopower.png', order: 4 },
                    { name: 'FutureVolt', logo: '/images/partners/futurevolt.jpg', order: 5 }
                ],
                timeline: [
                    { year: '2009', title: 'Company Founded', description: 'Started as a specialized power electronics and power quality engineering consultancy.', order: 0 },
                    { year: '2013', title: 'Grid Solutions Expansion', description: 'Expanded operations into industrial energy storage and high-capacity inverter testing systems.', order: 1 },
                    { year: '2017', title: 'EV Charging Division Launch', description: 'Pioneered our first generation of smart AC wallboxes and commercial fast chargers.', order: 2 },
                    { year: '2021', title: 'OCPP Cloud Platform', description: 'Released our proprietary backend cloud management software and driver mobile applications.', order: 3 },
                    { year: '2024', title: 'Global Network Growth', description: 'Surpassed 150,000 active chargers online across international commercial and municipal fleets.', order: 4 },
                    { year: '2026', title: 'Next-Gen Megawatt Charging', description: 'Introducing ultra-fast DC charging infrastructure and advanced dynamic load-balancing systems.', order: 5 }
                ],
                isActive: true
            });
        }
        
        res.status(200).json({
            success: true,
            data: about
        });
    } catch (error) {
        console.error('Error fetching about page:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch about page',
            error: error.message
        });
    }
};

// @desc    Get all about pages (admin)
// @route   GET /api/about/all
// @access  Public (for now)
exports.getAllAbout = async (req, res) => {
    try {
        const aboutPages = await About.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: aboutPages.length,
            data: aboutPages
        });
    } catch (error) {
        console.error('Error fetching about pages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch about pages',
            error: error.message
        });
    }
};

// @desc    Create about page
// @route   POST /api/about
// @access  Public (for now)
exports.createAbout = async (req, res) => {
    try {
        // If setting as active, deactivate others
        if (req.body.isActive) {
            await About.updateMany(
                { isActive: true },
                { isActive: false }
            );
        }
        
        const about = await About.create(req.body);
        res.status(201).json({
            success: true,
            data: about
        });
    } catch (error) {
        console.error('Error creating about page:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create about page',
            error: error.message
        });
    }
};

// @desc    Update about page
// @route   PUT /api/about/:id
// @access  Public (for now)
exports.updateAbout = async (req, res) => {
    try {
        let about = await About.findById(req.params.id);
        
        if (!about) {
            return res.status(404).json({
                success: false,
                message: 'About page not found'
            });
        }
        
        // If setting as active, deactivate others
        if (req.body.isActive) {
            await About.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }
        
        about = await About.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        res.status(200).json({
            success: true,
            data: about
        });
    } catch (error) {
        console.error('Error updating about page:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update about page',
            error: error.message
        });
    }
};

// @desc    Delete about page
// @route   DELETE /api/about/:id
// @access  Public (for now)
exports.deleteAbout = async (req, res) => {
    try {
        const about = await About.findById(req.params.id);
        
        if (!about) {
            return res.status(404).json({
                success: false,
                message: 'About page not found'
            });
        }
        
        await about.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'About page deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting about page:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete about page',
            error: error.message
        });
    }
};

// @desc    Toggle about page status
// @route   PUT /api/about/:id/toggle
// @access  Public (for now)
exports.toggleAboutStatus = async (req, res) => {
    try {
        const about = await About.findById(req.params.id);
        
        if (!about) {
            return res.status(404).json({
                success: false,
                message: 'About page not found'
            });
        }
        
        const newStatus = !about.isActive;
        
        // If activating, deactivate others
        if (newStatus) {
            await About.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }
        
        about.isActive = newStatus;
        await about.save();
        
        res.status(200).json({
            success: true,
            data: about
        });
    } catch (error) {
        console.error('Error toggling about status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle about status',
            error: error.message
        });
    }
};

// ============================================
// IMAGE UPLOAD ENDPOINTS
// ============================================

// @desc    Upload header image
// @route   POST /api/about/:id/upload-header
// @access  Public (for now)
exports.uploadHeaderImage = async (req, res) => {
    try {
        const about = await About.findById(req.params.id);
        if (!about) {
            return res.status(404).json({
                success: false,
                message: 'About page not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const imageUrl = `/uploads/about/${req.file.filename}`;
        about.header.imageUrl = imageUrl;
        about.header.imageFile = req.file.filename;
        await about.save();

        res.status(200).json({
            success: true,
            data: about,
            message: 'Header image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading header image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload header image',
            error: error.message
        });
    }
};

// @desc    Upload who we are image
// @route   POST /api/about/:id/upload-who-we-are
// @access  Public (for now)
exports.uploadWhoWeAreImage = async (req, res) => {
    try {
        const about = await About.findById(req.params.id);
        if (!about) {
            return res.status(404).json({
                success: false,
                message: 'About page not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const imageUrl = `/uploads/about/${req.file.filename}`;
        about.whoWeAre.imageUrl = imageUrl;
        about.whoWeAre.imageFile = req.file.filename;
        await about.save();

        res.status(200).json({
            success: true,
            data: about,
            message: 'Who We Are image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading who we are image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload who we are image',
            error: error.message
        });
    }
};

// @desc    Upload mission image
// @route   POST /api/about/:id/upload-mission
// @access  Public (for now)
exports.uploadMissionImage = async (req, res) => {
    try {
        const about = await About.findById(req.params.id);
        if (!about) {
            return res.status(404).json({
                success: false,
                message: 'About page not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const imageUrl = `/uploads/about/${req.file.filename}`;
        about.mission.imageUrl = imageUrl;
        about.mission.imageFile = req.file.filename;
        await about.save();

        res.status(200).json({
            success: true,
            data: about,
            message: 'Mission image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading mission image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload mission image',
            error: error.message
        });
    }
};

// @desc    Upload partner logo
// @route   POST /api/about/:id/upload-partner/:partnerIndex
// @access  Public (for now)
exports.uploadPartnerLogo = async (req, res) => {
    try {
        const about = await About.findById(req.params.id);
        if (!about) {
            return res.status(404).json({
                success: false,
                message: 'About page not found'
            });
        }

        const partnerIndex = parseInt(req.params.partnerIndex);
        if (isNaN(partnerIndex) || partnerIndex < 0 || partnerIndex >= about.partners.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid partner index'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const imageUrl = `/uploads/about/partners/${req.file.filename}`;
        about.partners[partnerIndex].logo = imageUrl;
        about.partners[partnerIndex].logoFile = req.file.filename;
        await about.save();

        res.status(200).json({
            success: true,
            data: about,
            message: 'Partner logo uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading partner logo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload partner logo',
            error: error.message
        });
    }
};