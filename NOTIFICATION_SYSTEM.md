# Notification System - Complete Implementation Guide

## 🎯 Overview

The Alumni Connect platform now includes a complete, end-to-end notification system that automatically alerts users of important activities:

- **Mentorship Requests**: When a student requests mentorship
- **Mentorship Approvals**: When mentorship is approved with meeting details
- **Mentorship Rejections**: When mentorship is rejected
- **Job Applications**: When a student applies for an opportunity

---

## 📂 System Architecture

### Backend Components

```
backend/
├── models/
│   └── Notification.js          # MongoDB schema for notifications
├── controllers/
│   ├── notificationController.js # CRUD operations & helpers
│   ├── mentorshipController.js   # Auto-creates mentorship notifications
│   └── opportunityController.js  # Auto-creates job notifications
├── routes/
│   └── notificationRoutes.js     # API endpoints
└── server.js                     # Routes registered here
```

### Frontend Components

```
frontend/src/
├── components/
│   ├── NotificationBell.jsx      # Bell icon with dropdown
│   ├── ApprovalModal.jsx          # Meeting details form
│   └── Navbar.jsx                 # Integration point
├── services/
│   └── notificationAPI.js         # Centralized API utilities
└── styles/
    ├── NotificationBell.css       # Bell & dropdown styling
    └── ApprovalModal.css          # Modal form styling
```

---

## 🔌 API Endpoints

All endpoints require authentication via JWT Bearer token.

### GET /api/notifications
Fetch all notifications for the logged-in user.

**Response:**
```json
{
  "notifications": [
    {
      "_id": "notification_id",
      "userId": "user_id",
      "type": "mentorship_request",
      "message": "John Doe requested mentorship",
      "data": {
        "mentorshipId": "mentorship_id",
        "fromUserId": "john_id",
        "fromUserName": "John Doe"
      },
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/notifications
Create a new notification (used internally by controllers).

**Body:**
```json
{
  "userId": "user_id",
  "type": "mentorship_request",
  "message": "Notification message",
  "data": {
    "mentorshipId": "mentorship_id",
    "fromUserId": "requester_id",
    "fromUserName": "Requester Name"
  }
}
```

### PUT /api/notifications/mark-read
Mark a notification as read.

**Body:**
```json
{
  "notificationId": "notification_id"
}
```

### DELETE /api/notifications
Delete a notification.

**Query Parameter:**
```
?notificationId=notification_id
```

---

## 🎨 Frontend Components

### NotificationBell Component

**Location:** `frontend/src/components/NotificationBell.jsx`

**Props:**
- `onApproveClick(notification)` - Callback when user clicks approve button

**Features:**
- 🔔 Bell icon with animated unread badge (9+ capped)
- 📋 Dropdown list of notifications
- 🔄 Auto-refreshes every 5 seconds
- ✅ Mark as read functionality
- ❌ Delete notification functionality
- 🤝 Approve/Reject buttons for mentorship requests
- 🔗 Meeting link display for approved mentorships

**Usage:**
```jsx
import NotificationBell from "./NotificationBell";

<NotificationBell
  onApproveClick={(notification) => {
    // Handle approval modal opening
  }}
/>
```

### ApprovalModal Component

**Location:** `frontend/src/components/ApprovalModal.jsx`

**Props:**
- `notification` - The notification object
- `onClose()` - Close modal callback
- `onApproveSuccess()` - Success callback after approval

**Features:**
- 📝 Form validation (URL format checking)
- ⏰ Date/time picker for meeting scheduling
- 📍 Location input (optional)
- 🔗 Meeting link input (required, validated)
- ⌛ Loading state during submission
- ❌ Error message display

**Usage:**
```jsx
import ApprovalModal from "./ApprovalModal";

