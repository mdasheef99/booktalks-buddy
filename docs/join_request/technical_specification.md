# Join Request Form Questions - Technical Specification

## Database Schema Design

### New Tables

#### `club_join_questions`
```sql
CREATE TABLE club_join_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL CHECK (char_length(question_text) <= 200),
  is_required BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure unique ordering per club
  UNIQUE(club_id, display_order),
  
  -- Ensure max 5 questions per club (enforced by application logic)
  CONSTRAINT max_questions_per_club CHECK (display_order BETWEEN 1 AND 5)
);
```

### Schema Extensions

#### `book_clubs` Table Extensions
```sql
-- Add questions enabled flag
ALTER TABLE book_clubs 
ADD COLUMN join_questions_enabled BOOLEAN DEFAULT false;
```

#### `club_members` Table Extensions
```sql
-- Add answers storage for pending requests
ALTER TABLE club_members 
ADD COLUMN join_answers JSONB;
```

### JSONB Answer Format
```json
{
  "answers": [
    {
      "question_id": "uuid-here",
      "question_text": "Why do you want to join this club?",
      "answer": "I love mystery novels and want to discuss them with others.",
      "is_required": true
    }
  ],
  "submitted_at": "2025-01-15T10:30:00Z"
}
```

### Indexes and Constraints
```sql
-- Optimize question queries
CREATE INDEX idx_club_join_questions_club_id ON club_join_questions(club_id);
CREATE INDEX idx_club_join_questions_order ON club_join_questions(club_id, display_order);

-- Optimize answer queries
CREATE INDEX idx_club_members_answers ON club_members USING GIN (join_answers) 
WHERE join_answers IS NOT NULL;
```

## API Contracts

### Question Management APIs

#### `POST /api/clubs/{clubId}/questions`
**Create Question**
```typescript
interface CreateQuestionRequest {
  question_text: string; // max 200 chars
  is_required: boolean;
  display_order: number; // 1-5
}

interface CreateQuestionResponse {
  success: boolean;
  question: {
    id: string;
    question_text: string;
    is_required: boolean;
    display_order: number;
    created_at: string;
  };
}
```

#### `GET /api/clubs/{clubId}/questions`
**Get Club Questions**
```typescript
interface GetQuestionsResponse {
  success: boolean;
  questions: Array<{
    id: string;
    question_text: string;
    is_required: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
  }>;
}
```

#### `PUT /api/clubs/{clubId}/questions/{questionId}`
**Update Question**
```typescript
interface UpdateQuestionRequest {
  question_text?: string;
  is_required?: boolean;
  display_order?: number;
}

interface UpdateQuestionResponse {
  success: boolean;
  question: QuestionObject;
}
```

#### `DELETE /api/clubs/{clubId}/questions/{questionId}`
**Delete Question**
```typescript
interface DeleteQuestionResponse {
  success: boolean;
  message: string;
}
```

#### `PUT /api/clubs/{clubId}/questions/reorder`
**Reorder Questions**
```typescript
interface ReorderQuestionsRequest {
  question_orders: Array<{
    question_id: string;
    display_order: number;
  }>;
}

interface ReorderQuestionsResponse {
  success: boolean;
  questions: QuestionObject[];
}
```

### Join Request APIs (Extended)

#### `POST /api/clubs/{clubId}/join` (Enhanced)
**Join Club with Answers**
```typescript
interface JoinClubRequest {
  answers?: Array<{
    question_id: string;
    answer: string; // max 500 chars
  }>;
}

interface JoinClubResponse {
  success: boolean;
  message: string;
  requires_approval: boolean;
  join_request_id?: string;
}
```

#### `GET /api/clubs/{clubId}/join-requests/{requestId}/answers`
**Get Join Request Answers**
```typescript
interface GetAnswersResponse {
  success: boolean;
  answers: Array<{
    question_id: string;
    question_text: string;
    answer: string;
    is_required: boolean;
  }>;
  user_info: {
    user_id: string;
    username: string;
    display_name: string;
  };
  submitted_at: string;
}
```

## Component Specifications

### `JoinQuestionsManager`
**Purpose**: Question CRUD interface for club leads

```typescript
interface JoinQuestionsManagerProps {
  clubId: string;
  questionsEnabled: boolean;
  onToggleQuestions: (enabled: boolean) => void;
  onQuestionsChange: () => void;
}

interface Question {
  id: string;
  question_text: string;
  is_required: boolean;
  display_order: number;
}
```

