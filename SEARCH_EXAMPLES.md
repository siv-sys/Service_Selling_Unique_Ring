# 🔍 User Search Feature - Examples & Guide

## 📋 Your Database Users

Based on your database initialization, you have these users:

| ID | Username    | Full Name       | Email                  | Role    |
|----|-------------|-----------------|------------------------|---------|
| 1  | alex_admin  | Alex Rivera     | alex@smartring.com     | ADMIN   |
| 2  | jordan_seller | Jordan Smith  | jordan@smartring.com   | SELLER  |
| 3  | sam_user    | Sam Johnson     | sam@smartring.com      | USER    |
| 4  | casey_user  | Casey Brown     | casey@smartring.com    | USER    |
| 5  | taylor_user | Taylor Davis    | taylor@smartring.com   | USER    |
| 6  | morgan_user | Morgan Wilson   | morgan@smartring.com   | USER    |

---

## ✅ SEARCH EXAMPLES

### Example 1: Search by Email Domain
**Search:** `@smartring`

**Results:** All 6 users (excluding yourself)
```
👤 Alex Rivera          [Invite]
   alex@smartring.com

👤 Jordan Smith         [Invite]
   jordan@smartring.com

👤 Sam Johnson          [Invite]
   sam@smartring.com

👤 Casey Brown          [Invite]
   casey@smartring.com

👤 Taylor Davis         [Invite]
   taylor@smartring.com

👤 Morgan Wilson        [Invite]
   morgan@smartring.com
```

---

### Example 2: Search by First Name
**Search:** `Alex`

**Results:** 1 user
```
👤 Alex Rivera          [Invite]
   alex@smartring.com
```

---

### Example 3: Search by Last Name
**Search:** `Smith`

**Results:** 1 user
```
👤 Jordan Smith         [Invite]
   jordan@smartring.com
```

---

### Example 4: Partial Email Search
**Search:** `jordan@`

**Results:** 1 user
```
👤 Jordan Smith         [Invite]
   jordan@smartring.com
```

---

### Example 5: Minimum Characters (2 chars)
**Search:** `Sa`

**Results:** 1 user (Sam Johnson)
```
👤 Sam Johnson          [Invite]
   sam@smartring.com
```

---

### Example 6: Search by Username Pattern
**Search:** `user`

**Results:** 4 users (those with "_user" in username)
```
👤 Sam Johnson          [Invite]
   sam@smartring.com

👤 Casey Brown          [Invite]
   casey@smartring.com

👤 Taylor Davis         [Invite]
   taylor@smartring.com

👤 Morgan Wilson        [Invite]
   morgan@smartring.com
```

---

### Example 7: Non-Existent User
**Search:** `nonexistent`

**Results:**
```
No users found. Try searching by email.
```

---

### Example 8: Single Character (Too Short)
**Search:** `A`

**Results:** No results (minimum 2 characters required)

---

## 🎯 HOW TO USE IN THE UI

### Step-by-Step Guide:

1. **Navigate to Relationship Page**
   - Click "Relationship" in the navigation menu

2. **Find the Search Box**
   - Look for "Search Platform Users:" input field
   - It's at the top of the "Send Connection Request" card

3. **Start Typing**
   - Type at least 2 characters
   - Wait 300ms for results to appear
   - Results show in a dropdown below the search box

4. **Browse Results**
   - Each result shows:
     - User avatar (or gradient initial if no photo)
     - Display name (bold)
     - Email address (smaller text)
     - [Invite] button

5. **Send Invitation**
   - **Option A:** Click the [Invite] button directly
   - **Option B:** Click on the user row to auto-fill email, then click "Send Invitation"

---

## 🎨 VISUAL EXAMPLES

### Search Box (Empty State)
```
┌─────────────────────────────────────────┐
│ Search Platform Users:                  │
│ ┌─────────────────────────────────────┐ │
│ │ Type email or name to search...     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Search Results (Searching for "Sam")
```
┌─────────────────────────────────────────┐
│ Search Platform Users:                  │
│ ┌─────────────────────────────────────┐ │
│ │ Sam                                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 Sam Johnson           [Invite]   │ │
│ │    sam@smartring.com                │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Search Results (Multiple - "@smartring")
```
┌─────────────────────────────────────────┐
│ Search Platform Users:                  │
│ ┌─────────────────────────────────────┐ │
│ │ @smartring                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 Alex Rivera          [Invite]    │ │
│ │    alex@smartring.com               │ │
│ ├─────────────────────────────────────┤ │
│ │ 👤 Jordan Smith         [Invite]    │ │
│ │    jordan@smartring.com             │ │
│ ├─────────────────────────────────────┤ │
│ │ 👤 Sam Johnson          [Invite]    │ │
│ │    sam@smartring.com                │ │
│ ├─────────────────────────────────────┤ │
│ │ ... more results ...                │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## ⚙️ TECHNICAL DETAILS

### Backend API Endpoint
```
GET /api/pair-invitations/search-users?q={searchQuery}
```

**Headers:**
- `x-auth-user-id`: Current user's ID

**Response Format:**
```json
{
  "success": true,
  "users": [
    {
      "id": 3,
      "email": "sam@smartring.com",
      "displayName": "Sam Johnson",
      "avatar": null,
      "accountStatus": "ACTIVE"
    }
  ]
}
```

### Search Logic
- Searches: email, name, full_name, username
- Minimum 2 characters required
- Returns max 10 results
- Excludes current user
- Ordered by relevance:
  1. Exact email match
  2. Email starts with query
  3. Contains query

---

## 💡 TIPS & TRICKS

1. **Quick Search**: Type "@" to find all users quickly
2. **Email Search**: Even partial emails work (e.g., "alex@", "smartring")
3. **Name Search**: Works with first OR last name
4. **Username Search**: Try "user" to find all regular users
5. **Minimum Length**: Must type at least 2 characters
6. **Auto-Clear**: Results clear when you delete search text
7. **Loading State**: Shows "Searching..." while fetching

---

## 🚀 TRY IT NOW!

1. Make sure backend is running on port 4001
2. Open your browser to the frontend
3. Go to Relationship page
4. Try these searches:
   - `@smartring` → See all users
   - `Alex` → Find Alex Rivera
   - `Smith` → Find Jordan Smith
   - `sam` → Find Sam Johnson
   - `user` → Find all users with "_user" username

---

## 🎯 COMMON USE CASES

### Case 1: You know their email
**Action:** Type full or partial email  
**Example:** `jordan@smartring.com` or just `jordan@`

### Case 2: You know their name
**Action:** Type first or last name  
**Example:** `Alex` or `Rivera`

### Case 3: Browse all users
**Action:** Type common pattern  
**Example:** `@smartring` or `user`

### Case 4: Quick invite
**Action:** Click [Invite] button directly from results  
**No need to fill manual email form!**

---

## ✨ FEATURES SUMMARY

✅ Real-time search as you type  
✅ Debounced for performance (300ms)  
✅ Beautiful dropdown with avatars  
✅ One-click invite from results  
✅ Dark mode support  
✅ Loading states  
✅ Empty state messages  
✅ Auto-scroll for many results  
✅ Click to auto-fill email  

---

Happy connecting! 🎉
