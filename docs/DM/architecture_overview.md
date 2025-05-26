# Direct Messaging System - Architecture Overview

## Executive Summary

This document outlines the high-level architecture for BookConnect's Direct Messaging system, designed as a simplified WhatsApp-style messaging feature that maintains tier-based permissions while focusing on essential functionality and safety.

## Business Context

### Single-Tenant SaaS Model
- Each bookstore operates as a completely separate deployment
- Database credentials and environment configuration per store instance
- Complete data isolation between store instances
- Sold as individual product to different bookstores

### Target Capacity
- **Primary Target**: 300-500 concurrent active messaging users per store
- **Maximum Ceiling**: Under 1000 concurrent users per store
- **Scalability**: Designed for single-tenant optimization

## Architectural Principles

### 1. Simplicity First
- 3-table database design (conversations, participants, messages)
- 4 core API functions
- 3-page WhatsApp-style navigation
- Minimal complexity for maximum maintainability

### 2. Safety by Design
- Architecture designed from ground up to support future blocking/reporting/moderation
- Extensible data model for safety features
- Store-level isolation for complete tenant separation

### 3. Mobile-First Experience
- WhatsApp-style navigation pattern
- Responsive design optimized for mobile devices
- Progressive enhancement for desktop users

### 4. Clean Integration
- Seamless integration with existing profile system
- Leverages current entitlements and authentication
- No impact on existing anonymous book chat functionality

## System Architecture Pattern

### Recommended Pattern: Layered Architecture with Domain Separation

**Why This Pattern:**
- Clean separation between messaging domain and existing features
- Extensible foundation for future safety features
- Familiar patterns that match existing codebase structure
- Single-tenant optimized with simple deployment model

### Architecture Layers

```
┌─────────────────────────────────────────┐
│              UI Layer                   │
│  ┌─────────────────────────────────────┐│
│  │     Messaging Pages & Components    ││
│  │  • ConversationListPage             ││
│  │  • MessageThreadPage                ││
│  │  • NewConversationPage              ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│             API Layer                   │
│  ┌─────────────────────────────────────┐│
│  │      Messaging API Functions       ││
│  │  • startConversation()             ││
│  │  • sendMessage()                   ││
│  │  • getUserConversations()          ││
│  │  • getConversationMessages()       ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│            Data Layer                   │
│  ┌─────────────────────────────────────┐│
│  │       Messaging Database            ││
│  │  • conversations                    ││
│  │  • conversation_participants        ││
│  │  • direct_messages                  ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## Core Design Decisions

### 1. Permission Model
- **Privileged/Privileged+ Members**: Can initiate conversations with any store member
- **Free Members**: Can only reply to existing conversations
- **Store Managers/Owners**: Can initiate conversations (administrative purposes)

### 2. Store Boundary Enforcement
- Users can only message others within the same store
- Store association determined through club membership
- Dynamic store context resolution via database queries

### 3. Message Retention Policies
- **Free Tier**: 30 days retention
- **Privileged Tier**: 180 days retention
- **Privileged Plus Tier**: 365 days retention (1 year)
- **Implementation**: Soft delete with background cleanup processes

### 4. Real-Time Infrastructure
- **Technology**: Supabase Realtime for live message delivery
- **Capacity**: Optimized for 300-500 concurrent users, scalable to under 1000
- **Performance Target**: Message delivery under 2 seconds

## Integration Points

### Existing Systems Integration

**Authentication & Authorization:**
- Leverages existing `AuthContext` and entitlements system
- Integrates with current user management and permissions
- Extends existing entitlements with `CAN_INITIATE_DIRECT_MESSAGES`

**Profile System:**
- Adds messaging access to existing profile navigation
- Integrates "Message User" buttons in user profiles
- Maintains existing profile functionality without disruption

**Database Infrastructure:**
- Extends existing Supabase setup with new messaging tables
- Leverages existing RLS patterns and migration system
- Uses established database connection and security patterns

**UI Framework:**
- Uses established component patterns (shadcn/ui, Tailwind)
- Follows existing routing patterns with React Router
- Maintains consistent design language and user experience

### External Dependencies

**Supabase Services:**
- **Database**: PostgreSQL with RLS for data storage
- **Realtime**: For live message delivery and presence
- **Auth**: Existing authentication integration

**Frontend Stack:**
- **React Query**: For data fetching, caching, and state management
- **React Router**: For navigation between messaging pages
- **Existing UI Components**: Buttons, inputs, layouts, and design system

## System Boundaries

### In Scope (MVP)
- 1-on-1 direct messaging between authenticated users
- Real-time message delivery and notifications
- Message persistence with tier-based retention
- Permission-based conversation initiation
- Mobile-responsive WhatsApp-style interface
- Store boundary enforcement and user isolation

### Out of Scope (Future Features)
- Group messaging capabilities
- File/image attachments
- Advanced moderation tools (architecture supports future implementation)
- Integration with existing anonymous book chat
- Cross-store messaging
- Message encryption (beyond database-level security)

### Future Extension Points

**Safety Features (Planned):**
- User blocking and unblocking
- Message and user reporting
- Store-level moderation tools
- Content filtering and automated moderation

**Enhanced Features (Potential):**
- Message reactions and formatting
- Typing indicators and read receipts
- Message search and filtering
- Conversation archiving and organization

## Cross-Cutting Concerns

### Security Architecture
- **Data Isolation**: Row-level security on all messaging tables
- **Permission Enforcement**: Entitlement-based access control
- **Content Validation**: Input sanitization and length limits
- **Store Boundaries**: Absolute isolation between store instances

### Performance Considerations
- **Database Optimization**: Strategic indexing for messaging queries
- **Real-Time Efficiency**: Optimized Supabase Realtime usage
- **Caching Strategy**: React Query for client-side data management
- **Scalability**: Single-tenant optimization for target user capacity

### Error Handling Strategy
- **Permission Errors**: Clear user feedback for access denials
- **Network Errors**: Retry logic and offline state management
- **Validation Errors**: Real-time input validation and user guidance
- **System Errors**: Graceful degradation and error recovery

### Monitoring and Observability
- **Performance Metrics**: Message delivery times and system responsiveness
- **Usage Analytics**: Conversation and message volume tracking
- **Error Tracking**: Comprehensive error logging and alerting
- **Capacity Monitoring**: Real-time user load and system resource usage

## Related Documents

- **[Database Design](./database_design.md)**: Detailed schema, RLS policies, and migration specifications
- **[API Specification](./api_specification.md)**: Function definitions, types, and integration details
- **[Frontend Implementation](./frontend_implementation.md)**: Component specifications and UI implementation
- **[Deployment Guide](./deployment_guide.md)**: Single-tenant setup and configuration instructions

## Next Steps

1. Review and approve architectural decisions outlined in this document
2. Proceed with detailed database design and schema implementation
3. Implement core API functions with permission integration
4. Develop frontend components following WhatsApp-style patterns
5. Integrate real-time messaging infrastructure
6. Conduct testing and performance validation
7. Prepare deployment documentation and procedures

This architecture provides a solid foundation for the Direct Messaging system while maintaining simplicity, security, and extensibility for future enhancements.
