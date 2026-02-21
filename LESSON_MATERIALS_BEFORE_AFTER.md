# Lesson Materials: Before & After Comparison

## Component Replacements

### Dialogs
**Before:**
```tsx
<Dialog open={linkDialogOpen} onClose={...} maxWidth="sm" fullWidth>
  <DialogTitle>{t("add_link")}</DialogTitle>
  <DialogContent>
    <Stack spacing={2} sx={{ mt: 1 }}>
      <TextField label={...} value={...} onChange={...} />
    </Stack>
  </DialogContent>
  <DialogActions>
    <Button onClick={...}>Cancel</Button>
    <Button onClick={...} variant="contained">Add</Button>
  </DialogActions>
</Dialog>
```

**After:**
```tsx
<Modal
  isOpen={linkDialogOpen}
  onClose={...}
  title={t("add_link")}
  size="md"
  footer={
    <>
      <Button onClick={...} variant="secondary">Cancel</Button>
      <Button onClick={...} variant="primary">Add</Button>
    </>
  }
>
  <Stack spacing={3}>
    <Input label={...} value={...} onChange={...} required error={...} />
  </Stack>
</Modal>
```

### Buttons
**Before:**
```tsx
<Button
  variant="outlined"
  size="small"
  startIcon={<Upload className="w-4 h-4" />}
  onClick={...}
  disabled={uploading}
>
  {t("upload_files")}
</Button>
```

**After:**
```tsx
<Button
  variant="outline"
  size="sm"
  leftIcon={<Upload className="w-4 h-4" />}
  onClick={...}
  disabled={uploading}
>
  {t("upload_files")}
</Button>
```

### Inputs
**Before:**
```tsx
<TextField
  label={t("link_title")}
  value={linkTitle}
  onChange={(e) => setLinkTitle(e.target.value)}
  fullWidth
  required
  error={!!linkError && !linkTitle}
/>
```

**After:**
```tsx
<Input
  label={t("link_title")}
  value={linkTitle}
  onChange={(e) => setLinkTitle(e.target.value)}
  required
  error={linkErrors.title}
/>
```

### Empty State
**Before:**
```tsx
<Box
  sx={{
    py: 4,
    textAlign: "center",
    color: "text.secondary",
  }}
>
  <Typography variant="body2">{t("no_materials")}</Typography>
</Box>
```

**After:**
```tsx
<EmptyState
  icon={<FileIcon className="w-12 h-12" />}
  message={t("no_materials")}
/>
```

## UX Improvements

### List Items
**Before:**
```tsx
<ListItem
  key={attachment.id}
  sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 1 }}
>
  <ListItemIcon>{getFileIcon(attachment)}</ListItemIcon>
  <ListItemText
    primary={attachment.title}
    secondary={...}
  />
  <ListItemSecondaryAction>
    <IconButton onClick={(e) => handleMenuOpen(e, attachment)}>
      <MoreVertical />
    </IconButton>
  </ListItemSecondaryAction>
</ListItem>
```

**After:**
```tsx
<ListItem
  key={attachment.id}
  disablePadding
  sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 1, overflow: "hidden" }}
  secondaryAction={
    <IconButton edge="end" onClick={(e) => handleMenuOpen(e, attachment)} sx={{ mr: 1 }}>
      <MoreVertical className="w-4 h-4" />
    </IconButton>
  }
>
  <ListItemButton onClick={() => handleRowClick(attachment)} sx={{ py: 1.5 }}>
    <ListItemIcon sx={{ minWidth: 40 }}>
      {getFileIcon(attachment)}
    </ListItemIcon>
    <ListItemText
      primary={attachment.title}
      secondary={getSecondaryText(attachment)}
      primaryTypographyProps={{ fontWeight: 500, fontSize: "0.875rem" }}
      secondaryTypographyProps={{
        fontSize: "0.75rem",
        sx: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
      }}
    />
  </ListItemButton>
</ListItem>
```

**Key Changes:**
- ✅ Entire row is now clickable (ListItemButton)
- ✅ Better typography with font weights and sizes
- ✅ Improved secondary text formatting
- ✅ Better spacing and padding

### File Icons
**Before:**
```tsx
const getFileIcon = (attachment: LessonAttachment) => {
  if (attachment.type === "LINK") {
    return <LinkIcon className="w-5 h-5" />;
  }
  // ... no colors
  return <File className="w-5 h-5" />;
};
```

**After:**
```tsx
const getFileIcon = (attachment: LessonAttachment) => {
  if (attachment.type === "LINK") {
    return <LinkIcon className="w-5 h-5 text-blue-500" />;
  }
  const mimeType = attachment.mimeType || "";
  if (mimeType.startsWith("image/")) {
    return <ImageIcon className="w-5 h-5 text-green-500" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="w-5 h-5 text-red-500" />;
  }
  return <File className="w-5 h-5 text-gray-500" />;
};
```

