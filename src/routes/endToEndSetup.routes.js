// evngen-backend/src/routes/endToEndSetup.routes.js
const express = require('express');
const router = express.Router();
const {
    getEndToEndSetup,
    getAllEndToEndSetup,
    createEndToEndSetup,
    updateEndToEndSetup,
    deleteEndToEndSetup,
    toggleEndToEndSetupStatus
} = require('../controllers/endToEndSetup.controller');

// Public routes
router.get('/', getEndToEndSetup);
router.get('/all', getAllEndToEndSetup);

// Admin routes
router.post('/', createEndToEndSetup);
router.put('/:id', updateEndToEndSetup);
router.delete('/:id', deleteEndToEndSetup);
router.put('/:id/toggle', toggleEndToEndSetupStatus);

module.exports = router;