# Join Request Form Questions Feature

## Overview

The Join Request Form Questions feature allows club leads to create custom questions for users requesting to join their private book clubs. This feature enhances the club management experience by enabling club leads to gather relevant information from potential members before approving their join requests.

## Key Features

### For Club Leads
- **Optional Question Toggle**: Enable/disable custom questions during club creation or later
- **Question Management**: Create, edit, delete, and reorder up to 5 custom questions
- **Question Types**: Text-based questions with character limits (200 chars per question)
- **Required/Optional Control**: Mark questions as mandatory (★) or optional
- **Answer Review**: View all question-answer pairs in a dedicated modal when reviewing join requests
- **Post-Creation Management**: Modify questions after club creation through club management interface

### For Users Requesting to Join
- **Modal-Based Form**: Clean, responsive modal dialog for answering questions
- **Validation**: Required question validation before submission
- **Character Limits**: Answer length limited to 500 characters per question
- **Clear Indicators**: Visual distinction between required (★) and optional questions

## User Flows

### Club Creation with Questions
1. Club lead creates private club
2. Toggles "Enable Join Request Questions" option
3. Adds up to 5 custom questions
4. Marks questions as required/optional
5. Club is created with questions enabled

### Join Request with Questions
1. User clicks "Request to Join" on private club with questions
2. Modal opens displaying club-specific questions
3. User answers required questions (optional ones can be skipped)
4. Form validates required fields
5. Join request submitted with answers

### Club Lead Review Process
1. Club lead accesses Member Management panel
2. Views pending join requests list
3. Clicks on join request to open review modal
4. Reviews user information and question-answer pairs
5. Approves or rejects request from within modal

## Technical Architecture

### Database Design
- **Hybrid Architecture**: Normalized questions table + JSONB answers storage
- **Questions Table**: `club_join_questions` for efficient question management
- **Answers Storage**: JSONB column in `club_members` table for atomic operations
- **Enable Flag**: `join_questions_enabled` boolean in `book_clubs` table

### API Integration
- **Backward Compatible**: Extends existing join request APIs
- **Question Management**: New CRUD endpoints for question management
- **Answer Handling**: Enhanced join request submission with answer collection

### UI Components
- **JoinQuestionsManager**: Question CRUD interface for club leads
- **JoinRequestModal**: Modal form for users answering questions
- **JoinRequestReviewModal**: Answer review interface for club leads
- **Question Reordering**: Drag-and-drop or arrow-based reordering

## Design System Compliance

### Visual Design
- **Brand Colors**: bookconnect-brown, bookconnect-terracotta, bookconnect-cream
- **Typography**: Consistent with existing BookTalks Buddy design system
- **Icons**: Lucide React icons for consistency
- **Responsive**: Mobile-first design with proper touch targets

### Accessibility
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus handling in modals
- **Error States**: Clear error messaging and validation feedback

## Privacy & Security

### Data Protection
- **Access Control**: Only club leads can view answers to their club's questions
- **RLS Policies**: Row Level Security enforces data access restrictions
- **Input Sanitization**: XSS prevention for questions and answers
- **Character Limits**: Enforced at both frontend and backend levels

### Permission Model
- **Club Lead Only**: Question management restricted to club leads
- **Member Privacy**: Answers only visible to relevant club leads
- **Audit Trail**: Question changes tracked with timestamps

## Implementation Scope

### Included Features
- ✅ Question management for private clubs only
- ✅ Up to 5 questions per club
- ✅ Required/optional question marking
- ✅ Modal-based answer collection
- ✅ Answer review in club management
- ✅ Post-creation question editing

### Excluded Features
- ❌ Public club questions
- ❌ Retroactive questions for existing clubs
- ❌ Question analytics or reporting
- ❌ Multiple choice or complex question types
- ❌ Historical answer data for approved members

## Success Criteria

### Functional Requirements
- [ ] Club leads can enable/disable questions during club creation
- [ ] Club leads can manage questions post-creation
- [ ] Users see question modal when requesting to join clubs with questions
- [ ] Required question validation works correctly
- [ ] Club leads can review answers before approving requests
- [ ] All operations work on mobile devices

### Technical Requirements
- [ ] Database schema supports efficient question/answer operations
- [ ] APIs maintain backward compatibility
- [ ] UI follows BookTalks Buddy design system
- [ ] Feature works within Supabase free tier limits
- [ ] Proper error handling and loading states

### User Experience Requirements
- [ ] Intuitive question management interface
- [ ] Clear distinction between required/optional questions
- [ ] Responsive modal design
- [ ] Fast loading and smooth interactions
- [ ] Accessible to users with disabilities

## Related Documentation

- [Technical Specification](./technical_specification.md) - Database schema, API contracts, component specs
- [Implementation Roadmap](./implementation_roadmap.md) - 4-phase implementation plan
- [Progress Tracking](./progress_tracking.md) - Implementation progress and milestones
- [User Flows](./user_flows.md) - Detailed user journey diagrams

## Support & Maintenance

### Development Guidelines
- Follow established BookTalks Buddy coding patterns
- Maintain comprehensive test coverage
- Document all API changes
- Update progress tracking after each milestone

### Future Enhancements
- Question templates for common use cases
- Advanced question types (multiple choice, rating scales)
- Question analytics and insights
- Bulk question management tools
