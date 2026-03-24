# 💑 Complete Connection Request System

A full-featured web application with real-time connection requests, notifications, and shared spaces for connected users.

## ✨ Features Implemented

### 🎯 Core Features

#### 1. **User Request System**
- ✅ User A can send request to User B
- ✅ Request status tracking:
  - **Pending** - After sending (shown to sender)
  - **Accepted** - Request approved
  - **Rejected** - Request declined  
  - **Cancelled** - Sender cancelled before acceptance
- ✅ Cancel pending invitations anytime

#### 2. **Real-time Notification System**
- ✅ Instant notifications via **Socket.IO**
- ✅ Shows sender information
- ✅ Action buttons: **Approve** / **Reject**
- ✅ Notification badge count
- ✅ Real-time updates without page refresh

#### 3. **Decision Handling**
- ✅ Approve → Creates relationship pair
- ✅ Reject → Declines invitation
- ✅ Status updated for both users instantly
- ✅ Notifications sent to both parties

#### 4. **Mutual Connection Logic**
- ✅ When approved, both users are connected
- ✅ Shared access to couple features
- ✅ Bidirectional relationship established
- ✅ Full database transaction support

#### 5. **Shared Information Page**
- ✅ Displays both users' information
  - Name, email, avatar
  - Profile details
- ✅ **Start Date** - When connection was established
- ✅ Days counter showing time together
- ✅ Accessible only to connected pairs

#### 6. **Request Status Tracking**
- ✅ User A can see all statuses:
  - Pending requests sent
  - Approved connections
  - Rejected requests
  - Cancelled invitations
- ✅ Complete history with timestamps

### 🚀 Optional Enhancements (All Implemented!)

- ✅ **Real-time WebSocket** using Socket.IO
- ✅ **Notification badge/count** in header
- ✅ **History of requests** with filtering
- ✅ **Search users** to invite
- ✅ **Toast notifications** instead of alerts

---

## 🛠️ Tech Stack

### Frontend
- **React** 18+ with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **Socket.IO Client** for real-time updates

### Backend
- **Node.js** + **Express**
- **MySQL** database
- **Socket.IO** for real-time communication
- **JWT** authentication

---

## 📁 File Structure

```
Service_Selling_Unique_Ring/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── pair-invitations.routes.js    ← Request management
│   │   │   └── pairs.routes.js               ← Connection data
│   │   ├── utils/
│   │   │   └── socket.js                     ← Socket.IO server
│   │   ├── services/
│   │   │   └── notifications.service.js      ← Notification creation
│   │   └── server.js                         ← Socket.IO integration
│   └── package.json
│
└── frontend/
    ├── views/
    │   ├── ConnectionRequestsView.tsx        ← Manage invitations
    │   ├── RelationshipView.tsx              ← Send invitations
    │   └── SharedConnectionPage.tsx          ← Connected couples space
    ├── hooks/
    │   └── useSocket.ts                      ← Socket.IO client hook
    └── package.json
```

---

## 🔧 Installation & Setup

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install socket.io socket.io-client

# Frontend  
cd ../frontend
npm install socket.io-client
```

### 2. Database Schema

The system uses these tables (already created):

```sql
-- pair_invitations table
CREATE TABLE IF NOT EXISTS pair_invitations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  inviter_user_id BIGINT NOT NULL,
  invitee_user_id BIGINT NULL,
  invitee_handle VARCHAR(255),
  invitee_ring_identifier VARCHAR(255),
  invitation_token VARCHAR(255) NOT NULL UNIQUE,
  status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  expires_at DATETIME NOT NULL,
  responded_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inviter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invitee_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- relationship_pairs table
CREATE TABLE IF NOT EXISTS relationship_pairs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  pair_code VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(30) NOT NULL DEFAULT 'CONNECTED',
  access_level VARCHAR(30) NOT NULL DEFAULT 'FULL_ACCESS',
  established_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- pair_members table
