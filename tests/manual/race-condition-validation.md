# Race Condition Fix - Manual Testing Protocol

## Test Environment Setup

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Open Browser Developer Tools**
   - Enable Console logging
   - Monitor Network tab for WebSocket connections

## Test Scenario 1: Username Change Race Condition

### Steps:
1. **Open Browser Tab 1**
   - Navigate to `/chat-selection`
   - Enter username: `TestUser1`
   - Select genre: `Fiction`
   - Click "Start Chat"
   - Navigate to a book discussion (e.g., `/book-discussion/test-book-id`)

2. **Monitor Console Logs**
   - Should see: `"Setting up unified real-time subscriptions for book: test-book-id, user: TestUser1"`
   - Should see: `"Chat subscription created successfully"`
   - Should see: `"Presence tracking created successfully"`

3. **Change Username (Simulate Race Condition)**
   - Open browser DevTools Console
   - Execute: `localStorage.setItem('anon_username', 'TestUser1Modified')`
   - Refresh the page

4. **Verify Fix**
   - Console should show: `"Setting up unified real-time subscriptions for book: test-book-id, user: TestUser1Modified"`
   - Both chat and presence should be set up with the new username
   - No error messages about subscription conflicts

### Expected Results:
- ✅ No race condition errors in console
- ✅ Both subscriptions use the same username
- ✅ Presence tracking shows correct username
- ✅ Messages can be sent/received properly

## Test Scenario 2: Multi-User Presence Tracking

### Steps:
1. **Open Two Browser Windows**
   - Window 1: Regular browser
   - Window 2: Incognito mode

2. **Setup User 1 (Regular Browser)**
   - Navigate to `/chat-selection`
   - Username: `User1`
   - Genre: `Fiction`
   - Navigate to `/book-discussion/same-book-id`

3. **Setup User 2 (Incognito Browser)**
   - Navigate to `/chat-selection`
   - Username: `User2`
   - Genre: `Fiction`
   - Navigate to `/book-discussion/same-book-id`

4. **Verify Presence Tracking**
   - Both browsers should show "2 Online" in the header
   - Click online users button - should show both User1 and User2
   - Close one browser - other should update to "1 Online"

### Expected Results:
- ✅ Real-time presence updates within 2 seconds
- ✅ Accurate online user count
- ✅ Correct usernames in online user list
- ✅ Updates when users join/leave

## Test Scenario 3: Message Synchronization

### Steps:
1. **Use the same two browser setup from Scenario 2**

2. **Send Message from User1**
   - Type: "Hello from User1!"
   - Click Send

3. **Verify in User2 Browser**
   - Message should appear within 1 second
   - Should show correct username and timestamp

4. **Send Reply from User2**
   - Type: "Hello back from User2!"
   - Click Send

5. **Verify in User1 Browser**
   - Reply should appear within 1 second

### Expected Results:
- ✅ Messages appear in real-time (< 1 second)
- ✅ Correct username attribution
- ✅ Proper message ordering
- ✅ No duplicate messages

## Console Log Validation

### Success Indicators:
```
✅ "Setting up unified real-time subscriptions for book: [id], user: [username]"
✅ "Chat subscription created successfully"
✅ "Presence tracking created successfully"
✅ "Online users updated: [array of usernames]"
✅ "Received new message in component: [message object]"
```

### Error Indicators (Should NOT appear):
```
❌ "Subscription already active, skipping setup"
❌ "Presence tracking already active, skipping setup"
❌ "Error setting up chat subscription"
❌ "Error setting up presence tracking"
❌ Race condition related errors
```

## Performance Validation

### Memory Usage Check:
1. Open Chrome DevTools > Performance tab
2. Start recording
3. Perform username changes and navigation
4. Stop recording after 2 minutes
5. Check for memory leaks or excessive subscription creation

### Network Validation:
1. Open DevTools > Network tab
2. Filter by WS (WebSocket)
3. Verify only expected number of WebSocket connections
4. No excessive connection creation/destruction

## Success Criteria

- [ ] No race condition errors in console
- [ ] Presence tracking updates within 2 seconds
- [ ] Message synchronization works within 1 second
- [ ] Username changes don't break functionality
- [ ] Memory usage remains stable
- [ ] WebSocket connections are properly managed

## Failure Scenarios to Test

1. **Rapid Username Changes**
   - Change username multiple times quickly
   - Should not cause subscription conflicts

2. **Network Interruption**
   - Disconnect/reconnect network
   - Should recover gracefully

3. **Multiple Tab Navigation**
   - Open multiple tabs with same book discussion
   - Should not interfere with each other

## Rollback Criteria

If any of these occur, revert the changes:
- Presence tracking accuracy drops below 95%
- Message delivery latency exceeds 3 seconds
- Console error rate increases
- Memory usage grows continuously
- Users report missing messages or incorrect online status
