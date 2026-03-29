
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Events.css";

const API_BASE = "http://localhost:5000/api";

const Events = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());

  // Countdown timer state
  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    console.log("🚀 Events component mounted, fetching events...");
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const timer = setInterval(() => updateCountdowns(), 1000);
    return () => clearInterval(timer);
  }, [upcomingEvents, featuredEvent]);

  const fetchEvents = async () => {
    try {
      console.log("🔄 Fetching events from:", API_BASE);
      setLoading(true);
      const token = localStorage.getItem("token");

      // Get all events - NO AUTH REQUIRED
      console.log("📡 Getting all events...");
      const eventsRes = await axios.get(`${API_BASE}/events`);
      console.log("✅ Events response:", eventsRes.data);

      // Get featured event - NO AUTH REQUIRED
      console.log("📡 Getting featured event...");
      const featuredRes = await axios.get(`${API_BASE}/events/featured`);
      console.log("✅ Featured response:", featuredRes.data);

      // Get user's registered events (if authenticated)
      let myEventsRes = { data: { events: [] } };
      if (token) {
        try {
          console.log("📡 Getting registered events...");
          myEventsRes = await axios.get(`${API_BASE}/events/my/registered`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("✅ Registered events response:", myEventsRes.data);
        } catch (err) {
          console.log("⚠️ Not authenticated or no registered events:", err.message);
        }
      }

      setAllEvents(eventsRes.data.events || []);
      setFeaturedEvent(featuredRes.data.event);
      setMyEvents(myEventsRes.data.events || []);

      // Set registered events for UI
      const registeredIds = new Set(
        (myEventsRes.data.events || []).map(e => e._id)
      );
      setRegisteredEventIds(registeredIds);

      // Filter upcoming events (exclude featured)
      const upcoming = (eventsRes.data.events || []).filter(
        e => !featuredRes.data.event || e._id !== featuredRes.data.event._id
      );
      setUpcomingEvents(upcoming.slice(0, 12));

      console.log("✅ Events loaded successfully");
      console.log(`📊 Total events: ${(eventsRes.data.events || []).length}, Featured: ${featuredRes.data.event ? 'Yes' : 'No'}, My events: ${(myEventsRes.data.events || []).length}`);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching events:", err);
      console.error("Error details:", err.response?.data || err.message);
      setError(`Failed to load events: ${err.response?.data?.message || err.message}`);
      setLoading(false);
    }
  };

  const updateCountdowns = () => {
    const newCountdowns = {};
    const now = new Date();

    [...(upcomingEvents || []), ...(featuredEvent ? [featuredEvent] : [])].forEach(event => {
      const eventDate = new Date(event.startDate);
      const diff = eventDate - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);

        newCountdowns[event._id] =
          days > 0
            ? `${days}d ${hours}h`
            : `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      } else {
        newCountdowns[event._id] = "Started";
      }
    });

    setCountdowns(newCountdowns);
  };

  const handleRegister = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/events/${eventId}/register`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRegisteredEventIds(new Set([...registeredEventIds, eventId]));
      fetchEvents(); // Refresh to update registered count
    } catch (err) {
      alert(err.response?.data?.message || "Failed to register");
    }
  };

  const handleUnregister = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/events/${eventId}/register`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newSet = new Set(registeredEventIds);
      newSet.delete(eventId);
      setRegisteredEventIds(newSet);
      fetchEvents(); // Refresh
    } catch (err) {
      alert(err.response?.data?.message || "Failed to unregister");
    }
  };

  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return <div className="events-loading">Loading events...</div>;
  }

  if (error) {
    return (
      <div className="events-container">
        <div className="error-message" style={{ margin: '20px', padding: '20px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px' }}>
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="events-container">
        {/* Header */}
        <div className="events-header">
          <h1>Events</h1>
          <p>Connect with alumni and students through events</p>
        </div>

        {/* Featured Event */}
        {featuredEvent && (
          <div className="featured-event-section">
            <div className="featured-event-card">
              <div className="featured-badge">⭐ Featured</div>
              <div className="featured-header">
                <div className="featured-title">{featuredEvent.title}</div>
                <div className="featured-countdown">
                  <span className="countdown-label">Starts in</span>
                  <span className="countdown-time">{countdowns[featuredEvent._id]}</span>
                </div>
              </div>
              <p className="featured-description">{featuredEvent.description}</p>
              <div className="featured-meta">
                <div className="meta-item">
                  <span className="meta-label">By</span>
                  <span className="meta-value">{featuredEvent.organizerName}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Date</span>
                  <span className="meta-value">{formatDate(featuredEvent.startDate)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Mode</span>
                  <span className={`mode-badge ${featuredEvent.mode}`}>
                    {featuredEvent.mode}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Attendees</span>
                  <span className="meta-value">
                    {featuredEvent.registrants?.length || 0}/{featuredEvent.capacity}
                  </span>
                </div>
              </div>
              <div className="featured-actions">
                {featuredEvent.meetingLink && (
                  <a
                    href={featuredEvent.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-join-meeting"
                  >
                    📽️ Join Meeting
                  </a>
                )}
                {registeredEventIds.has(featuredEvent._id) ? (
                  <button
                    className="btn-unregister"
                    onClick={() => handleUnregister(featuredEvent._id)}
                  >
                    ✓ Registered
                  </button>
                ) : (
                  <button
                    className="btn-register"
                    onClick={() => handleRegister(featuredEvent._id)}
                  >
                    Register
                  </button>
                )}
                <button
                  className="btn-details"
                  onClick={() => openEventDetails(featuredEvent)}
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        <div className="upcoming-events-section">
          <h2>Upcoming Events</h2>
          <div className="events-grid">
            {upcomingEvents.map(event => (
              <div key={event._id} className="event-card">
                {event.isFeatured && <div className="badge-featured">Featured</div>}
                <div className="event-card-header">
                  <h3>{event.title}</h3>
                  <span className={`event-type-tag ${event.eventType}`}>
                    {event.eventType}
                  </span>
                </div>

                <p className="event-description">{event.description?.substring(0, 80)}...</p>

                <div className="event-details">
                  <div className="detail-row">
                    <span className="icon">👤</span>
                    <span>{event.organizerName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="icon">📅</span>
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="icon">📍</span>
                    <span className={`mode-badge ${event.mode}`}>{event.mode}</span>
                  </div>
                  <div className="detail-row">
                    <span className="icon">⏳</span>
                    <span className="countdown">{countdowns[event._id]}</span>
                  </div>
                  <div className="detail-row">
                    <span className="icon">👥</span>
                    <span>{event.registrants?.length || 0}/{event.capacity}</span>
                  </div>
                </div>

                <div className="event-card-actions">
                  {event.meetingLink && (
                    <a
                      href={event.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-link"
                      title="Join meeting (requires registration)"
                    >
                      📽️ Meeting
                    </a>
                  )}
                  {registeredEventIds.has(event._id) ? (
                    <button
                      className="btn-registered"
                      onClick={() => handleUnregister(event._id)}
                    >
                      ✓ Registered
                    </button>
                  ) : (
                    <button
                      className="btn-register-small"
                      onClick={() => handleRegister(event._id)}
                      disabled={event.registrants?.length >= event.capacity}
                    >
                      {event.registrants?.length >= event.capacity ? "Full" : "Register"}
                    </button>
                  )}
                  <button
                    className="btn-view"
                    onClick={() => openEventDetails(event)}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Registered Events */}
        {myEvents.length > 0 && (
          <div className="registered-events-section">
            <h2>My Registered Events</h2>
            <div className="registered-events-list">
              {myEvents.map(event => (
                <div key={event._id} className="registered-event-item">
                  <div className="registered-event-content">
                    <div className="registered-title">
                      <span className="checkmark">✓</span>
                      <h4>{event.title}</h4>
                    </div>
                    <p className="registered-organizer">By {event.organizerName}</p>
                    <p className="registered-date">
                      📅 {formatDate(event.startDate)}
                    </p>
                    <p className="registered-mode">
                      📍 {event.mode} {event.location && `• ${event.location}`}
                    </p>
                  </div>
                  <div className="registered-actions">
                    {event.meetingLink && (
                      <a
                        href={event.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-join"
                      >
                        Join Now
                      </a>
                    )}
                    <button
                      className="btn-view-details"
                      onClick={() => openEventDetails(event)}
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {showModal && selectedEvent && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={closeModal}>✕</button>
              <div className="modal-body">
                <h2>{selectedEvent.title}</h2>

                <div className="modal-section">
                  <h4>About</h4>
                  <p>{selectedEvent.description}</p>
                </div>

                <div className="modal-section">
                  <h4>Details</h4>
                  <div className="detail-list">
                    <div className="detail-item">
                      <span className="label">Organizer:</span>
                      <span className="value">{selectedEvent.organizerName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Type:</span>
                      <span className="value">{selectedEvent.eventType}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Mode:</span>
                      <span className={`value mode-badge ${selectedEvent.mode}`}>
                        {selectedEvent.mode}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Start:</span>
                      <span className="value">{formatDate(selectedEvent.startDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">End:</span>
                      <span className="value">{formatDate(selectedEvent.endDate)}</span>
                    </div>
                    {selectedEvent.location && (
                      <div className="detail-item">
                        <span className="label">Location:</span>
                        <span className="value">{selectedEvent.location}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="label">Capacity:</span>
                      <span className="value">
                        {selectedEvent.registrants?.length || 0}/{selectedEvent.capacity}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                  <div className="modal-section">
                    <h4>Tags</h4>
                    <div className="tags-container">
                      {selectedEvent.tags.map((tag, idx) => (
                        <span key={idx} className="tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  {selectedEvent.meetingLink && (
                    <a
                      href={selectedEvent.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-modal-join"
                    >
                      📽️ Join Meeting
                    </a>
                  )}
                  {registeredEventIds.has(selectedEvent._id) ? (
                    <button
                      className="btn-modal-unregister"
                      onClick={() => {
                        handleUnregister(selectedEvent._id);
                        closeModal();
                      }}
                    >
                      Unregister
                    </button>
                  ) : (
                    <button
                      className="btn-modal-register"
                      onClick={() => {
                        handleRegister(selectedEvent._id);
                        closeModal();
                      }}
                      disabled={selectedEvent.registrants?.length >= selectedEvent.capacity}
                    >
                      {selectedEvent.registrants?.length >= selectedEvent.capacity
                        ? "Event Full"
                        : "Register Now"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>
    );
  } catch (renderError) {
    console.error("❌ Render error in Events component:", renderError);
    return (
      <div className="events-container">
        <div className="error-message" style={{ margin: '20px', padding: '20px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px' }}>
          <strong>Render Error:</strong> {renderError.message}
          <br />
          <code>{renderError.stack}</code>
        </div>
      </div>
    );
  }
};

export default Events;

