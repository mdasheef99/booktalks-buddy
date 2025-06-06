# Join Request Form Questions - User Flows

## Overview

This document contains detailed user journey diagrams showing the complete flow for the Join Request Form Questions feature. The flows are designed using Mermaid diagrams to visualize the user experience from different perspectives.

---

## **Flow 1: Club Creation with Questions**

```mermaid
flowchart TD
    A[Club Lead starts club creation] --> B[Fill basic club details]
    B --> C[Select 'Private' club type]
    C --> D{Enable join request questions?}
    
    D -->|No| E[Create club without questions]
    D -->|Yes| F[Toggle 'Enable Questions' ON]
    
    F --> G[Add first question]
    G --> H[Enter question text max 200 chars]
    H --> I{Mark as required?}
    
    I -->|Yes| J[Add required star indicator]
    I -->|No| K[Mark as optional]
    
    J --> L{Add more questions?}
    K --> L
    
    L -->|Yes, under 5 total| M[Add another question]
    L -->|No| N[Review questions list]
    L -->|At 5 questions| O[Show max limit message]
    
    M --> H
    O --> N
    
    N --> P[Reorder questions if needed]
    P --> Q[Create club with questions]
    Q --> R[Club created successfully]
    
    E --> S[Club created without questions]
    
    R --> T[Club lead can manage questions later]
    S --> U[Club lead can enable questions later]
```

---

## **Flow 2: User Join Request with Questions**

```mermaid
flowchart TD
    A[User browses private clubs] --> B[Finds interesting club]
    B --> C[Clicks 'Request to Join' button]
    C --> D{Club has questions enabled?}
    
    D -->|No| E[Submit basic join request]
    D -->|Yes| F[Open Join Request Modal]
    
    F --> G[Display club name and description]
    G --> H[Show list of questions]
    H --> I[Display required questions with ★]
    I --> J[Display optional questions]
    
    J --> K[User starts answering questions]
    K --> L{Answering required question?}
    
    L -->|Yes| M[Must provide answer max 500 chars]
    L -->|No| N[Can skip optional question]
    
    M --> O[Show character count]
    N --> O
    O --> P{More questions to answer?}
    
    P -->|Yes| Q[Move to next question]
    P -->|No| R[Review all answers]
    
    Q --> L
    R --> S{All required questions answered?}
    
    S -->|No| T[Show validation errors]
    S -->|Yes| U[Enable submit button]
    
    T --> V[Highlight missing required answers]
    V --> K
    
    U --> W[User clicks Submit]
    W --> X[Show loading state]
    X --> Y[Submit request with answers]
    Y --> Z[Show success message]
    Z --> AA[Close modal]
    
    E --> BB[Basic request submitted]
    AA --> CC[Request pending approval]
    BB --> CC
```

---

## **Flow 3: Club Lead Answer Review Process**

```mermaid
flowchart TD
    A[Club lead opens Member Management] --> B[Navigate to Join Requests tab]
    B --> C{Any pending requests?}
    
    C -->|No| D[Show 'No pending requests' message]
    C -->|Yes| E[Display list of pending requests]
    
    E --> F[Show user info and request date]
    F --> G{Request has answers?}
    
    G -->|No| H[Show basic request info only]
    G -->|Yes| I[Show 'View Answers' button]
    
    I --> J[Club lead clicks 'View Answers']
    J --> K[Open Join Request Review Modal]
    
    K --> L[Display user information]
    L --> M[Show username and display name]
    M --> N[Show request timestamp]
    N --> O[Display question-answer pairs]
    
    O --> P[Show question text]
    P --> Q{Question was required?}
    
    Q -->|Yes| R[Show ★ required indicator]
    Q -->|No| S[Show optional indicator]
    
    R --> T[Display user's answer]
    S --> T
    T --> U{More questions to show?}
    
    U -->|Yes| V[Show next question-answer pair]
    U -->|No| W[Show action buttons]
    
    V --> P
    W --> X[Display Approve and Reject buttons]
    X --> Y{Club lead decision?}
    
    Y -->|Approve| Z[Click Approve button]
    Y -->|Reject| AA[Click Reject button]
    Y -->|Cancel| BB[Close modal without action]
    
    Z --> CC[Show approval confirmation]
    AA --> DD[Show rejection confirmation]
    
    CC --> EE[User becomes club member]
    DD --> FF[Request removed from pending]
    
    EE --> GG[Send approval notification]
    FF --> HH[Send rejection notification]
    
    BB --> II[Return to requests list]
    GG --> II
    HH --> II
    
    H --> JJ[Show basic approve/reject options]
    JJ --> Y
```

---

## **Flow 4: Post-Creation Question Management**

