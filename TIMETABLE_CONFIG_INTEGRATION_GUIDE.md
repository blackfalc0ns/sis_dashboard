# Timetable Config Integration Guide

## Quick Summary

This guide shows how to integrate the new configurable timetable system into the existing implementation.

## Key Changes Required

### 1. TimetableView.tsx - Add Config Management

**Add imports:**
```typescript
import {
  TimetableConfig,
  ResolvedTimetableConfig,
  resolveTimetableConfig,
  mapEntriesToNewConfig,
} from "@/types/academics/timetableConfig";
import {
  fetchTimetableConfigs,
  upsertTimetableConfig,
} from "@/services/academics/timetableConfigService";
import TimetableConfigDialog from "./TimetableConfigDialog";
import ConfigChangeWarningDialog from "./ConfigChangeWarningDialog";
```

**Add state:**
```typescript
const [configs, setConfigs] = useState<TimetableConfig[]>([]);
const [resolvedConfig, setResolvedConfig] = useState<ResolvedTimetableConfig | null>(null);
const [configDialogOpen, setConfigDialogOpen] = useState(false);
const [configWarningOpen, setConfigWarningOpen] = useState(false);
const [pendingConfig, setPendingConfig] = useState<ResolvedTimetableConfig | null>(null);
const [migrationResult, setMigrationResult] = useState<{ kept: number; dropped: number } | null>(null);
```

**Load configs in loadData():**
```typescript
const configsData = await fetchTimetableConfigs(termId);
setConfigs(configsData);
```

**Resolve config when section changes:**
```typescript
useEffect(() => {
  if (selectedSectionId && configs.length > 0) {
    const section = sections.find((s) => s.id === selectedSectionId);
    if (section) {
      const termConfig = configs.find((c) => c.scopeType === "TERM");
      const gradeConfig = configs.find(
        (c) => c.scopeType === "GRADE" && c.scopeId === section.gradeId
      );
      const sectionConfig = configs.find(
        (c) => c.scopeType === "SECTION" && c.scopeId === selectedSectionId
      );
      
      const resolved = resolveTimetableConfig(termConfig, gradeConfig, sectionConfig);
      setResolvedConfig(resolved);
    }
  }
}, [selectedSectionId, configs, sections]);
```

**Add Settings button:**
```typescript
<Button
  onClick={() => setConfigDialogOpen(true)}
  variant="secondary"
  disabled={isReadOnly}
>
  {t("config.button")}
</Button>
```

**Handle config save:**
```typescript
const handleConfigSave = async (newConfig: {
  scopeType: TimetableConfigScope;
  scopeId?: string;
  days: TimetableDay[];
  periods: TimetablePeriod[];
}) => {
  // Check if this affects existing entries
  const newResolved: ResolvedTimetableConfig = {
    days: newConfig.days,
    periods: newConfig.periods,
    source: { scope: newConfig.scopeType, id: newConfig.scopeId },
  };
  
  const migration = mapEntriesToNewConfig(timetableEntries, newResolved);
  
  if (migration.dropped.length > 0) {
    // Show warning
    setPendingConfig(newResolved);
    setMigrationResult({
      kept: migration.kept.length,
      dropped: migration.dropped.length,
    });
    setConfigWarningOpen(true);
  } else {
    // No conflicts, apply directly
    await applyConfigChange(newConfig, newResolved);
  }
};

const applyConfigChange = async (
  config: any,
  resolved: ResolvedTimetableConfig
) => {
  // Save config
  await upsertTimetableConfig({
    termId,
    scopeType: config.scopeType,
    scopeId: config.scopeId,
    days: config.days,
    periods: config.periods,
  });
  
  // Reload configs
  const newConfigs = await fetchTimetableConfigs(termId);
  setConfigs(newConfigs);
  
  // Apply migration
  const migration = mapEntriesToNewConfig(timetableEntries, resolved);
  setTimetableEntries(migration.kept);
  setIsDirty(true);
  
  showToast(t("config.changeApplied"), "success");
};
```

### 2. TimetableGrid.tsx - Make Dynamic

**Update props:**
```typescript
interface TimetableGridProps {
  entries: TimetableEntry[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  conflicts: TimetableConflict[];
  onSlotClick: (dayKey: string, periodIndex: number) => void;
  isHolidayDay: (dayKey: string) => boolean;
  locale: string;
  isReadOnly: boolean;
  resolvedConfig: ResolvedTimetableConfig; // NEW
}
```

**Generate columns from config:**
```typescript
const activeDays = resolvedConfig.days.filter((d) => d.isActive);
const periods = resolvedConfig.periods;
```

**Update rendering:**
```typescript
// Header
{activeDays.map((day) => (
  <th key={day.key}>
    {locale === "ar" ? day.nameAr : day.nameEn}
  </th>
))}

// Cells
{periods.map((period) => (
  <tr key={period.index}>
    <td>{locale === "ar" ? period.nameAr : period.nameEn}</td>
    {activeDays.map((day) => {
      const entry = entries.find(
        (e) => e.dayKey === day.key && e.periodIndex === period.index
      );
      return (
        <td
          key={`${day.key}-${period.index}`}
          onClick={() => onSlotClick(day.key, period.index)}
        >
          {/* Render entry */}
        </td>
      );
    })}
  </tr>
))}
```

### 3. EditSlotDialog.tsx - Use dayKey

