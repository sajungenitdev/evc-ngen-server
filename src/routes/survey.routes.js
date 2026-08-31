// src/routes/survey.routes.js
const express = require('express');
const router = express.Router();
const {
    createSurvey,
    getSurveys,
    getSurvey,
    updateSurvey,
    deleteSurvey,
    updateSurveyStatus,
    deleteMultipleSurveys,
} = require('../controllers/survey.controller');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.post('/', createSurvey);

// Admin only routes
router.get('/', protect, admin, getSurveys);
router.get('/:id', protect, admin, getSurvey);
router.put('/:id', protect, admin, updateSurvey);
router.delete('/:id', protect, admin, deleteSurvey);
router.put('/:id/status', protect, admin, updateSurveyStatus);
router.delete('/bulk', protect, admin, deleteMultipleSurveys);

module.exports = router;