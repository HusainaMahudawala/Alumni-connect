const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Get recommended alumni based on student interests
router.get('/alumni/recommended', auth, userController.getRecommendedAlumni);

// Student self profile routes
router.get('/me/student', auth, role('student'), userController.getMyStudentProfile);
router.put('/me/student', auth, role('student'), userController.updateMyStudentProfile);
router.post('/me/student/profile-picture', auth, role('student'), upload.single('profilePicture'), userController.uploadMyStudentProfilePicture);

// Follow an alumni
router.post('/:userId/follow', auth, userController.followAlumni);

// Unfollow an alumni
router.post('/:userId/unfollow', auth, userController.unfollowAlumni);

// Admin user management
router.get('/admin/all', auth, role('admin'), userController.adminGetUsers);
router.delete('/admin/:id', auth, role('admin'), userController.adminDeleteUser);

module.exports = router;
