// src/controllers/solutionSection.controller.js
const SolutionSection = require('../models/SolutionSection');
const { deleteFromImgBB } = require('../services/imgbb.service');
const fs = require('fs');

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
// GET ACTIVE SOLUTION SECTION
// ============================================
exports.getSolutionSection = async (req, res) => {
    try {
        let solutionSection = await SolutionSection.findOne({ isActive: true });

        if (!solutionSection) {
            solutionSection = await SolutionSection.create({
                heading: 'Deliver Our Solutions',
                subtitle: 'We deliver cutting-edge technologies across Power Quality, EV Charging, Energy Storage, and Battery Testing.',
                items: [
                    {
                        title: 'Power Quality',
                        slug: 'power-quality',
                        subtitle: 'Enhancing Energy Efficiency, Safeguarding Grid Security',
                        description: 'Comprehensive low-voltage power quality solutions that optimize electricity usage across industrial and commercial environments.',
                        link: '/solutions',
                        imageUrl: '/images/solutions/EV-Charging-eBook-landing-page.jpg',
                        order: 0,
                        isActive: true
                    },
                    {
                        title: 'EV Charging',
                        slug: 'ev-charging',
                        subtitle: 'Fast on Demand, Intelligently Efficient',
                        description: 'High-efficiency power modules and reliable charging systems spanning 7kW to 1,280kW for residential, commercial, and fleet use.',
                        link: '/ev-chargers',
                        imageUrl: '/images/solutions/images.jpg',
                        order: 1,
                        isActive: true
                    },
                    {
                        title: 'Energy Storage',
                        slug: 'energy-storage',
                        subtitle: 'Empowering Partners, Empowering Energy Freedom',
                        description: 'Modular storage solutions tailored for utility-scale, commercial & industrial, and microgrid applications.',
                        link: '/about',
                        imageUrl: '/images/solutions/Energy Storage.webp',
                        order: 2,
                        isActive: true
                    },
                    {
                        title: 'Battery Testing',
                        slug: 'battery-testing',
                        subtitle: 'Advanced Battery Test Solutions to Empower Green Energy',
                        description: 'Innovative, intelligent, safe, and reliable test & formation-grading solutions for world-class battery labs and production lines.',
                        link: '/about',
                        imageUrl: '/images/solutions/Battery Testing.jpg',
                        order: 3,
                        isActive: true
                    }
                ],
                isActive: true,
                backgroundColor: '#ffffff',
                textColor: '#071322',
                sectionId: 'solutions'
            });
        }

        res.status(200).json({
            success: true,
            data: solutionSection
        });
    } catch (error) {
        console.error('Error fetching solution section:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch solution section',
            error: error.message
        });
    }
};

// ============================================
// GET ALL SOLUTION SECTIONS
// ============================================
exports.getAllSolutionSections = async (req, res) => {
    try {
        const solutionSections = await SolutionSection.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: solutionSections.length,
            data: solutionSections
        });
    } catch (error) {
        console.error('Error fetching solution sections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch solution sections',
            error: error.message
        });
    }
};

// ============================================
// CREATE SOLUTION SECTION
// ============================================
exports.createSolutionSection = async (req, res) => {
    try {
        console.log('📦 Creating solution section with body:', req.body);
        console.log('🖼️ ImgBB URLs:', req.imgbbUrls);

        if (req.body.isActive) {
            await SolutionSection.updateMany(
                { isActive: true },
                { isActive: false }
            );
        }

        // Parse items if they come as string
        let items = req.body.items;
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                items = [];
            }
        }

        // ✅ Process items with ImgBB URLs
        const processedItems = items.map((item, index) => {
            const processedItem = { ...item };
            
            // If we have an ImgBB URL for this item, use it
            if (req.imgbbUrls && req.imgbbUrls[index]) {
                processedItem.imageUrl = req.imgbbUrls[index];
                processedItem.imageDeleteUrl = req.imgbbDeleteUrls?.[index] || null;
            }
            
            return processedItem;
        });

        const solutionSection = await SolutionSection.create({
            ...req.body,
            items: processedItems
        });

        res.status(201).json({
            success: true,
            data: solutionSection,
            message: 'Solution section created successfully with ImgBB hosting'
        });
    } catch (error) {
        console.error('Error creating solution section:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create solution section',
            error: error.message
        });
    }
};

