# Document Center Implementation

## Overview

Added a centralized Document Center section to the Admissions Dashboard for tracking and managing required documents across all student applications. The feature provides a unified view of document status, upload functionality, and completion tracking.

## Changes Made

### 1. Created DocumentCenter Component

**File**: `src/components/admissions/DocumentCenter.tsx`

A comprehensive document management interface with:

- Centralized view of all documents across applications
- Search and filter functionality
- Status tracking (Complete/Missing)
- Upload and view actions
- Statistics dashboard

#### Key Features:

**Statistics Cards (4 metrics)**

1. Total Documents - Shows count of all documents
2. Complete - Documents successfully uploaded
3. Missing - Documents pending upload
4. Completion Rate - Percentage of complete documents

**Search & Filters**

- Real-time search by:
  - Student name
  - Application ID
  - Document type
- Status filter: All / Complete / Missing
- Clear filters button when active
- Search result highlighting

**Documents Table**
Displays flattened view of all documents with columns:

- Application ID
- Student Name
- Document Type
- Status (badge with icon)
- Uploaded Date
- Actions (Upload/View buttons)

**Actions**

- Upload button for missing documents
- View button for complete documents
- Color-coded status badges

### 2. Integrated into Admissions Dashboard

**File**: `src/components/admissions/AdmissionsDashboard.tsx`

- Added DocumentCenter component import
- Placed between Pipeline Kanban and Charts sections
- Passes `mockApplications` as prop for data

## Technical Implementation

### Data Structure

```typescript
interface DocumentCenterProps {
  applications: Application[];
}

// Flattened document structure
const allDocuments = applications.flatMap((app) =>
  app.documents.map((doc) => ({
    ...doc,
    applicationId: app.id,
    studentName: app.studentName,
    grade: app.gradeRequested,
    applicationStatus: app.status,
  })),
);
```

### Statistics Calculation

```typescript
const stats = useMemo(() => {
  const total = allDocuments.length;
  const complete = allDocuments.filter(
    (doc) => doc.status === "complete",
  ).length;
  const missing = allDocuments.filter((doc) => doc.status === "missing").length;
  const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;

  return { total, complete, missing, completionRate };
}, [allDocuments]);
```

### Filter Logic

```typescript
const filteredDocuments = useMemo(() => {
  return allDocuments.filter((doc) => {
    const matchesSearch =
      searchQuery === "" ||
      doc.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.applicationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}, [allDocuments, searchQuery, statusFilter]);
```

### Action Handlers

```typescript
const handleUpload = (doc) => {
  // Simulates file upload
  alert(`Upload document for ${doc.type} - Application ${doc.applicationId}`);
};

const handleView = (doc) => {
  if (doc.uploadedDate) {
    alert(`Viewing ${doc.name} for Application ${doc.applicationId}`);
  } else {
    alert("Document not uploaded yet");
  }
};
```

## Visual Design

### Color Scheme

- **Blue**: Total Documents (bg-blue-50, text-blue-600)
- **Green**: Complete status (bg-green-50, text-green-600)
- **Red**: Missing status (bg-red-50, text-red-600)
- **Purple**: Completion rate (bg-purple-50, text-purple-600)
- **Teal**: Primary actions (#036b80)

### Layout

- Statistics cards: 4-column grid (responsive)
- Search bar with icon and clear button
- Collapsible filters panel
- Full-width responsive table
- Empty state with icon and message

### Status Badges

```typescript
// Complete
<span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
  <CheckCircle className="w-3 h-3" />
  Complete
</span>

// Missing
<span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
  <AlertCircle className="w-3 h-3" />
  Missing
</span>
```

### Action Buttons

```typescript
// Upload (for missing documents)
<button className="flex items-center gap-1 px-3 py-1.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg text-xs font-medium">
  <Upload className="w-3 h-3" />
  Upload
</button>

// View (for complete documents)
<button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">
  <Eye className="w-3 h-3" />
  View
</button>
```

## Integration with Existing Features

### Missing Documents KPI

The Document Center integrates with the "Missing Documents" KPI on the Applications page:

- Both use the same calculation logic
- KPI shows count of applications with missing docs
- Document Center shows detailed list of all missing documents

### Document Type Structure

Uses existing `Document` interface from `src/types/admissions.ts`:

```typescript
export interface Document {
  id: string;
  type: string;
  name: string;
  status: "complete" | "missing";
  uploadedDate?: string;
}
```

## Responsive Design

- **Mobile (< 768px)**: 1 column for stats, stacked filters
- **Tablet (768px - 1024px)**: 2 columns for stats
- **Desktop (> 1024px)**: 4 columns for stats
- Table scrolls horizontally on small screens

## Performance Optimization

- Uses `useMemo` for expensive calculations:
  - Document flattening
  - Filtering logic
  - Statistics calculation
- Prevents unnecessary re-renders

## Files Created

- `src/components/admissions/DocumentCenter.tsx`

## Files Modified

- `src/components/admissions/AdmissionsDashboard.tsx`

## Dependencies

- React hooks: `useState`, `useMemo`
- Lucide React icons: `Upload`, `FileText`, `Eye`, `CheckCircle`, `AlertCircle`, `Search`, `Filter`, `X`
- Types: `Application`, `Document` from `@/types/admissions`
- Existing theme and styling patterns

## Current Limitations & Future Enhancements

### Current Implementation

- Upload and view actions show alerts (placeholder functionality)
- No actual file upload/storage integration
- No permission/role-based access control
- No document preview modal

### Recommended Enhancements

1. **File Upload Integration**
   - Connect to backend API/server action
   - Add file validation (size, type)
   - Show upload progress
   - Handle upload errors

2. **Document Preview**
   - Add modal for viewing documents
   - Support PDF, images (JPG, PNG)
   - Add download functionality

3. **Status Management**
   - Allow manual status updates
   - Add verification workflow
   - Track who uploaded/verified

4. **Permissions**
   - Role-based access control
   - Read-only mode for certain users
   - Audit trail for changes

5. **Notifications**
   - Alert staff when documents are uploaded
   - Remind parents of missing documents
   - Email notifications

6. **Bulk Operations**
   - Select multiple documents
   - Bulk download
   - Bulk status updates

7. **Document Templates**
   - Define required documents per grade
   - Auto-generate document checklist
   - Track completion per application

8. **Analytics**
   - Document completion trends
   - Average time to upload
   - Most commonly missing documents

## Testing Recommendations

1. Verify statistics calculate correctly
2. Test search across all fields
3. Confirm filter combinations work
4. Check responsive layout on all screen sizes
5. Validate empty states display correctly
6. Test with applications having no documents
7. Verify status badges render correctly
8. Test action buttons (upload/view)

## Integration Points

- **Applications Page**: Missing Documents KPI
- **Application360Modal**: Document tab shows same data
- **Backend**: Ready for API integration
- **File Storage**: Prepared for cloud storage integration (S3, Azure Blob, etc.)

## Accessibility

- Semantic HTML table structure
- Icon + text labels for actions
- Color + icon for status (not color alone)
- Keyboard accessible filters and buttons
- Screen reader friendly labels

## Security Considerations

- File upload validation needed
- Virus scanning recommended
- Access control required
- Audit logging for compliance
- Secure file storage with encryption
- GDPR/data privacy compliance
