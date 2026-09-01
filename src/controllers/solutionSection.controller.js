// evngen-backend/src/controllers/solutionSection.controller.js
const SolutionSection = require('../models/SolutionSection');

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
        if (req.body.isActive) {
            await SolutionSection.updateMany(
                { isActive: true },
                { isActive: false }
            );
        }

        const solutionSection = await SolutionSection.create(req.body);
        res.status(201).json({
            success: true,
            data: solutionSection
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
        let solutionSection = await SolutionSection.findById(req.params.id);

        if (!solutionSection) {
            return res.status(404).json({
                success: false,
                message: 'Solution section not found'
            });
        }

        if (req.body.isActive) {
            await SolutionSection.updateMany(
                { _id: { $ne: req.params.id }, isActive: true },
                { isActive: false }
            );
        }

        solutionSection = await SolutionSection.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: solutionSection
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

        await solutionSection.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Solution section deleted successfully'
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
            data: solutionSection
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
    console.log('📸 req.file:', req.file);

    try {
        const { id, itemIndex } = req.params;

        // Check if file exists
        if (!req.file) {
            console.log('❌ No file in request!');
            return res.status(400).json({
                success: false,
                message: 'No image file provided. Make sure you send a file with field name "image".'
            });
        }

        console.log('✅ File received:', req.file.originalname);
        console.log('✅ File size:', req.file.size);
        console.log('✅ File mimetype:', req.file.mimetype);

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            console.log('❌ Invalid file type:', req.file.mimetype);
            return res.status(400).json({
                success: false,
                message: `Invalid file type: ${req.file.mimetype}. Allowed: ${allowedTypes.join(', ')}`
            });
        }

        // Find the solution section
        const solutionSection = await SolutionSection.findById(id);
        console.log('📸 Solution section found:', !!solutionSection);

        if (!solutionSection) {
            return res.status(404).json({
                success: false,
                message: 'Solution section not found'
            });
        }

        // Parse and validate item index
        const index = parseInt(itemIndex);
        console.log('📸 Index:', index, 'Total items:', solutionSection.items?.length);

        if (isNaN(index) || index < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid item index. Must be a positive number.'
            });
        }

        // Check if the item exists
        if (!solutionSection.items || index >= solutionSection.items.length) {
            return res.status(400).json({
                success: false,
                message: `Item at index ${index} not found. Total items: ${solutionSection.items?.length || 0}`
            });
        }

        // Generate image URL
        const imageUrl = `/uploads/solutions/${req.file.filename}`;

        // Update the specific item's imageUrl
        solutionSection.items[index].imageUrl = imageUrl;
        solutionSection.items[index].imageFile = req.file.filename;
        await solutionSection.save();

        console.log('✅ Image uploaded successfully:', imageUrl);

        res.status(200).json({
            success: true,
            data: solutionSection,
            message: 'Image uploaded successfully',
            imageUrl
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
    console.log('📸 req.params:', req.params);
    console.log('📸 req.files:', req.files);

    try {
        const { id, itemIndex } = req.params;

        // Check if files exist
        if (!req.files || req.files.length === 0) {
            console.log('❌ No files in request!');
            return res.status(400).json({
                success: false,
                message: 'No image files provided. Make sure you send files with field name "images".'
            });
        }

        console.log(`✅ ${req.files.length} files received`);

        // Find the solution section
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

        // Add each image to the gallery
        const uploadedImages = [];
        for (const file of req.files) {
            const imageUrl = `/uploads/solutions/${file.filename}`;
            solutionSection.items[index].galleryImages.push({
                url: imageUrl,
                filename: file.filename,
                uploadedAt: new Date()
            });
            uploadedImages.push(imageUrl);
        }

        await solutionSection.save();

        console.log(`✅ ${uploadedImages.length} images uploaded successfully`);

        res.status(200).json({
            success: true,
            data: solutionSection,
            message: `${uploadedImages.length} images uploaded successfully`,
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
    console.log('🚀 ===== REMOVE IMAGE CALLED =====');
    console.log('📸 req.params:', req.params);

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

        solutionSection.items[index].imageUrl = '';
        solutionSection.items[index].imageFile = '';
        await solutionSection.save();

        console.log('✅ Image removed successfully');

        res.status(200).json({
            success: true,
            data: solutionSection,
            message: 'Image removed successfully'
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
    console.log('🚀 ===== REMOVE GALLERY IMAGE CALLED =====');
    console.log('📸 req.params:', req.params);

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

        // Remove the gallery image
        solutionSection.items[idx].galleryImages.splice(imgIdx, 1);
        await solutionSection.save();

        console.log('✅ Gallery image removed successfully');

        res.status(200).json({
            success: true,
            data: solutionSection,
            message: 'Gallery image removed successfully'
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