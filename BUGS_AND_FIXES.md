# Bug Fixes and Improvements

This document provides specific, actionable fixes for the bugs and issues identified in the AZ-204 quiz app.

## Critical Bugs

### Bug #1: Correct Answer Momentarily Visible on Navigation ⚠️ HIGH PRIORITY

**Problem:** When clicking "Next" to move to the next question, the correct answer from the previous question briefly appears (green highlight) before the new question loads.

**Root Cause:** The component is reusing the same DOM elements and state isn't being reset synchronously. The `showAnswer` state and `checkedValues` persist briefly during the transition.

**Current Code Location:** `app/routes/_index.tsx` - QuestionForm component

**Fix Option 1: Force Component Remount (RECOMMENDED - Already Implemented)**
```typescript
// In Index component (line ~114)
return (
  <QuestionForm
    key={data.id}  // ✅ Forces React to completely remount the component
    data={data}
    answered={answered}
    topic={loaderData.topic}
  />
);
```

**Fix Option 2: Add Defensive State Reset**
Add an effect to ensure state is cleared immediately:
```typescript
// In QuestionForm component
const [checkedValues, setCheckedValues] = useState<number[]>([]);
const [showAnswer, setShowAnswer] = useState(false);

// Add this effect
useEffect(() => {
  setCheckedValues([]);
  setShowAnswer(false);
}, [data.id]);
```

**Fix Option 3: Hide Answer Display During Transition**
```typescript
const [isTransitioning, setIsTransitioning] = useState(false);

const handleSubmit = () => {
  setIsTransitioning(true);
  window.history.pushState({}, data.id, window.location.href);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => setIsTransitioning(false), 100);
  return false;
};

// In render
<div className={clsx(
  'mt-4 overflow-hidden transition-opacity duration-500 ease-in-out',
  (showAnswer && !isTransitioning) ? 'h-auto opacity-100' : 'h-0 opacity-0',
)}>
```

**Testing:**
1. Start the app
2. Answer a question correctly (see green highlight)
3. Click "Next"
4. Observe if green highlight from previous question appears
5. Repeat with wrong answers (red highlight)

**Status:** ✅ Partially fixed with component key. Consider adding defensive reset for extra safety.

---

### Bug #2: Favicon Not Working on iOS 🍎

**Problem:** Favicon doesn't display correctly on iOS devices, particularly on the home screen when app is added.

**Investigation Steps:**
```bash
# 1. Check current favicon files
ls -la quiz-app/public/
# Expected files:
# - favicon.ico (16x16, 32x32, 48x48)
# - favicon-16x16.png
# - favicon-32x32.png
# - apple-touch-icon.png (180x180 minimum)
# - android-chrome-192x192.png
# - android-chrome-512x512.png

# 2. Verify apple-touch-icon size
file quiz-app/public/apple-touch-icon.png
# Should output: PNG image data, 180 x 180 (or larger)

# 3. Check site.webmanifest
cat quiz-app/public/site.webmanifest
```

**Fix:**

1. **Verify apple-touch-icon.png is proper size:**
```bash
# Generate 180x180 version if needed (using ImageMagick)
convert quiz-app/public/apple-touch-icon.png -resize 180x180 quiz-app/public/apple-touch-icon.png
```

2. **Add proper meta tags to root.tsx:**
```typescript
// app/root.tsx - in the <head> section
<head>
  <meta charSet="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <Meta />
  <Links />
  
  {/* Add these favicon links */}
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="manifest" href="/site.webmanifest" />
</head>
```

3. **Update site.webmanifest:**
```json
{
  "name": "AZ-204 Quiz",
  "short_name": "AZ-204",
  "description": "Study quiz for Microsoft Azure AZ-204 certification",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/"
}
```

4. **Clear cache and test:**
```bash
# On iOS device:
# 1. Clear Safari cache: Settings > Safari > Clear History and Website Data
# 2. Force quit Safari
# 3. Open site in Safari
# 4. Add to Home Screen
# 5. Verify icon appears correctly
```

**Common iOS Favicon Issues:**
- ❌ Icon too small (must be at least 180x180)
- ❌ Icon not square
- ❌ Aggressive caching by iOS
- ❌ Missing or incorrect manifest
- ❌ Icon path incorrect

**Status:** 🔍 Requires investigation and testing on actual iOS device

---

### Bug #3: Previous Attempts Show Up After Quiz Completion

**Problem:** After completing all questions in a topic, questions that were seen previously may still appear in the random quiz mode due to the Leitner algorithm.

**Root Cause:** The Leitner algorithm uses probability-based filtering but doesn't have explicit cooldown periods or "mastery" tracking.

