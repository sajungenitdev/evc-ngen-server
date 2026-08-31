// backend/controllers/heroSectionController.js
const HeroSection = require('../models/HeroSection');

// @desc    Get active hero section
// @route   GET /api/hero
// @access  Public
exports.getHeroSection = async (req, res) => {
    try {
        let hero = await HeroSection.findOne({ isActive: true });
        
        if (!hero) {
            // Create default hero section if none exists
            hero = await HeroSection.create({
                badge: {
                    text: 'EV Charging Infrastructure'
                },
                headline: {
                    main: 'Supply. Install.',
                    highlight: 'Train. Support.'
                },
                description: 'EVNGEN delivers end-to-end EV charging infrastructure — charger supply, installation, OCPP software, technical training, and long-term O&M support for government, commercial, and fleet projects.',
                buttons: [
                    {
                        label: 'Request Free Site Survey',
                        link: '/request-survey',
                        type: 'primary'
                    },
                    {
                        label: 'Download Company Profile',
                        link: '/about',
                        type: 'secondary'
                    }
                ],
                cards: [
                    {
                        title: '7 kW – 22 kW',
                        subtitle: 'AC Chargers',
                        link: '/ev-chargers?category=ac-chargers',
                        icon: 'Zap',
                        iconBgColor: '#22c55e'
                    },
                    {
                        title: '60 kW – 180 kW+',
                        subtitle: 'DC Fast Chargers',
                        link: '/ev-chargers?category=dc-chargers',
                        icon: 'BatteryCharging',
                        iconBgColor: '#22c55e'
                    },
                    {
                        title: 'Technician to Engineer',
                        subtitle: 'Training & Certification',
                        link: '/training',
                        icon: 'GraduationCap',
                        iconBgColor: '#2a3b5c',
                        iconTextColor: '#818cf8'
                    },
                    {
                        title: 'Preventive + Corrective',
                        subtitle: 'O&M / AMC Support',
                        link: '/services',
                        icon: 'Wrench',
                        iconBgColor: '#2a3b5c',
                        iconTextColor: '#94a3b8'
                    }
                ],
                isActive: true
            });
        }
        
        res.status(200).json({
            success: true,
            data: hero
        });
    } catch (error) {
        console.error('Error fetching hero section:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hero section',
            error: error.message
        });
    }
};

// @desc    Get all hero sections (admin)
// @route   GET /api/hero/all
// @access  Private (Admin only)
exports.getAllHeroSections = async (req, res) => {
    try {
        const heroSections = await HeroSection.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: heroSections.length,
            data: heroSections
        });
    } catch (error) {
        console.error('Error fetching hero sections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hero sections',
            error: error.message
        });
    }
};

// @desc    Create hero section
// @route   POST /api/hero
// @access  Private (Admin only)
exports.createHeroSection = async (req, res) => {
    try {
        // If setting as active, deactivate others
        if (req.body.isActive) {
            await HeroSection.updateMany(
                { isActive: true },
                { isActive: false }
            );
        }
        
        const hero = await HeroSection.create(req.body);
        res.status(201).json({
            success: true,
            data: hero
        });
    } catch (error) {
        console.error('Error creating hero section:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create hero section',
            error: error.message
        });
    }
};

// @desc    Update hero section
// @route   PUT /api/hero/:id
// @access  Private (Admin only)
exports.updateHeroSection = async (req, res) => {
    try {
        let hero = await HeroSection.findById(req.params.id);
        
        if (!hero) {
            return res.status(404).json({
                success: false,
                message: 'Hero section not found'
            });
        }
        
        // If setting as active, deactivate others
        if (req.body.isActive) {
            await HeroSection.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }
        
        hero = await HeroSection.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        res.status(200).json({
            success: true,
            data: hero
        });
    } catch (error) {
        console.error('Error updating hero section:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update hero section',
            error: error.message
        });
    }
};

// @desc    Delete hero section
// @route   DELETE /api/hero/:id
// @access  Private (Admin only)
exports.deleteHeroSection = async (req, res) => {
    try {
        const hero = await HeroSection.findById(req.params.id);
        
        if (!hero) {
            return res.status(404).json({
                success: false,
                message: 'Hero section not found'
            });
        }
        
        await hero.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'Hero section deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting hero section:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete hero section',
            error: error.message
        });
    }
};

// @desc    Toggle hero section status
// @route   PUT /api/hero/:id/toggle
// @access  Private (Admin only)
exports.toggleHeroStatus = async (req, res) => {
    try {
        const hero = await HeroSection.findById(req.params.id);
        
        if (!hero) {
            return res.status(404).json({
                success: false,
                message: 'Hero section not found'
            });
        }
        
        const newStatus = !hero.isActive;
        
        // If activating, deactivate others
        if (newStatus) {
            await HeroSection.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }
        
        hero.isActive = newStatus;
        await hero.save();
        
        res.status(200).json({
            success: true,
            data: hero
        });
    } catch (error) {
        console.error('Error toggling hero status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle hero status',
            error: error.message
        });
    }
};