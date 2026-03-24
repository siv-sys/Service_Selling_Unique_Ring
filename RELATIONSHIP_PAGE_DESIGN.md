# 💑 Relationship Page - Beautiful Interface Design

## 🎨 **New UI Components & Features**

### **1. Current User Profile Card**
Shows YOUR information at the top:
- Avatar (or initial if no avatar)
- Your name and email
- Account status badge (Active/Inactive)
- Beautiful gradient background

### **2. Pending Invitations Section**
Displays all pending invitations with:
- **Sent Invitations** (yellow border) - "⏳ Waiting for them"
- **Received Invitations** (pink border) - "⏳ Waiting for you"
- Quick action buttons:
  - Accept (green button)
  - Reject (red button)  
  - Cancel (gray button for sent invites)

### **3. Search & Invite Card**
Enhanced search functionality:
- Search box with magnifying glass icon
- Real-time dropdown results
- User avatars in results
- One-click invite button
- Manual email input option
- Optional Ring ID field

### **4. Privacy Settings Card**
Control who can see you:
- Public Presence
- Partners Only
- Private
- Visual radio button options

---

## 📐 **Layout Structure**

```
┌─────────────────────────────────────────────┐
│           HEADER (Navigation)               │
├─────────────────────────────────────────────┤
│                                             │
│  Hero Section                               │
│  "Build Your Relationship"                  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [YOUR PROFILE CARD]                        │
│  👤                                         │
│  Your Name                                  │
│  your@email.com                             │
│  [ACTIVE]                                   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ⏳ PENDING INVITATIONS (2)                 │
│  ┌─────────────────────────────────────┐   │
│  │ 👤 Reach User      [Waiting for you]│   │
│  │    reach@gmail.com                  │   │
│  │                      [✓Accept][✗Reject]│ │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 👤 Siv User        [Waiting for them]│  │
│  │    siv@gmail.com                    │   │
│  │                      [Cancel]        │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────┐  ┌──────────────────┐│
│  │ 💌 SEND REQUEST  │  │ 🔒 PRIVACY VAULT ││
│  │                  │  │                  ││
│  │ Search Users:    │  │ ○ Public         ││
│  │ [Type...] 🔍     │  │ ● Partners Only  ││
│  │                  │  │ ○ Private        ││
│  │ Results:         │  │                  ││
│  │ 👤 User [Invite] │  │ [Save Button]    ││
│  └──────────────────┘  └──────────────────┘│
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  What Happens After Pairing?                │
│  ┌─────────────────────────────────────┐   │
│  │ 💑 Share Your Journey               │   │
│  │ 🛍️ Couple Shop Access               │   │
│  │ 💌 Private Memories                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🎨 **Color Scheme**

### **Borders:**
- Sent Invitation: `#f59e0b` (amber/yellow)
- Received Invitation: `#ec4899` (pink)
- Active Status: `#10b981` (green)
- Inactive Status: `#6b7280` (gray)

### **Buttons:**
- Accept: `#10b981` (green)
- Reject: `#ef4444` (red)
- Cancel: `#6b7280` (gray)
- Invite: `linear-gradient(135deg, #ff2aa2, #e91a8a)` (pink gradient)