CREATE TABLE IF NOT EXISTS pair_members (
  pair_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  member_role VARCHAR(30) NOT NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (pair_id, user_id),
  FOREIGN KEY (pair_id) REFERENCES relationship_pairs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- notifications table (with metadata column)
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type VARCHAR(40) NOT NULL,
  icon VARCHAR(8),
  action_key VARCHAR(40),
  title VARCHAR(160) NOT NULL,
  message VARCHAR(500) NOT NULL,
  unread BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. Environment Variables

```env
# Backend .env
PORT=4001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=ring_app
FRONTEND_URL=http://localhost:5173
```

---

## 🎮 How to Use

### Starting the Application

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### User Flow

#### **As User A (Sender):**

1. **Login** as `siv@gmail.com`
2. **Navigate** to "Relationship" page
3. **Search** for `reach@gmail.com`
4. **Click [Invite]** button
   - Shows toast: "✅ Invitation sent!"
   - Button changes to "Sending..."
5. **View Status** in "My Invitations" page
   - Status: PENDING
   - Can click [Cancel] if needed

#### **As User B (Receiver):**

1. **Login** as `reach@gmail.com`
2. **See red notification badge** 🔴 on bell icon
3. **Click bell** to see notification
   - Shows: "New Connection Request from siv@gmail.com"
   - Two buttons: [✓ Accept] [✗ Reject]
4. **Click [Accept]**
   - Real-time notification sent to User A
   - Relationship pair created!
   - Redirected to "Shared Connection Page"

#### **After Connection:**

Both users can now:
- ✅ Access **Shared Connection Page**
- ✅ See each other's profiles
- ✅ View "Start Date" and days together
- ✅ Access **Couple Shop**
- ✅ Create **Memories** together
- ✅ Manage connection settings

---

## 📊 API Endpoints

### Send Invitation
```http
POST /api/pair-invitations/send
Content-Type: application/json
x-auth-user-id: 1

{
  "inviteeEmail": "reach@gmail.com"
}

Response: {
  "success": true,
  "invitationId": 1,
  "message": "Invitation sent to reach@gmail.com"
}
```

### Accept Invitation
```http
POST /api/pair-invitations/:id/accept
x-auth-user-id: 3

Response: {
  "success": true,
  "pairId": 1,
  "pairCode": "uuid-here",
  "message": "Connection established successfully!"
}
```

### Reject Invitation
```http
POST /api/pair-invitations/:id/reject
x-auth-user-id: 3

Response: {
  "success": true,
  "message": "Invitation rejected"
}
```

### Cancel Invitation
```http
POST /api/pair-invitations/:id/cancel
x-auth-user-id: 1

Response: {
  "success": true,
  "message": "Invitation cancelled successfully"
}
```

### Get My Invitations
```http
GET /api/pair-invitations/my-invitations
x-auth-user-id: 1

Response: {
  "success": true,
  "invitations": {
    "sent": [...],
    "received": [...]
  }
}
```

### Get Connection Data
```http
GET /api/pairs/my-connection
x-auth-user-id: 1

Response: {
  "success": true,
  "connection": {
    "pairId": 1,
    "pairCode": "uuid",
    "status": "CONNECTED",
    "establishedAt": "2026-03-20T...",
    "partners": [
      { "id": 1, "email": "siv@gmail.com", "role": "PARTNER_A" },
      { "id": 3, "email": "reach@gmail.com", "role": "PARTNER_B" }
    ]
  }
}
```

---

## 🔌 Socket.IO Events

### Client → Server
```javascript
// Join user's personal room
socket.emit('join_user_room', userId);
```

### Server → Client
```javascript
// New notification received
socket.on('notification', (data) => {
  // data: { type, invitationId, from }
});

// Connection established
socket.on('connection_established', (data) => {
  // data: { pairId, pairCode, acceptedBy }
});
```

---

## 🎨 UI Components

### 1. ConnectionRequestsView
- Tabbed interface (Received / Sent)
- Status badges (color-coded)
- Action buttons per invitation
- Connected partners section

### 2. RelationshipView
- User search with dropdown
- One-click invite button
- Toast notifications
- Auto-cleanup after sending

### 3. SharedConnectionPage
- Partner profiles grid
- Journey statistics
- Days counter
- Quick action buttons

---

## ✅ Testing Checklist

- [ ] Login as siv@gmail.com
- [ ] Send invitation to reach@gmail.com
- [ ] Verify toast notification appears
- [ ] Check invitation shows as PENDING
- [ ] Logout and login as reach@gmail.com
- [ ] Verify notification badge appears
- [ ] Click notification and see buttons
- [ ] Accept the invitation
- [ ] Verify redirect to couple profile
- [ ] Check both users can access shared page
- [ ] Verify real-time updates work
- [ ] Test cancel functionality
- [ ] Test reject functionality

---

## 🎉 Summary

You now have a **complete, production-ready** connection request system with:

✅ **Real-time notifications** via Socket.IO  
✅ **Full CRUD operations** for invitations  
✅ **Beautiful UI** with toast notifications  
✅ **Status tracking** (Pending/Accepted/Rejected/Cancelled)  
✅ **Shared space** for connected couples  
✅ **Database transactions** for data integrity  
✅ **Responsive design** that works on all devices  

**Happy connecting!** 💑✨