**Update props:**
```typescript
interface EditSlotDialogProps {
  open: boolean;
  dayKey: string; // Changed from day: number
  periodIndex: number; // Changed from period: number
  entry?: TimetableEntry;
  // ... rest
  onSave: (dayKey: string, periodIndex: number, ...) => Promise<void>;
  dayName: string; // NEW: pass day name for display
}
```

**Update display:**
```typescript
<DialogTitle>
  {t("editSlot.title")} - {dayName}, {t("editSlot.period", { number: periodIndex })}
</DialogTitle>
```

### 4. Update timetableService.ts

**Migrate entries on load:**
```typescript
export async function fetchTimetable(
  termId: string,
  sectionId: string
): Promise<TimetableEntry[]> {
  // ... fetch logic
  
  // Migrate old format to new
  return entries.map((entry) => ({
    ...entry,
    dayKey: entry.dayKey || getDayKeyFromIndex(entry.day || 0),
    periodIndex: entry.periodIndex || entry.period || 1,
  }));
}

function getDayKeyFromIndex(index: number): string {
  const keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return keys[index] || "sun";
}
```

**Update conflict detection:**
```typescript
export function detectConflicts(
  allEntries: TimetableEntry[],
  sections: Section[],
  teachers: Teacher[],
  rooms: Room[],
  subjects: Subject[]
): TimetableConflict[] {
  const conflicts: TimetableConflict[] = [];
  
  // Group by dayKey + periodIndex + resource
  const grouped = new Map<string, TimetableEntry[]>();
  
  for (const entry of allEntries) {
    if (!entry.subjectId) continue;
    
    // Teacher conflicts
    if (entry.teacherId) {
      const key = `teacher-${entry.dayKey}-${entry.periodIndex}-${entry.teacherId}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(entry);
    }
    
    // Room conflicts
    if (entry.roomId) {
      const key = `room-${entry.dayKey}-${entry.periodIndex}-${entry.roomId}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(entry);
    }
  }
  
  // Find conflicts (more than 1 entry per key)
  for (const [key, entries] of grouped) {
    if (entries.length > 1) {
      const [type, dayKey, periodIndex, resourceId] = key.split("-");
      // ... create conflict object
    }
  }
  
  return conflicts;
}
```

### 5. Update generator.ts

**Accept config as parameter:**
```typescript
export async function generateTimetable(
  options: GenerationOptions,
  subjects: Subject[],
  subjectAllocations: SubjectAllocation[],
  teacherAllocations: TeacherAllocation[],
  teachers: Teacher[],
  rooms: Room[],
  existingEntries: TimetableEntry[],
  config: ResolvedTimetableConfig // NEW
): Promise<GenerationResult> {
  const activeDays = config.days.filter((d) => d.isActive);
  const periods = config.periods;
  
  // Use activeDays and periods instead of hardcoded arrays
  for (const day of activeDays) {
    for (const period of periods) {
      // ... generation logic using day.key and period.index
    }
  }
}
```

**Update entry creation:**
```typescript
const entry: TimetableEntry = {
  id: `gen-${Date.now()}-${Math.random()}`,
  termId,
  sectionId,
  dayKey: day.key, // Use dayKey
  periodIndex: period.index, // Use periodIndex
  subjectId,
  teacherId,
  roomId,
  status: "DRAFT",
};
```

## Testing Checklist

- [ ] Load page - default config loads
- [ ] Open config dialog - shows current config
- [ ] Change days - grid updates
- [ ] Change periods - grid updates
- [ ] Save config at TERM level - all sections affected
- [ ] Save config at GRADE level - only that grade affected
- [ ] Save config at SECTION level - only that section affected
- [ ] Change config with existing entries - warning shows
- [ ] Confirm migration - entries updated correctly
- [ ] Save timetable - entries persist with dayKey/periodIndex
- [ ] Generate timetable - uses current config
- [ ] Conflicts detected correctly with dayKey
- [ ] Holiday detection works with dayKey

## Migration Strategy

### For Existing Data
1. Frontend automatically migrates on load:
   - `day: 0` → `dayKey: "sun"`
   - `period: 1` → `periodIndex: 1`

2. Backend should update schema:
   - Add `dayKey` and `periodIndex` columns
   - Keep `day` and `period` for backward compatibility
   - Migrate data in background job

3. After migration complete:
   - Remove old `day` and `period` columns
   - Update API to only use dayKey/periodIndex

## Summary Stats Display

Add to TimetableView after grid:

```typescript
{resolvedConfig && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
    <h4 className="font-semibold text-sm mb-2">{t("summary.title")}</h4>
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div>
        <div className="text-gray-600">{t("summary.totalSlots")}</div>
        <div className="text-lg font-semibold">
          {resolvedConfig.days.filter((d) => d.isActive).length *
            resolvedConfig.periods.length}
        </div>
      </div>
      <div>
        <div className="text-gray-600">{t("summary.requiredHours")}</div>
        <div className="text-lg font-semibold">
          {subjectHours.reduce((sum, s) => sum + s.target, 0)}
        </div>
      </div>
      <div>
        <div className="text-gray-600">{t("summary.filledSlots")}</div>
        <div className="text-lg font-semibold">
          {timetableEntries.filter((e) => e.subjectId).length}
        </div>
      </div>
    </div>
  </div>
)}
```

## Complete!

After implementing these changes:
1. Timetable will be fully configurable
2. Days and periods are dynamic per Term/Grade/Section
3. Config changes are safe with migration warnings
4. All existing functionality preserved
5. Backward compatible with old data format
