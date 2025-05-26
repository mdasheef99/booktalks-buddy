# Debug Direct Messaging Permissions in Browser

## 🔍 **Browser Console Debugging Commands**

Open your browser's Developer Tools (F12) and run these commands in the Console tab while on the `/messages/new` page:

### **1. Check Current User Authentication**
```javascript
// Check if user is authenticated
console.log('Auth User:', window.supabase?.auth?.getUser());

// Check current session
window.supabase?.auth?.getSession().then(session => {
  console.log('Current Session:', session);
  console.log('User ID:', session?.data?.session?.user?.id);
});
```

### **2. Check User's Account Tier from Database**
```javascript
// Check user's account tier directly from database
window.supabase?.auth?.getUser().then(({ data: { user } }) => {
  if (user) {
    window.supabase
      .from('users')
      .select('id, email, username, account_tier, membership_tier')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        console.log('User Database Record:', data);
        console.log('Account Tier:', data?.account_tier);
        console.log('Membership Tier:', data?.membership_tier);
        if (error) console.error('Error fetching user:', error);
      });
  }
});
```

### **3. Test Entitlements Calculation**
```javascript
// Test the entitlements system
window.supabase?.auth?.getUser().then(({ data: { user } }) => {
  if (user) {
    // This will show what entitlements the system thinks you have
    fetch('/api/entitlements/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    })
    .then(r => r.json())
    .then(data => console.log('Entitlements:', data))
    .catch(err => console.log('Entitlements API not available, checking manually...'));
  }
});
```

### **4. Check Permission Functions Directly**
```javascript
// Test the canInitiateConversations function
window.supabase?.auth?.getUser().then(({ data: { user } }) => {
  if (user) {
    // Import and test the permission function
    import('/src/lib/api/messaging/index.js').then(module => {
      module.canInitiateConversations(user.id).then(result => {
        console.log('Can Initiate Conversations:', result);
      }).catch(err => {
        console.error('Permission check error:', err);
      });
    }).catch(err => {
      console.log('Could not import messaging module:', err);
    });
  }
});
```

### **5. Check Local Storage/Session Storage**
```javascript
// Check cached entitlements
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('entitlements')) {
    console.log('Cached Entitlements:', key, JSON.parse(sessionStorage.getItem(key)));
  }
});

// Clear entitlements cache to force refresh
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('entitlements')) {
    sessionStorage.removeItem(key);
    console.log('Cleared cache:', key);
  }
});
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: Account Tier is NULL or 'free'**
**Symptoms**: Permission error despite thinking you have Privileged+
**Solution**: Your account tier needs to be upgraded in the database

**Fix in Supabase SQL Editor**:
```sql
-- Replace 'your-email@domain.com' with your actual email
UPDATE users 
SET account_tier = 'privileged_plus' 
WHERE email = 'your-email@domain.com';
```

### **Issue 2: Cached Entitlements are Stale**
**Symptoms**: Permission error after upgrading account tier
**Solution**: Clear browser cache and session storage

**Fix in Browser Console**:
```javascript
// Clear all entitlements cache
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('entitlements')) {
    sessionStorage.removeItem(key);
  }
});

// Refresh the page
location.reload();
```

### **Issue 3: Database Connection Issues**
**Symptoms**: Network errors when checking permissions
**Solution**: Check Supabase connection and RLS policies

**Debug in Browser Console**:
```javascript
// Test basic Supabase connection
window.supabase
  .from('users')
  .select('count')
  .then(({ data, error }) => {
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase connection working');
    }
  });
```

## 🔧 **Step-by-Step Debugging Process**

### **Step 1: Run Database Analysis**
1. Execute the SQL script: `supabase/migrations/20241219_007_debug_user_permissions.sql`
2. Look for your user in the output
3. Check if your account_tier is 'privileged_plus'

### **Step 2: Check Browser State**
1. Open `/messages/new` page
2. Open Developer Tools (F12)
3. Run the browser console commands above
4. Check if entitlements include 'CAN_INITIATE_DIRECT_MESSAGES'

### **Step 3: Fix Account Tier (if needed)**
1. If account_tier is NULL or 'free', upgrade it:
```sql
UPDATE users SET account_tier = 'privileged_plus' WHERE email = 'your-email';
```
2. Clear browser cache and refresh

### **Step 4: Test Conversation Creation**
1. Try creating a conversation again
2. Check browser console for any remaining errors
3. Look for specific HTTP error codes and messages

## 📋 **Expected Results**

### **After Successful Fix**:
- Account tier shows 'privileged_plus'
- Entitlements include 'CAN_INITIATE_DIRECT_MESSAGES'
- No permission errors when clicking "Send Message"
- Conversation creation succeeds

### **If Still Failing**:
- Share the exact console output
- Share the database query results
- Check for any remaining HTTP errors in Network tab