**Current Logic Location:** `app/lib/qa.ts` - `getQA()` function, `convertToChances()` function

**Current Code:**
```typescript
const chances = convertToChances(
  answers,
  answers.length === questions.length,
);

const filtered = questions.filter(
  (item) => !chances[item.id] || Math.random() > chances[item.id],
);
```

**Issues:**
1. Questions can reappear even if recently seen
2. No concept of "mastered" (multiple correct answers)
3. No time-based cooldown

**Fix Option 1: Add Minimum Cooldown Period**
```typescript
// app/lib/storage.ts - Add new interface
interface QuestionProgress {
  id: string;
  lastSeen: number;  // timestamp
  timesCorrect: number;
  timesIncorrect: number;
}

// Store progress with more detail
export function saveQuestionProgress(
  questionId: string,
  wasCorrect: boolean
): void {
  try {
    const key = 'question_progress';
    const data = localStorage.getItem(key);
    const progress: Record<string, QuestionProgress> = data ? JSON.parse(data) : {};
    
    const current = progress[questionId] || {
      id: questionId,
      lastSeen: 0,
      timesCorrect: 0,
      timesIncorrect: 0
    };
    
    progress[questionId] = {
      ...current,
      lastSeen: Date.now(),
      timesCorrect: current.timesCorrect + (wasCorrect ? 1 : 0),
      timesIncorrect: current.timesIncorrect + (wasCorrect ? 0 : 1)
    };
    
    localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    console.warn('Failed to save question progress');
  }
}

// app/lib/qa.ts - Update getQA to use cooldown
export const getQA = (
  topic?: string | null | undefined,
  answeredIndexes?: Set<number> | null | undefined,
): Question | null => {
  let questions: QAPair[] = topic
    ? (dataByTopicMap.get(topic) || [])
    : data;

  if (questions.length === 0) return null;

  // Load progress data
  const progressData = loadQuestionProgress();
  const now = Date.now();
  const MIN_COOLDOWN_HOURS = 1; // Don't show same question within 1 hour
  
  // Filter out recently seen questions
  questions = questions.filter(q => {
    const progress = progressData[q.id];
    if (!progress) return true;
    
    const hoursSinceLastSeen = (now - progress.lastSeen) / (1000 * 60 * 60);
    return hoursSinceLastSeen >= MIN_COOLDOWN_HOURS;
  });

  if (questions.length === 0) {
    // All questions are in cooldown, return null or show completion message
    return null;
  }

  // Continue with existing logic...
  const question = getRandomElement<QAPair>(questions);
  const index = data.findIndex((item) => item.id === question.id);

  return shuffleQA({ ...question, index });
};

function loadQuestionProgress(): Record<string, QuestionProgress> {
  try {
    const data = localStorage.getItem('question_progress');
    if (!data) return {};
    return JSON.parse(data) as Record<string, QuestionProgress>;
  } catch {
    return {};
  }
}
```

**Fix Option 2: Implement Proper Spaced Repetition Intervals**
```typescript
// Leitner Box System with time-based intervals
const LEITNER_INTERVALS = [
  0.5,  // Box 1: 30 minutes
  2,    // Box 2: 2 hours
  8,    // Box 3: 8 hours
  24,   // Box 4: 1 day
  72,   // Box 5: 3 days
  168,  // Box 6: 1 week
];

interface LeitnerProgress {
  id: string;
  box: number;  // Current Leitner box (0-5)
  lastSeen: number;
  consecutiveCorrect: number;
}

function shouldShowQuestion(
  progress: LeitnerProgress | undefined,
  now: number
): boolean {
  if (!progress) return true; // New question
  
  const box = Math.min(progress.box, LEITNER_INTERVALS.length - 1);
  const requiredHours = LEITNER_INTERVALS[box];
  const hoursSinceLastSeen = (now - progress.lastSeen) / (1000 * 60 * 60);
  
  return hoursSinceLastSeen >= requiredHours;
}

// Update progress after answering
function updateLeitnerProgress(
  questionId: string,
  wasCorrect: boolean
): void {
  const progressData = loadQuestionProgress();
  const current = progressData[questionId] || {
    id: questionId,
    box: 0,
    lastSeen: 0,
    consecutiveCorrect: 0
  };
  
  if (wasCorrect) {
    // Move to next box
    current.box = Math.min(current.box + 1, LEITNER_INTERVALS.length - 1);
    current.consecutiveCorrect++;
  } else {
    // Move back to box 0
    current.box = 0;
    current.consecutiveCorrect = 0;
  }
  
  current.lastSeen = Date.now();
  progressData[questionId] = current;
  
  saveQuestionProgress(progressData);
}
```

