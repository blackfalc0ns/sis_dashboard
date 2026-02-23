# إصلاح مفاتيح الترجمة - AR != EN Validation

## المشكلة
رسالة الخطأ كانت تظهر بصيغة المفتاح `validation.validation.arEnMustDiffer` بدلاً من النص المترجم.

## السبب
الكود كان يستخدم:
```typescript
tValidation(arEnErrors.arError)  // arEnErrors.arError = "validation.arEnMustDiffer"
```

لكن `tValidation` مُعرّف بـ:
```typescript
const tValidation = useTranslations("validation");
```

هذا يعني أن المفتاح النهائي كان: `validation.validation.arEnMustDiffer` ❌

## الحل
تم تغيير الكود ليستخدم المفتاح مباشرة:
```typescript
tValidation("arEnMustDiffer")  // ✅ الآن يعمل بشكل صحيح
```

## الملفات المُعدّلة

### 1. SubjectDialog.tsx
**قبل:**
```typescript
if (arEnErrors.arError) {
  newBilingualErrors.ar = tValidation(arEnErrors.arError);
}
if (arEnErrors.enError) {
  newBilingualErrors.en = tValidation(arEnErrors.enError);
}
```

**بعد:**
```typescript
if (arEnErrors.arError) {
  newBilingualErrors.ar = tValidation("arEnMustDiffer");
}
if (arEnErrors.enError) {
  newBilingualErrors.en = tValidation("arEnMustDiffer");
}
```

### 2. YearTermDialogs.tsx
تم إصلاح نفس المشكلة في:
- دالة `validateForm` في `YearDialog`
- دالة `validateForm` في `TermDialog`

### 3. DetailsPanel.tsx
تم إصلاح نفس المشكلة في دالة `validate`

### 4. AcademicStructurePage.tsx
تم إصلاح نفس المشكلة في دالة `handleCreateItem`

### 5. CurriculumEditor.tsx
هذا الملف كان يستخدم `t("validation.arEnMustDiffer")` بشكل صحيح من البداية ✅

## النتيجة

الآن عند إدخال نفس النص في الحقلين العربي والإنجليزي، ستظهر الرسالة المترجمة:

**بالعربي:**
```
يجب أن يكون النص بالعربي مختلفاً عن النص بالإنجليزي
```

**بالإنجليزي:**
```
Arabic and English values must be different
```

## الاختبار

- [x] تم إصلاح جميع الملفات
- [x] لا توجد أخطاء TypeScript
- [ ] اختبار يدوي: التحقق من ظهور الرسالة المترجمة بشكل صحيح

## التاريخ
22 فبراير 2026
