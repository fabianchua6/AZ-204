# 🌙 Dark Mode Color Scheme Proposal

## Current Issues
- Too flat and monotonous
- No visual hierarchy between elements
- Cards blend into background
- Poor contrast for readability

## Proposed Color Palette

### Background Layers (Dark to Light)
```css
--background: #0a0a0b;           /* Deepest background (body) */
--background-secondary: #111113;  /* Secondary areas */
--card: #1a1a1d;                 /* Cards and elevated surfaces */
--card-hover: #222226;           /* Card hover states */
--muted: #2a2a2e;                /* Subtle elements */
```

### Borders & Dividers
```css
--border: #2a2a2e;               /* Subtle borders */
--border-strong: #3a3a3e;       /* More prominent borders */
--accent-border: #4a4a4e;       /* Interactive borders */
```

### Text Hierarchy
```css
--foreground: #f4f4f5;          /* Primary text */
--foreground-muted: #a1a1aa;    /* Secondary text */
--foreground-subtle: #71717a;   /* Tertiary text */
```

### Interactive Elements
```css
--primary: #3b82f6;             /* Primary actions */
--primary-hover: #2563eb;       /* Primary hover */
--accent: #1e293b;              /* Accent backgrounds */
--accent-foreground: #e2e8f0;   /* Accent text */
```

## Visual Hierarchy Examples

### Quiz Card Structure
```
┌─ QUIZ CONTROLS ──────────────────────────────────┐
│ Background: #1a1a1d (card)                      │
│ Border: #2a2a2e (subtle)                        │
│ ┌─ Target Icon + Progress ─────────────────────┐ │
│ │ Background: #111113 (secondary)              │ │
│ │ Text: #a1a1aa (muted)                        │ │
│ └───────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘

┌─ MAIN QUIZ CARD ─────────────────────────────────┐
│ Background: #1a1a1d (card)                      │
│ Border: #3a3a3e (strong)                        │
│ Shadow: 0 4px 12px rgba(0,0,0,0.4)              │
│                                                  │
│ ┌─ HEADER ────────────────────────────────────┐  │
│ │ [Topic Badge] ────────────── [Nav Buttons] │  │
│ │ Badge: #3b82f6 (primary)                   │  │
│ │ Buttons: #2a2a2e (muted) hover #4a4a4e     │  │
│ └─────────────────────────────────────────────┘  │
│                                                  │
│ ┌─ CONTENT ───────────────────────────────────┐  │
│ │ Question text: #f4f4f5 (foreground)        │  │
│ │                                             │  │
│ │ ┌─ OPTIONS ─────────────────────────────┐   │  │
│ │ │ Background: #111113 (secondary)       │   │  │
│ │ │ Border: #2a2a2e → #3b82f6 (hover)     │   │  │
│ │ │ Selected: #1e293b (accent bg)         │   │  │
│ │ └────────────────────────────────────────┘   │  │
│ └─────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

## Key Improvements

### 1. **Layered Depth**
- Base: `#0a0a0b` (deepest)
- Controls card: `#1a1a1d` (elevated)
- Quiz card: `#1a1a1d` with stronger border
- Options: `#111113` (recessed)

### 2. **Interactive States**
```css
/* Option states */
.option-default: background #111113, border #2a2a2e
.option-hover: background #1a1a1d, border #3b82f6
.option-selected: background #1e293b, border #3b82f6
.option-correct: background #065f46, border #10b981
.option-wrong: background #7f1d1d, border #ef4444
```

### 3. **Enhanced Shadows**
```css
.quiz-card {
  box-shadow: 
    0 1px 3px rgba(0,0,0,0.3),
    0 4px 12px rgba(0,0,0,0.2),
    0 0 0 1px rgba(255,255,255,0.05);
}

.quiz-controls {
  box-shadow: 
    0 1px 2px rgba(0,0,0,0.2),
    0 0 0 1px rgba(255,255,255,0.03);
}
```

### 4. **Topic Badge Enhancement**
```css
.topic-badge {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: 1px solid rgba(59,130,246,0.3);
  box-shadow: 0 2px 4px rgba(59,130,246,0.2);
}
```

## Implementation Strategy

1. **Update CSS Variables** in globals.css
2. **Add subtle gradients** for depth
3. **Enhance border contrast** for definition
4. **Improve interactive states** with proper feedback
5. **Add strategic shadows** for elevation

Would you like me to implement this color scheme? It will make the dark mode much more sophisticated and visually appealing! 🎨
