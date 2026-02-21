# Subjects & Allocation - Quick Start Guide

## Overview
The Subjects & Allocation tab allows you to manage subjects and their weekly hour distribution across grades for each term.

## Key Concept: Term-Scoping
**IMPORTANT**: Subjects are term-scoped, not school-wide. Each term has its own independent list of subjects and allocations.

## Accessing the Tab
1. Click "Academics" in the sidebar
2. Click "Subjects & Allocation"
3. Select Academic Year and Term from the Context Bar

## Managing Subjects

### Add a Subject
1. Click "Add Subject" button
2. Enter subject name (required)
3. Optionally add:
   - Subject code (e.g., MATH101)
   - Stage (Primary/Middle/High)
   - Active status checkbox
4. Click "Create"

### Edit a Subject
1. Click the menu icon (⋮) on any subject
2. Select "Edit"
3. Modify fields
4. Click "Save"

### Delete a Subject
1. Click the menu icon (⋮) on any subject
2. Select "Delete"
3. Confirm deletion
4. Note: If subject has allocations, they will be removed

### Search Subjects
- Use the search box to filter by name, code, or stage
- Search is case-insensitive

## Allocating Weekly Hours

### Desktop View
- Left panel: Subjects list
- Right panel: Allocation matrix

### Mobile View
- Tab 1: Subjects
- Tab 2: Matrix

### Editing Allocations
1. Switch to Matrix tab (mobile) or view right panel (desktop)
2. Find the Grade × Subject cell
3. Enter weekly hours (0-50)
4. Changed cells are highlighted in blue
5. Click "Save Changes" to persist
6. Click "Reset" to revert unsaved changes

### Matrix Features
- **Stage Filter**: Show only grades from a specific stage
- **Show Missing**: Toggle to show only cells with 0 hours
- **Total Column**: Shows sum of hours per grade
- **Summary Bar**: Shows subjects count, grades count, and completion %

### Tips
- Enter 0 to remove an allocation
- Hours are clamped between 0 and 50
- All changes are saved in a single batch operation
- Unsaved changes are highlighted

## Copying from Another Term

### Use Case
When starting a new term, copy subjects and allocations from a previous term instead of recreating them.

### Steps
1. Click "Promote / Carry Over" in Context Bar
2. Select source academic year
3. Select source term
4. Choose options:
   - ☑ Copy subjects list
   - ☑ Copy weekly hour allocations
5. Click "Copy"

### Notes
- Allocations can only be copied if subjects are also copied
- This creates new subjects in the current term
- Original term data is not affected
- Cannot copy to a closed term

## Closed Terms

### Read-Only Mode
When a term is closed:
- Yellow banner appears at top
- All editing is disabled
- Cannot add/edit/delete subjects
- Cannot modify allocations
- Cannot copy data to this term

### What You Can Do
- View subjects list
- View allocation matrix
- Search and filter
- Copy data FROM this term to another term

## Unsaved Changes

### When It Triggers
You'll see a confirmation dialog if you have unsaved matrix changes and try to:
- Switch academic year
- Switch term
- Switch mobile tabs
- Navigate away

### Options
- **Stay**: Keep editing, don't lose changes
- **Discard**: Abandon changes and proceed

## Empty States

### No Grades
If you see "No grades found for this term":
1. Click "Go to Academic Structure"
2. Create stages, grades, and sections first
3. Return to Subjects & Allocation

### No Subjects
If you see "No subjects yet":
1. Click "Add Subject"
2. Create your first subject
3. Start allocating hours

## Common Workflows

### Setting Up a New Term
1. Select the new term from Context Bar
2. Click "Promote / Carry Over"
3. Copy subjects from previous term
4. Optionally copy allocations
5. Adjust allocations as needed
6. Click "Save Changes"

### Adjusting Allocations Mid-Term
1. Navigate to Subjects & Allocation
2. Select the current term
3. Edit hours in the matrix
4. Click "Save Changes"

### Adding a New Subject Mid-Term
1. Click "Add Subject"
2. Fill in details
3. Click "Create"
4. Switch to Matrix tab
5. Allocate hours for each grade
6. Click "Save Changes"

### Removing a Subject
1. Find the subject in the list
2. Click menu icon (⋮)
3. Select "Delete"
4. Confirm (note: allocations will be removed)

## Keyboard Shortcuts

### Matrix Navigation
- **Tab**: Move to next cell
- **Shift+Tab**: Move to previous cell
- **Enter**: Move to cell below
- **Arrow Keys**: Navigate cells (when focused)

## Status Indicators

### Subject Status
- **Allocated** (green): Subject has hours assigned in at least one grade
- **Not Allocated** (gray): Subject has no hours assigned
- **Inactive** (red): Subject is marked as inactive

### Matrix Cells
- **White background**: Original value, unchanged
- **Blue background**: Modified value, unsaved
- **Gray background**: Read-only (closed term)

## Validation Rules

### Subject Name
- Required field
- Must be unique within the term
- Case-insensitive duplicate check

### Weekly Hours
- Must be between 0 and 50
- Automatically clamped if you enter outside range
- 0 means no allocation

### Carry Over
- Cannot copy to a closed term
- Allocations require subjects to be copied first

## Troubleshooting

### "No grades found"
**Solution**: Go to Academic Structure tab and create grades first.

### "Cannot save changes"
**Check**: Is the term closed? Closed terms are read-only.

### "Subject already exists"
**Solution**: Choose a different name or edit the existing subject.

### Changes not saving
**Check**: 
1. Did you click "Save Changes"?
2. Is the term closed?
3. Check browser console for errors

### Matrix not scrolling
**Solution**: The matrix is horizontally scrollable. Try scrolling right to see more subjects.

## Best Practices

### Naming Conventions
- Use clear, descriptive subject names
- Include codes for easy reference (e.g., MATH101)
- Be consistent across terms

### Allocation Planning
- Plan total hours per grade
- Consider teacher availability
- Balance subject distribution
- Use stage filter to focus on one stage at a time

### Term Management
- Close terms when finalized
- Copy from previous term to save time
- Review allocations before closing term
- Keep inactive subjects for historical reference

### Data Entry
- Use "Show Missing" to find unallocated subjects
- Check completion % to track progress
- Save frequently to avoid losing work
- Use Reset if you make mistakes

## Mobile Tips

### Switching Between Views
- Use tabs at top to switch between Subjects and Matrix
- Subjects tab: Manage subject list
- Matrix tab: Allocate hours

### Matrix on Mobile
- Scroll horizontally to see all subjects
- Pinch to zoom if needed
- Use landscape mode for better view
- Total column is sticky on the right

### Touch Interactions
- Tap to focus input
- Tap outside to blur
- Use number keyboard for hour input
- Swipe to scroll matrix

## Performance Tips

### Large Datasets
If you have many subjects or grades:
- Use stage filter to reduce visible rows
- Use "Show Missing" to focus on incomplete allocations
- Save changes frequently
- Consider splitting into multiple terms

### Slow Loading
If data loads slowly:
- Check internet connection
- Refresh the page
- Clear browser cache
- Contact support if persistent

## Support

### Getting Help
1. Check this guide first
2. Review SUBJECTS_ALLOCATION_IMPLEMENTATION.md for technical details
3. Check translation files for UI text
4. Contact system administrator

### Reporting Issues
Include:
- Academic year and term
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser and device information
