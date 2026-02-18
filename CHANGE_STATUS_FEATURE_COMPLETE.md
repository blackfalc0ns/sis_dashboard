# Change Status Feature Implementation

## Summary

Added a "Change Status" option to transfer and withdrawal request details pages, allowing users to manually change the status of requests through a modal dialog with validation and warnings.

## Changes Made

### 1. New Component Created

#### ChangeStatusModal Component

**File**: `src/components/students-guardians/transfers-withdrawals/modals/ChangeStatusModal.tsx`

**Features**:

- Dropdown to select new status from all available statuses
- Shows current status (read-only)
- Mandatory rejection reason field when status is "rejected"
- Warning messages for critical statuses (executed, rejected)
- Validation to prevent submission without required fields
- Disabled confirm button when status hasn't changed
- Fully localized (EN/AR)
- Responsive design

**Props**:

```typescript
interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newStatus: ApplicationStatus, reason?: string) => void;
  currentStatus: ApplicationStatus;
  requestType: "transfer" | "withdrawal";
}
```

**Status Options**:

- Draft
- Submitted
- Under Review
- Finance Clearance
- Behavior Review
- Approved
- Rejected (requires reason)
- Executed

### 2. Updated Components

#### TransferRequestDetailsPage

**Changes**:

- Added `MoreVertical` icon import
- Added `ApplicationStatus` type import
- Added `ChangeStatusModal` component import
- Added state: `showStatusModal`, `showActionsMenu`
- Added `handleStatusChange` function
- Added "More Actions" menu button (three dots)
- Added dropdown menu with "Change Status" option
- Added `ChangeStatusModal` at the end of component

#### WithdrawalRequestDetailsPage

**Changes**:

- Added `MoreVertical` icon import
- Added `ApplicationStatus` type import
- Added `ChangeStatusModal` component import
- Added state: `showStatusModal`, `showActionsMenu`
- Added `handleStatusChange` function
- Added "More Actions" menu button (three dots)
- Added dropdown menu with "Change Status" option
- Added `ChangeStatusModal` at the end of component

### 3. Translations Added

#### English (en.json)

```json
"change_status": "Change Status",
"current_status": "Current Status",
"new_status": "New Status",
"reason_required": "Rejection reason is required",
"reason_placeholder": "Enter the reason for rejection...",
"status_change_warning": "Warning",
"execute_warning": "Executing this request will permanently change the student's status. This action cannot be undone.",
"reject_warning": "Rejecting this request will permanently close it. Make sure to provide a clear reason.",
"cancel": "Cancel",
"confirm_change": "Confirm Change"
```

#### Arabic (ar.json)

```json
"change_status": "تغيير الحالة",
"current_status": "الحالة الحالية",
"new_status": "الحالة الجديدة",
"reason_required": "سبب الرفض مطلوب",
"reason_placeholder": "أدخل سبب الرفض...",
"status_change_warning": "تحذير",
"execute_warning": "تنفيذ هذا الطلب سيغير حالة الطالب بشكل دائم. لا يمكن التراجع عن هذا الإجراء.",
"reject_warning": "رفض هذا الطلب سيغلقه بشكل دائم. تأكد من تقديم سبب واضح.",
"cancel": "إلغاء",
"confirm_change": "تأكيد التغيير"
```

## UI/UX Features

### More Actions Menu

- Three-dot icon button in the header
- Positioned next to status badge and action buttons
- Dropdown menu appears on click
- Click outside to close
- Currently contains one option: "Change Status"
- Can be extended with more actions in the future

### Change Status Modal

- Clean, centered modal with backdrop
- Header with title and close button
- Current status display (read-only, gray background)
- New status dropdown with all available statuses
- Conditional rejection reason textarea (only for "rejected" status)
- Warning box for critical statuses (executed, rejected)
- Footer with Cancel and Confirm buttons
- Confirm button disabled when status unchanged
- Validation for required rejection reason

### Warnings

**Execute Warning**:

- Yellow background with warning icon
- Message: "Executing this request will permanently change the student's status. This action cannot be undone."

**Reject Warning**:

