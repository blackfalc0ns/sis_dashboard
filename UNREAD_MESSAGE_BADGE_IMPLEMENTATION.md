# Unread Message Badge Implementation

## Overview

Added an unread message count badge to the Messages tab in the Lead Details page, providing visual feedback about unread parent messages.

## Features Implemented

### 1. Tab Badge Support

**File**: `src/components/admissions/TabNavigation.tsx`

- Added optional `badge` property to Tab interface
- Badge displays as red circular indicator with count
- Shows "99+" for counts over 99
- Only displays when badge value is greater than 0
- Positioned next to tab label

### 2. Unread Count in Lead Details

**File**: `src/components/leads/LeadDetails.tsx`

- Added `unreadCount` state to track unread messages
- Loads unread count from conversation data on component mount
- Passes unread count to Messages tab badge
- Clears count when user views messages
- Imports `getConversationByLeadId` helper function

### 3. Message Read Callback

**File**: `src/components/leads/LeadChatPanel.tsx`

- Added optional `onMessagesRead` callback prop
- Calls callback when messages are loaded and marked as read
- Notifies parent component to update unread count
- Maintains existing message marking functionality

## Visual Design

### Badge Styling

- **Color**: Red (#EF4444) for high visibility
- **Shape**: Circular with rounded corners
- **Size**: 20px height, auto width (min 20px)
- **Text**: White, bold, extra small (xs)
- **Position**: Inline with tab label
- **Max Display**: Shows "99+" for counts over 99

### Tab States

- **With Badge**: Red badge appears next to "Messages" label
- **Without Badge**: No badge shown (count is 0)
- **Active Tab**: Badge remains visible even when tab is active
- **Hover State**: Badge maintains visibility during hover

## User Flow

### Initial Load

1. User opens lead detail page
2. System loads conversation data
3. Unread count calculated from parent messages
4. Badge appears on Messages tab if count > 0

### Viewing Messages

1. User clicks Messages tab
2. Chat panel loads and displays messages
3. Messages marked as read automatically
4. Callback triggers to clear badge
5. Badge disappears from tab

### New Messages

1. Parent sends new message (in mock data)
2. Unread count increases
3. Badge updates with new count
4. Badge persists until user views messages

## Technical Implementation

### Type Definitions

```typescript
// TabNavigation Tab interface
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number; // NEW: Optional badge count
}

// LeadChatPanel props
interface LeadChatPanelProps {
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  currentUserName?: string;
  onMessagesRead?: () => void; // NEW: Callback when messages are read
}
```

### State Management

```typescript
// LeadDetails component
const [unreadCount, setUnreadCount] = useState(0);

// Load unread count
const conversation = getConversationByLeadId(leadId);
setUnreadCount(conversation?.unreadCount || 0);

// Clear on view
onMessagesRead={() => setUnreadCount(0)}
```

### Badge Rendering

```typescript
{tab.badge !== undefined && tab.badge > 0 && (
  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
    {tab.badge > 99 ? "99+" : tab.badge}
  </span>
)}
```

## Mock Data Examples

### Leads with Unread Messages

- **L004** (Khalid Ibrahim): 2 unread messages
- **L008** (Ahmed Rashid): 1 unread message

### Leads with No Unread Messages

- **L001-L003**: All messages read
- **L005-L007**: All messages read

## Benefits

### For Users

- Immediate visual feedback about unread messages
- No need to click tab to check for new messages
- Clear indication of which leads need attention
- Consistent with common messaging UX patterns

### For Staff

- Prioritize leads with unread messages
- Quick identification of active conversations
- Reduces time spent checking for new messages
- Improves response time to parent inquiries

## Accessibility

### Visual Indicators

- High contrast red badge on white/gray background
- Bold text for readability
- Sufficient size for easy visibility
- Clear numerical count

### Keyboard Navigation

- Badge doesn't interfere with tab navigation
- Tab remains fully keyboard accessible
- Screen readers can access badge content

## Integration Points

### Existing Systems

- Uses existing conversation data structure
- Integrates with message marking system
- Works with existing tab navigation
- Compatible with existing chat panel

### Future Enhancements

- Real-time badge updates (WebSocket)
- Badge animation on new message
- Sound notification option
- Desktop notification integration
- Badge in browser tab title

## Testing Checklist

✅ Badge displays correct unread count
✅ Badge appears only when count > 0
✅ Badge clears when viewing messages
✅ Badge shows "99+" for large counts
✅ Badge styling matches design system
✅ Tab navigation still works correctly
✅ Messages marked as read properly
✅ Callback triggers on message view
✅ Build passes without errors
✅ No TypeScript errors
✅ Responsive design maintained

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design works on all screen sizes
- No special polyfills required

## Performance

- Minimal performance impact
- Badge count calculated once on load
- No continuous polling or updates
- Efficient state management
- Fast re-renders

## Summary

The unread message badge provides clear visual feedback about unread parent messages in the lead detail page. The implementation is clean, performant, and follows existing design patterns. Staff can now quickly identify leads with pending messages and prioritize their responses accordingly.

### Key Features

- Red circular badge with count
- Displays on Messages tab
- Auto-clears when viewing messages
- Shows "99+" for large counts
- Fully accessible and responsive
- Zero performance impact
