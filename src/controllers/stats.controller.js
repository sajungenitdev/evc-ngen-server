// evngen-backend/src/controllers/statsController.js
const Stats = require('../models/Stats');

// @desc    Get active stats
// @route   GET /api/stats
// @access  Public
exports.getStats = async (req, res) => {
    try {
        let stats = await Stats.findOne({ isActive: true });
        
        if (!stats) {
            // Create default stats if none exists
            stats = await Stats.create({
                items: [
                    {
                        end: 200000,
                        suffix: '+',
                        label: 'Products',
                        duration: 2500,
                        prefix: '',
                        isActive: true
                    },
                    {
                        end: 5000,
                        suffix: '+',
                        label: 'Accessories',
                        duration: 2000,
                        prefix: '',
                        isActive: true
                    },
                    {
                        end: 50,
                        suffix: '+',
                        label: 'Services',
                        duration: 1500,
                        prefix: '',
                        isActive: true
                    },
                    {
                        end: 24,
                        suffix: '/7',
                        label: 'Training',
                        duration: 1000,
                        prefix: '',
                        isActive: true
                    }
                ],
                isActive: true,
                backgroundColor: '#0c1b2e',
                textColor: '#ffffff',
                borderColor: 'rgba(255,255,255,0.1)'
            });
        }
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: error.message
        });
    }
};

// @desc    Get all stats (admin)
// @route   GET /api/stats/all
// @access  Public (for now)
exports.getAllStats = async (req, res) => {
    try {
        const stats = await Stats.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: stats.length,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: error.message
        });
    }
};

// @desc    Create stats
// @route   POST /api/stats
// @access  Public (for now)
exports.createStats = async (req, res) => {
    try {
        // If setting as active, deactivate others
        if (req.body.isActive) {
            await Stats.updateMany(
                { isActive: true },
                { isActive: false }
            );
        }
        
        const stats = await Stats.create(req.body);
        res.status(201).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error creating stats:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create stats',
            error: error.message
        });
    }
};

// @desc    Update stats
// @route   PUT /api/stats/:id
// @access  Public (for now)
exports.updateStats = async (req, res) => {
    try {
        let stats = await Stats.findById(req.params.id);
        
        if (!stats) {
            return res.status(404).json({
                success: false,
                message: 'Stats not found'
            });
        }
        
        // If setting as active, deactivate others
        if (req.body.isActive) {
            await Stats.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }
        
        stats = await Stats.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error updating stats:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update stats',
            error: error.message
        });
    }
};

// @desc    Delete stats
// @route   DELETE /api/stats/:id
// @access  Public (for now)
exports.deleteStats = async (req, res) => {
    try {
        const stats = await Stats.findById(req.params.id);
        
        if (!stats) {
            return res.status(404).json({
                success: false,
                message: 'Stats not found'
            });
        }
        
        await stats.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'Stats deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete stats',
            error: error.message
        });
    }
};

// @desc    Toggle stats status
// @route   PUT /api/stats/:id/toggle
// @access  Public (for now)
exports.toggleStatsStatus = async (req, res) => {
    try {
        const stats = await Stats.findById(req.params.id);
        
        if (!stats) {
            return res.status(404).json({
                success: false,
                message: 'Stats not found'
            });
        }
        
        const newStatus = !stats.isActive;
        
        // If activating, deactivate others
        if (newStatus) {
            await Stats.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }
        
        stats.isActive = newStatus;
        await stats.save();
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error toggling stats status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle stats status',
            error: error.message
        });
    }
};