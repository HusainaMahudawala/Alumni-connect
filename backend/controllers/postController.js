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

// Create a new post
exports.createPost = async (req, res) => {
	try {
		const { content } = req.body;
		const user = await User.findById(req.user.id);
		if (!user) return res.status(404).json({ error: 'User not found' });
		const post = new Post({
			content,
			authorId: user._id,
			authorName: user.name,
			authorRole: user.role || 'Student',
		});
		await post.save();
		res.status(201).json(post);
	} catch (err) {
		res.status(500).json({ error: 'Server error' });
	}
};

// Like a post (toggle)
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const userId = req.user.id;
    const userLiked = post.likedBy.includes(userId);
    
    if (userLiked) {
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
    } else {
      post.likedBy.push(userId);
      // Remove from disliked if exists
      post.dislikedBy = post.dislikedBy.filter(id => id.toString() !== userId);
    }
    
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Dislike a post (toggle)
exports.dislikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const userId = req.user.id;
    const userDisliked = post.dislikedBy.includes(userId);
    
    if (userDisliked) {
      post.dislikedBy = post.dislikedBy.filter(id => id.toString() !== userId);
    } else {
      post.dislikedBy.push(userId);
      // Remove from liked if exists
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
    }
    
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
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
    