// ============================================
// UPDATE SOLUTION SECTION
// ============================================
exports.updateSolutionSection = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📦 Updating solution section with body:', req.body);
        console.log('🖼️ ImgBB URLs:', req.imgbbUrls);

        let solutionSection = await SolutionSection.findById(id);

        if (!solutionSection) {
            return res.status(404).json({
                success: false,
                message: 'Solution section not found'
            });
        }

        if (req.body.isActive) {
            await SolutionSection.updateMany(
                { _id: { $ne: id }, isActive: true },
                { isActive: false }
            );
        }

        // Parse items if they come as string
        let items = req.body.items;
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                items = solutionSection.items || [];
            }
        }

        // ✅ Process items with ImgBB URLs
        // Delete old images from ImgBB for items being replaced
        if (req.imgbbUrls && req.imgbbUrls.length > 0) {
            for (let i = 0; i < Math.min(req.imgbbUrls.length, solutionSection.items.length); i++) {
                if (solutionSection.items[i] && solutionSection.items[i].imageDeleteUrl) {
                    await deleteImageFromImgBB(solutionSection.items[i].imageDeleteUrl);
                }
            }
        }

        const processedItems = items.map((item, index) => {
            const processedItem = { ...item };
            
            if (req.imgbbUrls && req.imgbbUrls[index]) {
                processedItem.imageUrl = req.imgbbUrls[index];
                processedItem.imageDeleteUrl = req.imgbbDeleteUrls?.[index] || null;
            }
            
            return processedItem;
        });

        solutionSection = await SolutionSection.findByIdAndUpdate(
            id,
            {
                ...req.body,
                items: processedItems
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: solutionSection,
            message: 'Solution section updated successfully with ImgBB'
        });
    } catch (error) {
        console.error('Error updating solution section:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update solution section',
            error: error.message
        });
    }
};

// ============================================
// DELETE SOLUTION SECTION
// ============================================
exports.deleteSolutionSection = async (req, res) => {
    try {
        const solutionSection = await SolutionSection.findById(req.params.id);

        if (!solutionSection) {
            return res.status(404).json({
                success: false,
                message: 'Solution section not found'
            });
        }

        // ✅ Delete all item images from ImgBB
        if (solutionSection.items && solutionSection.items.length > 0) {
            for (const item of solutionSection.items) {
                if (item.imageDeleteUrl) {
                    await deleteImageFromImgBB(item.imageDeleteUrl);
                }
                // Delete gallery images if they exist
                if (item.galleryImages && item.galleryImages.length > 0) {
                    for (const galleryImage of item.galleryImages) {
                        if (galleryImage.imageDeleteUrl) {
                            await deleteImageFromImgBB(galleryImage.imageDeleteUrl);
                        }
                    }
                }
            }
        }

        await solutionSection.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Solution section and its images deleted successfully from ImgBB'
        });
    } catch (error) {
        console.error('Error deleting solution section:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete solution section',
            error: error.message
        });
    }
};

