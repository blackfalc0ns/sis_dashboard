# Timetable & Rooms Implementation Plan

## Overview
Implementing Tab 5 (Timetable & Rooms) for the Academics module, following existing patterns and reusing shared components.

## File Structure

### 1. Types
- `src/types/academics/timetable.ts` - TimetableEntry, Room, ValidationResult types

### 2. Services
- `src/services/academics/timetableService.ts` - API calls for timetable CRUD
- `src/services/academics/roomsService.ts` - API calls for rooms CRUD

### 3. Page Components
- `src/components/features/academics/components/pages/TimetablePage.tsx` - Main page with tabs
- `src/app/[lang]/(dashboard)/academics/timetable/page.tsx` - Route page

### 4. Timetable Components
- `src/components/features/academics/components/timetable/TimetableView.tsx` - Main timetable grid
- `src/components/features/academics/components/timetable/TimetableGrid.tsx` - Grid editor
- `src/components/features/academics/components/timetable/EditSlotDialog.tsx` - Edit cell dialog
- `src/components/features/academics/components/timetable/ValidationPanel.tsx` - Validation sidebar
- `src/components/features/academics/components/timetable/FilterBar.tsx` - Grade/Section filters

### 5. Rooms Components
- `src/components/features/academics/components/rooms/RoomsView.tsx` - Rooms list view
- `src/components/features/academics/components/rooms/RoomDialog.tsx` - Add/Edit room dialog

### 6. I18n Keys
- Add to `src/messages/en.json` and `src/messages/ar.json`

## Data Flow

### Integration Points
1. **Tab 1 (Structure)**: Fetch grades and sections
2. **Tab 2 (Subjects)**: Get weekly hours matrix (Grade × Subject)
3. **Tab 7 (Teacher Allocation)**: Get teacher assignments (Section × Subject → Teacher)
4. **Tab 4 (Calendar)**: Get holidays to mark days as OFF (optional)

### State Management
- Use React Query/SWR pattern (same as other tabs)
- Manual save with dirty tracking
- Global unsaved changes guard integration

## Implementation Phases

### Phase 1: Types & Services
1. Create type definitions
2. Implement service layer with mock data
3. Set up API endpoints structure

### Phase 2: Basic UI Structure
1. Create main TimetablePage with tabs
2. Implement ContextBar integration
3. Create FilterBar for grade/section selection

### Phase 3: Timetable Grid
1. Implement TimetableGrid component
2. Create EditSlotDialog
3. Add manual save functionality
4. Implement dirty tracking

### Phase 4: Validation
1. Create ValidationPanel
2. Implement validation logic:
   - Target vs Actual hours
   - Missing teacher/room
   - Conflicts detection
3. Add validation UI indicators

### Phase 5: Rooms Management
1. Implement RoomsView with DataTable
2. Create RoomDialog with bilingual fields
3. Add CRUD operations

### Phase 6: Publish Flow
1. Implement publish button
2. Add validation checks before publish
3. Create confirmation dialog
4. Integrate with API

### Phase 7: Polish & Testing
1. Add loading states
2. Implement error handling
3. Add toast notifications
4. Test RTL support
5. Test read-only mode (closed term)

## Key Features

### Timetable Grid
- Days (columns): Sunday - Thursday (5 days) or configurable
- Periods (rows): 1-8 or configurable
- Each cell shows: Subject, Teacher, Room
- Click to edit
- Conflict indicators (red border/icon)
- Holiday days marked as OFF

### Edit Slot Dialog
- Subject dropdown (searchable, bilingual)
- Teacher dropdown (auto-filled from allocation, searchable)
- Room dropdown (searchable, bilingual)
- Clear button
- Save/Cancel

### Validation Panel
- Target vs Actual per subject (progress bars)
- Completeness stats (filled/total slots)
- Missing teacher count
- Missing room count
- Conflicts list (clickable to navigate)

