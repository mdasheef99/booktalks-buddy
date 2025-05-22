# Club Lead Interface Implementation Plan

## Overview

This document outlines the implementation plan for the Club Lead interface in the BookConnect platform. The Club Lead interface will provide club creators with management tools to effectively administer their book clubs, including moderator appointment, member management, and club settings configuration.

## Implementation Status

**Current Status: Phase 3 - Partially Implemented**

The following components have been implemented:
- Permission verification system with `useClubLeadPermission` hook
- Basic UI structure with `ClubManagementPanel` component
- Club Settings Management with `ClubSettingsPanel`
- Member Management with `MemberManagementPanel`
- Moderator Management with `ModeratorManagementPanel`
- Content Moderation with `ContentModerationPanel`
- Current Book Management with `CurrentBookPanel`

Remaining work:
- Comprehensive integration testing
- User acceptance testing
- Performance optimization
- Bug fixes and refinements

## Requirements

1. **Access Control**:
   - Interface accessible only to users with Privileged or Privileged+ membership tiers
   - Interface visible only to the designated Club Lead of the specific club (creator)
   - Store Owners/Managers should also have access for administrative purposes

2. **UI Integration**:
   - Integrate with existing "Manage club" button in BookClub details page
   - Use conditional rendering based on permissions
   - Maintain consistent design language with the rest of the application

3. **Feature Scope**:
   - Moderator appointment and management
   - Club settings configuration
   - Member management
   - Content moderation tools
   - Current book selection

## Component Structure

### 1. Enhanced BookClubDetailsPage

The BookClubDetailsPage has been enhanced to include the Club Lead interface:

```jsx
function BookClubDetailsPage() {
  const { clubId } = useParams();
  const { user } = useAuth();
  const { hasPermission } = useClubLeadPermission(clubId);
  const [showManagementPanel, setShowManagementPanel] = useState(false);

  // Rest of the component logic

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Club details UI */}

      {hasPermission && (
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setShowManagementPanel(true)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Club
        </Button>
      )}

      {showManagementPanel && (
        <ClubManagementPanel
          clubId={clubId}
          onClose={() => setShowManagementPanel(false)}
        />
      )}
    </div>
  );
}
```

### 2. ClubManagementPanel Component

The ClubManagementPanel component provides a tabbed interface for different management functions:

```jsx
function ClubManagementPanel({ clubId, onClose }) {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-serif text-bookconnect-brown">
            Club Management
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="moderators">Moderators</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="current-book">Current Book</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="p-4">
          <ClubSettingsPanel clubId={clubId} />
        </TabsContent>

        <TabsContent value="members" className="p-4">
          <MemberManagementPanel clubId={clubId} />
        </TabsContent>

        <TabsContent value="moderators" className="p-4">
          <ModeratorManagementPanel clubId={clubId} />
        </TabsContent>

        <TabsContent value="content" className="p-4">
          <ContentModerationPanel clubId={clubId} />
        </TabsContent>

        <TabsContent value="current-book" className="p-4">
          <CurrentBookPanel clubId={clubId} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
```

### 3. Implemented Sub-Components

1. **ClubSettingsPanel**: Allows the Club Lead to update club settings such as name, description, privacy, and image.

2. **MemberManagementPanel**: Provides tools for managing club members, including:
   - Viewing all current members
   - Removing members from the club
   - Approving or rejecting join requests
   - Searching and filtering members

3. **ModeratorManagementPanel**: Enables the Club Lead to appoint and remove moderators:
   - Displays current moderators with appointment details
   - Provides a dialog to appoint new moderators from existing members
   - Includes confirmation dialogs for moderator removal

4. **ContentModerationPanel**: Offers tools for moderating club content:
   - Viewing and filtering discussion topics
   - Locking or unlocking topics
   - Removing inappropriate posts
   - Searching content by keywords

5. **CurrentBookPanel**: Allows the Club Lead to select the current book for the club:
   - Displays current book information
   - Shows book nominations with details
   - Provides a button to set a nominated book as the current book
   - Includes confirmation for book selection