{showModal && (
  <ApprovalModal
    notification={selectedNotification}
    onClose={() => setShowModal(false)}
    onApproveSuccess={() => setShowModal(false)}
  />
)}
```

---

## 📊 Notification Types

| Type | Trigger | From | To | Data |
|------|---------|------|-----|------|
| `mentorship_request` | Student requests mentorship | Student | Alumni | mentorshipId, fromUserId, fromUserName |
| `mentorship_approved` | Alumni approves request | Alumni | Student | mentorshipId, meetingLink, meetingDate, meetingLocation |
| `mentorship_rejected` | Alumni rejects request | Alumni | Student | mentorshipId |
| `job_applied` | Student applies for opportunity | Student | Alumni (poster) | jobId, fromUserId, fromUserName, jobTitle |

---

## 🔧 Backend Integration Points

### 1. Mentorship Request Notification

**File:** `backend/controllers/mentorshipController.js`

When a student applies for mentorship:
```javascript
// Auto-creates notification
await createNotificationHelper(
  alumni._id,
  "mentorship_request",
  `${student.name} requested mentorship`
);
```

### 2. Mentorship Approval Notification

When alumni approves mentorship:
```javascript
// Creates notification with meeting details
await createNotificationHelper(
  mentorship.student,
  "mentorship_approved",
  `Your mentorship request was approved by ${alumni.name}`,
  {
    mentorshipId,
    meetingLink,
    meetingDate,
    meetingLocation
  }
);
```

### 3. Job Application Notification

**File:** `backend/controllers/opportunityController.js`

When student applies for job:
```javascript
// Creates notification for opportunity poster
await createNotificationHelper(
  opportunity.postedBy,
  "job_applied",
  `${student.name} applied for ${opportunity.title}`
);
```

---

## 📱 Styling & Themes

### NotificationBell.css
- Bell icon with hover effects
- Unread badge with pulse animation
- Dropdown with smooth slide-down animation
- Notification items with hover highlighting
- Scrollable list with custom scrollbar
- Mobile responsive (95vw on mobile)
- Action buttons with color-coded icons

### ApprovalModal.css
- Modal overlay with backdrop blur
- Smooth slide-up animation
- Form validation styling
- Error message display
- Loading spinner on submit button
- Gradient buttons (purple/blue theme)
- Mobile-responsive form layout
- Meeting details preview card

---

## 🚀 Usage Workflow

### For Students:
1. Click bell icon in navbar
2. View all notifications in dropdown
3. For mentorship requests from alumni:
   - Review the notification message
   - Click "Approve" to open approval modal
   - Enter meeting link, date/time, location
   - Click "Confirm" to save meeting details

### For Alumni:
1. Click bell icon in navbar
2. See all incoming notifications
3. View mentorship requests
   - Click "Approve" to schedule meeting
   - Click "Reject" to decline request
4. View job applications
   - Review applicant details
   - Contact applicant if interested

---

## 🧪 Testing the System

### Test Scenario 1: Mentorship Request
1. Login as student
2. Go to Mentorship page
3. Request mentorship from an alumni
4. Switch to alumni account
5. Check navbar bell for notification ✅

### Test Scenario 2: Mentorship Approval
1. Alumni receives mentorship request
2. Click notification "Approve" button
3. Fill in meeting details:
   - Meeting Link: https://meet.google.com/xyz
   - Date/Time: 2024-01-20 14:00
   - Location: Video Call
4. Click "Confirm"
5. Switch to student account
6. Check bell for approval notification with meeting link ✅

### Test Scenario 3: Job Application
1. Login as student
2. Go to Opportunities page
3. Apply for a job
4. Switch to alumni account (who posted job)
5. Check bell for notification ✅

---

## 🛠️ API Service Utilities

**Location:** `frontend/src/services/notificationAPI.js`

### Available Functions:

```javascript
// Fetch all notifications
const notifications = await notificationAPI.fetchNotifications();

// Mark as read
await notificationAPI.markAsRead(notificationId);

// Delete notification
await notificationAPI.deleteNotification(notificationId);

// Create notification (admin only)
await notificationAPI.createNotification({
  userId: "...",
  type: "mentorship_request",
  message: "...",
  data: {...}
});

// Utility functions
const icon = notificationAPI.getNotificationIcon("mentorship_request");
const title = notificationAPI.getNotificationTitle("mentorship_request");
const unread = notificationAPI.getUnreadNotifications(notifications);
const sorted = notificationAPI.sortByTimestamp(notifications);
```

---

## 🐛 Troubleshooting

### Notifications not showing up?
1. Check browser console for errors
2. Verify token is stored in localStorage
3. Ensure backend server is running
4. Check REACT_APP_API_URL environment variable

### Modal not opening on approve?
1. Verify Navbar integration (NotificationBell + ApprovalModal imported)
2. Check that onApproveClick prop is passed to NotificationBell
3. Verify ApprovalModal component has correct props

### Meeting details not saving?
1. Validate URL format (must start with http:// or https://)
2. Check datetime format (should be ISO format)
3. Verify bearer token has required permissions
4. Check backend for validation errors

---

## 📝 Database Schema

**Notification Model:**
```javascript
{
  userId: ObjectId (required),
  type: String (enum: ["mentorship_request", "mentorship_approved", "mentorship_rejected", "job_applied"]),
  message: String (required),
  data: {
    mentorshipId: ObjectId,
    jobId: ObjectId,
    fromUserId: ObjectId,
    fromUserName: String,
    jobTitle: String,
    meetingLink: String,
    meetingDate: Date,
    meetingLocation: String
  },
  isRead: Boolean (default: false),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## ✅ Completed Features

- ✅ MongoDB Notification schema with all required fields
- ✅ Notification controller (CRUD + auto-creation helper)
- ✅ Notification API routes (all 4 endpoints)
- ✅ Auto-notification triggers in mentorship flow
- ✅ Auto-notification triggers in job application flow
- ✅ NotificationBell React component with dropdown UI
- ✅ ApprovalModal React component with form validation
- ✅ Navbar integration with modal state management
- ✅ CSS styling with animations and themes
- ✅ Notification API service utility
- ✅ End-to-end functionality

---

## 📞 Support

For issues or questions about the notification system:
1. Check browser console for errors
2. Review backend logs
3. Verify MongoDB connection
4. Check JWT token validity
5. Ensure all files are in correct locations

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Production Ready ✅