- Yellow background with warning icon
- Message: "Rejecting this request will permanently close it. Make sure to provide a clear reason."

## Validation Rules

1. **Status Change Required**: Confirm button is disabled if selected status equals current status
2. **Rejection Reason Required**: When status is "rejected", reason field is mandatory
3. **Reason Field Visibility**: Reason textarea only appears when "rejected" status is selected
4. **Alert on Missing Reason**: Shows browser alert if user tries to confirm rejection without reason

## How to Test

### 1. Navigate to Details Page

```
http://localhost:3000/en/students-guardians/transfers-withdrawals/transfers/TRF-2024-001
http://localhost:3000/en/students-guardians/transfers-withdrawals/withdrawals/WTH-2024-001
```

### 2. Open Change Status Modal

- Click the three-dot menu button (⋮) in the header
- Click "Change Status" from the dropdown
- Modal should appear

### 3. Test Status Selection

- Current status should be displayed (read-only)
- Select different statuses from dropdown
- Verify reason field appears only for "rejected" status
- Verify warning appears for "executed" and "rejected" statuses

### 4. Test Validation

- Try to confirm without changing status → button should be disabled
- Select "rejected" status
- Try to confirm without entering reason → should show alert
- Enter a reason → should allow confirmation

### 5. Test Status Change

- Select a new status
- Click "Confirm Change"
- Check console for log: "Change status: [requestId] [newStatus] [reason]"
- Modal should close

### 6. Test Localization

- Switch to Arabic: `http://localhost:3000/ar/...`
- Verify all text is translated
- Verify RTL layout works correctly
- Test all modal interactions in Arabic

### 7. Test Menu Interactions

- Click three-dot button → menu opens
- Click outside menu → menu closes
- Click "Change Status" → menu closes, modal opens
- Click modal backdrop → modal closes
- Click X button → modal closes
- Click Cancel → modal closes

## API Integration (TODO)

The `handleStatusChange` function currently logs to console. To integrate with API:

```typescript
const handleStatusChange = async (
  newStatus: ApplicationStatus,
  reason?: string,
) => {
  try {
    // Show loading state
    setIsLoading(true);

    // Call API
    await updateTransferStatus(transfer.id, newStatus, reason);
    // or
    await updateWithdrawalStatus(withdrawal.id, newStatus, reason);

    // Show success toast
    toast.success("Status updated successfully");

    // Refresh data or update local state
    router.refresh();
  } catch (error) {
    // Show error toast
    toast.error("Failed to update status");
    console.error(error);
  } finally {
    setIsLoading(false);
    setShowStatusModal(false);
  }
};
```

## Future Enhancements

### More Actions Menu

- [ ] Add "Edit Request" option (for draft status)
- [ ] Add "Cancel Request" option
- [ ] Add "Print/Export" option
- [ ] Add "Request More Info" option
- [ ] Add "View History" option
- [ ] Add "Duplicate Request" option

### Change Status Modal

- [ ] Add confirmation step for critical statuses
- [ ] Add notes field for all status changes (not just rejection)
- [ ] Add email notification checkbox
- [ ] Show status change history in modal
- [ ] Add status change preview/summary
- [ ] Add role-based status restrictions

### Validation

- [ ] Add server-side validation
- [ ] Add permission checks per status
- [ ] Add workflow validation (e.g., can't go from executed back to draft)
- [ ] Add business rule validation

### Audit Trail

- [ ] Log all status changes with timestamp and user
- [ ] Display in timeline tab
- [ ] Add status change notifications
- [ ] Add email alerts for status changes

## Files Modified

- `src/components/students-guardians/transfers-withdrawals/details/TransferRequestDetailsPage.tsx`
- `src/components/students-guardians/transfers-withdrawals/details/WithdrawalRequestDetailsPage.tsx`
- `src/messages/en.json`
- `src/messages/ar.json`

## Files Created

- `src/components/students-guardians/transfers-withdrawals/modals/ChangeStatusModal.tsx`

## Build Status

✅ Build passed successfully
✅ All TypeScript checks passed
✅ No linting errors
✅ All routes generated correctly
