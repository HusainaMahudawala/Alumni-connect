import React from "react";
import "./AlumniCard.css";

const API_HOST = "http://localhost:5000";

function getProfileImage(profilePicture, name) {
  if (!profilePicture) return null;
  if (profilePicture.startsWith("http")) return profilePicture;
  return `${API_HOST}${profilePicture}`;
}

function AlumniCard({ alumni, onViewProfile, onConnect, onCollaborate }) {
  const profileImage = getProfileImage(alumni.profilePicture, alumni.name);

  return (
    <article className="alumni-card">
      <div className="alumni-card-header">
        <div className="alumni-avatar-wrap">
          {profileImage ? (
            <img src={profileImage} alt={alumni.name} className="alumni-avatar" />
          ) : (
            <div className="alumni-avatar-fallback">{(alumni.name || "A").charAt(0).toUpperCase()}</div>
          )}
        </div>

        <div className="alumni-card-title">
          <h3>{alumni.name || "Unnamed Alumni"}</h3>
          <p>{alumni.jobTitle || "Professional"}</p>
        </div>
      </div>

      <div className="alumni-card-meta">
        <p>
          <span>Company:</span> {alumni.currentCompany || "Not specified"}
        </p>
        <p>
          <span>Industry:</span> {alumni.industry || "Not specified"}
        </p>
        <p>
          <span>Location:</span> {alumni.location || "Not specified"}
        </p>
        <p>
          <span>Graduation Year:</span> {alumni.graduationYear || "Not specified"}
        </p>
      </div>

      <div className="alumni-skill-wrap">
        {(alumni.skills || []).length > 0 ? (
          alumni.skills.slice(0, 6).map((skill) => (
            <span key={`${alumni._id}-${skill}`} className="alumni-skill-pill">
              {skill}
            </span>
          ))
        ) : (
          <span className="alumni-skill-empty">No skills listed</span>
        )}
      </div>

      {alumni.linkedin ? (
        <a className="alumni-linkedin" href={alumni.linkedin} target="_blank" rel="noreferrer">
          View LinkedIn
        </a>
      ) : (
        <p className="alumni-linkedin empty">LinkedIn not added</p>
      )}

      <div className="alumni-card-actions">
        <button type="button" className="btn btn-primary" onClick={() => onViewProfile(alumni)}>
          View Profile
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => onConnect(alumni)}>
          Connect / Message
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onCollaborate(alumni)}>
          Offer Collaboration
        </button>
      </div>
    </article>
  );
}

export default AlumniCard;
