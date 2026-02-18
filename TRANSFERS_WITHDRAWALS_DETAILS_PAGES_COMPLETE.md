# Transfers & Withdrawals Details Pages Implementation

## Summary

Implemented dedicated details pages for transfer and withdrawal requests with row-click navigation, replacing the previous modal/drawer pattern.

## Changes Made

### 1. New Routes Created

- **Transfer Details**: `/students-guardians/transfers-withdrawals/transfers/[requestId]`
- **Withdrawal Details**: `/students-guardians/transfers-withdrawals/withdrawals/[requestId]`

### 2. New Components

#### Details Page Components

- `src/components/students-guardians/transfers-withdrawals/details/TransferRequestDetailsPage.tsx`
  - Full-page transfer request details
  - Summary cards: Student Info, Request Info, Behavior Summary
  - Tabs: Details, Attachments, Timeline
  - Contextual actions: Approve, Reject, Execute (based on status)
  - Back button with filter preservation

- `src/components/students-guardians/transfers-withdrawals/details/WithdrawalRequestDetailsPage.tsx`
  - Full-page withdrawal request details
  - Summary cards: Student Info, Request Info, Behavior Summary
  - Tabs: Details, Attachments, Timeline
  - Contextual actions: Approve, Reject, Execute (based on status)
  - Back button with filter preservation

#### Route Pages

- `src/app/[lang]/(dashboard)/students-guardians/transfers-withdrawals/transfers/[requestId]/page.tsx`
- `src/app/[lang]/(dashboard)/students-guardians/transfers-withdrawals/withdrawals/[requestId]/page.tsx`

### 3. Updated Components

#### Table Components

- **TransfersTable.tsx**
  - Added `useRouter` hook
  - Added `handleRowClick` function to navigate to details page
  - Added `onRowClick` prop to DataTable
  - Updated action buttons with `stopPropagation` to prevent row click
  - View button now navigates to details page

- **WithdrawalsTable.tsx**
  - Added `useRouter` hook
  - Added `handleRowClick` function to navigate to details page
  - Added `onRowClick` prop to DataTable
  - Updated action buttons with `stopPropagation` to prevent row click
  - View button now navigates to details page

### 4. Translations Added

#### English (en.json)

```json
"details": {
  "back_to_list": "Back to List",
  "transfer_request_details": "Transfer Request Details",
  "withdrawal_request_details": "Withdrawal Request Details",
  "request_id": "Request ID",
  "approve": "Approve",
  "reject": "Reject",
  "execute": "Execute",
  "student_info": "Student Information",
  "student_name": "Student Name",
  "stage": "Stage",
  "grade": "Grade",
  "request_info": "Request Information",
  "transfer_type": "Transfer Type",
  "target_class": "Target Class",
  "external_school": "External School",
  "reason": "Reason",
  "request_date": "Request Date",
  "effective_date": "Effective Date",
  "created_by": "Created By",
  "behavior_summary": "Behavior Summary",
  "behavior_score": "Behavior Score",
  "behavior_avg": "Behavior Average",
  "behavior_band": "Behavior Band",
  "attendance": "Attendance",
  "tab_details": "Details",
  "tab_attachments": "Attachments",
  "tab_timeline": "Timeline",
  "notes": "Notes",
  "no_notes": "No notes available",
  "rejection_reason": "Rejection Reason",
  "no_attachments": "No attachments available",
  "request_submitted": "Request Submitted",
  "submitted_by": "Submitted by"
}
```

#### Arabic (ar.json)

```json
"details": {
  "back_to_list": "العودة إلى القائمة",
  "transfer_request_details": "تفاصيل طلب التحويل",
  "withdrawal_request_details": "تفاصيل طلب الانسحاب",
  "request_id": "رقم الطلب",
  "approve": "موافقة",
  "reject": "رفض",
  "execute": "تنفيذ",
  "student_info": "معلومات الطالب",
  "student_name": "اسم الطالب",
  "stage": "المرحلة",
  "grade": "الصف",
  "request_info": "معلومات الطلب",
  "transfer_type": "نوع التحويل",
  "target_class": "الفصل المستهدف",
  "external_school": "المدرسة الخارجية",
  "reason": "السبب",
  "request_date": "تاريخ الطلب",
  "effective_date": "تاريخ السريان",
  "created_by": "أنشئ بواسطة",
  "behavior_summary": "ملخص السلوك",
  "behavior_score": "درجة السلوك",
  "behavior_avg": "متوسط السلوك",
  "behavior_band": "نطاق السلوك",
  "attendance": "الحضور",
  "tab_details": "التفاصيل",
  "tab_attachments": "المرفقات",
  "tab_timeline": "الجدول الزمني",
  "notes": "ملاحظات",
  "no_notes": "لا توجد ملاحظات متاحة",
  "rejection_reason": "سبب الرفض",
  "no_attachments": "لا توجد مرفقات متاحة",
  "request_submitted": "تم إرسال الطلب",
  "submitted_by": "أرسل بواسطة"
}
```

