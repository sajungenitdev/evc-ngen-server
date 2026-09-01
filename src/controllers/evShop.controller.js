// src/controllers/evShop.controller.js
const EvShop = require('../models/EvShop');
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
// GET ACTIVE EV SHOP SECTION
// ============================================
exports.getEvShop = async (req, res) => {
    try {
        let evShop = await EvShop.findOne({ isActive: true });

        if (!evShop) {
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

        const data = { ...req.body };

        // Process items with ImgBB URLs
        if (data.items && req.imgbbUrls && req.imgbbUrls.length > 0) {
            data.items = data.items.map((item, index) => ({
                ...item,
                imageUrl: req.imgbbUrls[index] || item.imageUrl || '',
                imageDeleteUrl: req.imgbbDeleteUrls?.[index] || null
            }));
        }

        const evShop = await EvShop.create(data);
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

        const data = { ...req.body };

        // Process items with ImgBB URLs
        if (data.items && req.imgbbUrls && req.imgbbUrls.length > 0) {
            // Delete old images
            for (let i = 0; i < Math.min(req.imgbbUrls.length, evShop.items.length); i++) {
                if (evShop.items[i] && evShop.items[i].imageDeleteUrl) {
                    await deleteImageFromImgBB(evShop.items[i].imageDeleteUrl);
                }
            }

            data.items = data.items.map((item, index) => {
                const { _id, ...cleanItem } = item;
                return {
                    ...cleanItem,
                    imageUrl: req.imgbbUrls[index] || item.imageUrl || '',
                    imageDeleteUrl: req.imgbbDeleteUrls?.[index] || null
                };
            });
        }

        evShop = await EvShop.findByIdAndUpdate(
            req.params.id,
            data,
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

        // Delete all item images from ImgBB
        if (evShop.items && evShop.items.length > 0) {
            for (const item of evShop.items) {
                if (item.imageDeleteUrl) {
                    await deleteImageFromImgBB(item.imageDeleteUrl);
                }
            }
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

        if (!req.imgbbImageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload image: No image URL returned'
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

        if (evShop.items[index] && evShop.items[index].imageDeleteUrl) {
            await deleteImageFromImgBB(evShop.items[index].imageDeleteUrl);
        }

        evShop.items[index].imageUrl = req.imgbbImageUrl;
        evShop.items[index].imageDeleteUrl = req.imgbbDeleteUrl;
        await evShop.save();

        res.status(200).json({
            success: true,
            data: evShop,
            message: 'Shop item image uploaded successfully to ImgBB'
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

        if (evShop.items[index] && evShop.items[index].imageDeleteUrl) {
            await deleteImageFromImgBB(evShop.items[index].imageDeleteUrl);
        }

        evShop.items[index].imageUrl = '';
        evShop.items[index].imageDeleteUrl = null;
        evShop.items[index].imageFile = '';
        await evShop.save();

        res.status(200).json({
            success: true,
            data: evShop,
            message: 'Image removed successfully from ImgBB'
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