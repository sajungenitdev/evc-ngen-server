// evngen-backend/src/routes/heroSectionRoutes.js
const express = require('express');
const router = express.Router();
const {
    getHeroSection,
    getAllHeroSections,
    createHeroSection,
    updateHeroSection,
    deleteHeroSection,
    toggleHeroStatus
} = require('../controllers/heroSection.Controller');

// Public routes - No authentication required
router.get('/', getHeroSection);
router.get('/all', getAllHeroSections);
router.post('/', createHeroSection);
router.put('/:id', updateHeroSection);
router.delete('/:id', deleteHeroSection);
router.put('/:id/toggle', toggleHeroStatus);

module.exports = router;