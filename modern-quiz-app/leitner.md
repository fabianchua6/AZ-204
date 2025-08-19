# Leitner System Quiz App - Implementation Specification

## Overview

Implement a spaced repetition quiz application using the Leitner System algorithm. The app manages 600+ questions using 5 boxes with increasing review intervals to optimize learning retention.

## Core Algorithm: Leitner System

### Box Structure

```
Box 1: Review every 1 day    (new/difficult questions)
Box 2: Review every 2 days   (improving questions)
Box 3: Review every 4 days   (moderate mastery)
Box 4: Review every 8 days   (good mastery)
Box 5: Review every 16 days  (strong mastery)
```

### Question Movement Logic

```
Correct Answer â†’ Move to next higher box (Box 1â†’2â†’3â†’4â†’5)
Incorrect Answer â†’ Move back to Box 1 (regardless of current box)
Box 5 Correct â†’ Stay in Box 5
```

## Database Schema

### Questions Table

```sql
CREATE TABLE questions (
    id INTEGER PRIMARY KEY,
    content TEXT NOT NULL,
    options JSON NOT NULL,      -- Array of answer choices
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    topic VARCHAR(100),
    difficulty ENUM('easy', 'medium', 'hard'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Progress Table

```sql
CREATE TABLE user_progress (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    current_box INTEGER DEFAULT 1,        -- Box 1-5
    next_review_date DATE NOT NULL,       -- When question is due next
    times_correct INTEGER DEFAULT 0,
    times_incorrect INTEGER DEFAULT 0,
    last_reviewed DATE,
    last_answer_correct BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (question_id) REFERENCES questions(id),
    UNIQUE(user_id, question_id)
);
```

### Review History Table

```sql
CREATE TABLE review_history (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    was_correct BOOLEAN NOT NULL,
    response_time_seconds INTEGER,
    previous_box INTEGER,
    new_box INTEGER,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Core Functions

### 1. Question Scheduling Algorithm

```python
def calculate_next_review_date(current_box, review_date):
    """
    Calculate next review date based on Leitner box intervals
    """
    intervals = {1: 1, 2: 2, 3: 4, 4: 8, 5: 16}  # days
    interval = intervals[current_box]
    return review_date + timedelta(days=interval)

def move_question_after_answer(current_box, was_correct):
    """
    Determine new box based on answer correctness
    """
    if was_correct:
        return min(current_box + 1, 5)  # Move up, max Box 5
    else:
        return 1  # Reset to Box 1 for incorrect answers
```

### 2. Daily Question Selection

```python
def get_due_questions(user_id, current_date, limit=20):
    """
    Get questions due for review today, prioritizing lower boxes
    """
    query = """
    SELECT q.*, up.current_box, up.times_incorrect
    FROM questions q
    JOIN user_progress up ON q.id = up.question_id
    WHERE up.user_id = ?
    AND up.next_review_date <= ?
    ORDER BY up.current_box ASC,     -- Box 1 first (highest priority)
             up.times_incorrect DESC, -- More failed attempts first
             RANDOM()                 -- Randomize within same priority
    LIMIT ?
    """
    return execute_query(query, [user_id, current_date, limit])
```

### 3. Answer Processing

```python
def process_answer(user_id, question_id, user_answer, correct_answer, response_time):
    """
    Process user's answer and update progress using Leitner algorithm
    """
    was_correct = (user_answer == correct_answer)

    # Get current progress
    progress = get_user_progress(user_id, question_id)
    current_box = progress.current_box

    # Apply Leitner algorithm
    new_box = move_question_after_answer(current_box, was_correct)
    next_review = calculate_next_review_date(new_box, datetime.now().date())

    # Update progress
    update_progress(
        user_id=user_id,
        question_id=question_id,
        new_box=new_box,
        next_review_date=next_review,
        was_correct=was_correct,
        response_time=response_time
    )

    # Log the review
    log_review(user_id, question_id, was_correct, response_time,
               current_box, new_box)

    return {
        'correct': was_correct,
        'moved_from_box': current_box,
        'moved_to_box': new_box,
        'next_review': next_review
    }
```

## API Endpoints

### GET /api/daily-questions

```json
{
  "questions": [
    {
      "id": 123,
      "content": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "current_box": 1,
      "times_failed": 2
    }
  ],
  "total_due": 25,
  "by_box": { "1": 15, "2": 7, "3": 2, "4": 1, "5": 0 }
}
```

### POST /api/submit-answer

```json
{
  "question_id": 123,
  "user_answer": "Paris",
  "response_time_seconds": 8
}

Response:
{
  "correct": true,
  "explanation": "Paris is indeed the capital of France.",
  "box_movement": {
    "from": 1,
    "to": 2
  },
  "next_review": "2025-08-21"
}
```

### GET /api/progress-stats

```json
{
  "total_questions": 600,
  "box_distribution": {
    "box_1": 45, // Need daily review
    "box_2": 78, // Every 2 days
    "box_3": 123, // Every 4 days
    "box_4": 89, // Every 8 days
    "box_5": 265 // Every 16 days
  },
  "due_today": 23,
  "accuracy_rate": 0.78,
  "streak_days": 12
}
```

## UI Requirements

### 1. Daily Quiz Session

- Display questions one at a time (active recall)
- Hide answer choices until user attempts recall
- Show immediate feedback after each answer
- Display box movement animation
- Show session progress (Question X of Y)

### 2. Progress Dashboard

- Visual representation of questions in each box (bar chart)
- Daily streak counter
- Accuracy percentage over time
- Questions due today/tomorrow/this week

### 3. Question Management

- Import questions from CSV/JSON
- Tag questions by topic
- Mark questions for review
- View question statistics

## Key Features

### 1. Active Recall Implementation

```javascript
// Force users to attempt recall before showing options
function startQuestion(question) {
  showQuestionText(question.content);
  showRecallPrompt(); // "Try to recall the answer first"

  // Only show options after user confirms they've attempted recall
  waitForRecallAttempt().then(() => {
    showAnswerOptions(question.options);
    startTimer();
  });
}
```

### 2. Interleaving

```python
def get_interleaved_questions(user_id, session_size=20):
    """
    Mix questions from different topics and boxes for better learning
    """
    questions = get_due_questions(user_id, datetime.now().date(), session_size * 2)

    # Group by topic and box, then interleave
    return interleave_by_topic_and_difficulty(questions)[:session_size]
```

### 3. Performance Analytics

- Track response times by topic
- Identify problematic questions (high failure rate)
- Monitor learning velocity (questions moving to higher boxes)
- Generate study recommendations

## Implementation Priority

### Phase 1: Core Leitner System

1. Database schema setup
2. Basic Leitner algorithm (question movement)
3. Daily question selection logic
4. Simple quiz interface

### Phase 2: Enhanced Learning Features

1. Active recall prompts
2. Interleaving algorithm
3. Progress visualization
4. Performance analytics

### Phase 3: Advanced Features

1. Spaced repetition optimization
2. Adaptive difficulty
3. Study recommendations
4. Export/import functionality

## Configuration

### Default Settings

```python
LEITNER_INTERVALS = {
    1: 1,    # Box 1: 1 day
    2: 2,    # Box 2: 2 days
    3: 4,    # Box 3: 4 days
    4: 8,    # Box 4: 8 days
    5: 16    # Box 5: 16 days
}

SESSION_SIZE = 20           # Questions per daily session
MAX_NEW_QUESTIONS = 10      # New questions introduced daily
RESPONSE_TIME_LIMIT = 60    # Seconds per question
```

## Testing Requirements

### Unit Tests

- Leitner algorithm correctness
- Date calculations
- Question movement logic
- Progress tracking

### Integration Tests

- Daily session flow
- Database consistency
- Performance under load
- Data import/export
