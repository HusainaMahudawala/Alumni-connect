const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

// Get recommended alumni based on student interests
router.get('/alumni/recommended', auth, userController.getRecommendedAlumni);

// Follow an alumni
router.post('/:userId/follow', auth, userController.followAlumni);

// Unfollow an alumni
router.post('/:userId/unfollow', auth, userController.unfollowAlumni);

module.exports = router;
