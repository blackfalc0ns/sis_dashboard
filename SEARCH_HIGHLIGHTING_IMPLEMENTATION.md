# Search Highlighting Implementation

## Overview

Added visual search term highlighting across all tables to help users identify exactly what they're searching for in the results.

## Component Created

### HighlightText Component

**Location:** `src/components/admissions/HighlightText.tsx`

A reusable React component that highlights matching search terms within text.

**Props:**

- `text`: The full text to display
- `highlight`: The search term to highlight

**Features:**

- Case-insensitive matching
- Regex-safe (escapes special characters)
- Yellow highlight background
- Bold font weight for emphasis
- Rounded corners for polish
- No highlight when search is empty

**Example Usage:**

```tsx
<HighlightText text="John Smith" highlight="john" />
// Renders: <mark>John</mark> Smith
```

## Integration Points

### 1. Applications List

**File:** `src/components/admissions/ApplicationsList.tsx`

**Highlighted Fields:**

- Application ID
- Student Name
- Guardian Name

**Search Input Enhancement:**

- Shows result count: "X found"
- Teal border when search is active
- Ring effect for visual feedback

### 2. Leads List

**File:** `src/components/admissions/LeadsList.tsx`

**Highlighted Fields:**

- Lead Name
- Phone Number

**Search Input Enhancement:**

- Shows result count: "X found"
- Teal border when search is active
- Ring effect for visual feedback

### 3. Parent Inquiries Inbox

**File:** `src/components/inquiries/InquiriesInbox.tsx`

**Highlighted Fields:**

- Parent Name
- Inquiry Message
- Student Name

**Search Input Enhancement:**

- Shows result count (number only)
- Teal border when search is active
- Background changes from gray to white
- Ring effect for visual feedback

## Visual Design

### Highlight Styling

```css
bg-yellow-200      /* Light yellow background */
text-gray-900      /* Dark text for contrast */
font-semibold      /* Bold weight */
px-0.5             /* Minimal horizontal padding */
rounded            /* Rounded corners */
```

### Active Search Input

```css
border-[#036b80]           /* Teal border */
ring-2                     /* Ring effect */
ring-[#036b80]/20          /* Teal ring with 20% opacity */
```

### Result Counter

```css
text-xs                    /* Small text */
text-[#036b80]            /* Teal color */
font-medium               /* Medium weight */
```

## User Experience Benefits

1. **Instant Visual Feedback**: Users immediately see what matched their search
2. **Confidence**: Clear indication that search is working correctly
3. **Efficiency**: Quickly scan results for relevant information
4. **Context**: See matching terms in context of full data
5. **Result Count**: Know how many matches were found
6. **Active State**: Clear visual indicator when search is active

## Technical Implementation

### Regex Pattern

```typescript
const regex = new RegExp(
  `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
  "gi",
);
```

- Escapes special regex characters
- Global flag for all matches
- Case-insensitive flag

### Text Splitting

```typescript
const parts = text.split(regex);
```

Splits text into array of matching and non-matching parts.

### Conditional Rendering

```typescript
parts.map((part, index) =>
  regex.test(part) ? (
    <mark key={index}>{part}</mark>
  ) : (
    <span key={index}>{part}</span>
  )
)
```

Wraps matching parts in `<mark>` tag with styling.

## Performance Considerations

1. **Memoization**: Filtering logic uses `useMemo` to prevent unnecessary recalculations
2. **Efficient Regex**: Pattern is created once per render
3. **Conditional Rendering**: Highlighting only applied when search term exists
4. **Lightweight Component**: Minimal overhead per highlighted field

## Accessibility

- Uses semantic `<mark>` HTML element
- High contrast between highlight and text
- Bold weight improves readability
- Works with screen readers

## Browser Compatibility

- Works in all modern browsers
- Fallback to plain text if JavaScript disabled
- No external dependencies

## Future Enhancements

Potential improvements:

- Highlight multiple search terms
- Different colors for different match types
- Fuzzy matching support
- Highlight in dropdown options
- Export highlighted results
- Keyboard navigation between highlights