## Features Implemented

### 1. Navigation Pattern

- ✅ Row click navigates to dedicated details page
- ✅ Action buttons use `stopPropagation` to prevent row click
- ✅ Back button preserves list filters via query params
- ✅ Breadcrumb-style navigation with back button

### 2. Details Page Layout

- ✅ Header with title, status badge, and contextual actions
- ✅ Summary cards grid (responsive):
  - Student Information
  - Request Information
  - Behavior Summary
- ✅ Tabbed interface:
  - Details tab (notes, rejection reason)
  - Attachments tab (placeholder)
  - Timeline tab (audit log placeholder)

### 3. Contextual Actions

- ✅ Status-based action visibility:
  - `under_review` / `behavior_review`: Show Approve & Reject
  - `approved`: Show Execute
  - Other statuses: Read-only
- ✅ Action buttons with icons and proper styling
- ✅ TODO markers for API integration

### 4. Data Display

- ✅ Localized content (AR/EN)
- ✅ Status badges with color coding
- ✅ Behavior score color coding (green/yellow/red)
- ✅ Conditional field display (internal vs external transfers)
- ✅ Empty states for missing data

### 5. Responsive Design

- ✅ Mobile-friendly layout
- ✅ Responsive grid for summary cards
- ✅ Proper spacing and typography
- ✅ RTL support for Arabic

## How to Test

### 1. Navigate to Transfers/Withdrawals

```
http://localhost:3000/en/students-guardians/transfers-withdrawals/transfers/applications
http://localhost:3000/en/students-guardians/transfers-withdrawals/withdrawals/applications
```

### 2. Click on a Table Row

- Click anywhere on a row (except action buttons)
- Should navigate to details page
- URL should be: `.../transfers/TRF-2024-001` or `.../withdrawals/WTH-2024-001`

### 3. Test Action Buttons

- Click View icon → navigates to details
- Click Approve/Reject icons → logs to console (doesn't navigate)
- Verify `stopPropagation` works correctly

### 4. Test Details Page

- Verify all summary cards display correctly
- Switch between tabs (Details, Attachments, Timeline)
- Check status-based action button visibility
- Click Back button → returns to list

### 5. Test Filter Preservation

- Apply filters on list page
- Click a row to view details
- Click Back button
- Verify filters are preserved in URL and applied

### 6. Test Localization

- Switch to Arabic: `http://localhost:3000/ar/...`
- Verify all text is translated
- Verify RTL layout works correctly
- Verify Arabic student names display

### 7. Test Different Statuses

Mock data includes:

- Transfer TRF-2024-001: `approved` status
- Transfer TRF-2024-002: `under_review` status
- Withdrawal WTH-2024-001: `submitted` status
- Withdrawal WTH-2024-002: `behavior_review` status

## Next Steps (TODO)

### 1. API Integration

- [ ] Implement `getTransferRequestById` API call
- [ ] Implement `getWithdrawalRequestById` API call
- [ ] Add loading states with skeletons
- [ ] Add error handling with retry

### 2. Actions Implementation

- [ ] Create Approve confirmation modal
- [ ] Create Reject modal with reason input (mandatory)
- [ ] Create Execute confirmation with consequences summary
- [ ] Implement status update API calls
- [ ] Add toast notifications for success/error

### 3. Attachments Tab

- [ ] Fetch attachments from API
- [ ] Display attachment list with icons
- [ ] Add view/download actions
- [ ] Add upload functionality (if allowed)

### 4. Timeline Tab

- [ ] Fetch audit log from API
- [ ] Display chronological events
- [ ] Show actor, timestamp, and notes for each event
- [ ] Add visual timeline with icons

### 5. Permissions

- [ ] Add role-based action visibility
- [ ] Implement permission checks for Approve/Reject/Execute
- [ ] Add permission checks for Edit/Cancel

### 6. Enhanced Features

- [ ] Add Print/Export functionality
- [ ] Add Edit mode for draft status
- [ ] Add Cancel request functionality
- [ ] Add "Request More Info" action
- [ ] Add email notifications

## Files Modified

- `src/components/students-guardians/transfers-withdrawals/TransfersTable.tsx`
- `src/components/students-guardians/transfers-withdrawals/WithdrawalsTable.tsx`
- `src/messages/en.json`
- `src/messages/ar.json`

## Files Created

- `src/app/[lang]/(dashboard)/students-guardians/transfers-withdrawals/transfers/[requestId]/page.tsx`
- `src/app/[lang]/(dashboard)/students-guardians/transfers-withdrawals/withdrawals/[requestId]/page.tsx`
- `src/components/students-guardians/transfers-withdrawals/details/TransferRequestDetailsPage.tsx`
- `src/components/students-guardians/transfers-withdrawals/details/WithdrawalRequestDetailsPage.tsx`

## Build Status

✅ Build passed successfully
✅ All routes generated correctly
✅ No TypeScript errors
✅ No linting errors
