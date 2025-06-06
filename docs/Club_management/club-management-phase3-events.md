# Phase 3: Events Integration (Weeks 5-6)

## Overview

This document provides detailed implementation guidance for Phase 3 of the Club-Level Management Features in BookConnect. Phase 3 integrates club-specific events and meetings with the existing events system.

**Reference Documents:**
- [Implementation Overview](./club-management-implementation-phases.md)
- [Phase 1: Foundation](./club-management-phase1-foundation.md)
- [Phase 2: Analytics](./club-management-phase2-analytics.md)
- [Progress Tracking](./club-management-progress-tracking.md)

**Phase Duration:** Weeks 5-6  
**Status:** ⏳ PENDING (Awaiting Phase 1-2 completion)  
**Prerequisites:** Phase 1 & 2 completion

---

## Objectives
- Integrate club-specific events and meetings
- Implement notification system for club events
- Create seamless meeting management experience
- Connect with existing events infrastructure

---

## Week 5: Events Section & Basic Meeting Management

### Primary Tasks
1. **Club Events Section**
   - Add "Events" button/section to club interface
   - Display current and upcoming club events
   - Event history and archive access

2. **Meeting Creation & Management**
   - Meeting creation form within management interface
   - Basic meeting details (title, date, description, link)
   - Meeting editing and cancellation

3. **Integration with Existing Events**
   - Connect with current events system
   - Ensure compatibility with existing RSVP functionality
   - Maintain event data consistency

### Technical Requirements

#### Meeting Data Structure
```typescript
interface ClubMeeting {
  id: string;
  club_id: string;
  title: string;
  description: string;
  meeting_type: 'discussion' | 'social' | 'planning' | 'author_event' | 'other';
  scheduled_at: Date;
  duration_minutes: number;
  virtual_link?: string;
  max_attendees?: number;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface RecurrencePattern {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  end_date?: Date;
  max_occurrences?: number;
}
```

#### Database Schema
```sql
-- Club meetings table
CREATE TABLE club_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT DEFAULT 'discussion' CHECK (meeting_type IN ('discussion', 'social', 'planning', 'author_event', 'other')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  virtual_link TEXT,
  max_attendees INTEGER,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_club_meetings_club_id ON club_meetings(club_id);
CREATE INDEX idx_club_meetings_scheduled_at ON club_meetings(scheduled_at);
CREATE INDEX idx_club_meetings_club_scheduled ON club_meetings(club_id, scheduled_at);

-- RLS policies
ALTER TABLE club_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view meetings" ON club_meetings
  FOR SELECT USING (
    club_id IN (
      SELECT club_id FROM club_members 
      WHERE user_id = auth.uid() AND role != 'pending'
    )
  );

CREATE POLICY "Club leads can manage meetings" ON club_meetings
  FOR ALL USING (
    club_id IN (
      SELECT club_id FROM club_members 
      WHERE user_id = auth.uid() AND role = 'lead'
    )
  );
```

#### API Contracts
```typescript
// Meeting management endpoints
interface MeetingAPI {
  // POST /api/clubs/:clubId/meetings
  createMeeting: (clubId: string, meeting: CreateMeetingRequest) => Promise<ClubMeeting>;
  
  // GET /api/clubs/:clubId/meetings?upcoming=true&limit=10
  getMeetings: (clubId: string, options?: MeetingQueryOptions) => Promise<ClubMeeting[]>;
  
  // PUT /api/clubs/:clubId/meetings/:meetingId
  updateMeeting: (clubId: string, meetingId: string, updates: UpdateMeetingRequest) => Promise<ClubMeeting>;
  
  // DELETE /api/clubs/:clubId/meetings/:meetingId
  deleteMeeting: (clubId: string, meetingId: string) => Promise<void>;
  
  // GET /api/clubs/:clubId/events
  getClubEvents: (clubId: string) => Promise<Event[]>;
}

interface CreateMeetingRequest {
  title: string;
  description?: string;
  meeting_type: string;
  scheduled_at: Date;
  duration_minutes?: number;
  virtual_link?: string;
  max_attendees?: number;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
}

interface MeetingQueryOptions {
  upcoming?: boolean;
  limit?: number;
  offset?: number;
  meeting_type?: string;
}
```

### Success Criteria
- [ ] Events section accessible to all club members
- [ ] Meeting creation works for authorized users
- [ ] Integration with existing events seamless
- [ ] Mobile responsive interface
- [ ] Proper permission enforcement

---

## Week 6: Notifications & Advanced Meeting Features

### Primary Tasks
1. **Notification System**
   - Event notifications on club entry
   - Notification dismissal mechanism
   - Integration with existing notification infrastructure