### **Backgrounds:**
- Light Mode: White with subtle gradients
- Dark Mode: Dark charcoal (#1e293b)

---

## 💡 **Key Features**

### **Real-time Search:**
1. Type 2+ characters
2. Dropdown appears instantly
3. Shows user avatar, name, email
4. Click [Invite] button
5. Green toast notification appears

### **Quick Actions:**
- **Accept**: Creates relationship immediately
- **Reject**: Declines invitation
- **Cancel**: Withdraws sent invitation

### **Visual Feedback:**
- Loading states
- Success toasts
- Error messages
- Status badges
- Color-coded borders

---

## 📱 **Responsive Design**

### **Desktop (>1024px):**
- 2-column grid for cards
- Full navigation visible
- Large profile images

### **Tablet (640px - 1024px):**
- 1-column grid stacked
- Compact spacing
- Medium-sized elements

### **Mobile (<640px):**
- Single column layout
- Smaller text sizes
- Touch-friendly buttons
- Simplified header

---

## 🎯 **User Flow**

### **Sending an Invitation:**
```
1. User sees their profile card
   ↓
2. Scrolls to "Send Connection Request"
   ↓
3. Types in search box
   ↓
4. Dropdown shows results
   ↓
5. Clicks [Invite] on desired user
   ↓
6. Green toast: "✅ Invitation sent!"
   ↓
7. Invitation appears in "Pending" section
   ↓
8. Status shows "⏳ Waiting for them"
```

### **Receiving an Invitation:**
```
1. User logs in
   ↓
2. Sees red notification badge 🔴
   ↓
3. Opens notifications panel
   ↓
4. Sees "New Connection Request"
   ↓
5. OR sees it in Pending Invitations section
   ↓
6. Clicks [✓ Accept]
   ↓
7. Relationship created!
   ↓
8. Redirected to Couple Profile
```

---

## ✨ **Implementation Steps**

### **Step 1: Add State Variables**
```typescript
const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
const [pendingInvitations, setPendingInvitations] = React.useState<Array<any>>([]);
const [loading, setLoading] = React.useState(true);
```

### **Step 2: Fetch Data on Mount**
```typescript
React.useEffect(() => {
  fetchUserData();
}, []);

const fetchUserData = async () => {
  // Fetch current user profile
  const profileResult: any = await api.get('/profile/me/current');
  
  // Fetch pending invitations
  const invitationsResult: any = await api.get('/pair-invitations/my-invitations');
  
  // Set state
};
```

### **Step 3: Render Profile Card**
```tsx
{currentUser && (
  <section className="certificate">
    <div style={{ textAlign: 'center' }}>
      <Avatar />
      <h2>{currentUser.name}</h2>
      <p>{currentUser.email}</p>
      <StatusBadge status={currentUser.accountStatus} />
    </div>
  </section>
)}
```

### **Step 4: Render Pending Invitations**
```tsx
{pendingInvitations.length > 0 && (
  <section className="certificate">
    <h3>Pending Invitations ({pendingInvitations.length})</h3>
    {pendingInvitations.map(inv => (
      <InvitationCard key={inv.id} invitation={inv} />
    ))}
  </section>
)}
```

### **Step 5: Quick Action Handlers**
```typescript
const handleQuickAccept = async (invitationId: number) => {
  const result: any = await api.post(`/pair-invitations/${invitationId}/accept`);
  if (result.success) {
    showToast('✅ Connection established!', 'success');
    fetchUserData(); // Refresh
  }
};

const handleQuickReject = async (invitationId: number) => {
  const result: any = await api.post(`/pair-invitations/${invitationId}/reject`);
  if (result.success) {
    showToast('Invitation rejected', 'info');
    fetchUserData();
  }
};

const handleQuickCancel = async (invitationId: number) => {
  const result: any = await api.post(`/pair-invitations/${invitationId}/cancel`);
  if (result.success) {
    showToast('Invitation cancelled', 'success');
    fetchUserData();
  }
};
```

---

## 🎨 **CSS Styles to Add**

```css
/* Profile Avatar */
.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff2aa2, #e91a8a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  margin: 0 auto 20px;
  overflow: hidden;
}

/* Invitation Card */
.invitation-card {
  background: white;
  border: 2px solid;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s;
}

.invitation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.status-active {
  background: #10b981;
  color: white;
}

.status-inactive {
  background: #6b7280;
  color: white;
}

/* Quick Action Buttons */
.accept-btn {
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
}

.accept-btn:hover {
  transform: scale(1.05);
}

.reject-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 700;
  cursor: pointer;
}

.cancel-btn {
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 700;
  cursor: pointer;
}
```

---

## 🎉 **Benefits of This Design**

✅ **Clear Visual Hierarchy** - Profile → Pending → Actions  
✅ **Immediate Feedback** - Toast notifications, status badges  
✅ **Quick Actions** - Accept/Reject/Cancel in one click  
✅ **Beautiful UI** - Gradients, shadows, animations  
✅ **Responsive** - Works on all screen sizes  
✅ **Accessible** - High contrast, clear labels  
✅ **Informative** - Shows all relevant user info  

---

## 📋 **Component Checklist**

- [ ] Profile avatar with fallback
- [ ] User name and email display
- [ ] Account status badge
- [ ] Pending invitations list
- [ ] Sent vs received visual distinction
- [ ] Quick accept button
- [ ] Quick reject button
- [ ] Quick cancel button
- [ ] Search input with icon
- [ ] Search results dropdown
- [ ] User result items with avatar
- [ ] Invite button in dropdown
- [ ] Manual email input
- [ ] Ring ID input (optional)
- [ ] Privacy radio options
- [ ] Save visibility button
- [ ] Information section (benefits)
- [ ] Toast notifications
- [ ] Loading states
- [ ] Error handling

---

This design provides a **professional, modern, and user-friendly** interface for managing relationships and invitations! 💑✨
