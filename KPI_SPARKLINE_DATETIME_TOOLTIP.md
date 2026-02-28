# KPI Sparkline Date/Time Tooltip Enhancement

## Summary
Enhanced all KPI card sparkline tooltips to display date + time for hovered data points, with full bilingual support (AR/EN) and localized formatting.

## Changes Made

### 1. Date/Time Formatter Utility
**File**: `src/utils/formatters/dateTime.ts` (NEW)

Created shared formatter functions:
- `formatDateTime(ts, locale, timeZone)` - Formats date + time
- `formatDate(ts, locale, timeZone)` - Formats date only

Features:
- Accepts ISO string or epoch milliseconds
- Localized formatting (ar-EG / en-US)
- Default timezone: Africa/Cairo
- Uses Intl.DateTimeFormat for proper localization

### 2. KPICard.tsx (MUI SparkLineChart)
**Updates**:
- Added support for `DataPoint[]` format with optional `ts` field
- Backward compatible with simple `number[]` format
- Enhanced `valueFormatter` to show date/time when available
- Added `useLocale()` hook for localization
- Improved tooltip styling (larger padding, better line height)

**Interface**:
```typescript
interface DataPoint {
  value: number;
  ts?: string | number; // Optional timestamp
}

interface KPICardProps {
  trendData?: number[] | DataPoint[]; // Both formats supported
  // ... other props
}
```

### 3. KPICardV2.tsx (Recharts)
**Updates**:
- Updated `DataPoint` interface to include optional `ts` field
- Enhanced `CustomTooltip` to show formatted date/time above value
- Added `useLocale()` hook and passed to tooltip
- Improved tooltip styling with Cairo font
- Set `dot={false}` to hide dots by default (hover only)

**Interface**:
```typescript
interface DataPoint {
  label: string;
  value: number;
  ts?: string | number; // Optional timestamp
}
```

**Tooltip Layout**:
```
┌─────────────────────┐
│ Feb 24, 10:15 AM    │ ← Date/time (muted, small)
│ 543                 │ ← Value (bold, colored)
└─────────────────────┘
```

### 4. KPICardWithChart.tsx (Recharts)
**Updates**:
- Updated `DataPoint` interface to include optional `ts` field
- Enhanced `CustomTooltip` to show formatted date/time
- Falls back to showing `month` label if no timestamp
- Added `useLocale()` hook for localization
- Improved tooltip styling with Cairo font

**Interface**:
```typescript
interface DataPoint {
  month: string;
  value: number;
  ts?: string | number; // Optional timestamp
}
```

## Usage Examples

### With Timestamps (Recommended)
```typescript
<KPICardV2
  title="Monthly Users"
  value={543}
  chartData={[
    { label: "W1", value: 12, ts: "2026-02-01T10:00:00Z" },
    { label: "W2", value: 15, ts: "2026-02-08T10:00:00Z" },
    { label: "W3", value: 18, ts: "2026-02-15T10:00:00Z" },
    { label: "W4", value: 543, ts: "2026-02-22T10:00:00Z" },
  ]}
  chartColor="#3b82f6"
/>
```

### Without Timestamps (Backward Compatible)
```typescript
<KPICardV2
  title="Monthly Users"
  value={543}
  chartData={[
    { label: "W1", value: 12 },
    { label: "W2", value: 15 },
    { label: "W3", value: 18 },
    { label: "W4", value: 543 },
  ]}
  chartColor="#3b82f6"
/>
```

### MUI SparkLineChart Format
```typescript
<KPICard
  title="Active Users"
  value={543}
  icon={Users}
  trendData={[
    { value: 12, ts: "2026-02-01T10:00:00Z" },
    { value: 15, ts: "2026-02-08T10:00:00Z" },
    { value: 18, ts: "2026-02-15T10:00:00Z" },
    { value: 543, ts: "2026-02-22T10:00:00Z" },
  ]}
/>

// Or simple format (backward compatible)
<KPICard
  title="Active Users"
  value={543}
  icon={Users}
  trendData={[12, 15, 18, 543]}
/>
```

## Behavior

### Default State
- Only line and area fill visible
- No dots or tooltips shown

### Hover State
- Dot appears at nearest data point
- Tooltip shows:
  - Date/time (if `ts` provided) - small, muted text
  - Value - bold, colored text
  - Month/label (if no `ts` provided) - fallback
- Cursor changes to crosshair
- Tooltip positioned to avoid overflow

### Localization
- Arabic (ar): Uses "ar-EG" locale
  - Example: "٢٤ فبر، ٢٠٢٦، ١٠:١٥ ص"
- English (en): Uses "en-US" locale
  - Example: "Feb 24, 2026, 10:15 AM"

## Technical Details

### Timezone Handling
- Default: "Africa/Cairo"
- Can be customized per call to `formatDateTime()`
- Consistent across all KPI cards

### Font
- All tooltips use Cairo font via `font-[Cairo]` class
- Consistent with project design system

### Performance
- No new dependencies added
- Reuses existing chart libraries (Recharts, MUI)
- Minimal overhead for date formatting

### Backward Compatibility
- All existing usages continue to work
- `ts` field is optional
- Simple number arrays still supported in KPICard

## Testing Checklist

- [ ] Hover over sparkline shows tooltip
- [ ] Tooltip displays correct date/time when `ts` provided
- [ ] Tooltip displays value correctly
- [ ] Tooltip disappears on mouse leave
- [ ] Works in both Arabic and English locales
- [ ] Tooltip doesn't overflow card boundaries
- [ ] Cursor changes to crosshair over chart
- [ ] Backward compatible with existing data (no `ts` field)
- [ ] Works in RTL mode
- [ ] Responsive on mobile devices

## Files Modified

1. `src/utils/formatters/dateTime.ts` - NEW
2. `src/components/ui/kpi-card/KPICard.tsx` - UPDATED
3. `src/components/ui/kpi-card/KPICardV2.tsx` - UPDATED
4. `src/components/ui/kpi-card/KPICardWithChart.tsx` - UPDATED

## Next Steps (Optional)

To enable date/time tooltips in existing KPI cards:
1. Update data sources to include `ts` field
2. Ensure timestamps are in ISO format or epoch milliseconds
3. Test tooltip display in both locales
4. Verify timezone is correct for your use case

No changes required if you want to keep current behavior (label-only tooltips).