## Permission Verification Approach

### 1. Custom Hooks for Permission Checking

We've implemented two custom hooks for permission verification:

```jsx
// Hook to check if a user can manage a club (either as lead or store admin)
export function useClubLeadPermission(clubId) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      if (!clubId || !user?.id) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Check if user is the club lead
        const isLead = await isClubLead(user.id, clubId);

        // Check if user has store admin permissions
        const hasStorePermission = await hasStoreAdminPermission(user.id, clubId);

        setHasPermission(isLead || hasStorePermission);
      } catch (error) {
        console.error('Error checking club lead permission:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [clubId, user?.id]);

  return { hasPermission, loading };
}

// Hook specifically to check if a user is the lead of a club
export function useClubLead(clubId) {
  const { user } = useAuth();
  const [isLead, setIsLead] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkIsLead() {
      if (!clubId || !user?.id) {
        setIsLead(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await isClubLead(user.id, clubId);
        setIsLead(result);
      } catch (error) {
        console.error('Error checking if user is club lead:', error);
        setIsLead(false);
      } finally {
        setLoading(false);
      }
    }

    checkIsLead();
  }, [clubId, user?.id]);

  return { isLead, loading };
}
```

### 2. Backend Permission Verification

We've implemented the following permission verification functions:

```typescript
// Check if user is the club lead (creator)
export async function isClubLead(userId, clubId) {
  try {
    // Get the club details
    const { data: club, error } = await supabase
      .from('book_clubs')
      .select('created_by')
      .eq('id', clubId)
      .single();

    if (error) throw error;

    // The club creator is the lead
    return club.created_by === userId;
  } catch (error) {
    console.error('[isClubLead] Error:', error);
    return false;
  }
}

// Check if user has store admin permissions for the club's store
export async function hasStoreAdminPermission(userId, clubId) {
  try {
    // Get the store ID for this club
    const { data: club, error: clubError } = await supabase
      .from('book_clubs')
      .select('store_id')
      .eq('id', clubId)
      .single();

    if (clubError) throw clubError;

    // Check if user is a store admin
    const { data: storeAdmin, error: adminError } = await supabase
      .from('store_administrators')
      .select('role')
      .eq('store_id', club.store_id)
      .eq('user_id', userId)
      .single();

    if (adminError && adminError.code !== 'PGRST116') throw adminError;

    return !!storeAdmin; // User is a store admin if record exists
  } catch (error) {
    console.error('[hasStoreAdminPermission] Error:', error);
    return false;
  }
}
```

### 3. Integration with Components

The permission hooks are integrated with the components to conditionally render UI elements:

