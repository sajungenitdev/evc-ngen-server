// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    changePassword
} = require('../controllers/auth.controller');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

// Admin only routes
router.get('/users', protect, admin, getUsers);
router.get('/users/:id', protect, admin, getUser);
router.post('/users', protect, admin, createUser);
router.put('/users/:id', protect, admin, updateUser);
router.delete('/users/:id', protect, admin, deleteUser);
router.put('/users/:id/toggle', protect, admin, toggleUserStatus);

module.exports = router;