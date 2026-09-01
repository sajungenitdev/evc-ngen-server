// evngen-backend/src/controllers/evShopController.js
const EvShop = require('../models/EvShop');

// ============================================
// GET ACTIVE EV SHOP SECTION
// ============================================
exports.getEvShop = async (req, res) => {
    try {
        let evShop = await EvShop.findOne({ isActive: true });

        if (!evShop) {
            // Create default EV Shop section
            evShop = await EvShop.create({
                heading: 'EV Shop Online',
                items: [
                    {
                        title: 'Chargers',
                        buttonText: 'Shop',
                        link: '/ev-chargers?category=chargers',
                        bgClass: 'bg-gradient-to-br from-[#1b854a] to-[#125530]',
                        imageUrl: '/images/help/charger.jpg',
                        order: 0,
                        isActive: true
                    },
                    {
                        title: 'Cables & Connectors',
                        buttonText: 'Shop',
                        link: '/ev-chargers?category=cables',
                        bgClass: 'bg-gradient-to-br from-[#176641] to-[#0a1c2e]',
                        imageUrl: '/images/help/group-of-EV-charging-stations.jpg',
                        order: 1,
                        isActive: true
                    },
                    {
                        title: 'Accessories',
                        buttonText: 'Shop',
                        link: '/ev-chargers?category=accessories',
                        bgClass: 'bg-gradient-to-br from-[#144a35] to-[#071322]',
                        imageUrl: '/images/help/Accessories.jpg',
                        order: 2,
                        isActive: true
                    }
                ],
                viewAllButton: {
                    text: 'View All',
                    link: '/ev-chargers',
                    isActive: true
                },
                isActive: true,
                backgroundColor: '#ffffff',
                textColor: '#071322',
                sectionId: 'ev-shop'
            });
        }

        res.status(200).json({
            success: true,
            data: evShop
        });
    } catch (error) {
        console.error('Error fetching EV Shop:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch EV Shop',
            error: error.message
        });
    }
};

// ============================================
// GET ALL EV SHOP SECTIONS
// ============================================
exports.getAllEvShop = async (req, res) => {
    try {
        const evShops = await EvShop.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: evShops.length,
            data: evShops
        });
    } catch (error) {
        console.error('Error fetching EV Shop sections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch EV Shop sections',
            error: error.message
        });
    }
};

// ============================================
// CREATE EV SHOP SECTION
// ============================================
exports.createEvShop = async (req, res) => {
    try {
        if (req.body.isActive) {
            await EvShop.updateMany(
                { isActive: true },
                { isActive: false }
            );
        }

        const evShop = await EvShop.create(req.body);
        res.status(201).json({
            success: true,
            data: evShop
        });
    } catch (error) {
        console.error('Error creating EV Shop:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create EV Shop',
            error: error.message
        });
    }
};

// ============================================
// UPDATE EV SHOP SECTION
// ============================================
exports.updateEvShop = async (req, res) => {
    try {
        let evShop = await EvShop.findById(req.params.id);

        if (!evShop) {
            return res.status(404).json({
                success: false,
                message: 'EV Shop section not found'
            });
        }

        if (req.body.isActive) {
            await EvShop.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }

        // Remove _id from items before updating
        if (req.body.items) {
            req.body.items = req.body.items.map(item => {
                const { _id, ...cleanItem } = item;
                return cleanItem;
            });
        }

        evShop = await EvShop.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: evShop
        });
    } catch (error) {
        console.error('Error updating EV Shop:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update EV Shop',
            error: error.message
        });
    }
};

// ============================================
// DELETE EV SHOP SECTION
// ============================================
exports.deleteEvShop = async (req, res) => {
    try {
        const evShop = await EvShop.findById(req.params.id);

        if (!evShop) {
            return res.status(404).json({
                success: false,
                message: 'EV Shop section not found'
            });
        }

        await evShop.deleteOne();

        res.status(200).json({
            success: true,
            message: 'EV Shop section deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting EV Shop:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete EV Shop',
            error: error.message
        });
    }
};

// ============================================
// TOGGLE EV SHOP STATUS
// ============================================
exports.toggleEvShopStatus = async (req, res) => {
    try {
        const evShop = await EvShop.findById(req.params.id);

        if (!evShop) {
            return res.status(404).json({
                success: false,
                message: 'EV Shop section not found'
            });
        }

        const newStatus = !evShop.isActive;

        if (newStatus) {
            await EvShop.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }

        evShop.isActive = newStatus;
        await evShop.save();

        res.status(200).json({
            success: true,
            data: evShop
        });
    } catch (error) {
        console.error('Error toggling EV Shop status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle EV Shop status',
            error: error.message
        });
    }
};

// ============================================
// IMAGE UPLOAD - SHOP ITEM
// ============================================
exports.uploadShopItemImage = async (req, res) => {
    try {
        const { id, itemIndex } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const evShop = await EvShop.findById(id);

        if (!evShop) {
            return res.status(404).json({
                success: false,
                message: 'EV Shop section not found'
            });
        }

        const index = parseInt(itemIndex);
        if (isNaN(index) || index < 0 || index >= evShop.items.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid item index'
            });
        }

        const imageUrl = `/uploads/ev-shop/${req.file.filename}`;
        evShop.items[index].imageUrl = imageUrl;
        evShop.items[index].imageFile = req.file.filename;
        await evShop.save();

        res.status(200).json({
            success: true,
            data: evShop,
            message: 'Shop item image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading shop item image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};

// ============================================
// REMOVE SHOP ITEM IMAGE
// ============================================
exports.removeShopItemImage = async (req, res) => {
    try {
        const { id, itemIndex } = req.params;

        const evShop = await EvShop.findById(id);

        if (!evShop) {
            return res.status(404).json({
                success: false,
                message: 'EV Shop section not found'
            });
        }

        const index = parseInt(itemIndex);
        if (isNaN(index) || index < 0 || index >= evShop.items.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid item index'
            });
        }

        evShop.items[index].imageUrl = '';
        evShop.items[index].imageFile = '';
        await evShop.save();

        res.status(200).json({
            success: true,
            data: evShop,
            message: 'Image removed successfully'
        });
    } catch (error) {
        console.error('Error removing shop item image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove image',
            error: error.message
        });
    }
};