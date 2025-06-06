# Messaging Button Fixes

## Issues Fixed

### 1. **Duplicate "Upgrade to Message" Buttons**
**Problem**: Two identical messaging buttons were displayed on BookClubProfilePage - one in the desktop header and another in the mobile layout.

**Solution**: 
- Made desktop buttons visible only on `sm:` screens and above (`hidden sm:flex`)
- Made mobile buttons visible only on mobile screens (`sm:hidden`)
- This ensures only one button is visible at any screen size

**Files Changed**:
- `src/components/profile/BookClubProfileHeader.tsx`

### 2. **Incorrect Upgrade Messaging Logic**
**Problem**: Hardcoded "Privileged+" upgrade messages when users should be directed to "Privileged" tier.

**Solution**:
- Updated all hardcoded "Privileged+" references to "Privileged tier"
- Implemented dynamic upgrade message based on user's current tier
- Updated tier mapping to use new system (Member → Privileged → Privileged Plus)

**Files Changed**:
- `src/components/messaging/hooks/useMessaging.ts`
- `src/lib/api/messaging/permissions.ts`

### 3. **Tier Name Consistency**
**Problem**: Mixed usage of "Free" vs "Member" tier names.

**Solution**:
- Standardized all tier references to use "Member" instead of "Free"
- Updated fallback values and error states
- Ensured consistency across messaging permissions

## Current Messaging Permissions

### ✅ **MEMBER Tier Users**
- **Button**: "Upgrade to Message"
- **Click Action**: Shows toast "Upgrade to Privileged tier to start conversations"
- **Functionality**: Cannot initiate conversations, can only reply to existing ones

### ✅ **PRIVILEGED Tier Users**
- **Button**: "Message" (functional)
- **Click Action**: Starts conversation with target user
- **Functionality**: Can initiate conversations, 180-day message retention

### ✅ **PRIVILEGED_PLUS Tier Users**
- **Button**: "Message" (functional)
- **Click Action**: Starts conversation with target user
- **Functionality**: Can initiate conversations, 365-day message retention

## Technical Implementation

### Entitlements Logic
```typescript
// Both PRIVILEGED and PRIVILEGED_PLUS can initiate conversations
canInitiateConversations = 
  hasEntitlement('CAN_SEND_DIRECT_MESSAGES') ||      // PRIVILEGED_PLUS
  hasEntitlement('CAN_INITIATE_DIRECT_MESSAGES');    // PRIVILEGED
```

### Button State Logic
```typescript
if (!canInitiate) {
  return {
    children: 'Upgrade to Message',
    onClick: () => toast.info(upgradeMessage), // Dynamic message
    variant: 'outline'
  };
}

return {
  children: 'Message',
  onClick: handleMessageUser,
  variant: 'default'
};
```

### Responsive Design
```css
/* Desktop buttons */
.absolute.top-4.right-4.hidden.sm:flex

/* Mobile buttons */
.flex.gap-2.w-full.sm:hidden
```

## Testing Checklist

### ✅ **Visual Testing**
- [ ] Only one messaging button visible on desktop
- [ ] Only one messaging button visible on mobile
- [ ] Button positioning correct on both screen sizes
- [ ] Hover states work correctly

### ✅ **Functional Testing**

**MEMBER Tier User**:
- [ ] Shows "Upgrade to Message" button
- [ ] Click shows "Upgrade to Privileged tier to start conversations" toast
- [ ] Button is not disabled

**PRIVILEGED Tier User**:
- [ ] Shows "Message" button
- [ ] Click initiates conversation successfully
- [ ] Button shows "Starting..." during loading

**PRIVILEGED_PLUS Tier User**:
- [ ] Shows "Message" button
- [ ] Click initiates conversation successfully
- [ ] Button shows "Starting..." during loading

### ✅ **Edge Cases**
- [ ] No username provided: Button disabled, shows "Message"
- [ ] Current user's own profile: No messaging button shown
- [ ] Loading state: Button shows "Starting..." and is disabled
- [ ] Network errors: Graceful fallback behavior

## Files Modified

1. **`src/components/profile/BookClubProfileHeader.tsx`**
   - Removed duplicate messaging buttons
   - Added responsive visibility classes
   - Maintained consistent button styling

2. **`src/components/messaging/hooks/useMessaging.ts`**
   - Fixed hardcoded "Privileged+" messages
   - Implemented dynamic upgrade messaging
   - Updated tier name references

3. **`src/lib/api/messaging/permissions.ts`**
   - Updated tier names from "Free" to "Member"
   - Ensured consistency in upgrade logic
   - Fixed fallback values

## Verification Commands

```bash
# Check for any remaining "Privileged+" references
grep -r "Privileged\+" src/

# Check for "Free" tier references that should be "Member"
grep -r "tier.*Free" src/

# Verify button visibility classes
grep -r "sm:hidden\|hidden.*sm:" src/components/profile/
```

## Future Improvements

1. **Enhanced Upgrade Flow**: Direct users to upgrade page instead of just showing toast
2. **Better Error Handling**: More specific error messages for different failure scenarios
3. **Loading States**: Skeleton loading for permission checks
4. **Accessibility**: Better ARIA labels for screen readers
5. **Analytics**: Track upgrade button clicks for conversion metrics
