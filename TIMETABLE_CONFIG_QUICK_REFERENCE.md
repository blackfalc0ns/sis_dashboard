# Timetable Configuration - Quick Reference Card

## 🎯 What It Does
Makes timetable days and periods fully configurable per Term/Grade/Section instead of hardcoded.

## 📦 What's Included

### Core Types
```typescript
TimetableDay      // Configurable day (key, names, isActive)
TimetablePeriod   // Configurable period (index, names, times)
TimetableConfig   // Config with scope (TERM/GRADE/SECTION)
```

### UI Components
```typescript
<TimetableConfigDialog />          // 3-step wizard
<ConfigChangeWarningDialog />      // Migration warning
```

### Services
```typescript
fetchTimetableConfigs(termId)      // Load all configs
upsertTimetableConfig(payload)     // Save config
resolveTimetableConfig(...)        // Resolve priority
```

## 🔑 Key Concepts

### Config Priority
```
SECTION → GRADE → TERM → Default
(highest)              (lowest)
```

### Data Model Change
```typescript
// OLD (fixed)
{ day: 0, period: 1 }

// NEW (configurable)
{ dayKey: "sun", periodIndex: 1 }
```

## 🚀 Quick Start

### 1. Open Config Dialog
```typescript
<Button onClick={() => setConfigDialogOpen(true)}>
  {t("config.button")}
</Button>

<TimetableConfigDialog
  open={configDialogOpen}
  onClose={() => setConfigDialogOpen(false)}
  onSave={handleConfigSave}
  grades={grades}
  sections={sections}
  locale={locale}
/>
```

### 2. Load & Resolve Config
```typescript
// Load configs
const configs = await fetchTimetableConfigs(termId);

// Resolve for section
const resolved = resolveTimetableConfig(
  termConfig,
  gradeConfig,
  sectionConfig
);

// Use in grid
<TimetableGrid resolvedConfig={resolved} />
```

### 3. Handle Config Change
```typescript
const handleConfigSave = async (newConfig) => {
  // Check migration
  const migration = mapEntriesToNewConfig(entries, newConfig);
  
  if (migration.dropped.length > 0) {
    // Show warning
    setConfigWarningOpen(true);
  } else {
    // Apply directly
    await applyConfig(newConfig);
  }
};
```

## 📋 Common Tasks

### Create Term Default
```typescript
await upsertTimetableConfig({
  termId: "term-1",
  scopeType: "TERM",
  days: getDefaultDays(),
  periods: generateDefaultPeriods(7),
});
```

### Override for Grade
```typescript
await upsertTimetableConfig({
  termId: "term-1",
  scopeType: "GRADE",
  scopeId: "grade-5",
  days: customDays,
  periods: customPeriods,
});
```

### Reset to Default
```typescript
await resetTimetableConfig(termId, "GRADE", gradeId);
```

## 🎨 UI Flow

### Config Dialog Steps
1. **Days** - Toggle active, reorder, rename
2. **Periods** - Set count, add times, rename
3. **Scope** - Choose Term/Grade/Section

### Warning Dialog
- Shows when config affects entries
- Displays kept vs dropped counts
- Requires confirmation

## ✅ Validation Rules

```typescript
// Config must have:
✓ At least 1 active day
✓ At least 1 period
✓ startTime < endTime (if provided)
✓ Valid scope selection

// Entries must have:
✓ dayKey in active days
✓ periodIndex in periods
```

## 🔄 Migration Pattern

```typescript
// Automatic on load
entry.dayKey = entry.dayKey || getDayKeyFromIndex(entry.day);
entry.periodIndex = entry.periodIndex || entry.period;

// On config change
const { kept, dropped } = mapEntriesToNewConfig(entries, newConfig);
// Show warning if dropped.length > 0
// Apply kept entries
```

## 📊 Summary Stats

```typescript
const totalSlots = activeDays.length * periods.length;
const requiredHours = subjectHours.reduce((sum, s) => sum + s.target, 0);
const filledSlots = entries.filter(e => e.subjectId).length;

// Warn if requiredHours > totalSlots
```

## 🧪 Test Scenarios

```bash
# Scenario 1: Term config
Set: 5 days, 7 periods → All sections: 5×7 grid

# Scenario 2: Grade override
Set: 6 days, 7 periods → Grade sections: 6×7 grid

# Scenario 3: Section override
Set: 5 days, 4 periods → Section: 5×4 grid

# Scenario 4: Config change
30 entries → Remove 1 day, 2 periods → 22 kept, 8 dropped
```

## 📁 File Locations

```
Types:          src/types/academics/timetableConfig.ts
Services:       src/services/academics/timetableConfigService.ts
Dialog:         src/components/.../TimetableConfigDialog.tsx
Warning:        src/components/.../ConfigChangeWarningDialog.tsx
Translations:   src/messages/{en,ar}.json
```

## 🔗 Integration Checklist

- [ ] Load configs in TimetableView
- [ ] Resolve config for selected section
- [ ] Pass resolved config to TimetableGrid
- [ ] Update grid to use config days/periods
- [ ] Update EditSlotDialog to use dayKey
- [ ] Update services to use dayKey/periodIndex
- [ ] Update generator to use config
- [ ] Add summary stats display
- [ ] Test all scenarios

## 💡 Pro Tips

1. **Always resolve config** before rendering grid
2. **Show warning** when config changes affect entries
3. **Mark dirty** after config change
4. **Validate** before saving config
5. **Use dayKey** everywhere (not day number)
6. **Test migration** with existing data

## 📚 Documentation

- `TIMETABLE_CONFIG_IMPLEMENTATION_PLAN.md` - Architecture
- `TIMETABLE_CONFIG_INTEGRATION_GUIDE.md` - Integration steps
- `TIMETABLE_CONFIG_SYSTEM_COMPLETE.md` - Full details

## 🎉 Status

**Core:** ✅ Complete  
**Integration:** 🔄 Ready  
**Testing:** 🧪 Pending

---

**Quick Help:** See TIMETABLE_CONFIG_INTEGRATION_GUIDE.md for detailed integration steps.