**Testing:**
1. Answer all questions in a topic
2. Immediately request another question
3. Verify you don't see the same questions again within cooldown period
4. Wait for cooldown period to expire
5. Verify questions reappear with proper spacing

**Recommended Approach:** Implement Fix Option 1 first (simple cooldown), then enhance with Fix Option 2 if more sophisticated spaced repetition is desired.

**Status:** ⚠️ Not yet fixed - requires implementation

---

## Medium Priority Issues

### Issue #1: Race Conditions in localStorage

**Problem:** Multiple rapid saves to localStorage can cause data loss due to read-modify-write race conditions.

**Example Scenario:**
```typescript
// Time 0ms: User answers question A
const existing1 = loadAnsweredQuestions(); // Read: [1, 2, 3]
// Time 5ms: User answers question B (before first save completes)
const existing2 = loadAnsweredQuestions(); // Read: [1, 2, 3] (same stale data)
// Time 10ms: First save
saveAnsweredQuestions([...existing1, 'A']); // Write: [1, 2, 3, A]
// Time 15ms: Second save
saveAnsweredQuestions([...existing2, 'B']); // Write: [1, 2, 3, B] (lost A!)
```

**Fix: Add Debouncing**
```typescript
// app/lib/storage.ts

// Create a debounce map for different storage keys
const saveQueues = new Map<string, NodeJS.Timeout>();

export function saveAnsweredQuestions(
  topic: string | null,
  questionIds: string[],
): void {
  if (typeof window === 'undefined') return;

  const storageKey = topic || '_all';
  
  // Clear any pending save for this key
  const existingTimeout = saveQueues.get(storageKey);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  
  // Debounce the save operation
  const timeoutId = setTimeout(() => {
    try {
      const existingData = localStorage.getItem(GLOBAL_ANSWERED_KEY);
      const answered: AnsweredQuestions = existingData
        ? (JSON.parse(existingData) as AnsweredQuestions)
        : {};

      answered[storageKey] = questionIds;

      localStorage.setItem(GLOBAL_ANSWERED_KEY, JSON.stringify(answered));
      saveQueues.delete(storageKey);
    } catch {
      console.warn('Failed to save answered questions');
    }
  }, 300); // Wait 300ms before saving
  
  saveQueues.set(storageKey, timeoutId);
}

// Add cleanup on unmount
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Flush all pending saves
    for (const timeout of saveQueues.values()) {
      clearTimeout(timeout);
    }
    saveQueues.clear();
  });
}
```

**Testing:**
1. Rapidly click through multiple questions (< 300ms between clicks)
2. Verify all answers are saved correctly
3. Check localStorage in DevTools to confirm data integrity

**Status:** ⚠️ Not yet fixed

---

### Issue #2: No Error Handling for Corrupted Data

**Problem:** If localStorage data gets corrupted, the app crashes instead of recovering gracefully.

**Fix: Add Error Boundary and Data Validation**

**Step 1: Create Error Boundary Component**
```typescript
// app/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-8">
          <div className="max-w-md w-full text-center">
            <h2 className="text-3xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-700 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                // Clear potentially corrupted data
                localStorage.clear();
                window.location.reload();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Clear Data & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Step 2: Wrap Routes with Error Boundary**
```typescript
// app/root.tsx
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <html lang="en">
      {/* ... */}
      <body>
        <ErrorBoundary>
          <div id="detail">
            <header>
              {/* ... */}
            </header>
            <Outlet />
          </div>
        </ErrorBoundary>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

**Step 3: Add Data Validation**
```typescript
// app/lib/storage.ts

// Type guards
function isQuizProgress(obj: unknown): obj is QuizProgress {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'index' in obj &&
    'questionIds' in obj &&
    'timestamp' in obj &&
    typeof obj.index === 'number' &&
    Array.isArray(obj.questionIds) &&
    obj.questionIds.every(id => typeof id === 'string') &&
    typeof obj.timestamp === 'number'
  );
}

function isAnsweredQuestions(obj: unknown): obj is AnsweredQuestions {
  if (typeof obj !== 'object' || obj === null) return false;
  
  for (const value of Object.values(obj)) {
    if (!Array.isArray(value)) return false;
    if (!value.every(id => typeof id === 'string')) return false;
  }
  
  return true;
}

// Update load functions to use type guards
export function loadTopicProgress(topic: string): QuizProgress | null {
  try {
    const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${topic}`);
    if (!data) return null;

    const parsed = JSON.parse(data);
    
    // Validate the data
    if (!isQuizProgress(parsed)) {
      console.warn('Invalid quiz progress data, clearing...');
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${topic}`);
      return null;
    }

    // Expire check
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > ONE_DAY) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${topic}`);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Error loading topic progress:', error);
    // Clear corrupted data
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${topic}`);
    } catch {}
    return null;
  }
}
```

