# Transfers & Withdrawals Tab Implementation

## Overview

Implemented a comprehensive "Transfers & Withdrawals" tab in the Students & Guardians section with full bilingual support (English/Arabic), responsive design, and all required features.

## Files Created

### 1. Layout & Routing

- **src/app/[lang]/(dashboard)/students-guardians/layout.tsx**
  - Created tab navigation layout for Students & Guardians section
  - Tabs: Overview, Students, Guardians, Transfers & Withdrawals
  - Handles active tab detection and routing

- **src/app/[lang]/(dashboard)/students-guardians/transfers-withdrawals/page.tsx**
  - Route page for Transfers & Withdrawals tab
  - Renders TransfersWithdrawalsPage component

### 2. Main Component

- **src/components/students-guardians/TransfersWithdrawalsPage.tsx**
  - Main dashboard component
  - 6 KPI cards with metrics
  - Smart alert for high dropout rate
  - Integrates all charts and table components

### 3. Chart Components

- **src/components/students-guardians/charts/TransfersWithdrawalsTrendChart.tsx**
  - Line chart showing monthly transfers vs withdrawals
  - Stage filter (Primary/Preparatory/Secondary/All)
  - Last 6 months data visualization
  - Uses MUI X-Charts LineChart

- **src/components/students-guardians/charts/TransfersByStageChart.tsx**
  - Stacked bar chart showing transfers/withdrawals by educational stage
  - Compares transfers and withdrawals side by side
  - Uses MUI X-Charts BarChart

- **src/components/students-guardians/charts/WithdrawalReasonsChart.tsx**
  - Donut/Pie chart showing withdrawal reasons breakdown
  - Stage filter for detailed analysis
  - Color-coded reasons (Relocation, Financial, Academic, Behavior, Other)
  - Uses MUI X-Charts PieChart

- **src/components/students-guardians/charts/WithdrawalsByBehaviorChart.tsx**
  - Bar chart analyzing withdrawals by behavior score ranges
  - Ranges: 0-20, 21-40, 41-60, 61-80, 81-100
  - Includes insight text explaining correlation
  - Uses MUI X-Charts BarChart

### 4. Table Component

- **src/components/students-guardians/tables/TransfersWithdrawalsTable.tsx**
  - Detailed table of latest transfer/withdrawal requests
  - Columns: Student Name, Stage, Grade, Behavior Avg, Attendance %, Reason, Status, Request Date
  - Search functionality by student name
  - Color-coded status chips (Pending/Approved/Rejected)
  - Color-coded behavior scores (green/yellow/red)
  - Pagination support (10 items per page)
  - Uses existing DataTable component

## Features Implemented

### A) KPI Cards (6 cards)

1. **Transfers (This Month)** - Shows incoming students count
2. **Withdrawals (This Month)** - Shows outgoing students count
3. **Net Change** - Calculates transfers minus withdrawals
4. **Dropout Rate %** - Shows percentage with threshold indicator
5. **Pending Requests** - Count of requests awaiting review
6. **Behavior-related Withdrawals %** - Percentage linked to low behavior scores

### B) Trend Chart

- Monthly line chart comparing transfers vs withdrawals
- Stage filter dropdown
- 6-month historical data
- Responsive design

### C) Breakdown Charts

- **Left**: Stacked bar chart by educational stage
- **Right**: Donut chart showing withdrawal reasons
- Both include stage filters

### D) Behavior Impact Analysis

- Bar chart showing withdrawals by behavior score ranges
- Insight box explaining correlation
- Helps identify at-risk students

### E) Detailed Table

- Latest requests with full details
- Search by student name
- Sortable by date
- Status color indicators
- Behavior score color coding
- Pagination

### F) Smart Alerts

- Warning banner when dropout rate exceeds 5% threshold
- Displays current rate and alert message
- Dismissible design

## Translations Added

### English (src/messages/en.json)

- Added `students_guardians.tabs.transfers_withdrawals`
- Added complete `students_guardians.transfers_withdrawals` section with:
  - Title and subtitle
  - 6 KPI labels and descriptions
  - Alert messages
  - Filter labels
  - Chart titles and labels
  - Table headers and messages

