import React, { useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";

const PostCard = ({ post, onLike, onComment, userId }) => {
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [enlargedMedia, setEnlargedMedia] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [savedPosts, setSavedPosts] = useState(JSON.parse(localStorage.getItem('savedPosts') || '[]'));
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [likeDislikeInFlight, setLikeDislikeInFlight] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVideo, setEditVideo] = useState(post.videoUrl || null);
  const [editFile, setEditFile] = useState(post.attachedFileUrl || null);
  const [newVideo, setNewVideo] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [showEditCameraModal, setShowEditCameraModal] = useState(false);
  const [editCameraVideo, setEditCameraVideo] = useState(null);
  const [editCameraVideoPreview, setEditCameraVideoPreview] = useState(null);
  const [isEditRecording, setIsEditRecording] = useState(false);
  const [editRecordingTime, setEditRecordingTime] = useState(0);
  const editVideoRef = React.useRef(null);
  const editCanvasRef = React.useRef(null);
  const editStreamRef = React.useRef(null);
  const editMediaRecorderRef = React.useRef(null);
  const editRecordedChunksRef = React.useRef([]);
  const editRecordingTimerRef = React.useRef(null);
  const [removeConfirmation, setRemoveConfirmation] = useState(null); // 'video' or 'file'

  // Use userId from prop, fallback to localStorage
  const currentUserId = userId || localStorage.getItem("userId");
  
  if (!currentUserId) {
    console.warn('⚠️  WARNING: No userId available at all! userId prop:', userId, 'localStorage:', localStorage.getItem("userId"));
  }
  
  const isLiked = post.likedBy?.some(id => id.toString() === currentUserId);
  const isDisliked = post.dislikedBy?.some(id => id.toString() === currentUserId);
  const isSaved = savedPosts.includes(post._id);
  const likeCount = post.likedBy?.length || 0;
  const dislikeCount = post.dislikedBy?.length || 0;
  const attachmentCount = (post.videoUrl ? 1 : 0) + (post.attachedFileUrl ? 1 : 0);
  
  // Debug: Check if this is user's own post
  const authorIdStr = post.authorId?.toString ? post.authorId.toString() : post.authorId;
  const isOwnPost = post.authorId && currentUserId && authorIdStr === currentUserId;
  
  console.log(`Post ${post._id.slice(-6)}: userId=${currentUserId}, authorId=${authorIdStr}, isOwnPost=${isOwnPost}`);
  
  // Log like/dislike state
  React.useEffect(() => {
    console.log(`Post ${post._id.slice(-6)}: Likes=${likeCount}, Dislikes=${dislikeCount}, IsLiked=${isLiked}, IsDisliked=${isDisliked}`);
  }, [likeCount, dislikeCount, isLiked, isDisliked, post._id]);

  const handleLike = async () => {
    if (actionLoading || likeDislikeInFlight) return;
    
    setActionLoading(true);
    setLikeDislikeInFlight(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/posts/${post._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onLike(post._id);
    } catch (error) {
      console.error("Like error:", error);
      alert("Failed to like post.");
    } finally {
      setActionLoading(false);
      setLikeDislikeInFlight(false);
    }
  };

  const handleDislike = async () => {
    if (actionLoading || likeDislikeInFlight) return;
    
    setActionLoading(true);
    setLikeDislikeInFlight(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/posts/${post._id}/dislike`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onLike(post._id);
    } catch (error) {
      console.error("Dislike error:", error);
      alert("Failed to dislike post.");
    } finally {
      setActionLoading(false);
      setLikeDislikeInFlight(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/posts/${post._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Post deleted successfully.");
      onLike(post._id);
      setShowOptions(false);
    } catch (error) {
      alert("Failed to delete post: " + (error.response?.data?.message || error.message));
    }
    setDeleteLoading(false);
  };

  const handleEditPost = async () => {
    if (!window.confirm("Are you sure you want to edit this post?")) return;
    
    if (!editContent.trim() && !newVideo && !newFile && !editVideo && !editFile) {
      alert("Post must have content or attachments.");
      return;
    }
    
    setUpdateLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('content', editContent);
      
      // Append new video if selected
      if (newVideo) {
        formData.append('video', newVideo);
      }
      
      // Append new file if selected
      if (newFile) {
        formData.append('attachedFile', newFile);
      }
      
      // Append flags to indicate what to keep
      if (editVideo) {
        formData.append('keepVideo', 'true');
      }
      if (editFile) {
        formData.append('keepFile', 'true');
      }
      
      const response = await axios.put(
        `http://localhost:5000/api/posts/${post._id}`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      alert("Post updated successfully.");
      setShowEditModal(false);
      onLike(post._id);
    } catch (error) {
      alert("Failed to update post: " + (error.response?.data?.message || error.message));
    }
    setUpdateLoading(false);
  };

  // Edit Camera Modal Handlers
  const handleOpenEditCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      editStreamRef.current = stream;
      setShowEditCameraModal(true);
      setTimeout(() => {
        if (editVideoRef.current) {
          editVideoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        alert('Camera permission denied. Please enable camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        alert('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        alert('Camera is already in use by another application.');
      } else {
        alert('Could not access camera: ' + err.message);
      }
      console.error('Camera error:', err);
    }
  };

  const handleStartEditRecording = () => {
    if (!editStreamRef.current) return;
    
    editRecordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(editStreamRef.current);
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        editRecordedChunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(editRecordedChunksRef.current, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      setEditCameraVideoPreview(videoUrl);
      setEditCameraVideo(blob);
    };
    
    mediaRecorder.start();
    editMediaRecorderRef.current = mediaRecorder;
    setIsEditRecording(true);
    setEditRecordingTime(0);
    
    editRecordingTimerRef.current = setInterval(() => {
      setEditRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const handleStopEditRecording = () => {
    if (editMediaRecorderRef.current && editMediaRecorderRef.current.state !== 'inactive') {
      editMediaRecorderRef.current.stop();
      setIsEditRecording(false);
      clearInterval(editRecordingTimerRef.current);
      
      editStreamRef.current?.getTracks().forEach((track) => track.stop());
      setShowEditCameraModal(false);
    }
  };

  const handleRetakeEditVideo = () => {
    setEditCameraVideo(null);
    setEditCameraVideoPreview(null);
    setEditRecordingTime(0);
    editRecordedChunksRef.current = [];
  };

  const handleConfirmRemoveEditAttachment = (type) => {
    if (window.confirm(`Are you sure you want to remove this ${type}?`)) {
      if (type === 'video') {
        setEditVideo(null);
        setNewVideo(null);
      } else if (type === 'file') {
        setEditFile(null);
        setNewFile(null);
      }
    }
  };

  const handleSavePost = () => {
    try {
      let updated = [...savedPosts];
      if (updated.includes(post._id)) {
        updated = updated.filter(id => id !== post._id);
      } else {
        updated.push(post._id);
      }
      setSavedPosts(updated);
      localStorage.setItem('savedPosts', JSON.stringify(updated));
    } catch (error) {
      alert("Failed to save post.");
    }
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
          <span className="avatar">{post.authorName?.[0] || "U"}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="post-author">{post.authorName}</span>
            <span className="post-role">{post.authorRole}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px', justifyContent: 'flex-end' }}>
          <span className="post-date" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{new Date(post.createdAt).toLocaleString()}</span>
          {isOwnPost && (
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                onClick={() => setShowEditModal(true)}
                style={{
                  background: 'white',
                  border: '1px solid #ccc',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                type="button"
                title="Edit post"
              >
                ✏️
              </button>
              <button
                onClick={handleDeletePost}
                disabled={deleteLoading}
                style={{
                  background: 'white',
                  border: '1px solid #ccc',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: deleteLoading ? 0.6 : 1
                }}
                type="button"
                title="Delete post"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
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
          disabled={actionLoading || likeDislikeInFlight}
          type="button"
        >
          👍 {likeCount}
        </button>
        <button
          className={`action-btn ${isDisliked ? 'disliked' : ''}`}
          onClick={handleDislike}
          disabled={actionLoading || likeDislikeInFlight}
          type="button"
        >
          👎 {dislikeCount}
        </button>
        <button className="action-btn" type="button">
          💬 {post.comments?.length || 0}
        </button>
        <button 
          className={`action-btn ${(post.videoUrl || post.attachedFileUrl) ? 'has-attachment' : ''}`}
          onClick={() => setShowAttachmentsModal(!showAttachmentsModal)}
          type="button"
          title={attachmentCount > 0 ? `Click to view ${attachmentCount} attachment(s)` : "No attachments"}
        >
          🔗 {attachmentCount}
        </button>
        <button 
          className={`action-btn ${isSaved ? 'saved' : ''}`}
          onClick={handleSavePost}
          type="button"
          title={isSaved ? "Remove from saved" : "Save post"}
        >
          🔖 {isSaved ? '✓' : ''}
        </button>
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

      {/* Attachments Modal */}
      {/* Attachments Modal - Rendered as Portal */}
      {showAttachmentsModal && (post.videoUrl || post.attachedFileUrl) && !enlargedMedia && ReactDOM.createPortal(
        <div className="attachments-modal-bg" onClick={() => setShowAttachmentsModal(false)}>
          <div className="attachments-modal" onClick={(e) => e.stopPropagation()}>
            <div className="attachments-modal-header">
              <h3>Attachments</h3>
              <button
                className="attachments-close-btn"
                onClick={() => setShowAttachmentsModal(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="attachments-container">
              {/* Video Thumbnail */}
              {post.videoUrl && (
                <div
                  className="attachment-thumbnail attachment-video"
                  onClick={() => setEnlargedMedia({ type: 'video', url: post.videoUrl, name: post.videoFileName })}
                >
                  <video 
                    width="100%" 
                    height="100%"
                    style={{ objectFit: 'cover' }}
                  >
                    <source src={`http://localhost:5000${post.videoUrl}`} type="video/webm" />
                  </video>
                </div>
              )}

              {/* File Box */}
              {post.attachedFileUrl && (
                <div
                  className="attachment-thumbnail attachment-file"
                  onClick={() => setEnlargedMedia({ type: 'file', url: post.attachedFileUrl, name: post.attachedFileName })}
                >
                  <div className="attachment-file-icon">📎</div>
                  <div className="attachment-file-info">
                    <p className="attachment-file-name">{post.attachedFileName}</p>
                    <p className="attachment-file-hint">Click to view</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Enlarged Media View - Rendered as Portal */}
      {enlargedMedia && ReactDOM.createPortal(
        <div className="attachments-enlarged-bg" onClick={() => setEnlargedMedia(null)}>
          <div className="attachments-enlarged-container" onClick={(e) => e.stopPropagation()}>
            <button
              className="attachments-enlarged-close"
              onClick={() => setEnlargedMedia(null)}
              type="button"
            >
              ✕
            </button>
            {enlargedMedia.type === 'video' ? (
              <video 
                controls 
                autoPlay
                className="attachments-enlarged-video"
              >
                <source src={`http://localhost:5000${enlargedMedia.url}`} type="video/webm" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="attachments-enlarged-file">
                <h3>{enlargedMedia.name}</h3>
                <p>File: {enlargedMedia.name}</p>
                <a 
                  href={`http://localhost:5000${enlargedMedia.url}`}
                  download={enlargedMedia.name}
                  className="attachments-download-btn"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal - Rendered as Portal */}
      {showEditModal && ReactDOM.createPortal(
        <div className="edit-post-modal-bg" onClick={() => setShowEditModal(false)}>
          <div className="edit-post-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Post</h2>
            
            {/* Content textarea */}
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="What's on your mind?"
              className="edit-post-modal-input"
            />

            {/* Current attachments */}
            {(editVideo || editFile) && (
              <div className="edit-post-attachments-section">
                <h4>Current Attachments:</h4>
                {editVideo && (
                  <div className="edit-post-attachment-item">
                    <p>🎥 Video attached</p>
                    <button
                      onClick={() => handleConfirmRemoveEditAttachment('video')}
                      className="edit-post-attachment-remove-btn"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {editFile && (
                  <div className="edit-post-attachment-item">
                    <p>📎 {post.attachedFileName}</p>
                    <button
                      onClick={() => handleConfirmRemoveEditAttachment('file')}
                      className="edit-post-attachment-remove-btn"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
            {!editVideo && !editFile && (
              <div className="edit-post-attachments-section">
                <h4>Current Attachments:</h4>
                <p className="edit-post-no-attachments">No attachments</p>
              </div>
            )}

            {/* Add new attachments */}
            <div className="edit-post-file-section">
              <div className="edit-post-file-input-wrapper">
                <button
                  onClick={handleOpenEditCamera}
                  className="edit-camera-button"
                  type="button"
                >
                  📹 Add/Replace Video
                </button>
                {editCameraVideoPreview && <span className="edit-post-file-selected">✓ Video recorded</span>}
                {newVideo && <span className="edit-post-file-selected">✓ {newVideo.name}</span>}
              </div>
              
              <div className="edit-post-file-input-wrapper">
                <input
                  type="file"
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                  id="edit-file-input"
                />
                <label htmlFor="edit-file-input" className="edit-post-file-input-label">
                  📎 Add/Replace File
                </label>
                {newFile && <span className="edit-post-file-selected">✓ {newFile.name}</span>}
              </div>
            </div>

            {/* Buttons */}
            <div className="edit-post-modal-actions">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditContent(post.content);
                  setEditVideo(post.videoUrl || null);
                  setEditFile(post.attachedFileUrl || null);
                  setNewVideo(null);
                  setNewFile(null);
                }}
                className="cancel-btn"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleEditPost}
                disabled={updateLoading}
                className="save-btn"
                type="button"
              >
                {updateLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Camera Modal - Rendered as Portal */}
      {showEditCameraModal && ReactDOM.createPortal(
        <div className="edit-camera-modal-bg">
          <div className="camera-modal">
            <div className="camera-modal-header">
              <h3>Record Video</h3>
              <button
                className="camera-close-btn"
                onClick={() => {
                  setShowEditCameraModal(false);
                  editStreamRef.current?.getTracks().forEach((track) => track.stop());
                  if (isEditRecording) {
                    editMediaRecorderRef.current?.stop();
                    setIsEditRecording(false);
                    clearInterval(editRecordingTimerRef.current);
                  }
                }}
                type="button"
              >
                ✕
              </button>
            </div>

            {!editCameraVideoPreview ? (
              <>
                <video
                  ref={editVideoRef}
                  className="camera-video"
                  autoPlay
                  playsInline
                />
                <div style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(100, 116, 139, 0.8)', marginTop: '12px' }}>
                  {isEditRecording && <span>Recording: {editRecordingTime}s</span>}
                </div>
                <div className="camera-modal-actions">
                  {!isEditRecording ? (
                    <button
                      onClick={handleStartEditRecording}
                      className="camera-capture-btn"
                      type="button"
                    >
                      🔴 Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={handleStopEditRecording}
                      className="camera-capture-btn"
                      style={{ background: '#dc3545' }}
                      type="button"
                    >
                      ⏹ Stop Recording
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowEditCameraModal(false);
                      editStreamRef.current?.getTracks().forEach((track) => track.stop());
                    }}
                    className="camera-cancel-btn"
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <video
                  src={editCameraVideoPreview}
                  controls
                  className="camera-video"
                />
                <div className="camera-modal-actions">
                  <button
                    onClick={handleRetakeEditVideo}
                    className="camera-cancel-btn"
                    type="button"
                  >
                    Retake
                  </button>
                  <button
                    onClick={() => {
                      setNewVideo(editCameraVideo);
                      setShowEditCameraModal(false);
                      setEditCameraVideo(null);
                      setEditCameraVideoPreview(null);
                    }}
                    className="camera-capture-btn"
                    type="button"
                  >
                    ✓ Use Video
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PostCard;