// ============================================
// TOGGLE SOLUTION SECTION STATUS
// ============================================
exports.toggleSolutionSectionStatus = async (req, res) => {
    try {
        const solutionSection = await SolutionSection.findById(req.params.id);

        if (!solutionSection) {
            return res.status(404).json({
                success: false,
                message: 'Solution section not found'
            });
        }

        const newStatus = !solutionSection.isActive;

        if (newStatus) {
            await SolutionSection.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }

        solutionSection.isActive = newStatus;
        await solutionSection.save();

        res.status(200).json({
            success: true,
            data: solutionSection,
            message: `Solution section ${newStatus ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('Error toggling solution section status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle solution section status',
            error: error.message
        });
    }
};

// ============================================
// IMAGE UPLOAD - SINGLE IMAGE
// ============================================
exports.uploadSolutionImage = async (req, res) => {
    console.log('🚀 ===== UPLOAD IMAGE FUNCTION CALLED =====');
    console.log('📸 req.params:', req.params);

    try {
        const { id, itemIndex } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided.'
            });
        }

        const solutionSection = await SolutionSection.findById(id);
        if (!solutionSection) {
            return res.status(404).json({
                success: false,
                message: 'Solution section not found'
            });
        }

        const index = parseInt(itemIndex);
        if (isNaN(index) || index < 0 || index >= solutionSection.items.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid item index'
            });
        }

        // ✅ Upload to ImgBB
        const { uploadToImgBB } = require('../services/imgbb.service');
        const fileBuffer = fs.readFileSync(req.file.path);
        const base64Image = fileBuffer.toString('base64');

        const result = await uploadToImgBB(
            base64Image,
            `solution-${Date.now()}-${index}`
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to upload image to ImgBB: ' + result.error
            });
        }

        // Delete old image from ImgBB if exists
        if (solutionSection.items[index].imageDeleteUrl) {
            await deleteImageFromImgBB(solutionSection.items[index].imageDeleteUrl);
        }

        solutionSection.items[index].imageUrl = result.url;
        solutionSection.items[index].imageDeleteUrl = result.deleteUrl;
        await solutionSection.save();

        // Clean up temp file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(200).json({
            success: true,
            data: solutionSection,
            message: 'Image uploaded successfully to ImgBB',
            imageUrl: result.url
        });
    } catch (error) {
        console.error('❌ Error uploading solution image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};

// ============================================
// IMAGE UPLOAD - MULTIPLE IMAGES (GALLERY)
// ============================================
exports.uploadSolutionImages = async (req, res) => {
    console.log('🚀 ===== UPLOAD MULTIPLE IMAGES CALLED =====');

    try {
        const { id, itemIndex } = req.params;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No image files provided.'
            });
        }

        const solutionSection = await SolutionSection.findById(id);
        if (!solutionSection) {
            return res.status(404).json({
                success: false,
                message: 'Solution section not found'
            });
        }

        const index = parseInt(itemIndex);
        if (isNaN(index) || index < 0 || index >= solutionSection.items.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid item index'
            });
        }

        // Create gallery array if it doesn't exist
        if (!solutionSection.items[index].galleryImages) {
            solutionSection.items[index].galleryImages = [];
        }

        // ✅ Upload each image to ImgBB
        const { uploadToImgBB } = require('../services/imgbb.service');
        const uploadedImages = [];

        for (const file of req.files) {
            const fileBuffer = fs.readFileSync(file.path);
            const base64Image = fileBuffer.toString('base64');

            const result = await uploadToImgBB(
                base64Image,
                `solution-gallery-${Date.now()}-${Math.random().toString(36).substring(7)}`
            );

            if (result.success) {
                const galleryImage = {
                    url: result.url,
                    imageDeleteUrl: result.deleteUrl,
                    uploadedAt: new Date()
                };
                solutionSection.items[index].galleryImages.push(galleryImage);
                uploadedImages.push(result.url);
            }

            // Clean up temp file
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }

        await solutionSection.save();

        res.status(200).json({
            success: true,
            data: solutionSection,
            message: `${uploadedImages.length} images uploaded successfully to ImgBB`,
            uploadedImages
        });
    } catch (error) {
        console.error('❌ Error uploading solution images:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: error.message
        });
    }
};

// ============================================
// REMOVE SINGLE IMAGE
// ============================================
exports.removeSolutionImage = async (req, res) => {
    try {
        const { id, itemIndex } = req.params;

        const solutionSection = await SolutionSection.findById(id);
        if (!solutionSection) {
            return res.status(404).json({
                success: false,
                message: 'Solution section not found'
            });
        }

        const index = parseInt(itemIndex);
        if (isNaN(index) || index < 0 || index >= solutionSection.items.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid item index'
            });
        }

        // ✅ Delete image from ImgBB
        if (solutionSection.items[index].imageDeleteUrl) {
            await deleteImageFromImgBB(solutionSection.items[index].imageDeleteUrl);
        }

        solutionSection.items[index].imageUrl = '';
        solutionSection.items[index].imageDeleteUrl = null;
        await solutionSection.save();

        res.status(200).json({
            success: true,
            data: solutionSection,
            message: 'Image removed successfully from ImgBB'
        });
    } catch (error) {
        console.error('❌ Error removing solution image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove image',
            error: error.message
        });
    }
};

// ============================================
// REMOVE GALLERY IMAGE
// ============================================
exports.removeGalleryImage = async (req, res) => {
    try {
        const { id, itemIndex, imageIndex } = req.params;

        const solutionSection = await SolutionSection.findById(id);
        if (!solutionSection) {
            return res.status(404).json({
                success: false,
                message: 'Solution section not found'
            });
        }

        const idx = parseInt(itemIndex);
        if (isNaN(idx) || idx < 0 || idx >= solutionSection.items.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid item index'
            });
        }

        const imgIdx = parseInt(imageIndex);
        if (isNaN(imgIdx) || imgIdx < 0 || imgIdx >= solutionSection.items[idx].galleryImages.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid image index'
            });
        }

        // ✅ Delete gallery image from ImgBB
        const galleryImage = solutionSection.items[idx].galleryImages[imgIdx];
        if (galleryImage.imageDeleteUrl) {
            await deleteImageFromImgBB(galleryImage.imageDeleteUrl);
        }

        // Remove the gallery image
        solutionSection.items[idx].galleryImages.splice(imgIdx, 1);
        await solutionSection.save();

        res.status(200).json({
            success: true,
            data: solutionSection,
            message: 'Gallery image removed successfully from ImgBB'
        });
    } catch (error) {
        console.error('❌ Error removing gallery image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove gallery image',
            error: error.message
        });
    }
};