```jsx
function BookClubDetailsPage() {
  const { clubId } = useParams();
  const { hasPermission, loading } = useClubLeadPermission(clubId);
  const [showManagementPanel, setShowManagementPanel] = useState(false);

  // Only show the Manage Club button if the user has permission
  return (
    <div>
      {/* Club details */}

      {hasPermission && (
        <Button onClick={() => setShowManagementPanel(true)}>
          Manage Club
        </Button>
      )}

      {showManagementPanel && (
        <ClubManagementPanel
          clubId={clubId}
          onClose={() => setShowManagementPanel(false)}
        />
      )}
    </div>
  );
}

## UI Integration with Existing Components

### 1. Enhancing the Existing "Manage Club" Button

The current "Manage club" button will be enhanced to:
- Perform proper permission checks
- Open the comprehensive management panel
- Maintain its current position in the UI

### 2. Management Panel Design

The management panel will:
- Use a modal dialog to overlay the current page
- Implement a tabbed interface for different management functions
- Follow the application's design system for consistency
- Provide clear feedback for actions
- Include confirmation dialogs for destructive actions

## Implementation Progress

### Phase 1: Foundation ✅ COMPLETED

1. **Permission System Enhancement** ✅
   - Implemented `useClubLeadPermission` and `useClubLead` hooks
   - Enhanced backend permission verification functions
   - Added error handling and loading states

2. **Basic UI Structure** ✅
   - Created `ClubManagementPanel` component with tabbed interface
   - Connected to existing "Manage club" button
   - Implemented responsive design for all screen sizes

### Phase 2: Core Management Features ✅ COMPLETED

1. **Club Settings Management** ✅
   - Implemented `ClubSettingsPanel` component with form validation
   - Created API functions for updating club settings
   - Added error handling and success feedback

2. **Member Management** ✅
   - Implemented `MemberManagementPanel` component
   - Created API functions for member actions (remove, approve, reject)
   - Added confirmation dialogs for destructive actions
   - Implemented search and filtering functionality

### Phase 3: Moderation Tools ✅ COMPLETED

1. **Moderator Management** ✅
   - Implemented `ModeratorManagementPanel` component
   - Created API functions for moderator appointment/removal
   - Added user search functionality
   - Implemented confirmation dialogs for moderator removal

2. **Content Moderation** ✅
   - Implemented `ContentModerationPanel` component
   - Created API functions for content moderation
   - Added filtering and search for content
   - Implemented topic locking/unlocking functionality

### Phase 4: Current Book Management ✅ COMPLETED

1. **Current Book Selection** ✅
   - Implemented `CurrentBookPanel` component
   - Enhanced nomination display and selection
   - Added confirmation and feedback for book selection
   - Implemented book cover display with fallbacks

### Phase 5: Final Integration and Testing 🔄 IN PROGRESS

1. **Bug Fixes and Refinements** 🔄
   - Fixed Supabase database errors in member and moderator queries
   - Improved error handling and fallbacks
   - Enhanced empty state messages

2. **Integration Testing** 🔄
   - Testing all components together
   - Verifying proper permission enforcement
   - Ensuring consistent UI/UX across all management functions

3. **Performance Optimization** ⏳
   - Implement proper data fetching strategies
   - Optimize permission checks with caching
   - Minimize unnecessary re-renders

4. **Documentation** ⏳
   - Update technical documentation
   - Create user guides for Club Leads
   - Document API functions and components

## Technical Considerations

### 1. Database Schema Updates

No major schema changes are required as the existing tables support the Club Lead functionality:
- `book_clubs` table already has `lead_user_id` field
- `club_moderators` table exists for moderator management
- `club_members` table handles membership

Minor additions may include:
- Add `settings` JSON field to `book_clubs` table for club-specific settings
- Add activity tracking fields for inactive lead detection (future feature)

### 2. API Enhancements

New API functions needed:
- `updateClubSettings(leadId, clubId, settings)`
- `appointModerator(leadId, clubId, userId)`
- `removeModerator(leadId, clubId, userId)`
- `removeClubMember(leadId, clubId, userId)`
- `lockClubTopic(leadId, clubId, topicId)`
- `deleteClubPost(leadId, clubId, postId)`

### 3. Performance Considerations

- Implement proper data fetching strategies (React Query)
- Use pagination for member and content lists
- Optimize permission checks with caching
- Minimize unnecessary re-renders with memoization

### 4. Accessibility

- Ensure all management interfaces are keyboard navigable
- Implement proper ARIA attributes for modal dialogs
- Provide clear feedback for actions
- Maintain color contrast ratios for text

## Dependencies

1. **External Dependencies**
   - Existing UI component library
   - React Query for data fetching
   - Supabase for backend operations

2. **Internal Dependencies**
   - Entitlements system
   - User authentication context
   - Existing club data fetching logic

## Success Criteria

The Club Lead interface implementation will be considered successful when:

1. Club Leads can access all management functions
2. Permissions are properly enforced
3. All management actions work correctly
4. The interface is intuitive and follows design guidelines
5. Performance meets expectations
6. Accessibility standards are met

## Future Enhancements

After the initial implementation, consider:
- Advanced analytics for Club Leads
- Enhanced notification options for club announcements
- Scheduled meeting management
- Club activity reports
- Customization options for club appearance
