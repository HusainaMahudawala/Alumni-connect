
import React, { useState, useRef } from "react";
import axios from "axios";

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraPhotoPreview, setCameraPhotoPreview] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedFileObj, setAttachedFileObj] = useState(null);
  const [attachedFilePreview, setAttachedFilePreview] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoPreview, setVideoPreview] = useState(null);
  const [capturedVideo, setCapturedVideo] = useState(null);
  const [capturedVideoObj, setCapturedVideoObj] = useState(null);
  const inputRef = useRef();
  const fileInputRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const emojis = ["😀", "😂", "😍", "🤔", "👍", "🎉", "❤️", "😢", "🔥", "💯"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !capturedImage && !capturedVideo) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Create FormData to handle files
      const formData = new FormData();
      formData.append('content', content);
      
      // Append video file if it exists
      if (capturedVideoObj) {
        console.log('Appending video to FormData:', capturedVideoObj.name);
        formData.append('video', capturedVideoObj);
      }
      
      // Append attached file if it exists
      if (attachedFileObj) {
        console.log('Appending file to FormData:', attachedFileObj.name);
        formData.append('attachedFile', attachedFileObj);
      }
      
      const res = await axios.post(
        "http://localhost:5000/api/posts",
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      console.log('Post created successfully:', res.data);
      onPostCreated(res.data);
      handleResetAll();
    } catch (err) {
      console.error('Post error:', err.response?.data || err.message);
      alert("Failed to post: " + (err.response?.data?.error || err.message));
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

  // Open video recorder
  const handleOpenVideoRecorder = async () => {
    setCameraError(null);
    setVideoPreview(null);
    setIsRecording(false);
    setRecordingTime(0);
    recordedChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      });
      streamRef.current = stream;
      setShowVideoModal(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      setCameraError('Could not access camera/microphone. Please check permissions.');
      console.error('Video recorder error:', err);
    }
  };

  // Start recording video
  const handleStartRecording = () => {
    if (streamRef.current && videoRef.current) {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoPreview(url);
        setCapturedVideoObj(blob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Timer for recording duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  // Stop recording video
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  // Format recording time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Confirm and use the video
  const handleConfirmVideo = () => {
    if (videoPreview && capturedVideoObj) {
      // Create a file object from the blob
      const videoFile = new File([capturedVideoObj], `video_${Date.now()}.webm`, { type: 'video/webm' });
      setCapturedVideo(videoPreview);
      setCapturedVideoObj(videoFile);
      handleCloseVideoModal();
    }
  };

  // Retake video
  const handleRetakeVideo = () => {
    setVideoPreview(null);
    setCapturedVideoObj(null);
    recordedChunksRef.current = [];
    setRecordingTime(0);
  };

  // Remove captured video
  const handleRemoveVideo = () => {
    setCapturedVideo(null);
    setCapturedVideoObj(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(null);
  };

  // Close video modal
  const handleCloseVideoModal = () => {
    if (isRecording) {
      handleStopRecording();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowVideoModal(false);
    setCameraError(null);
    setVideoPreview(null);
    setIsRecording(false);
    setRecordingTime(0);
    recordedChunksRef.current = [];
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
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
      console.log('File uploaded:', file.name, 'Type:', file.type);
      setAttachedFile(file.name);
      setAttachedFileObj(file);
      
      // Check if file is an image
      if (file.type.startsWith('image/')) {
        console.log('Image file detected - showing preview');
        const reader = new FileReader();
        reader.onload = (event) => {
          console.log('Image preview set');
          setAttachedFilePreview(event.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        console.log('Non-image file - showing file box instead');
        setAttachedFilePreview(null);
      }
      
      // Reset the file input
      e.target.value = '';
      inputRef.current?.focus();
    }
  };

  const handleOpenFile = () => {
    if (attachedFileObj) {
      // Download the file
      handleDownloadFile(attachedFileObj);
    }
  };

  const handleDownloadFile = (file) => {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Delay revoke to ensure download completes
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    setAttachedFileObj(null);
    setAttachedFilePreview(null);
  };

  const handleResetAll = () => {
    console.log('Resetting all form states');
    setContent("");
    setCapturedImage(null);
    setCapturedVideo(null);
    setCapturedVideoObj(null);
    setAttachedFile(null);
    setAttachedFileObj(null);
    setAttachedFilePreview(null);
    setModalOpen(false);
    setShowEmojiPicker(false);
    setShowVideoModal(false);
    setShowCameraModal(false);
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

              {/* Captured Video Display */}
              {capturedVideo && (
                <div className="captured-media-container">
                  <div className="captured-video-wrapper">
                    <video 
                      src={capturedVideo} 
                      className="captured-video-thumbnail"
                      controls
                    />
                    <button
                      type="button"
                      className="remove-video-btn"
                      onClick={handleRemoveVideo}
                      title="Remove video"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Attached File Display - Small Box Next to Video */}
                  {attachedFile && !attachedFilePreview && (
                    <div className="attached-file-box">
                      <button
                        type="button"
                        className="file-box-btn"
                        onClick={handleOpenFile}
                        title={`Click to open: ${attachedFile}`}
                      >
                        <span className="file-box-icon">{getFileIcon(attachedFile)}</span>
                        <span className="file-box-name">{attachedFile}</span>
                      </button>
                      <button
                        type="button"
                        className="file-box-remove"
                        onClick={handleRemoveAttachment}
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Attached File Display - When No Video */}
              {attachedFile && !capturedVideo && !attachedFilePreview && (
                <div className="attached-file-box-standalone">
                  <button
                    type="button"
                    className="file-box-btn"
                    onClick={handleOpenFile}
                    title={`Click to open: ${attachedFile}`}
                  >
                    <span className="file-box-icon">{getFileIcon(attachedFile)}</span>
                    <span className="file-box-name">{attachedFile}</span>
                  </button>
                  <button
                    type="button"
                    className="file-box-remove"
                    onClick={handleRemoveAttachment}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Image File Preview */}
              {attachedFilePreview && (
                <div className="attached-image-preview-container">
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
                    handleOpenVideoRecorder();
                  }}
                  title="Record video"
                >
                  🎥
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
                  onClick={handleResetAll}
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

      {/* Video Recording Modal */}
      {showVideoModal && (
        <div className="video-modal-bg">
          <div className="video-modal">
            <div className="video-modal-header">
              <h3>Record Your Experience</h3>
              <button
                type="button"
                className="video-close-btn"
                onClick={handleCloseVideoModal}
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
                  onClick={handleCloseVideoModal}
                >
                  Close
                </button>
              </div>
            ) : videoPreview ? (
              <>
                <div className="video-preview-container">
                  <video 
                    src={videoPreview} 
                    className="video-preview-playback"
                    controls
                  />
                </div>
                <div className="video-modal-actions">
                  <button
                    type="button"
                    className="video-retake-btn"
                    onClick={handleRetakeVideo}
                  >
                    🔄 Retake
                  </button>
                  <button
                    type="button"
                    className="video-confirm-btn"
                    onClick={handleConfirmVideo}
                  >
                    ✓ Use Video
                  </button>
                </div>
              </>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="video-recording-feed"
                  autoPlay={true}
                  playsInline={true}
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    backgroundColor: '#000',
                  }}
                />
                
                <div className="video-recording-info">
                  {isRecording && (
                    <div className="recording-indicator">
                      <span className="recording-dot"></span>
                      <span className="recording-text">Recording {formatTime(recordingTime)}</span>
                    </div>
                  )}
                </div>
                
                <div className="video-modal-actions">
                  {!isRecording ? (
                    <>
                      <button
                        type="button"
                        className="video-record-btn"
                        onClick={handleStartRecording}
                      >
                        🔴 Start Recording
                      </button>
                      <button
                        type="button"
                        className="video-cancel-btn"
                        onClick={handleCloseVideoModal}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="video-stop-btn"
                        onClick={handleStopRecording}
                      >
                        ⏹ Stop Recording
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
