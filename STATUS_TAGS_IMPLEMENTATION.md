# Status Tags Bar Implementation

## Overview

Added status tags bars above all tables in the Admissions module to provide quick visibility into data distribution by status.

## Components Created

### 1. StatusTagsBar Component

**Location:** `src/components/admissions/StatusTagsBar.tsx`

A reusable component that displays:

- Total count of items
- Individual status badges with counts
- Clean, responsive layout with dividers

**Usage:**

```tsx
import StatusTagsBar from "./StatusTagsBar";

<StatusTagsBar data={applications} totalLabel="Applications" />;
```

### 2. InquiryStatusTagsBar Component

**Location:** `src/components/inquiries/InquiryStatusTagsBar.tsx`

Similar to StatusTagsBar but specifically for inquiries with InquiryStatus types.

**Usage:**

```tsx
import InquiryStatusTagsBar from "./InquiryStatusTagsBar";

<InquiryStatusTagsBar data={inquiries} totalLabel="Inquiries" />;
```

## Integration

### Applications List

**File:** `src/components/admissions/ApplicationsList.tsx`

- Added StatusTagsBar between filters and table
- Shows total applications and breakdown by status (submitted, under_review, accepted, etc.)

### Leads List

**File:** `src/components/admissions/LeadsList.tsx`

- Added StatusTagsBar between filters and table
- Shows total leads and breakdown by status (new, contacted, qualified, etc.)

### Parent Inquiries Inbox

**File:** `src/components/inquiries/InquiriesInbox.tsx`

- Added InquiryStatusTagsBar after filters section
- Shows total inquiries and breakdown by status (new, in_progress, answered, closed)
- Respects current filters (search, status, category)

## Features

1. **Automatic Calculation**: Counts are calculated automatically from the data array
2. **Dynamic Status Display**: Only shows statuses that exist in the current dataset
3. **Consistent Styling**: Uses existing StatusBadge components for visual consistency
4. **Responsive Design**: Wraps gracefully on smaller screens
5. **Customizable Labels**: Total label can be customized per implementation

## Visual Design

- Gray background with border for subtle separation
- Bold total count in gray badge
- Status badges match existing design system
- Vertical divider between total and status counts
- Proper spacing and alignment

## Example Output

```
Total: 15 | [Submitted] 3 | [Under Review] 5 | [Accepted] 4 | [Rejected] 3
```

Where each status is shown with its corresponding colored badge.
