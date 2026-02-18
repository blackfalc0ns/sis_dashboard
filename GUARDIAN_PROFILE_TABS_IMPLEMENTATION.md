# Guardian Profile Page with Tab Routing Implementation

## Overview

Created a complete guardian details page with tabbed navigation using Next.js routing. Each tab has its own route, allowing for direct URL access and proper browser history. The implementation follows the same pattern as the student profile page.

## Files Created/Modified

### Route Files

1. **src/app/[lang]/(dashboard)/students-guardians/guardians/[guardianId]/layout.tsx**
   - Shared layout for all guardian profile tabs
   - Header with guardian avatar, name, relation badge, and contact info
   - Tab navigation with active state based on current route
   - Back button with RTL support

2. **src/app/[lang]/(dashboard)/students-guardians/guardians/[guardianId]/page.tsx**
   - Overview tab route (default)
   - Renders OverviewTab component

3. **src/app/[lang]/(dashboard)/students-guardians/guardians/[guardianId]/students/page.tsx**
   - Students tab route
   - Renders StudentsTab component

4. **src/app/[lang]/(dashboard)/students-guardians/guardians/[guardianId]/documents/page.tsx**
   - Documents tab route
   - Renders DocumentsTab component

5. **src/app/[lang]/(dashboard)/students-guardians/guardians/[guardianId]/notes/page.tsx**
   - Notes tab route
   - Renders NotesTab component

6. **src/app/[lang]/(dashboard)/students-guardians/guardians/[guardianId]/timeline/page.tsx**
   - Timeline tab route
   - Renders TimelineTab component

### Tab Components

1. **src/components/students-guardians/guardian-tabs/OverviewTab.tsx**
   - Displays guardian's personal information
   - Contact information (phones, email)
   - Professional information (job title, workplace)
   - Permissions (pickup authorization, notifications)

2. **src/components/students-guardians/guardian-tabs/StudentsTab.tsx**
   - Lists all students linked to the guardian
   - Clickable student cards that navigate to student profile
   - Shows student grade, section, and status
   - Empty state when no students are linked

3. **src/components/students-guardians/guardian-tabs/DocumentsTab.tsx**
   - Placeholder for guardian documents
   - Upload document button
   - Empty state with instructions

4. **src/components/students-guardians/guardian-tabs/NotesTab.tsx**
   - Placeholder for guardian notes
   - Add note button
   - Empty state with instructions

5. **src/components/students-guardians/guardian-tabs/TimelineTab.tsx**
   - Placeholder for guardian activity timeline
   - Empty state with instructions

### Modified Files

1. **src/components/students-guardians/GuardiansList.tsx**
   - Added `useRouter` and `useParams` imports
   - Added `handleRowClick` function to navigate to guardian profile
   - Added `onRowClick` prop to DataTable component

2. **src/services/studentsService.ts**
   - Added `getGuardianById` function to retrieve a specific guardian

3. **src/messages/en.json**
   - Added `guardian_profile` translations section with all tabs and fields
   - Added sections for notes, documents, and timeline

4. **src/messages/ar.json**
   - Added `guardian_profile` translations section (Arabic)
   - Added sections for notes, documents, and timeline

## Features

- Each tab has its own route for direct URL access
- Browser back/forward buttons work correctly
- Tab navigation updates URL without page reload
- Shared layout across all tabs
- Overview tab with organized information sections
- Students tab showing all linked students with navigation
- Document, Notes, and Timeline tabs (ready for implementation)
- Responsive design with organized information sections
- Displays all guardian details including permissions
- Shows linked students with their grade, section, and status
- Bilingual support (English/Arabic)
- Consistent styling with the rest of the application
- Primary guardian indicator (star icon)
- Relation badge with color coding
- RTL support for Arabic language

## URL Structure

- Overview: `/[lang]/students-guardians/guardians/[guardianId]`
- Students: `/[lang]/students-guardians/guardians/[guardianId]/students`
- Documents: `/[lang]/students-guardians/guardians/[guardianId]/documents`
- Notes: `/[lang]/students-guardians/guardians/[guardianId]/notes`
- Timeline: `/[lang]/students-guardians/guardians/[guardianId]/timeline`

## Navigation Flow

1. User views guardians list at `/[lang]/students-guardians/guardians`
2. User clicks on any guardian row
3. Navigates to `/[lang]/students-guardians/guardians/[guardianId]` (Overview tab)
4. User can click tabs to navigate to different routes
5. Each tab change updates the URL
6. User can bookmark or share specific tab URLs
7. User can click on linked students to navigate to their profiles
8. User can navigate back using "Back to Guardians" button or browser back button

## Tab Structure

- **Overview** (`/[guardianId]`): Personal info, contact details, professional info, permissions
- **Students** (`/[guardianId]/students`): All linked students with navigation to their profiles
- **Documents** (`/[guardianId]/documents`): Guardian-related documents (placeholder)
- **Notes** (`/[guardianId]/notes`): Notes about the guardian (placeholder)
- **Timeline** (`/[guardianId]/timeline`): Activity history (placeholder)

## Technical Implementation

- Uses Next.js App Router with nested layouts
- Server components for route pages with async params
- Client components for interactive tab content
- Shared layout handles guardian data fetching and tab navigation
- Active tab detection based on pathname
- Smooth transitions with startTransition for route changes
