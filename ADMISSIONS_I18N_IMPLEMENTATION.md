# Admissions Dashboard - Arabic/English Localization Implementation

## Existing i18n System Analysis

### Framework: next-intl

- **Hook**: `useTranslations()` from `next-intl`
- **Translation files**: `src/messages/ar.json` and `src/messages/en.json`
- **Routing**: Locale-based routing with `[lang]` parameter
- **Default locale**: Arabic (`ar`)
- **Supported locales**: `en`, `ar`

### RTL Support

- Already implemented in layout components
- Uses `document.documentElement.dir` detection
- Conditional classes based on `isRTL` flag

## Strings to Translate

### AdmissionsDashboard.tsx

- "Admissions Dashboard"
- "Overview of admissions pipeline and analytics"
- "Export"
- "Applications"
- "Conversion Rate"
- "Avg Processing Time"
- "Avg time to decision"
- "Application Sources"
- "Distribution by application source"

### DateRangeFilter.tsx

- "Filter by Period"
- "All Time"
- "Last 7 Days"
- "Last 30 Days"
- "Last 60 Days"
- "Last 90 Days"
- "Custom Range"
- "From:"
- "To:"

### DocumentCenter.tsx

- "Document Center"
- "Centralized document tracking and management"
- "Total Documents"
- "Complete"
- "Unsubmitted"
- "Missing"
- "Completion Rate"
- "Search documents..."
- "Filters"
- "Clear"
- "Document Status"
- "All Statuses"
- "Upload"
- "View"
- "Application ID"
- "Student Name"
- "Document Type"
- "Status"
- "Uploaded Date"
- "Actions"
- "No documents match your filters"
- "No documents found"
- "Clear filters"

### Chart Components

- "Conversion Funnel"
- "Application pipeline stages"
- "Weekly Inquiries"
- "Inquiries trend over time"
- "Applications by Grade"
- "Distribution by grade level"
- "Application Sources"
- "Distribution by application source"

### ApplicationsList.tsx

- "Applications"
- "Manage and track all applications"
- "New Application"
- "Search applications..."
- "Status"
- "Source"
- "Grade"
- "All"
- "Pending"
- "Under Review"
- "Accepted"
- "Rejected"
- "In App"
- "Referral"
- "Walk-in"
- "Other"

### LeadsList.tsx

- "Leads"
- "Manage parent inquiries and leads"
- "New Lead"
- "Import"
- "Search leads..."
- "Channel"
- "Owner"

### TestsList.tsx

- "Tests"
- "Manage entrance tests and results"
- "Schedule Test"
- "Test Type"
- "Result"

### InterviewsList.tsx

- "Interviews"
- "Manage interviews and ratings"
- "Schedule Interview"
- "Rating"

### DecisionsList.tsx

- "Decisions"
- "Manage admission decisions"
- "Decision Type"
- "Decision Date"

### EnrollmentList.tsx

- "Enrollment"
- "Manage enrolled students"
- "Enrollment Date"
- "Payment Status"

## Translation Keys Structure