### Arabic (src/messages/ar.json)

- Added `students_guardians.tabs.transfers_withdrawals` (التحويلات والانسحاب)
- Added complete `students_guardians.transfers_withdrawals` section with:
  - All labels translated to Arabic
  - RTL-compatible text
  - Culturally appropriate terminology

## Responsive Design

### Mobile (< 768px)

- KPI cards: 1 column
- Charts: Stack vertically
- Table: Horizontal scroll with sticky header
- Filters: Full width dropdowns

### Tablet (768px - 1024px)

- KPI cards: 2 columns
- Charts: 1 per row
- Table: Responsive with better spacing

### Desktop (> 1024px)

- KPI cards: 3-6 columns (depending on screen size)
- Charts: 2-column layout for breakdown section
- Table: Full width with all columns visible

## Data Integration

### Current Implementation

- Uses mock data with TODO comments
- Proper TypeScript interfaces defined
- Ready for API integration

### API Integration Points

1. **KPIs**: Replace mockData object in TransfersWithdrawalsPage.tsx
2. **Trend Chart**: Replace mockMonthlyData in TransfersWithdrawalsTrendChart.tsx
3. **Stage Chart**: Replace mockStageData in TransfersByStageChart.tsx
4. **Reasons Chart**: Replace mockReasonsData in WithdrawalReasonsChart.tsx
5. **Behavior Chart**: Replace mockBehaviorData in WithdrawalsByBehaviorChart.tsx
6. **Table**: Replace mockRequests in TransfersWithdrawalsTable.tsx

### Recommended API Endpoints

```typescript
// Suggested API structure
GET /api/transfers-withdrawals/kpis
GET /api/transfers-withdrawals/trend?stage=all&months=6
GET /api/transfers-withdrawals/by-stage
GET /api/transfers-withdrawals/reasons?stage=all
GET /api/transfers-withdrawals/by-behavior
GET /api/transfers-withdrawals/requests?search=&page=1&limit=10
```

## Code Quality

### Best Practices

- ✅ Follows project architecture and naming conventions
- ✅ Uses existing UI components (KPICard, DataTable)
- ✅ Implements loading states (ready for async data)
- ✅ Error handling structure in place
- ✅ Empty states for all components
- ✅ Proper TypeScript typing
- ✅ Responsive design with Tailwind CSS
- ✅ Accessibility considerations (color contrast, ARIA labels)
- ✅ RTL support for Arabic

### Dependencies Used

- MUI X-Charts (LineChart, BarChart, PieChart)
- Lucide React (icons)
- next-intl (translations)
- Existing project hooks (useResponsiveChart)

## Testing Checklist

- [ ] Navigate to Students & Guardians section
- [ ] Click on "Transfers & Withdrawals" tab
- [ ] Verify all 6 KPI cards display correctly
- [ ] Check alert banner appears when dropout rate > 5%
- [ ] Test stage filters on trend chart
- [ ] Test stage filters on withdrawal reasons chart
- [ ] Verify all charts render properly
- [ ] Test table search functionality
- [ ] Test table pagination
- [ ] Verify status color coding
- [ ] Test responsive design on mobile/tablet/desktop
- [ ] Switch to Arabic language and verify RTL layout
- [ ] Verify all translations display correctly

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live data
2. **Export Functionality**: CSV/PDF export for reports
3. **Advanced Filters**: Date range picker, multiple stage selection
4. **Drill-down**: Click charts to see detailed student lists
5. **Notifications**: Alert system for high dropout rates
6. **Predictive Analytics**: ML model to predict at-risk students
7. **Comparison View**: Year-over-year comparisons
8. **Custom Reports**: User-defined report builder

## Notes

- All TODO comments mark where API integration is needed
- Mock data is realistic and follows expected data structures
- Charts use responsive hooks for proper sizing
- Color scheme matches project design system
- All text is internationalized (no hardcoded strings)