### Rooms Management
- DataTable with columns: Name, Type, Capacity, Active
- Add/Edit/Delete actions
- Bilingual name fields with validation (AR ≠ EN)
- Room types: CLASSROOM, LAB, OTHER

## Technical Decisions

### Grid Implementation
- Use HTML table with sticky headers
- CSS Grid for responsive layout
- MUI components for dialogs and inputs

### Data Fetching
- Fetch all sections' timetables for conflict detection
- Cache with React Query
- Optimistic updates for better UX

### Validation
- Client-side validation for immediate feedback
- Server-side validation before publish
- Real-time conflict detection on edit

### Save Strategy
- Manual save (consistent with recent requirements)
- Bulk save API call for all changes
- Dirty tracking per section
- Global unsaved changes guard

## API Endpoints (to be implemented)

```typescript
// Timetable
GET    /api/terms/{termId}/sections/{sectionId}/timetable
POST   /api/terms/{termId}/sections/{sectionId}/timetable
PUT    /api/terms/{termId}/sections/{sectionId}/timetable/bulk
POST   /api/terms/{termId}/sections/{sectionId}/timetable/publish
POST   /api/terms/{termId}/timetable/validate

// Rooms
GET    /api/schools/{schoolId}/rooms
POST   /api/schools/{schoolId}/rooms
PUT    /api/schools/{schoolId}/rooms/{roomId}
DELETE /api/schools/{schoolId}/rooms/{roomId}
```

## I18n Keys Structure

```json
{
  "academics": {
    "timetable": {
      "title": "Timetable",
      "tabs": {
        "timetable": "Timetable",
        "rooms": "Rooms"
      },
      "filters": {
        "selectGrade": "Select Grade",
        "selectSection": "Select Section"
      },
      "grid": {
        "period": "Period",
        "day": "Day",
        "sunday": "Sunday",
        "monday": "Monday",
        "tuesday": "Tuesday",
        "wednesday": "Wednesday",
        "thursday": "Thursday",
        "friday": "Friday",
        "saturday": "Saturday",
        "holiday": "Holiday"
      },
      "actions": {
        "editSlot": "Edit Slot",
        "save": "Save Changes",
        "validate": "Validate",
        "publish": "Publish",
        "generate": "Auto Generate",
        "copyFrom": "Copy From"
      },
      "editSlot": {
        "title": "Edit Time Slot",
        "subject": "Subject",
        "teacher": "Teacher",
        "room": "Room",
        "clear": "Clear Slot",
        "autoFilled": "Auto-filled from allocation"
      },
      "validation": {
        "title": "Validation",
        "targetVsActual": "Target vs Actual Hours",
        "completeness": "Completeness",
        "conflicts": "Conflicts",
        "missingTeacher": "Missing Teacher",
        "missingRoom": "Missing Room",
        "teacherConflict": "Teacher Conflict",
        "roomConflict": "Room Conflict",
        "filledSlots": "Filled Slots",
        "totalSlots": "Total Slots",
        "target": "Target",
        "actual": "Actual",
        "noConflicts": "No conflicts found"
      },
      "publish": {
        "confirmTitle": "Publish Timetable",
        "confirmMessage": "Are you sure you want to publish this timetable?",
        "withErrors": "There are validation errors. Publish anyway?",
        "success": "Timetable published successfully",
        "error": "Failed to publish timetable"
      },
      "rooms": {
        "title": "Rooms",
        "addRoom": "Add Room",
        "editRoom": "Edit Room",
        "deleteRoom": "Delete Room",
        "deleteConfirm": "Are you sure you want to delete this room?",
        "nameAr": "Name (Arabic)",
        "nameEn": "Name (English)",
        "type": "Type",
        "capacity": "Capacity",
        "active": "Active",
        "types": {
          "CLASSROOM": "Classroom",
          "LAB": "Laboratory",
          "OTHER": "Other"
        }
      }
    }
  }
}
```

## Next Steps
1. Create type definitions
2. Implement service layer
3. Build UI components
4. Integrate with existing tabs
5. Add validation logic
6. Implement publish flow
7. Test and polish
