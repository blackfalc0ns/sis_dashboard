# Lesson Video & Assignments Implementation Status

## ✅ COMPLETED

### 1. TypeScript Types
**File**: `src/services/academics/curriculumService.ts`
- ✅ Added `LessonVideo` interface
- ✅ Added `Assignment` interface  
- ✅ Added `AssignmentAttachment` interface

### 2. API Services
**File**: `src/services/academics/curriculumService.ts`
- ✅ Video API functions (fetch, upsert link, upload, delete)
- ✅ Assignment API functions (fetch, create, update, delete)
- ✅ Assignment attachment API functions (fetch, upload, create link, delete)

### 3. Translations
**Files**: `src/messages/en.json`, `src/messages/ar.json`
- ✅ Added `academics.curriculum.video.*` keys
- ✅ Added `academics.curriculum.assignments.*` keys
- ✅ All UI text translated (EN/AR)

### 4. LessonVideo Component
**File**: `src/components/features/academics/components/curriculum/LessonVideo.tsx`
- ✅ Mode switch (Upload/Link)
- ✅ Bilingual title fields with AR != EN validation
- ✅ URL input with validation (http/https)
- ✅ File upload with FileUploadButton
- ✅ Preview modal with video player/iframe
- ✅ YouTube/Vimeo embed support
- ✅ Delete confirmation
- ✅ Read-only mode support
- ✅ Loading states

---

## 🚧 REMAINING WORK

### 5. AssignmentDialog Component
**File to create**: `src/components/features/academics/components/curriculum/AssignmentDialog.tsx`

**Implementation needed**:
```typescript
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { validateArEnDifferent } from "@/utils/validation/bilingualValidation";
import { Assignment } from "@/services/academics/curriculumService";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

interface AssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignment: Partial<Assignment>) => Promise<void>;
  assignment?: Assignment | null;
  isReadOnly: boolean;
}

export default function AssignmentDialog({
  isOpen,
  onClose,
  onSave,
  assignment,
  isReadOnly,
}: AssignmentDialogProps) {
  const t = useTranslations("academics.curriculum.assignments");
  const tValidation = useTranslations("validation");

  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [maxScore, setMaxScore] = useState<number | "">("");
  const [errors, setErrors] = useState<{ ar?: string; en?: string; maxScore?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (assignment) {
        setTitleAr(assignment.titleAr);
        setTitleEn(assignment.titleEn);
        setDescriptionAr(assignment.descriptionAr || "");
        setDescriptionEn(assignment.descriptionEn || "");
        setDueDate(assignment.dueDate ? dayjs(assignment.dueDate) : null);
        setMaxScore(assignment.maxScore ?? "");
      } else {
        setTitleAr("");
        setTitleEn("");
        setDescriptionAr("");
        setDescriptionEn("");
        setDueDate(null);
        setMaxScore("");
      }
      setErrors({});
    }
  }, [isOpen, assignment]);

  const validate = (): boolean => {
    const newErrors: { ar?: string; en?: string; maxScore?: string } = {};

    if (!titleAr.trim()) newErrors.ar = tValidation("required_ar");
    if (!titleEn.trim()) newErrors.en = tValidation("required_en");

    if (titleAr.trim() && titleEn.trim()) {
      const arEnErrors = validateArEnDifferent(titleAr, titleEn);
      if (arEnErrors.arError) newErrors.ar = tValidation("arEnMustDiffer");
      if (arEnErrors.enError) newErrors.en = tValidation("arEnMustDiffer");
    }

    // Description AR != EN only if both provided
    if (descriptionAr.trim() && descriptionEn.trim()) {
      const descArEnErrors = validateArEnDifferent(descriptionAr, descriptionEn);
      if (descArEnErrors.arError || descArEnErrors.enError) {
        // Show error on title fields as description doesn't have error display
        newErrors.ar = newErrors.ar || tValidation("arEnMustDiffer");
      }
    }

    if (maxScore !== "" && (Number(maxScore) < 0 || isNaN(Number(maxScore)))) {
      newErrors.maxScore = t("max_score_invalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave({
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
        descriptionAr: descriptionAr.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        dueDate: dueDate?.toISOString(),
        maxScore: maxScore !== "" ? Number(maxScore) : undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save assignment:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assignment ? t("edit_assignment") : t("add_assignment")}
      size="md"
      footer={
        <>
          <Button onClick={onClose} variant="secondary" disabled={isSaving}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} variant="primary" disabled={isReadOnly || isSaving}>
            {isSaving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <BilingualTextField
          label={t("assignment_title")}
          value={{ ar: titleAr, en: titleEn }}
          onChange={(value) => {
            setTitleAr(value.ar);
            setTitleEn(value.en);
            setErrors({});
          }}
          requiredAr
          requiredEn
          errors={errors}
          disabled={isReadOnly}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("description")} (عربي)
            </label>
            <TextArea
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              disabled={isReadOnly}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("description")} (English)
            </label>
            <TextArea
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              disabled={isReadOnly}
              rows={3}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={t("due_date")}
              value={dueDate}
              onChange={(newValue) => setDueDate(newValue)}
              disabled={isReadOnly}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />
          </LocalizationProvider>

          <Input
            label={t("max_score")}
            type="number"
            value={maxScore}
            onChange={(e) => {
              setMaxScore(e.target.value === "" ? "" : Number(e.target.value));
              setErrors({ ...errors, maxScore: undefined });
            }}
            error={errors.maxScore}
            disabled={isReadOnly}
            min={0}
          />
        </div>
      </div>
    </Modal>
  );
}
```

### 6. LessonAssignments Component
**File to create**: `src/components/features/academics/components/curriculum/LessonAssignments.tsx`

**Key features needed**:
- List assignments with title, due date, max score
- Add/Edit/Delete actions
- Expandable attachments per assignment (reuse LessonMaterials pattern)
- Empty state
- Read-only mode

**Pattern to follow**: Look at `LessonMaterials.tsx` for structure

### 7. Integration into CurriculumEditor
**File to update**: `src/components/features/academics/components/curriculum/CurriculumEditor.tsx`

**Add after LessonMaterials section** (around line 390):
```tsx
{/* Lesson Video Section - Only for existing lessons */}
{selectedNode.type === "lesson" && !isNew && (
  <LessonVideo lessonId={selectedNode.id} isReadOnly={isReadOnly} />
)}

{/* Lesson Assignments Section - Only for existing lessons */}
{selectedNode.type === "lesson" && !isNew && (
  <LessonAssignments lessonId={selectedNode.id} isReadOnly={isReadOnly} />
)}
```

**Add imports**:
```typescript
import LessonVideo from './LessonVideo';
import LessonAssignments from './LessonAssignments';
```

---

## 📊 PROGRESS

- [x] Types & Interfaces (100%)
- [x] API Services (100%)
- [x] Translations (100%)
- [x] LessonVideo Component (100%)
- [ ] AssignmentDialog Component (0% - code provided above)
- [ ] LessonAssignments Component (0% - needs implementation)
- [ ] Integration (0% - simple import + render)

**Overall Progress**: ~60%

---

## 🎯 NEXT STEPS

1. Create `AssignmentDialog.tsx` using code above
2. Create `LessonAssignments.tsx` following LessonMaterials pattern
3. Add imports and render in `CurriculumEditor.tsx`
4. Test all features
5. Replace mock API with real endpoints

---

## 📝 NOTES

- All mock API functions use localStorage
- Replace with real API calls when backend is ready
- Video upload uses `URL.createObjectURL()` for preview (mock)
- Real implementation should use multipart/form-data
- MUI DatePicker is already configured in the project
- All components support RTL and bilingual display

