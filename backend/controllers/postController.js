const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

// Get all posts
exports.getPosts = async (req, res) => {
	try {
		const posts = await Post.find().sort({ createdAt: -1 });
		res.json(posts);
	} catch (err) {
		res.status(500).json({ error: 'Server error' });
	}
};

// Create a new post with optional video and file attachments
exports.createPost = async (req, res) => {
	try {
		const { content } = req.body;
		const user = await User.findById(req.user.id);
		if (!user) return res.status(404).json({ error: 'User not found' });

		// Prepare post data
		const postData = {
			content,
			authorId: user._id,
			authorName: user.name,
			authorRole: user.role || 'Student',
		};

		// Handle video file if uploaded
		if (req.files && req.files.video) {
			const videoFile = req.files.video[0];
			postData.videoUrl = `/uploads/${videoFile.filename}`;
			postData.videoFileName = videoFile.originalname;
			console.log('Video uploaded:', videoFile.originalname);
		}

		// Handle attached file if uploaded
		if (req.files && req.files.attachedFile) {
			const attachedFile = req.files.attachedFile[0];
			postData.attachedFileUrl = `/uploads/${attachedFile.filename}`;
			postData.attachedFileName = attachedFile.originalname;
			console.log('File uploaded:', attachedFile.originalname);
		}

		const post = new Post(postData);
		await post.save();
		console.log('Post created successfully with ID:', post._id);
		res.status(201).json(post);
	} catch (err) {
		console.error('Post creation error:', err);
		res.status(500).json({ error: 'Server error: ' + err.message });
	}
};

// Like a post (toggle)
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const userIdStr = userId.toString();
    
    // Check current state BEFORE modifications
    const wasLiking = post.likedBy && post.likedBy.some(id => id.toString() === userIdStr);
    const wasDisliking = post.dislikedBy && post.dislikedBy.some(id => id.toString() === userIdStr);
    
    // Reset arrays - ensure user is in neither list
    post.likedBy = (post.likedBy || []).filter(id => id.toString() !== userIdStr);
    post.dislikedBy = (post.dislikedBy || []).filter(id => id.toString() !== userIdStr);
    
    // If wasn't liking, add to likes. If was liking, remove it (toggle off)
    if (!wasLiking) {
      post.likedBy.push(userId);
    }
    
    // Ensure post is marked as modified
    post.markModified('likedBy');
    post.markModified('dislikedBy');
    
    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

// Dislike a post (toggle)
exports.dislikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const userIdStr = userId.toString();
    
    // Check current state BEFORE modifications
    const wasDisliking = post.dislikedBy && post.dislikedBy.some(id => id.toString() === userIdStr);
    const wasLiking = post.likedBy && post.likedBy.some(id => id.toString() === userIdStr);
    
    // Reset arrays - ensure user is in neither list
    post.likedBy = (post.likedBy || []).filter(id => id.toString() !== userIdStr);
    post.dislikedBy = (post.dislikedBy || []).filter(id => id.toString() !== userIdStr);
    
    // If wasn't disliking, add to dislikes. If was disliking, remove it (toggle off)
    if (!wasDisliking) {
      post.dislikedBy.push(userId);
    }
    
    // Ensure post is marked as modified
    post.markModified('likedBy');
    post.markModified('dislikedBy');
    
    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

// Add a comment to a post
exports.commentPost = async (req, res) => {
  try {
    const { text } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.comments.push({
      userId: user._id,
      userName: user.name,
      text,
    });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Rate a post
exports.ratePost = async (req, res) => {
  try {
    const { rating } = req.body;
    if (rating < 0 || rating > 5) return res.status(400).json({ error: 'Invalid rating' });
    
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const userId = req.user.id;
    const existingRating = post.ratedBy.findIndex(r => r.userId.toString() === userId);
    
    if (existingRating !== -1) {
      post.ratedBy[existingRating].rating = rating;
    } else {
      post.ratedBy.push({ userId, rating });
    }
    
    // Calculate average rating
    const totalRating = post.ratedBy.reduce((sum, r) => sum + r.rating, 0);
    post.rating = totalRating / post.ratedBy.length;
    
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // Check if user is the post author
    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }
    
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  try {
    const { content, keepVideo, keepFile } = req.body;
    
    if (!content || !content.trim()) {
      // Check if there are attachments to make the post valid
      if (!req.files || (!req.files.video && !req.files.attachedFile && !keepVideo && !keepFile)) {
        return res.status(400).json({ error: 'Post must have content or attachments' });
      }
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // Check if user is the post author
    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own posts' });
    }
    
    // Update content
    post.content = content || post.content;
    
    // Handle video
    if (req.files && req.files.video) {
      // New video uploaded
      const videoFile = req.files.video[0];
      post.videoUrl = `/uploads/${videoFile.filename}`;
      post.videoFileName = videoFile.originalname;
    } else if (!keepVideo) {
      // Remove existing video
      post.videoUrl = null;
      post.videoFileName = null;
    }
    // else: keep existing video (do nothing)
    
    // Handle file attachment
    if (req.files && req.files.attachedFile) {
      // New file uploaded
      const fileAttachment = req.files.attachedFile[0];
      post.attachedFileUrl = `/uploads/${fileAttachment.filename}`;
      post.attachedFileName = fileAttachment.originalname;
    } else if (!keepFile) {
      // Remove existing file
      post.attachedFileUrl = null;
      post.attachedFileName = null;
    }
    // else: keep existing file (do nothing)
    
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