**Testing:**
1. Manually corrupt localStorage data in DevTools
2. Reload the app
3. Verify error boundary catches the error
4. Verify corrupted data is cleared
5. Verify app continues to work after reload

**Status:** ⚠️ Not yet fixed

---

## Low Priority Improvements

### Improvement #1: Add Keyboard Shortcuts

**Enhancement:** Add keyboard shortcuts for power users

```typescript
// app/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';

export function useKeyboardShortcuts(handlers: {
  onShowAnswer?: () => void;
  onNext?: () => void;
  onSelect?: (index: number) => void;
}) {
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'a':
        case 'A':
          handlers.onShowAnswer?.();
          break;
        case 'Enter':
        case ' ':
          handlers.onNext?.();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          const index = parseInt(e.key) - 1;
          handlers.onSelect?.(index);
          break;
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlers]);
}

// Usage in QuestionForm
function QuestionForm({ data, answered, topic }: Props) {
  // ... existing code

  useKeyboardShortcuts({
    onShowAnswer: () => setShowAnswer(prev => !prev),
    onNext: () => handleSubmit(),
    onSelect: (index) => {
      if (index < data.options.length) {
        setCheckedValues([index]);
      }
    }
  });

  // ... rest of component
}
```

### Improvement #2: Add Statistics Tracking

**Enhancement:** Track study statistics

```typescript
// app/lib/statistics.ts
interface StudyStats {
  totalQuestionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  topicStats: Record<string, {
    total: number;
    correct: number;
  }>;
  studySessions: {
    date: string;
    questionsAnswered: number;
    duration: number; // minutes
  }[];
}

export function updateStats(
  questionId: string,
  topic: string,
  wasCorrect: boolean
): void {
  const stats = loadStats();
  
  stats.totalQuestionsAnswered++;
  if (wasCorrect) {
    stats.correctAnswers++;
  } else {
    stats.incorrectAnswers++;
  }
  
  if (!stats.topicStats[topic]) {
    stats.topicStats[topic] = { total: 0, correct: 0 };
  }
  stats.topicStats[topic].total++;
  if (wasCorrect) {
    stats.topicStats[topic].correct++;
  }
  
  saveStats(stats);
}

// Add statistics route
// app/routes/statistics.tsx
export default function Statistics() {
  const stats = loadStats();
  const accuracy = (stats.correctAnswers / stats.totalQuestionsAnswered * 100).toFixed(1);
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Study Statistics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Questions"
          value={stats.totalQuestionsAnswered}
          icon="📊"
        />
        <StatCard
          title="Accuracy"
          value={`${accuracy}%`}
          icon="🎯"
        />
        <StatCard
          title="Study Streak"
          value={calculateStreak(stats.studySessions)}
          icon="🔥"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Topic Performance</h2>
        {Object.entries(stats.topicStats).map(([topic, data]) => (
          <TopicStatRow
            key={topic}
            topic={topic}
            total={data.total}
            correct={data.correct}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Summary of Action Items

### Immediate (Do Now)
1. ✅ Fix TypeScript type assertions in storage.ts
2. ✅ Fix accessibility issues (SVG aria-labels, button types)
3. ⚠️ Verify answer visibility bug fix is working properly
4. ⚠️ Investigate and fix iOS favicon issue

### Short-term (Next Session)
1. Implement cooldown period for recently seen questions
2. Add debouncing to localStorage saves
3. Create and add Error Boundary component
4. Add data validation with type guards

### Long-term (When Time Permits)
1. Implement proper Leitner spaced repetition algorithm
2. Add statistics tracking
3. Add keyboard shortcuts
4. Create comprehensive test suite
5. Add PWA features for offline support

---

## Testing Checklist

After implementing fixes, verify:

- [ ] Answer visibility bug is completely fixed
- [ ] No TypeScript errors
- [ ] All accessibility warnings resolved
- [ ] Build completes successfully
- [ ] App runs without errors
- [ ] localStorage operations are stable
- [ ] Error handling works (test with corrupted data)
- [ ] Keyboard shortcuts work (if implemented)
- [ ] iOS favicon displays (if fixed)
- [ ] Leitner algorithm respects cooldown periods (if implemented)

---

## Additional Resources

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [TypeScript Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [localStorage Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Leitner System](https://en.wikipedia.org/wiki/Leitner_system)
- [iOS Web App Icons](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/)
