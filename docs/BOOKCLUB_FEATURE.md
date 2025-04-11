# BookClub Feature Documentation

## Overview

The BookClub feature allows users to create and join book clubs, participate in discussions, and manage club membership. It provides a social reading experience where users can connect with others who share similar reading interests.

## Key Components

### Pages

- **BookClubListPage**: Displays all book clubs the user is a member of and allows creating new clubs
- **BookClubDetailsPage**: Shows details of a specific book club, including current book, members, and discussions
- **BookClubDiscussionsPage**: Lists all discussion topics in a book club
- **BookClubTopicDetailPage**: Shows a specific discussion topic and its posts
- **CreateTopicForm**: Allows creating a new discussion topic
- **ReplyForm**: Allows replying to a discussion topic

### Admin Components

- **BookClubMembers**: Allows club admins to manage members
- **BookClubSettings**: Allows club admins to update club settings
- **AdminJoinRequestsPage**: Allows admins to approve or deny join requests

### Route Guards

- **MemberRouteGuard**: Protects routes that require club membership
- **AdminRouteGuard**: Protects routes that require club admin privileges
- **GlobalAdminRouteGuard**: Protects routes that require admin privileges in any club

## User Roles

- **Non-Member**: Can view public book clubs and request to join
- **Member**: Can view club details, participate in discussions, and leave the club
- **Admin**: Can manage club settings, members, and approve join requests

## Navigation Flow

1. **Book Club List**: View all clubs and create new ones
2. **Book Club Details**: View club information and access discussions
3. **Discussions List**: View all discussion topics in a club
4. **Topic Detail**: View and participate in a specific discussion

## API Structure

The API is organized into modules:

- **clubs.ts**: CRUD operations for book clubs
- **members.ts**: Membership management
- **discussions.ts**: Discussion topics and posts
- **requests.ts**: Join request management
- **books.ts**: Current book management

## Data Models

- **BookClub**: Represents a book club with name, description, and privacy settings
- **ClubMember**: Represents a user's membership in a club with a specific role
- **DiscussionTopic**: Represents a discussion topic in a book club
- **DiscussionPost**: Represents a post in a discussion topic

## Best Practices

1. **Route Protection**: All member and admin routes are protected with appropriate guards
2. **Efficient Data Loading**: User profiles are batch-loaded to avoid N+1 query problems
3. **Confirmation Dialogs**: Destructive actions require confirmation
4. **Graceful Error Handling**: Missing data is handled with appropriate fallbacks
5. **Real-time Updates**: Changes to discussions and membership are reflected in real-time

## Testing

To test the BookClub feature:

1. Create a new book club
2. Invite members or approve join requests
3. Create discussion topics and posts
4. Test admin functionality (member management, settings)
5. Verify route protection works correctly

## Future Enhancements

- Book recommendations within clubs
- Reading progress tracking
- Virtual book club meetings
- Book voting system for next reads
