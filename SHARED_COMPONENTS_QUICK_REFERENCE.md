# Shared Components Quick Reference

## New Shared Components Created

### 1. ConfirmDialog

**Import:**
```tsx
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
```

**Basic Usage:**
```tsx
<ConfirmDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  title="Delete Item?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  severity="danger"
/>
```

**Props:**
- `isOpen: boolean` - Controls dialog visibility
- `onClose: () => void` - Called when dialog closes
- `onConfirm: () => void` - Called when user confirms
- `title: string` - Dialog title
- `description: string` - Dialog description/message
- `confirmLabel: string` - Confirm button text
- `cancelLabel: string` - Cancel button text
- `loading?: boolean` - Shows loading state on confirm button
- `severity?: "default" | "info" | "warning" | "danger"` - Button color

**Use Cases:**
- Delete confirmations
- Discard changes warnings
- Destructive action confirmations
- Any yes/no decision

---

### 2. FileUploadButton

**Import:**
```tsx
import { FileUploadButton } from "@/components/ui/file-upload";
```

**Basic Usage:**
```tsx
<FileUploadButton
  onFilesSelected={(files) => handleUpload(files)}
  buttonLabel="Upload Files"
  multiple
  maxSizeBytes={20 * 1024 * 1024}
  buttonProps={{
    variant: "outline",
    size: "sm",
    leftIcon: <Upload className="w-4 h-4" />
  }}
/>
```

**Props:**
- `onFilesSelected: (files: File[]) => void` - Called with selected files
- `buttonLabel: string` - Button text
- `accept?: string` - File types (e.g., "image/*", ".pdf")
- `multiple?: boolean` - Allow multiple files
- `maxSizeBytes?: number` - Max file size in bytes
- `disabled?: boolean` - Disable button
- `buttonProps?: Partial<ButtonProps>` - Customize button appearance
- `helperText?: string` - Helper text below button
- `onError?: (error: string) => void` - Called on validation error

**Use Cases:**
- Document uploads
- Image uploads
- File attachments
- Profile picture uploads
- Bulk imports

---

### 3. AttachmentListItem

**Import:**
```tsx
import { AttachmentListItem } from "@/components/ui/attachment-list-item";
```

**Basic Usage:**
```tsx
<AttachmentListItem
  icon={<FileText className="w-5 h-5 text-red-500" />}
  title="Document.pdf"
  subtitle="2.3 MB • PDF"
  onClick={() => handlePreview(item)}
  actions={[
    {
      label: "Preview",
      icon: <Eye className="w-4 h-4" />,
      onClick: () => handlePreview(item)
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => handleDelete(item),
      color: "error"
    }
  ]}
/>
```

**Props:**
- `icon: React.ReactNode` - Leading icon
- `title: string` - Primary text
- `subtitle?: string` - Secondary text
- `onClick?: () => void` - Called when row is clicked
- `actions?: AttachmentAction[]` - Action menu items
- `disabled?: boolean` - Disable interactions

**AttachmentAction:**
- `label: string` - Action label
- `icon?: React.ReactNode` - Action icon
- `onClick: () => void` - Action handler
- `color?: "default" | "error"` - Action color
- `hidden?: boolean` - Hide action conditionally

**Use Cases:**
- Document lists
- File attachments
- Link collections
- Media galleries
- Any list with actions

---

## Usage Examples

### Example 1: Delete Confirmation
```tsx
const [deleteOpen, setDeleteOpen] = useState(false);
const [deleting, setDeleting] = useState(false);

const handleDelete = async () => {
  setDeleting(true);
  try {
    await deleteItem(itemId);
    setDeleteOpen(false);
  } finally {
    setDeleting(false);
  }
};

return (
  <ConfirmDialog
    isOpen={deleteOpen}
    onClose={() => setDeleteOpen(false)}
    onConfirm={handleDelete}
    title="Delete Document?"
    description="This document will be permanently deleted."
    confirmLabel="Delete"
    cancelLabel="Cancel"
    loading={deleting}
    severity="danger"
  />
);
```

### Example 2: Image Upload
```tsx
const handleImageUpload = async (files: File[]) => {
  for (const file of files) {
    await uploadImage(file);
  }
};

return (
  <FileUploadButton
    onFilesSelected={handleImageUpload}
    accept="image/*"
    multiple
    maxSizeBytes={5 * 1024 * 1024} // 5MB
    buttonLabel="Upload Images"
    buttonProps={{
      variant: "primary",
      leftIcon: <ImageIcon />
    }}
    helperText="Max 5MB per image"
    onError={(error) => toast.error(error)}
  />
);
```

### Example 3: Document List
```tsx
const documents = [
  { id: 1, name: "Report.pdf", size: "2.3 MB", type: "pdf" },
  { id: 2, name: "Presentation.pptx", size: "5.1 MB", type: "pptx" }
];

return (
  <List>
    {documents.map((doc) => (
      <AttachmentListItem
        key={doc.id}
        icon={<FileText className="w-5 h-5 text-red-500" />}
        title={doc.name}
        subtitle={`${doc.size} • ${doc.type.toUpperCase()}`}
        onClick={() => handlePreview(doc)}
        actions={[
          {
            label: "Download",
            icon: <Download className="w-4 h-4" />,
            onClick: () => handleDownload(doc)
          },
          {
            label: "Share",
            icon: <Share className="w-4 h-4" />,
            onClick: () => handleShare(doc)
          },
          {
            label: "Delete",
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => handleDelete(doc),
            color: "error"
          }
        ]}
      />
    ))}
  </List>
);
```

---

## Component Locations

```
src/components/ui/
├── confirm-dialog/
│   ├── ConfirmDialog.tsx
│   └── index.ts
├── file-upload/
│   ├── FileUploadButton.tsx
│   └── index.ts
└── attachment-list-item/
    ├── AttachmentListItem.tsx
    └── index.ts
```

---

## Best Practices

### ConfirmDialog
✅ Always provide clear, concise descriptions
✅ Use appropriate severity (danger for destructive actions)
✅ Show loading state during async operations
✅ Use i18n for all labels

### FileUploadButton
✅ Set appropriate maxSizeBytes
✅ Specify accept types when possible
✅ Provide clear buttonLabel
✅ Handle onError for user feedback
✅ Show helperText for guidance

### AttachmentListItem
✅ Use color-coded icons for file types
✅ Provide meaningful subtitles (size, date, etc.)
✅ Hide actions conditionally (e.g., read-only mode)
✅ Use error color for destructive actions
✅ Make rows clickable for primary action

---

## TypeScript Types

All components are fully typed. Import types as needed:

```tsx
import type { ConfirmDialogProps } from "@/components/ui/confirm-dialog";
import type { FileUploadButtonProps } from "@/components/ui/file-upload";
import type { 
  AttachmentListItemProps, 
  AttachmentAction 
} from "@/components/ui/attachment-list-item";
```

---

## i18n Support

All components accept labels as props, making them i18n-ready:

```tsx
const t = useTranslations("common");

<ConfirmDialog
  confirmLabel={t("delete")}
  cancelLabel={t("cancel")}
  // ...
/>

<FileUploadButton
  buttonLabel={t("upload_files")}
  // ...
/>

<AttachmentListItem
  actions={[
    { label: t("preview"), ... },
    { label: t("delete"), ... }
  ]}
/>
```

---

## RTL Support

All components automatically support RTL:
- ConfirmDialog: Via Modal component
- FileUploadButton: Built-in RTL detection
- AttachmentListItem: Via MUI components

No additional configuration needed!
