# Notification System - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Backend server running (`node server.js` in `/backend`)
- MongoDB connected and running
- Frontend dev server running (`npm start` in `/frontend`)
- Logged in as student or alumni

---

## 📋 Files Added/Modified

### New Files Created:
1. **Backend:**
   - `/backend/models/Notification.js` - Database schema
   - `/backend/controllers/notificationController.js` - Business logic
   - `/backend/routes/notificationRoutes.js` - API endpoints

2. **Frontend:**
   - `/frontend/src/components/NotificationBell.jsx` - UI component
   - `/frontend/src/components/ApprovalModal.jsx` - Approval form
   - `/frontend/src/services/notificationAPI.js` - API utilities
   - `/frontend/src/styles/NotificationBell.css` - Bell styling
   - `/frontend/src/styles/ApprovalModal.css` - Modal styling

3. **Documentation:**
   - `/NOTIFICATION_SYSTEM.md` - Full documentation
   - `/QUICK_START.md` - This file

### Modified Files:
1. `/backend/server.js` - Added notification routes
2. `/backend/models/Mentorship.js` - Added meeting fields
3. `/backend/controllers/mentorshipController.js` - Added notifications
4. `/backend/controllers/opportunityController.js` - Added notifications
5. `/frontend/src/components/Navbar.jsx` - Integrated bell + modal

---

## ⚡ Quick Test

### Test 1: View Notifications Bell (2 min)
1. Open Alumni Connect app
2. Login as any user
3. Look for bell icon (🔔) in top right navbar
4. Click bell to toggle dropdown

**Expected:** Dropdown appears with empty state (no notifications yet)

### Test 2: Trigger Mentorship Request (5 min)
1. **Student:** Go to Mentorship → Request mentorship from an alumni
2. **Alumni:** Click bell icon → Should see "Student requested mentorship"

**Expected:** Notification appears with green "Approve" and red "Reject" buttons

### Test 3: Approve Mentorship (5 min)
1. **Alumni:** Click "Approve" button on notification
2. Modal opens with meeting form
3. Fill details:
   - Meeting Link: `https://meet.google.com/abc-xyz-123`
   - Date/Time: Pick future date and time
   - Location: `Virtual Meeting` (optional)
4. Click "Confirm"

**Expected:** 
- Modal closes
- Notification disappears from alumni's bell
- Student sees new notification with meeting link

### Test 4: View Meeting Link (2 min)
1. **Student:** Click bell icon
2. Find "Mentorship Approved" notification
3. Click meeting link

**Expected:** Opens meeting link in new tab

### Test 5: Job Application (5 min)
1. **Student:** Go to Opportunities → Apply for a job
2. **Alumni (who posted):** Check bell for notification

**Expected:** See "Student applied for [Job Title]" notification

---

## 🔧 Configuration

### Environment Variables
In `/frontend/.env` (create if not exists):
```
REACT_APP_API_URL=http://localhost:5000
```

### MongoDB Connection
Ensure MongoDB is running and connected in `/backend/server.js`

### JWT Authentication
Notifications require valid JWT token in localStorage:
- Token key: `token`
- Applied as: `Authorization: Bearer {token}`

---

## ✨ Features Quick Reference

| Feature | Access | Trigger |
|---------|--------|---------|
| Bell Icon | Navbar (top right) | User logged in |
| Dropdown | Click bell | Always available |
| Auto-Refresh | Dropdown open | Every 5 seconds |
| Mark Read | Dropdown | Click read icon |
| Delete | Dropdown | Click trash icon |
| Approve | Only for mentorship_request | Click approve button |
| Reject | Only for mentorship_request | Click reject button |
| Meeting Link | Only for mentorship_approved | Click link button |
| Unread Badge | Bell icon | Has unread notifications |

---

## 🐛 Common Issues & Fixes

### Issue: Bell icon not showing
**Fix:** 
- Check Navbar.jsx imports
- Verify NotificationBell component in `components/` folder
- Clear browser cache

### Issue: Dropdown empty but should have notifications
**Fix:**
- Check browser console for API errors
- Verify backend server is running
- Check token in localStorage
- Verify database has notification records

### Issue: Modal not opening on approve
**Fix:**
- Check Navbar state management
- Verify ApprovalModal component is imported
- Check onApproveClick callback

### Issue: Form validation errors
**Fix:**
- Ensure URL starts with `http://` or `https://`
- Ensure date/time is in future
- Ensure location field is filled (if required in your version)

---

## 📊 API Endpoints Reference

```bash
# Get all notifications
GET /api/notifications
Authorization: Bearer {token}

# Mark as read
PUT /api/notifications/mark-read
Authorization: Bearer {token}
Content-Type: application/json
Body: { "notificationId": "..." }

# Delete notification
DELETE /api/notifications?notificationId=...
Authorization: Bearer {token}

# Create notification (auto-triggered)
POST /api/notifications
Authorization: Bearer {token}
Content-Type: application/json
Body: {
  "userId": "...",
  "type": "mentorship_request",
  "message": "...",
  "data": {...}
}
```

---

## 💡 Usage Tips

1. **Notifications auto-refresh** - No need to refresh page to see new notifications
2. **Unread count** - Red badge shows number of unread (capped at 9+)
3. **Meeting link** - Only appears after alumni sets meeting details during approval
4. **Reject flow** - Student gets rejection notification if alumni declines
5. **Job notifications** - Posted by the student, seen by the opportunity creator

---

## 🎯 Next Steps

1. Test all scenarios above ✅
2. Customize styling in CSS files if needed
3. Add more notification types as needed
4. Setup email notifications (future enhancement)
5. Add notification preferences (future enhancement)

---

## 📞 Need Help?

Refer to `/NOTIFICATION_SYSTEM.md` for:
- Detailed architecture
- Complete API documentation
- Database schema
- Troubleshooting guide
- Testing procedures

---

**Status:** ✅ Ready for Production
**Version:** 1.0.0