```mermaid
flowchart TD
    A[Club lead accesses Club Management] --> B[Navigate to Settings section]
    B --> C[Find 'Join Request Questions' section]
    C --> D{Questions currently enabled?}
    
    D -->|No| E[Show 'Enable Questions' toggle]
    D -->|Yes| F[Show questions management interface]
    
    E --> G[Club lead enables questions]
    G --> H[Show empty questions list]
    H --> I[Show 'Add Question' button]
    
    F --> J{What action does club lead want?}
    
    J -->|Add Question| K{Under 5 questions?}
    J -->|Edit Question| L[Click edit on existing question]
    J -->|Delete Question| M[Click delete on question]
    J -->|Reorder Questions| N[Use drag-and-drop or arrows]
    J -->|Disable Questions| O[Toggle questions OFF]
    
    K -->|Yes| P[Show add question form]
    K -->|No| Q[Show max limit message]
    
    P --> R[Enter question text]
    R --> S[Set required/optional]
    S --> T[Save new question]
    T --> U[Update questions list]
    
    L --> V[Show edit question form]
    V --> W[Modify question text or required status]
    W --> X[Save changes]
    X --> U
    
    M --> Y[Show delete confirmation]
    Y --> Z{Confirm deletion?}
    Z -->|Yes| AA[Delete question]
    Z -->|No| BB[Cancel deletion]
    AA --> CC[Reorder remaining questions]
    CC --> U
    BB --> U
    
    N --> DD[Drag question to new position]
    DD --> EE[Update display order]
    EE --> U
    
    O --> FF[Confirm disable questions]
    FF --> GG{Confirm disable?}
    GG -->|Yes| HH[Disable questions feature]
    GG -->|No| II[Cancel disable]
    HH --> JJ[Hide questions interface]
    II --> F
    
    Q --> F
    U --> F
    JJ --> E
    
    I --> P
```

---

## **Flow 5: Error Handling and Edge Cases**

```mermaid
flowchart TD
    A[User/Club Lead performs action] --> B{What type of error occurs?}
    
    B -->|Network Error| C[Show retry option]
    B -->|Validation Error| D[Show field-specific errors]
    B -->|Permission Error| E[Show access denied message]
    B -->|Server Error| F[Show generic error message]
    
    C --> G[User clicks retry]
    G --> H{Retry successful?}
    H -->|Yes| I[Continue normal flow]
    H -->|No| J[Show persistent error message]
    
    D --> K[Highlight invalid fields]
    K --> L[Show error text below fields]
    L --> M[User corrects input]
    M --> N[Re-validate on change]
    N --> O{Validation passes?}
    O -->|Yes| I
    O -->|No| K
    
    E --> P[Redirect to login if needed]
    P --> Q[Show permission explanation]
    Q --> R[Provide contact information]
    
    F --> S[Log error for debugging]
    S --> T[Show user-friendly message]
    T --> U[Provide support contact]
    
    J --> V[Suggest alternative actions]
    R --> W[User seeks help or logs in]
    U --> X[User contacts support]
    V --> Y[User tries different approach]
    
    W --> Z[Attempt action again]
    X --> AA[Support resolves issue]
    Y --> BB[Alternative flow]
    
    Z --> A
    AA --> A
    BB --> CC[Different feature usage]
```

---

## **Flow 6: Mobile-Specific Interactions**

```mermaid
flowchart TD
    A[Mobile user accesses feature] --> B{Screen size detection}
    
    B -->|Small screen| C[Use mobile-optimized layout]
    B -->|Large screen| D[Use desktop layout]
    
    C --> E[Show full-screen modal]
    E --> F[Stack questions vertically]
    F --> G[Use larger touch targets]
    G --> H[Show one question at a time option]
    
    H --> I{User prefers single question view?}
    I -->|Yes| J[Show question navigation]
    I -->|No| K[Show all questions in scroll view]
    
    J --> L[Previous/Next buttons]
    L --> M[Progress indicator]
    M --> N[Question counter 1 of 5]
    
    K --> O[Vertical scroll layout]
    O --> P[Sticky submit button]
    
    N --> Q[Touch-friendly interactions]
    P --> Q
    
    Q --> R[Swipe gestures for navigation]
    R --> S[Haptic feedback on actions]
    S --> T[Auto-save draft answers]
    T --> U[Resume from where left off]
    
    D --> V[Use standard desktop layout]
    V --> W[Show all questions at once]
    W --> X[Mouse/keyboard interactions]
    X --> Y[Standard form validation]
    
    U --> Z[Complete mobile flow]
    Y --> AA[Complete desktop flow]
    
    Z --> BB[Responsive success state]
    AA --> BB
```

---

## **Integration Points**

### Existing System Touchpoints
1. **Club Creation Flow**: Integrates with `CreateBookClubForm` component
2. **Join Request System**: Extends existing `joinOrRequestClub` API
3. **Member Management**: Enhances `MemberManagementPanel` component
4. **Permission System**: Uses existing club lead permission checks
5. **Notification System**: Leverages existing approval/rejection notifications

### Data Flow Integration
1. **Questions Storage**: New `club_join_questions` table
2. **Answers Storage**: JSONB column in existing `club_members` table
3. **Club Settings**: New column in existing `book_clubs` table
4. **User Sessions**: Maintains existing authentication flow
5. **Real-time Updates**: Uses existing Supabase real-time subscriptions

---

## **Accessibility Considerations**

### Screen Reader Support
- All modals have proper ARIA labels and descriptions
- Question requirements clearly announced
- Form validation errors read aloud
- Progress indicators accessible

### Keyboard Navigation
- Tab order follows logical flow
- All interactive elements keyboard accessible
- Modal focus management
- Escape key closes modals

### Visual Accessibility
- High contrast for required question indicators
- Clear visual hierarchy
- Sufficient color contrast ratios
- Scalable text and UI elements

---

**Last Updated**: January 15, 2025  
**Diagram Format**: Mermaid  
**Maintained By**: Development Team
