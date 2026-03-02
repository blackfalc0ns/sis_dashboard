# Timetable Configuration System - Implementation Plan

## Overview
Implementing a fully configurable timetable system where days and periods are NOT fixed but configurable per Term/Grade/Section.

## Status: IN PROGRESS

### Completed ✅
- [x] PART A: Type definitions (`src/types/academics/timetableConfig.ts`)
  - TimetableDay, TimetablePeriod, TimetableConfig types
  - resolveTimetableConfig() resolver function
  - validateTimetableConfig() validation
  - mapEntriesToNewConfig() migration helper
  
- [x] Updated TimetableEntry to use dayKey instead of day number
  - Changed from `day: number` to `dayKey: string`
  - Changed from `period: number` to `periodIndex: number`
  - Added backward compatibility fields

- [x] PART C: Services (`src/services/academics/timetableConfigService.ts`)
  - fetchTimetableConfigs()
  - fetchTimetableConfig()
  - upsertTimetableConfig()
  - deleteTimetableConfig()
  - resetTimetableConfig()
  - Helper functions for defaults

- [x] PART B: Config UI Components
  - TimetableConfigDialog.tsx - 3-step wizard (Days, Periods, Scope)
  - ConfigChangeWarningDialog.tsx - Warning when config changes affect entries

- [x] Translations (AR/EN)
  - Complete config translations added
  - Steps, validation, warnings, summaries

### Remaining Tasks 🔄

#### 1. Update TimetableView to integrate config system
- [ ] Load configs on mount (term + grade + section)
- [ ] Resolve effective config for selected section
- [ ] Add "Settings" button in header
- [ ] Handle config dialog open/close
- [ ] Handle config save with entry migration
- [ ] Show config change warning when entries affected
- [ ] Update grid to use resolved config

#### 2. Update TimetableGrid to be fully dynamic
- [ ] Accept resolvedConfig as prop
- [ ] Generate columns from config.days (active only)
- [ ] Generate rows from config.periods
- [ ] Update cell rendering to use dayKey + periodIndex
- [ ] Update holiday detection to use dayKey
- [ ] Update conflict display

#### 3. Update EditSlotDialog
- [ ] Pass dayKey instead of day number
- [ ] Update display to show day name from config

#### 4. Update timetableService
- [ ] Migrate day/period to dayKey/periodIndex in all functions
- [ ] Update conflict detection to use dayKey
- [ ] Add backward compatibility for existing data

#### 5. Update generator algorithm
- [ ] Use config days/periods instead of hardcoded
- [ ] Update slot scoring to work with dayKey
- [ ] Update conflict checking

#### 6. Add summary/stats display
- [ ] Show total slots per week
- [ ] Show required hours from Tab 2
- [ ] Warn if required > available slots

#### 7. Testing
- [ ] Test term config (5 days, 7 periods)
- [ ] Test grade override (6 days)
- [ ] Test section override (4 periods)
- [ ] Test config change with existing entries
- [ ] Test entry migration (keep/drop)
- [ ] Test validation
- [ ] Test save/load

## Architecture

### Config Resolution Priority
```
SECTION config (highest priority)
    ↓ (if not found)
GRADE config
    ↓ (if not found)
TERM config (default)
    ↓ (if not found)
System default (5 days, 8 periods)
```

### Data Model Migration
```
OLD: { day: 0, period: 1 }  // Sunday, Period 1
NEW: { dayKey: "sun", periodIndex: 1 }  // Config-safe
```

### Entry Migration on Config Change
```
1. User changes config (e.g., removes Friday, reduces to 6 periods)
2. System maps existing entries:
   - Keep: entries with valid dayKey + periodIndex
   - Drop: entries outside new config
3. Show warning dialog with counts
4. User confirms
5. Apply changes and mark dirty
6. User must save
```

## UI Flow

### Config Dialog (3 Steps)
1. **Days Step**
   - Toggle active/inactive for each day
   - Reorder days with up/down buttons
   - Edit day names (AR/EN)

2. **Periods Step**
   - Set number of periods (1-12)
   - Edit period names (AR/EN)
   - Optional: set start/end times
   - Reorder periods with up/down buttons

3. **Scope Step**
   - Select: Term / Grade / Section
   - If Grade: select which grade
   - If Section: select grade then section
   - Show summary (active days, periods, total slots)

### Config Change Warning
- Shows when config change affects existing entries
- Displays: kept count, dropped count
- Requires confirmation
- Marks timetable as dirty after applying

## Integration Points

### Tab 1 (Structure)
- Provides grades/sections for config scope selector

### Tab 2 (Subjects)
- weeklyHours defines target hours
- Must fit within: activeDays × periods

### Tab 4 (Calendar)
- Holidays mark specific dayKeys as unavailable
- For date-based: check if date falls on active dayKey

### Tab 7 (Teacher Allocation)
- Still provides default teacher per subject+section
- No changes needed

## Files Structure

```
src/
├── types/academics/
│   ├── timetable.ts (updated: dayKey, periodIndex)
│   └── timetableConfig.ts (new)
├── services/academics/
│   ├── timetableService.ts (update: use dayKey)
│   └── timetableConfigService.ts (new)
├── components/features/academics/components/timetable/
│   ├── TimetableView.tsx (update: integrate config)
│   ├── TimetableGrid.tsx (update: dynamic from config)
│   ├── EditSlotDialog.tsx (update: use dayKey)
│   ├── TimetableConfigDialog.tsx (new)
│   └── ConfigChangeWarningDialog.tsx (new)
├── utils/timetable/
│   └── generator.ts (update: use config)
└── messages/
    ├── en.json (updated: config translations)
    └── ar.json (updated: config translations)
```

## Validation Rules

### Config Validation
- ✓ At least 1 active day
- ✓ At least 1 period
- ✓ If times provided: startTime < endTime
- ✓ Scope: must select grade/section if not TERM

### Entry Validation
- ✓ dayKey must exist in active days
- ✓ periodIndex must exist in periods
- ✓ Subject/teacher/room validation (existing)

## Next Steps

1. Update TimetableView to load and use configs
2. Update TimetableGrid to render dynamically
3. Update all services to use dayKey/periodIndex
4. Update generator algorithm
5. Add summary stats display
6. Test all scenarios
7. Create migration guide for existing data

## Notes

- Backward compatibility maintained with optional day/period fields
- Frontend migration happens automatically on load
- Backend should store dayKey/periodIndex going forward
- Config changes require explicit user confirmation
- Dirty state tracking ensures no data loss