**Features**:
- Toggle questions enabled/disabled
- Add new questions (max 5)
- Edit existing questions inline
- Mark questions as required/optional
- Drag-and-drop reordering
- Delete questions with confirmation
- Character count indicators
- Validation and error handling

### `JoinRequestModal`
**Purpose**: Modal form for answering club questions

```typescript
interface JoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  clubName: string;
  questions: Question[];
  onSubmit: (answers: Answer[]) => Promise<void>;
}

interface Answer {
  question_id: string;
  answer: string;
}
```

**Features**:
- Responsive modal design
- Question display with required indicators
- Answer validation
- Character count for answers
- Submit/cancel actions
- Loading states
- Error handling

### `JoinRequestReviewModal`
**Purpose**: Answer review interface for club leads

```typescript
interface JoinRequestReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  joinRequest: {
    user_id: string;
    username: string;
    display_name: string;
    requested_at: string;
    answers: QuestionAnswer[];
  };
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}

interface QuestionAnswer {
  question_text: string;
  answer: string;
  is_required: boolean;
}
```

**Features**:
- User information display
- Question-answer pairs formatting
- Required/optional indicators
- Approve/reject actions
- Loading states
- Confirmation dialogs

## Data Validation Rules

### Question Validation
- **Text Length**: 1-200 characters
- **Question Limit**: Maximum 5 questions per club
- **Order Validation**: display_order must be 1-5 and unique per club
- **Required Field**: question_text cannot be empty

### Answer Validation
- **Text Length**: 0-500 characters
- **Required Answers**: Must provide answers for all required questions
- **Question Existence**: question_id must reference existing question
- **Club Context**: Answers only accepted for club's active questions

### Business Rules
- **Private Clubs Only**: Questions feature only available for private clubs
- **Club Lead Permission**: Only club leads can manage questions
- **Active Questions**: Only active questions require answers
- **Answer Persistence**: Answers stored with pending requests only

## Security Considerations

### Access Control
```sql
-- RLS Policy: Club leads can manage their club's questions
CREATE POLICY "Club leads can manage questions" ON club_join_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM book_clubs 
      WHERE book_clubs.id = club_join_questions.club_id 
      AND book_clubs.lead_user_id = auth.uid()
    )
  );

-- RLS Policy: Club leads can view answers for their clubs
CREATE POLICY "Club leads can view join answers" ON club_members
  FOR SELECT USING (
    role = 'pending' AND
    EXISTS (
      SELECT 1 FROM book_clubs 
      WHERE book_clubs.id = club_members.club_id 
      AND book_clubs.lead_user_id = auth.uid()
    )
  );
```

### Input Sanitization
- **XSS Prevention**: Sanitize all text inputs
- **SQL Injection**: Use parameterized queries
- **Character Limits**: Enforce at database and application levels
- **Rate Limiting**: Prevent spam question creation/updates

## Performance Considerations

### Database Optimization
- **Indexed Queries**: Efficient question and answer retrieval
- **JSONB Operations**: Optimized answer storage and querying
- **Connection Pooling**: Efficient database connection management
- **Query Batching**: Minimize database round trips

### Frontend Optimization
- **Lazy Loading**: Load questions only when needed
- **Debounced Updates**: Prevent excessive API calls during editing
- **Optimistic Updates**: Immediate UI feedback for better UX
- **Caching**: Cache questions for repeated access

## Error Handling Strategy

### API Error Responses
```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
}
```

### Common Error Codes
- `QUESTION_LIMIT_EXCEEDED`: More than 5 questions
- `INVALID_QUESTION_TEXT`: Text validation failed
- `DUPLICATE_ORDER`: Display order conflict
- `PERMISSION_DENIED`: Insufficient permissions
- `CLUB_NOT_FOUND`: Invalid club ID
- `REQUIRED_ANSWER_MISSING`: Missing required answer

### Frontend Error Handling
- **Toast Notifications**: User-friendly error messages
- **Form Validation**: Real-time validation feedback
- **Retry Logic**: Automatic retry for network errors
- **Graceful Degradation**: Fallback behavior for failures

## Testing Strategy

### Unit Tests
- Question CRUD operations
- Answer validation logic
- Permission checking
- Data transformation functions

### Integration Tests
- API endpoint functionality
- Database operations
- Component interactions
- Error scenarios

### End-to-End Tests
- Complete join request flow
- Question management workflow
- Answer review process
- Mobile responsiveness