**Key Changes:**
- ✅ Color-coded icons (blue=link, red=PDF, green=image, gray=file)
- ✅ Better visual distinction

### Form Validation
**Before:**
```tsx
const [linkError, setLinkError] = useState("");

const handleAddLink = async () => {
  setLinkError("");
  if (!linkTitle.trim()) {
    setLinkError(t("title_required"));
    return;
  }
  if (!linkUrl.trim()) {
    setLinkError(t("url_required"));
    return;
  }
  try {
    new URL(linkUrl);
  } catch {
    setLinkError(t("invalid_url"));
    return;
  }
  // ... save
};
```

**After:**
```tsx
const [linkErrors, setLinkErrors] = useState<Record<string, string>>({});

const validateLinkForm = (): boolean => {
  const errors: Record<string, string> = {};
  
  if (!linkTitle.trim()) {
    errors.title = t("title_required");
  }
  
  if (!linkUrl.trim()) {
    errors.url = t("url_required");
  } else {
    try {
      const url = new URL(linkUrl);
      if (!url.protocol.startsWith("http")) {
        errors.url = t("invalid_url");
      }
    } catch {
      errors.url = t("invalid_url");
    }
  }
  
  setLinkErrors(errors);
  return Object.keys(errors).length === 0;
};

const handleAddLink = async () => {
  if (!validateLinkForm()) return;
  // ... save
};
```

**Key Changes:**
- ✅ Separated validation logic
- ✅ Multiple error fields (title, url)
- ✅ Better protocol validation (requires http/https)
- ✅ Cleaner code organization

### Secondary Text
**Before:**
```tsx
secondary={
  <Stack direction="row" spacing={1} component="span">
    {attachment.fileName && (
      <Typography variant="caption" component="span">
        {attachment.fileName}
      </Typography>
    )}
    {attachment.size && (
      <Typography variant="caption" component="span">
        • {formatFileSize(attachment.size)}
      </Typography>
    )}
    {attachment.type === "LINK" && (
      <Typography variant="caption" component="span" sx={{ maxWidth: 200, ... }}>
        • {attachment.url}
      </Typography>
    )}
  </Stack>
}
```

**After:**
```tsx
const getSecondaryText = (attachment: LessonAttachment) => {
  const parts: string[] = [];
  
  if (attachment.type === "FILE") {
    if (attachment.fileName) parts.push(attachment.fileName);
    if (attachment.size) parts.push(formatFileSize(attachment.size));
  } else {
    try {
      const url = new URL(attachment.url);
      parts.push(url.hostname);
    } catch {
      parts.push(attachment.url);
    }
  }
  
  return parts.join(" • ");
};

// Usage:
secondary={getSecondaryText(attachment)}
```

**Key Changes:**
- ✅ Cleaner helper function
- ✅ Shows hostname for links (not full URL)
- ✅ Better text formatting
- ✅ More maintainable

## Code Quality Improvements

### State Management
**Before:**
```tsx
const [linkError, setLinkError] = useState("");
```

**After:**
```tsx
const [linkErrors, setLinkErrors] = useState<Record<string, string>>({});
```

### Error Handling
**Before:**
```tsx
for (const file of filesArray) {
  try {
    await uploadLessonAttachmentFile(lessonId, file);
  } catch (error) {
    showSnackbar(`${file.name}: ${tErrors("upload_failed")}`, "error");
  }
}
await loadAttachments();
showSnackbar(tSuccess("uploaded"), "success");
```

**After:**
```tsx
let hasError = false;
for (const file of filesArray) {
  try {
    await uploadLessonAttachmentFile(lessonId, file);
  } catch (error) {
    showSnackbar(`${file.name}: ${tErrors("upload_failed")}`, "error");
    hasError = true;
  }
}
await loadAttachments();
if (!hasError) {
  showSnackbar(tSuccess("uploaded"), "success");
}
```

**Key Changes:**
- ✅ Only shows success if no errors
- ✅ Better error tracking

## Summary of Changes

### Components Replaced
- ❌ MUI Dialog → ✅ Modal
- ❌ MUI Button → ✅ Button
- ❌ MUI TextField → ✅ Input
- ❌ Custom empty state → ✅ EmptyState

### UX Enhancements
- ✅ Clickable rows
- ✅ Colored icons
- ✅ Better typography
- ✅ Improved validation
- ✅ Better error handling
- ✅ Cleaner secondary text

### Code Quality
- ✅ Separated validation logic
- ✅ Better state management
- ✅ Improved error handling
- ✅ Cleaner helper functions
- ✅ Better TypeScript typing

### Maintained
- ✅ All functionality
- ✅ API integration
- ✅ RTL support
- ✅ i18n translations
- ✅ Responsive design
- ✅ Accessibility
