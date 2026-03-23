
import React, { useState, useRef } from "react";
import axios from "axios";

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraPhotoPreview, setCameraPhotoPreview] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedFileObj, setAttachedFileObj] = useState(null);
  const [attachedFilePreview, setAttachedFilePreview] = useState(null);
  const [openedFile, setOpenedFile] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const inputRef = useRef();
  const fileInputRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef(null);

  const emojis = ["😀", "😂", "😍", "🤔", "👍", "🎉", "❤️", "😢", "🔥", "💯"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !capturedImage) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/posts",
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContent("");
      setCapturedImage(null);
      setAttachedFile(null);
      setAttachedFilePreview(null);
      setModalOpen(false);
      setShowEmojiPicker(false);
      onPostCreated(res.data);
    } catch (err) {
      alert("Failed to post.");
    }
    setLoading(false);
  };

  // Open camera
  const handleOpenCamera = async () => {
    setCameraError(null);
    setCameraPhotoPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      streamRef.current = stream;
      setShowCameraModal(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      setCameraError('Could not access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  // Capture photo from camera
  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      // Store the preview for the camera modal
      const imageData = canvas.toDataURL('image/jpeg');
      setCameraPhotoPreview(imageData);
    }
  };

  // Confirm and use the photo
  const handleConfirmPhoto = () => {
    setCapturedImage(cameraPhotoPreview);
    handleCloseCameraModal();
  };

  // Retake photo
  const handleRetakePhoto = () => {
    setCameraPhotoPreview(null);
  };

  // Remove captured image
  const handleRemoveImage = () => {
    setCapturedImage(null);
  };

  // Enlarge image
  const handleEnlargeImage = (imageData) => {
    setEnlargedImage(imageData);
  };

  // Close camera
  const handleCloseCameraModal = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
    setCameraError(null);
    setCameraPhotoPreview(null);
    inputRef.current?.focus();
  };

  // Open modal on input focus
  const handleInputFocus = () => {
    setModalOpen(true);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  // Close modal on background click
  const handleModalClose = (e) => {
    if (e.target.classList.contains("create-post-modal-bg")) {
      setModalOpen(false);
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiClick = (emoji) => {
    setContent(content + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    
    const iconMap = {
      // Images
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️', 'svg': '🖼️',
      // Documents
      'pdf': '📄', 'doc': '📘', 'docx': '📘', 'txt': '📝', 'md': '📝',
      // Sheets
      'xls': '📊', 'xlsx': '📊', 'csv': '📊',
      // Code
      'js': '</>', 'ts': '</>', 'jsx': '</>', 'tsx': '</>', 'css': '💅', 'html': '🌐', 'json': '{ }', 'py': '🐍',
      // Archives
      'zip': '📦', 'rar': '📦', 'tar': '📦', '7z': '📦',
      // Video
      'mp4': '🎥', 'avi': '🎥', 'mov': '🎥', 'wmv': '🎥',
      // Audio
      'mp3': '🎵', 'wav': '🎵', 'flac': '🎵', 'm4a': '🎵',
      // Presentation
      'ppt': '📽️', 'pptx': '📽️',
    };
    
    return iconMap[ext] || '📎';
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file.name);
      setAttachedFileObj(file);
      
      // Check if file is an image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setAttachedFilePreview(event.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedFilePreview(null);
      }
      
      // Reset the file input
      e.target.value = '';
      inputRef.current?.focus();
    }
  };

  const handleOpenFile = () => {
    if (attachedFileObj) {
      setOpenedFile(attachedFileObj);
    }
  };

  const handleCloseOpenedFile = () => {
    setOpenedFile(null);
  };

  const handleDownloadFile = (file) => {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    setAttachedFileObj(null);
    setAttachedFilePreview(null);
    setOpenedFile(null);
  };

  return (
    <>
      <div className="create-post-card">
        <div className="create-post-row">
          <span className="avatar">U</span>
          <input
            className="create-post-input"
            value={content}
            onFocus={handleInputFocus}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with the community..."
          />
          <div className="create-post-icons">
            <span className="icon">📷</span>
            <span className="icon">😊</span>
            <span className="icon">📎</span>
          </div>
          <button className="create-post-btn" type="button" onClick={handleInputFocus}>
            Post
          </button>
        </div>
      </div>
      {modalOpen && (
        <div className="create-post-modal-bg" onClick={handleModalClose}>
          <div className="create-post-modal">
            <form onSubmit={handleSubmit}>
              <textarea
                ref={inputRef}
                className="create-post-modal-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                autoFocus
              />
              
              {/* Captured Image Display */}
              {capturedImage && (
                <div className="captured-image-container">
                  <div className="captured-image-wrapper">
                    <img 
                      src={capturedImage} 
                      alt="Captured" 
                      className="captured-image-thumbnail"
                      onClick={() => handleEnlargeImage(capturedImage)}
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={handleRemoveImage}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Attached File Display */}
              {attachedFile && (
                <div className="attached-file-container">
                  {attachedFilePreview ? (
                    <div className="attached-image-wrapper">
                      <img 
                        src={attachedFilePreview} 
                        alt="Attachment" 
                        className="attached-image-thumbnail"
                        onClick={() => handleEnlargeImage(attachedFilePreview)}
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={handleRemoveAttachment}
                        title="Remove attachment"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="attached-file-item">
                      <button
                        type="button"
                        className="attachment-open-btn"
                        onClick={handleOpenFile}
                        title="Open file"
                      >
                        <span className="attachment-icon">{getFileIcon(attachedFile)}</span>
                        <span className="attachment-name">{attachedFile}</span>
                      </button>
                      <button
                        type="button"
                        className="remove-attachment-btn"
                        onClick={handleRemoveAttachment}
                        title="Remove attachment"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Opened File Display */}
              {openedFile && (
                <div className="opened-file-container">
                  <div className="opened-file-header">
                    <span className="opened-file-icon">{getFileIcon(openedFile.name)}</span>
                    <span className="opened-file-name">{openedFile.name}</span>
                    <button
                      type="button"
                      className="opened-file-close-btn"
                      onClick={handleCloseOpenedFile}
                      title="Close file"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="opened-file-preview">
                    <p>File ready to be attached</p>
                    <button
                      type="button"
                      className="download-file-btn"
                      onClick={() => handleDownloadFile(openedFile)}
                    >
                      💾 Download
                    </button>
                  </div>
                </div>
              )}
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="emoji-picker">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="emoji-btn"
                      onClick={() => handleEmojiClick(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="create-post-modal-icons">
                <button
                  type="button"
                  className="modal-icon-btn"
                  onClick={() => {
                    handleOpenCamera();
                  }}
                  title="Open camera"
                >
                  📷
                </button>
                <button
                  type="button"
                  className="modal-icon-btn"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Add emoji"
                >
                  😊
                </button>
                <button
                  type="button"
                  className="modal-icon-btn"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  title="Add attachment"
                >
                  📎
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              
              <div className="create-post-modal-actions">
                <button
                  className="create-post-btn"
                  type="submit"
                  disabled={loading || !content.trim()}
                >
                  {loading ? "Posting..." : "Post"}
                </button>
                <button
                  type="button"
                  className="create-post-btn cancel"
                  onClick={() => {
                    setModalOpen(false);
                    setShowEmojiPicker(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="camera-modal-bg">
          <div className="camera-modal">
            <div className="camera-modal-header">
              <h3>Take a Photo</h3>
              <button
                type="button"
                className="camera-close-btn"
                onClick={handleCloseCameraModal}
              >
                ✕
              </button>
            </div>
            
            {cameraError ? (
              <div className="camera-error">
                <p>{cameraError}</p>
                <button
                  type="button"
                  className="create-post-btn"
                  onClick={handleCloseCameraModal}
                >
                  Close
                </button>
              </div>
            ) : cameraPhotoPreview ? (
              <>
                <div className="camera-preview-container">
                  <img 
                    src={cameraPhotoPreview} 
                    alt="Preview" 
                    className="camera-preview-image"
                  />
                  <button
                    type="button"
                    className="preview-remove-btn"
                    onClick={handleRemoveImage}
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
                <div className="camera-modal-actions">
                  <button
                    type="button"
                    className="camera-capture-btn"
                    onClick={handleRetakePhoto}
                  >
                    🔄 Retake
                  </button>
                  <button
                    type="button"
                    className="camera-confirm-btn"
                    onClick={handleConfirmPhoto}
                  >
                    ✓ Use Photo
                  </button>
                </div>
              </>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="camera-video"
                  autoPlay={true}
                  playsInline={true}
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    backgroundColor: '#000',
                  }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                <div className="camera-modal-actions">
                  <button
                    type="button"
                    className="camera-capture-btn"
                    onClick={handleCapturePhoto}
                  >
                    📸 Capture Photo
                  </button>
                  <button
                    type="button"
                    className="camera-cancel-btn"
                    onClick={handleCloseCameraModal}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div 
          className="enlarged-image-modal-bg" 
          onClick={() => setEnlargedImage(null)}
        >
          <div className="enlarged-image-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="enlarged-image-close-btn"
              onClick={() => setEnlargedImage(null)}
            >
              ✕
            </button>
            <img 
              src={enlargedImage} 
              alt="Enlarged" 
              className="enlarged-image"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CreatePost;
