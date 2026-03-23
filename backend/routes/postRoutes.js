const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middleware/authMiddleware');

// Get all posts
router.get('/', auth, postController.getPosts);

// Create a post
router.post('/', auth, postController.createPost);

// Like a post
router.post('/:id/like', auth, postController.likePost);

// Dislike a post
router.post('/:id/dislike', auth, postController.dislikePost);

// Comment on a post
router.post('/:id/comment', auth, postController.commentPost);

// Rate a post
router.post('/:id/rate', auth, postController.ratePost);

module.exports = router;
