import React, { useState } from "react";
import axios from "axios";

const PostCard = ({ post, onLike, onComment }) => {
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const currentUserId = localStorage.getItem("userId");
  const isLiked = post.likedBy?.includes(currentUserId);
  const isDisliked = post.dislikedBy?.includes(currentUserId);
  const likeCount = post.likedBy?.length || 0;
  const dislikeCount = post.dislikedBy?.length || 0;

  const handleLike = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/posts/${post._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onLike(post._id);
    } catch {
      alert("Failed to like post.");
    }
    setActionLoading(false);
  };

  const handleDislike = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/posts/${post._id}/dislike`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onLike(post._id);
    } catch {
      alert("Failed to dislike post.");
    }
    setActionLoading(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommentLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/posts/${post._id}/comment`,
        { text: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComment("");
      onComment(post._id);
    } catch {
      alert("Failed to comment.");
    }
    setCommentLoading(false);
  };

  const handleRate = async (value) => {
    setRatingLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/posts/${post._id}/rate`,
        { rating: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRating(value);
      onLike(post._id);
    } catch {
      alert("Failed to rate post.");
    }
    setRatingLoading(false);
  };

  const commentsToShow = showAllComments ? post.comments : (post.comments || []).slice(0, 2);
  const hasMoreComments = post.comments && post.comments.length > 2;

  return (
    <div className="post-card">
      <div className="post-header">
        <span className="avatar">{post.authorName?.[0] || "U"}</span>
        <span className="post-author">{post.authorName}</span>
        <span className="post-role">{post.authorRole}</span>
        <span className="post-date">{new Date(post.createdAt).toLocaleString()}</span>
      </div>

      <div className="post-content">{post.content}</div>

      {post.image && (
        <div className="post-image">
          <img src={post.image} alt="Post" />
        </div>
      )}

      {/* Rating */}
      <div className="post-rating">
        <div className="rating-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`star ${star <= (hoverRating || Math.round(post.rating || 0)) ? 'filled' : ''}`}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={ratingLoading}
              type="button"
            >
              ⭐
            </button>
          ))}
        </div>
        <span className="rating-text">{post.rating ? post.rating.toFixed(1) : 'No ratings'}</span>
      </div>

      <div className="post-actions">
        <button
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={actionLoading}
          type="button"
        >
          👍 {likeCount}
        </button>
        <button
          className={`action-btn ${isDisliked ? 'disliked' : ''}`}
          onClick={handleDislike}
          disabled={actionLoading}
          type="button"
        >
          👎 {dislikeCount}
        </button>
        <button className="action-btn" type="button">
          💬 {post.comments?.length || 0}
        </button>
        <button className="action-btn" type="button">🔗</button>
        <button className="action-btn" type="button">🔖</button>
      </div>

      <div className="post-comments">
        {post.comments && post.comments.length > 0 && (
          <div className="comments-list">
            {commentsToShow.map((c, idx) => (
              <div key={idx} className="comment-item">
                <span className="comment-author">{c.userName || c.authorName}</span>
                <span className="comment-content">{c.text || c.content}</span>
                <span className="comment-date">
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                </span>
              </div>
            ))}
            {hasMoreComments && (
              <button
                type="button"
                className="show-more-comments"
                onClick={() => setShowAllComments(!showAllComments)}
              >
                {showAllComments ? 'Show less' : `Show ${post.comments.length - 2} more comment(s)`}
              </button>
            )}
          </div>
        )}

        <form className="comment-form" onSubmit={handleComment}>
          <input
            className="comment-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            type="text"
          />
          <button
            className="comment-btn"
            type="submit"
            disabled={commentLoading || !comment.trim()}
          >
            {commentLoading ? 'Posting...' : 'Comment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostCard;
