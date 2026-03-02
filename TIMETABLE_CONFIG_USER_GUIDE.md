# Timetable Configuration System - User Guide

## Quick Start

The Timetable Configuration System allows you to customize school days and periods for each term, grade, or section.

## Accessing Configuration

1. Navigate to **Academics > Timetable**
2. Select a Grade and Section
3. Click the **"Settings"** button in the action bar

## Configuration Dialog

### Step 1: Configure Days

**Toggle Days On/Off**
- Check/uncheck days to activate/deactivate them
- Inactive days won't appear in the timetable grid
- At least 1 day must be active

**Reorder Days**
- Use ↑ ↓ buttons to change day order
- Days appear in the grid in this order

**Edit Day Names** (Optional)
- Click on day name to edit
- Provide both Arabic and English names
- Default names are provided

**Example:**
- Active: Sunday, Monday, Tuesday, Wednesday, Thursday (5 days)
- Inactive: Friday, Saturday (weekend)

### Step 2: Configure Periods

**Set Number of Periods**
- Enter total number of periods per day
- Common values: 6, 7, 8 periods

**Edit Period Details** (Optional)
- Name: Custom name for each period (AR/EN)
- Start Time: When period begins (HH:mm format)
- End Time: When period ends (HH:mm format)

**Validation:**
- At least 1 period required
- Start time must be before end time
- Times are optional

**Example:**
```
Period 1: 08:00 - 08:45
Period 2: 08:45 - 09:30
Period 3: 09:30 - 10:15
Break:    10:15 - 10:30
Period 4: 10:30 - 11:15
...
```

### Step 3: Select Scope

**Term Level (Default)**
- Applies to all grades and sections in the term
- Use for school-wide schedule

**Grade Level**
- Select a specific grade
- Overrides term config for that grade
- Applies to all sections in the grade

**Section Level**
- Select a specific section
- Overrides both term and grade configs
- Applies only to that section

**Priority:** SECTION > GRADE > TERM

## Configuration Hierarchy

### Example Scenario

**Term Config:**
- Days: Sun-Thu (5 days)
- Periods: 7

**Grade 1 Override:**
- Days: Sun-Fri (6 days)
- Periods: 6

**Section 1-A Override:**
- Days: Sun-Wed (4 days)
- Periods: 5

**Result:**
- Section 1-A uses: 4 days, 5 periods
- Other Grade 1 sections use: 6 days, 6 periods
- Other grades use: 5 days, 7 periods

## Changing Configuration

### When Entries Exist

If you change configuration after creating timetable entries:

1. **Warning Dialog Appears**
   - Shows how many entries will be kept
   - Shows how many entries will be dropped

2. **Migration Logic**
   - Entries matching new config are kept
   - Entries outside new config are dropped
   - Example: If you remove Friday, all Friday entries are dropped

3. **Confirm or Cancel**
   - Confirm: Apply changes and migrate entries
   - Cancel: Keep current config

### Best Practice

- Configure days/periods BEFORE creating timetable entries
- If you must change config later, review the migration warning carefully
- Save timetable after config change to persist migration

## Using the Timetable

### After Configuration

1. **Grid Updates Automatically**
   - Columns show active days
   - Rows show periods
   - Names appear in current language (AR/EN)

2. **Add Entries**
   - Click any cell to add subject/teacher/room
   - Only active days/periods are editable
   - Inactive days are hidden

3. **Auto-Generate**
   - Click "Generate" button
   - Algorithm respects your config
   - Only uses active days/periods
   - Excludes inactive days

4. **Validation**
   - Total slots = active days × periods
   - Subject hours checked against config
   - Conflicts detected using config

## Common Scenarios

### Scenario 1: Elementary School
```
Config:
- Days: Sun-Thu (5 days)
- Periods: 6 per day
- Total slots: 30 per week
```

### Scenario 2: High School
```
Config:
- Days: Sun-Fri (6 days)
- Periods: 8 per day
- Total slots: 48 per week
```

### Scenario 3: Half-Day Program
```
Config:
- Days: Sun-Thu (5 days)
- Periods: 4 per day
- Total slots: 20 per week
```

### Scenario 4: Special Section
```
Section Override:
- Days: Sun-Wed (4 days)
- Periods: 5 per day
- Total slots: 20 per week
- Use case: Part-time program
```

## Tips & Best Practices

### Planning

1. **Start with Term Config**
   - Set default schedule for entire school
   - Most sections will use this

2. **Override Only When Needed**
   - Use grade override for grade-specific schedules
   - Use section override for special programs

3. **Consider Subject Hours**
   - Total slots must accommodate all subject hours
   - Example: If subjects need 35 hours, config must provide ≥35 slots

### Configuration

1. **Day Names**
   - Use clear, consistent names
   - Default names work for most schools

2. **Period Times**
   - Optional but helpful for teachers
   - Include break times in planning (not as periods)

3. **Active Days**
   - Deactivate weekends/holidays
   - Grid will hide inactive days

### Migration

1. **Before Changing Config**
   - Review current timetable entries
   - Understand which entries will be affected

2. **After Changing Config**
   - Review migration warning
   - Save timetable to persist changes
   - Regenerate if needed

## Troubleshooting

### "At least one day must be active"
- You tried to deactivate all days
- Keep at least 1 day active

### "At least one period is required"
- You set periods to 0
- Set at least 1 period

### "Start time must be before end time"
- Period start time is after end time
- Fix time values

### "Cannot edit holiday day"
- You clicked on an inactive day
- Only active days are editable

### "Failed to place all hours"
- Auto-generate couldn't fit all subjects
- Increase periods or days
- Reduce subject hours
- Use relaxed mode (uncheck strict mode)

## Keyboard Shortcuts

- **Tab**: Navigate between fields
- **Enter**: Save dialog
- **Escape**: Cancel dialog
- **↑/↓**: Reorder days/periods

## Language Support

All configuration UI supports:
- **Arabic (AR)**: Right-to-left layout
- **English (EN)**: Left-to-right layout

Day and period names are bilingual:
- Display in current language
- Store both AR and EN names

## API Integration

Configuration is stored per term and synced with backend:

```typescript
// Fetch configs
GET /api/academics/timetable/configs?termId={termId}

// Save config
POST /api/academics/timetable/configs
{
  termId: string,
  scopeType: "TERM" | "GRADE" | "SECTION",
  scopeId?: string,
  days: TimetableDay[],
  periods: TimetablePeriod[]
}
```

## Summary

The Timetable Configuration System provides:

✅ Flexible day/period configuration
✅ Hierarchical overrides (Term/Grade/Section)
✅ Safe migration of existing entries
✅ Dynamic grid rendering
✅ Config-aware auto-generation
✅ Full AR/EN support

**Result:** Complete control over your school's timetable structure.

---

**Need Help?** Contact system administrator or refer to technical documentation.
