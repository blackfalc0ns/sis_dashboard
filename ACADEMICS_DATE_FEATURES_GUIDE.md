# Academic Year and Term Date Management - User Guide

## Overview

The Academics module now includes comprehensive date management for Academic Years and Terms, accessible directly from the Context Bar.

## Location

All date management features are located in the **Context Bar** at the top of the Academic Structure page.

## Features

### 1. Create Academic Year

**Button Location:** Context Bar → "Create Year" button

**What it does:**
- Opens a dialog to create a new academic year
- Requires: Name, Start Date, End Date
- Validates that dates don't overlap with existing years

**Example:**
```
Name: 2024-2025
Start Date: 2024-09-01
End Date: 2025-06-30
```

### 2. Create Term

**Button Location:** Context Bar → "Create Term" button

**What it does:**
- Opens a dialog to create a new term within the selected academic year
- Requires: Name, Start Date, End Date
- Automatically suggests dates based on existing terms
- Shows duration in weeks
- Validates that dates are within the academic year range
- Prevents overlapping terms

**Smart Defaults:**
- First term: Starts on academic year start date
- Subsequent terms: Starts the day after the previous term ends
- End date: 16 weeks from start (or academic year end, whichever is earlier)

**Example:**
```
Name: Term 1
Start Date: 2024-09-01 (auto-suggested)
End Date: 2024-12-31 (auto-suggested)
Duration: 17 weeks (calculated automatically)
```

### 3. Edit Academic Year

**Button Location:** Context Bar → Edit icon (pencil) next to Academic Year dropdown

**What it does:**
- Opens a dialog to edit the selected academic year
- Can modify: Name, Start Date, End Date
- Validates that changes don't create conflicts

### 4. Edit Term

**Button Location:** Context Bar → Edit icon (pencil) next to Term dropdown

**What it does:**
- Opens a dialog to edit the selected term
- Can modify: Name, Start Date, End Date
- Validates that changes stay within academic year range
- Disabled if term is closed (read-only)

**Note:** Closed terms cannot be edited to maintain data integrity.

## Validation Rules

### Academic Year Validation
✓ Start date must be before end date
✓ Cannot overlap with other academic years
✓ All fields are required

### Term Validation
✓ Start date must be before end date
✓ Start date must be within academic year range
✓ End date must be within academic year range
✓ Cannot overlap with other terms in the same year
✓ All fields are required

## Error Messages

The system provides clear, actionable error messages:

- **"Start date must be before end date"** - Adjust your dates
- **"Academic year dates overlap with [Year Name]"** - Choose different dates
- **"Term dates must be within the academic year range (YYYY-MM-DD to YYYY-MM-DD)"** - Adjust term dates to fit within the year
- **"Term dates overlap with [Term Name] (YYYY-MM-DD to YYYY-MM-DD)"** - Choose different dates or edit the conflicting term

## Workflow Examples

### Setting Up a New Academic Year

1. Click "Create Year"
2. Enter name: "2025-2026"
3. Select start date: September 1, 2025
4. Select end date: June 30, 2026
5. Click "Create"

### Creating Three Terms

**Term 1:**
1. Select the academic year
2. Click "Create Term"
3. Name: "Term 1"
4. Dates auto-suggest: Sep 1 - Dec 31 (17 weeks)
5. Click "Create"

**Term 2:**
1. Click "Create Term" again
2. Name: "Term 2"
3. Dates auto-suggest: Jan 1 - Apr 15 (15 weeks)
4. Click "Create"

**Term 3:**
1. Click "Create Term" again
2. Name: "Term 3"
3. Dates auto-suggest: Apr 16 - Jun 30 (11 weeks)
4. Click "Create"

### Adjusting Term Dates

1. Click the Edit icon next to the Term dropdown
2. Adjust start or end date
3. System validates:
   - Dates are within academic year
   - No overlap with other terms
   - Start before end
4. Click "Save"

## Tips

- **Plan ahead:** Create the academic year first, then create terms
- **Use auto-suggestions:** The system suggests sensible defaults based on existing terms
- **Check duration:** The dialog shows duration in weeks to help you plan
- **Avoid gaps:** Create terms consecutively to avoid gaps in your academic calendar
- **Closed terms:** Once a term is closed, its dates cannot be edited for data integrity

## Responsive Design

- **Desktop:** All buttons appear in a row in the Context Bar
- **Mobile:** Buttons stack vertically for better touch interaction
- **Edit icons:** Always appear next to their respective dropdowns

## Internationalization

All features are fully translated:
- **English:** Full support
- **Arabic:** Full support with RTL layout
- Date formats adapt to locale

## Accessibility

- All dialogs are keyboard navigable
- Required fields are clearly marked with *
- Error messages are announced to screen readers
- Date pickers support keyboard input
- Proper focus management

## Technical Notes

- Dates are stored in ISO format (YYYY-MM-DD)
- Validation happens both client-side and server-side
- Changes are immediately reflected in the UI
- All operations are asynchronous with loading states
