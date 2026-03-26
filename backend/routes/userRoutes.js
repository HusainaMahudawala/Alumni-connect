const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

// Get recommended alumni based on student interests
router.get('/alumni/recommended', auth, userController.getRecommendedAlumni);

// Follow an alumni
router.post('/:userId/follow', auth, userController.followAlumni);

// Unfollow an alumni
router.post('/:userId/unfollow', auth, userController.unfollowAlumni);

// Admin user management
router.get('/admin/all', auth, role('admin'), userController.adminGetUsers);
router.delete('/admin/:id', auth, role('admin'), userController.adminDeleteUser);

module.exports = router;
