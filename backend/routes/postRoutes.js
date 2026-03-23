const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Get all posts
router.get('/', auth, postController.getPosts);

// Create a post with optional video and file attachments
router.post(
  '/',
  auth,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'attachedFile', maxCount: 1 },
  ]),
  postController.createPost
);

// Like a post
router.post('/:id/like', auth, postController.likePost);

// Dislike a post
router.post('/:id/dislike', auth, postController.dislikePost);

// Comment on a post
router.post('/:id/comment', auth, postController.commentPost);

// Rate a post
router.post('/:id/rate', auth, postController.ratePost);

// Update a post
router.put(
  '/:id',
  auth,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'attachedFile', maxCount: 1 },
  ]),
  postController.updatePost
);

// Delete a post
router.delete('/:id', auth, postController.deletePost);

module.exports = router;
