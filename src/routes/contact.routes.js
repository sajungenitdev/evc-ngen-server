// src/routes/contact.routes.js
const express = require('express');
const router = express.Router();
const {
    createContact,
    getContacts,
    getContact,
    updateContact,
    deleteContact,
    updateContactStatus,
} = require('../controllers/contact.controller');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.post('/', createContact);

// Admin only routes
router.get('/', protect, admin, getContacts);
router.get('/:id', protect, admin, getContact);
router.put('/:id', protect, admin, updateContact);
router.delete('/:id', protect, admin, deleteContact);
router.put('/:id/status', protect, admin, updateContactStatus);

module.exports = router;