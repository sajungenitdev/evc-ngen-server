// evngen-backend/src/routes/stats.routes.js
const express = require('express');
const router = express.Router();
const {
    getStats,
    getAllStats,
    createStats,
    updateStats,
    deleteStats,
    toggleStatsStatus
} = require('../controllers/stats.controller');

// Public routes - No authentication required
router.get('/', getStats);
router.get('/all', getAllStats);
router.post('/', createStats);
router.put('/:id', updateStats);
router.delete('/:id', deleteStats);
router.put('/:id/toggle', toggleStatsStatus);

module.exports = router;