2. **Advanced Meeting Features**
   - Meeting reminders
   - Attendance tracking preparation
   - Meeting templates for different types

3. **User Experience Enhancements**
   - Calendar integration preparation
   - Meeting link validation
   - Improved meeting display and filtering

### Technical Requirements

#### Notification System
```sql
-- Club event notifications table
CREATE TABLE club_event_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES club_meetings(id) ON DELETE CASCADE,
  notification_type TEXT DEFAULT 'meeting_created' CHECK (notification_type IN ('meeting_created', 'meeting_updated', 'meeting_cancelled', 'meeting_reminder')),
  title TEXT NOT NULL,
  message TEXT,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  dismissed_at TIMESTAMPTZ
);

-- Indexes for efficient notification querying
CREATE INDEX idx_club_notifications_user_club ON club_event_notifications(user_id, club_id, is_dismissed);
CREATE INDEX idx_club_notifications_created ON club_event_notifications(created_at DESC);

-- RLS policies
ALTER TABLE club_event_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON club_event_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON club_event_notifications
  FOR UPDATE USING (user_id = auth.uid());
```

#### Notification API
```typescript
interface NotificationAPI {
  // GET /api/clubs/:clubId/notifications?dismissed=false
  getClubNotifications: (clubId: string, userId: string, dismissed?: boolean) => Promise<ClubNotification[]>;
  
  // POST /api/clubs/:clubId/notifications/:notificationId/dismiss
  dismissNotification: (clubId: string, notificationId: string) => Promise<void>;
  
  // POST /api/clubs/:clubId/meetings/:meetingId/notify
  createMeetingNotification: (clubId: string, meetingId: string, type: NotificationType) => Promise<void>;
}

interface ClubNotification {
  id: string;
  club_id: string;
  user_id: string;
  event_id: string;
  notification_type: string;
  title: string;
  message?: string;
  is_dismissed: boolean;
  created_at: Date;
  dismissed_at?: Date;
}
```

#### Meeting Templates
```typescript
interface MeetingTemplate {
  id: string;
  name: string;
  meeting_type: string;
  default_duration: number;
  description_template: string;
  suggested_agenda: string[];
}

const MEETING_TEMPLATES: MeetingTemplate[] = [
  {
    id: 'book-discussion',
    name: 'Book Discussion',
    meeting_type: 'discussion',
    default_duration: 90,
    description_template: 'Discussion of [Book Title] - Chapters [X-Y]',
    suggested_agenda: [
      'Welcome and introductions',
      'Chapter summary and key themes',
      'Character development discussion',
      'Favorite quotes and passages',
      'Questions and predictions',
      'Next meeting planning'
    ]
  },
  {
    id: 'social-meetup',
    name: 'Social Meetup',
    meeting_type: 'social',
    default_duration: 120,
    description_template: 'Casual social gathering for club members',
    suggested_agenda: [
      'Icebreaker activities',
      'Book recommendations',
      'Upcoming events planning',
      'Open discussion'
    ]
  }
];
```

### Success Criteria
- [ ] Notifications working correctly
- [ ] Meeting features fully functional
- [ ] User experience smooth and intuitive
- [ ] Performance requirements met
- [ ] Integration testing passed

### Dependencies
- Phase 1 & 2 completion
- Existing events system
- Notification infrastructure

### Risk Mitigation
- **Risk:** Notification system complexity
- **Mitigation:** Use existing infrastructure, simple implementation first
- **Fallback:** Basic meeting management without notifications

---

## Integration Considerations

### Existing Events System
1. **Data Consistency:** Ensure club meetings sync with main events table
2. **RSVP Compatibility:** Maintain existing RSVP functionality
3. **Permission Alignment:** Use same permission system as main events
4. **UI Consistency:** Match existing events UI patterns

### Performance Optimization
1. **Lazy Loading:** Load meetings only when needed
2. **Caching:** Cache frequently accessed meeting data
3. **Pagination:** Implement pagination for large meeting lists
4. **Optimistic Updates:** Immediate UI updates with background sync

### Mobile Considerations
1. **Responsive Design:** Ensure meeting forms work on mobile
2. **Touch Interactions:** Optimize for touch-based interactions
3. **Offline Support:** Basic offline viewing of meeting details
4. **Push Notifications:** Prepare for future push notification support

---

## Next Steps

1. **Complete Phase 1-2:** Ensure foundation and analytics are solid
2. **Events System Analysis:** Deep dive into existing events architecture
3. **Database Migrations:** Execute meeting and notification table creation
4. **API Development:** Implement meeting management endpoints
5. **UI Implementation:** Create meeting management components
6. **Integration Testing:** Comprehensive testing with existing events system

---

*This document is part of the living implementation guide and will be updated with progress and learnings throughout Phase 3 development.*