```json
{
  "admissions": {
    "dashboard": {
      "title": "Admissions Dashboard",
      "subtitle": "Overview of admissions pipeline and analytics",
      "export": "Export"
    },
    "kpi": {
      "applications": "Applications",
      "conversion_rate": "Conversion Rate",
      "avg_processing_time": "Avg Processing Time",
      "avg_time_to_decision": "Avg time to decision"
    },
    "date_filter": {
      "filter_by_period": "Filter by Period",
      "all_time": "All Time",
      "last_7_days": "Last 7 Days",
      "last_30_days": "Last 30 Days",
      "last_60_days": "Last 60 Days",
      "last_90_days": "Last 90 Days",
      "custom_range": "Custom Range",
      "from": "From:",
      "to": "To:"
    },
    "charts": {
      "conversion_funnel": "Conversion Funnel",
      "pipeline_stages": "Application pipeline stages",
      "weekly_inquiries": "Weekly Inquiries",
      "inquiries_trend": "Inquiries trend over time",
      "applications_by_grade": "Applications by Grade",
      "grade_distribution": "Distribution by grade level",
      "application_sources": "Application Sources",
      "source_distribution": "Distribution by application source",
      "no_data": "No data for selected period"
    },
    "document_center": {
      "title": "Document Center",
      "subtitle": "Centralized document tracking and management",
      "total_documents": "Total Documents",
      "complete": "Complete",
      "unsubmitted": "Unsubmitted",
      "missing": "Missing",
      "completion_rate": "Completion Rate",
      "search_placeholder": "Search documents...",
      "filters": "Filters",
      "clear": "Clear",
      "document_status": "Document Status",
      "all_statuses": "All Statuses",
      "upload": "Upload",
      "view": "View",
      "application_id": "Application ID",
      "student_name": "Student Name",
      "document_type": "Document Type",
      "status": "Status",
      "uploaded_date": "Uploaded Date",
      "actions": "Actions",
      "no_match": "No documents match your filters",
      "no_documents": "No documents found",
      "clear_filters": "Clear filters"
    },
    "applications": {
      "title": "Applications",
      "subtitle": "Manage and track all applications",
      "new_application": "New Application",
      "search_placeholder": "Search applications..."
    },
    "leads": {
      "title": "Leads",
      "subtitle": "Manage parent inquiries and leads",
      "new_lead": "New Lead",
      "import": "Import",
      "search_placeholder": "Search leads..."
    },
    "tests": {
      "title": "Tests",
      "subtitle": "Manage entrance tests and results",
      "schedule_test": "Schedule Test",
      "test_type": "Test Type",
      "result": "Result"
    },
    "interviews": {
      "title": "Interviews",
      "subtitle": "Manage interviews and ratings",
      "schedule_interview": "Schedule Interview",
      "rating": "Rating"
    },
    "decisions": {
      "title": "Decisions",
      "subtitle": "Manage admission decisions",
      "decision_type": "Decision Type",
      "decision_date": "Decision Date"
    },
    "enrollment": {
      "title": "Enrollment",
      "subtitle": "Manage enrolled students",
      "enrollment_date": "Enrollment Date",
      "payment_status": "Payment Status"
    },
    "filters": {
      "status": "Status",
      "source": "Source",
      "grade": "Grade",
      "channel": "Channel",
      "owner": "Owner",
      "all": "All"
    },
    "status": {
      "pending": "Pending",
      "under_review": "Under Review",
      "accepted": "Accepted",
      "rejected": "Rejected",
      "complete": "Complete",
      "missing": "Missing"
    },
    "source": {
      "in_app": "In App",
      "referral": "Referral",
      "walk_in": "Walk-in",
      "other": "Other"
    }
  }
}
```

## Implementation Plan

1. Add translation keys to `src/messages/en.json` and `src/messages/ar.json`
2. Update all Admissions components to use `useTranslations('admissions')`
3. Replace hardcoded strings with `t()` calls
4. Ensure RTL support is working correctly
5. Test both languages

## Files to Modify

1. `src/messages/en.json` - Add English translations
2. `src/messages/ar.json` - Add Arabic translations
3. `src/components/admissions/AdmissionsDashboard.tsx`
4. `src/components/admissions/DateRangeFilter.tsx`
5. `src/components/admissions/DocumentCenter.tsx`
6. `src/components/admissions/charts/ConversionFunnelChart.tsx`
7. `src/components/admissions/charts/WeeklyInquiriesChart.tsx`
8. `src/components/admissions/charts/ApplicationsByGradeChart.tsx`
9. `src/components/admissions/charts/ApplicationSourcesChart.tsx`
10. `src/components/admissions/ApplicationsList.tsx`
11. `src/components/leads/LeadsList.tsx`
12. `src/components/admissions/TestsList.tsx`
13. `src/components/admissions/InterviewsList.tsx`
14. `src/components/admissions/DecisionsList.tsx`
15. `src/components/admissions/EnrollmentList.tsx`
