# Attachment Card Redesign Specification (WhatsApp Web-Style)

We are redesigning the default file attachment card layout in the redesigned conversations panel to match a premium WhatsApp Web-style rectangular layout. This document details the visual components, file extension color mapping, metadata presentation, and verification strategies.

---

## 1. User Interface & Layout Design

The redesigned file attachment card will render as a neat, responsive rectangular block inside message bubbles.

### 1.1 Background & Border Styling
- **Sent by Current User (`isOwn = true`):**
  - **Background:** Semi-transparent white overlay (`bg-white/10` or `bg-primary-950/20`).
  - **Border:** Subtle white border (`border border-white/10`).
  - **Text Color:** Clean white (`text-white`) for file name; semi-transparent white (`text-white/70`) for metadata.
- **Received from Others (`isOwn = false`):**
  - **Background:** Solid white or extremely soft light-gray card (`bg-white` or `bg-slate-50`).
  - **Border:** Soft gray border (`border border-slate-100` or `border-slate-200/60`).
  - **Text Color:** Muted slate (`text-slate-800`) for file name; slate gray (`text-slate-500`) for metadata.

### 1.2 Layout Structure
- **Container:** `flex items-center gap-3 p-3 rounded-xl border w-full max-w-[280px] sm:max-w-[320px] mb-1.5 transition-all shadow-sm`
- **Left Side:** Colored file type badge (`h-10 w-9 rounded shrink-0`) containing a sheet icon at the top and the capitalized file extension overlay text at the bottom.
- **Center:** Flex column containing the truncated file name and the metadata row.
- **Right Side:** A row of circular action buttons (download, delete) with hover micro-interactions.

---

## 2. Component Specifications

### 2.1 File Type Badge Color Mapping
The rectangular file type badge on the left will change its background color and styling depending on the file's extension (extracted from the file name or MIME type):
- **PDF (`.pdf`):** Crimson/Red theme (`bg-red-500` / own bubble: `bg-red-600/30 text-red-200`)
- **Word/Text (`.doc`, `.docx`, `.txt`, `.rtf`):** Blue theme (`bg-blue-500` / own bubble: `bg-blue-600/30 text-blue-200`)
- **Excel/Sheets (`.xls`, `.xlsx`, `.csv`):** Green theme (`bg-emerald-500` / own bubble: `bg-emerald-600/30 text-emerald-200`)
- **PowerPoint/Slides (`.ppt`, `.pptx`):** Orange theme (`bg-amber-600` / own bubble: `bg-amber-600/30 text-amber-200`)
- **Compressed (`.zip`, `.rar`, `.7z`, `.tar`, `.gz`):** Amber/Yellow theme (`bg-orange-500` / own bubble: `bg-orange-600/30 text-orange-200`)
- **Images/Videos (`.png`, `.jpg`, `.jpeg`, `.gif`, `.mp4`, `.mov`, `.avi`):** Violet/Indigo theme (`bg-indigo-500` / own bubble: `bg-indigo-600/30 text-indigo-200`)
- **Generic/Other:** Neutral Slate theme (`bg-slate-500` / own bubble: `bg-slate-600/30 text-slate-300`)

### 2.2 Text Metadata
- **File Name:** Bold, truncated (`text-[13px] font-semibold truncate`).
- **File Size and Extension:** Formatted as `Size • Extension`, e.g., `1.4 MB • PDF Document` (`text-[10.5px] font-medium opacity-80 mt-0.5`).

### 2.3 Interactive Action Buttons
- **Download Button:** A clean, modern circular button (`h-8 w-8 rounded-full flex items-center justify-center transition hover:bg-slate-100 active:scale-90`) containing a download SVG icon.
- **Delete Button:** Appears only if `canDelete` is true. Styled as a circular button with a trash icon (`text-rose-600 hover:bg-rose-50` / own bubble: `text-white/70 hover:bg-white/10`).

---

## 3. Testing & Verification Plan

### 3.1 Unit Testing (`AttachmentCard.test.tsx`)
We will add new unit tests to assert the following behaviors:
1. Renders correct class names and backgrounds for own bubble vs others' bubbles.
2. Correctly parses file extensions and matches the appropriate badge background theme.
3. Renders the uppercase file extension text in the badge overlay (e.g. `PDF` for PDF files).
4. Verifies clicking the download button calls the download handler.
5. Verifies clicking the delete button opens the confirmation prompt and triggers deletion.

### 3.2 Regression Testing
- Run all communication feature tests (`npx vitest run src/features/communication`) to ensure zero regressions.
