# Subjects Allocation - Unsaved Changes Guard Implementation

## Overview
تم تطبيق نظام حماية التغييرات غير المحفوظة في صفحة Subjects Allocation بنجاح.

## التغييرات المطبقة

### 1. استيراد Hook الحماية
```tsx
import { useDirtyKey } from "@/hooks/useDirtyKey";
```

### 2. تهيئة Hook
```tsx
const { markDirty, clearDirty } = useDirtyKey("subjects-allocation");
```

### 3. إزالة النظام القديم
تم إزالة:
- `hasUnsavedChanges` state
- استخدام `confirm()` المباشر
- الفحوصات اليدوية في `handleAcademicYearChange`, `handleTermChange`, `handleTabChange`

### 4. تطبيق النظام الجديد

#### عند تغيير التخصيصات
```tsx
const handleAllocationsChange = useCallback((newAllocations: SubjectAllocation[]) => {
  setAllocations(newAllocations);
  markDirty(); // Mark as dirty when allocations change
}, [markDirty]);
```

#### عند تغيير حالة Dirty من AllocationMatrix
```tsx
const handleDirtyChange = useCallback((isDirty: boolean) => {
  if (isDirty) {
    markDirty();
  } else {
    clearDirty();
  }
}, [markDirty, clearDirty]);
```

#### بعد تحديث البيانات
```tsx
const refreshData = async () => {
  // ... fetch data
  clearDirty(); // Clear dirty state after refresh
};
```

#### بعد Carry Over ناجح
```tsx
const handleCarryOverSuccess = async () => {
  await refreshData();
  setShowCarryOverDialog(false);
  clearDirty(); // Clear dirty state after successful carry over
};
```

## كيفية العمل

### سيناريو 1: تغيير التخصيصات
1. المستخدم يقوم بتعيين مادة لصف/شعبة
2. يتم استدعاء `handleAllocationsChange`
3. يتم وضع علامة dirty على الصفحة
4. عند محاولة التنقل، يظهر dialog التأكيد

### سيناريو 2: حفظ التغييرات
1. المستخدم يضغط Save في AllocationMatrix
2. يتم حفظ البيانات
3. يتم استدعاء `refreshData`
4. يتم مسح علامة dirty
5. التنقل يصبح حراً بدون تأكيد

### سيناريو 3: Carry Over
1. المستخدم ينفذ carry over من ترم سابق
2. بعد النجاح، يتم استدعاء `handleCarryOverSuccess`
3. يتم تحديث البيانات ومسح علامة dirty

### سيناريو 4: تغيير السنة/الترم
1. المستخدم يختار سنة أو ترم مختلف
2. إذا كانت هناك تغييرات غير محفوظة، يظهر dialog
3. "Stay" → البقاء في الصفحة الحالية
4. "Leave" → الانتقال للسنة/الترم الجديد

## الفوائد

### 1. تجربة مستخدم محسنة
- Dialog موحد عبر كل التطبيق
- رسائل مترجمة (EN/AR)
- دعم RTL كامل

### 2. حماية أفضل
- حماية من التنقل عبر Sidebar
- حماية من التنقل عبر Tabs
- حماية من تحديث المتصفح (F5)
- حماية من إغلاق التبويب

### 3. كود أنظف
- إزالة الكود المكرر
- استخدام نظام مركزي
- سهولة الصيانة

## اختبار الوظيفة

### Test Case 1: تغيير التخصيصات
1. افتح صفحة Subjects Allocation
2. قم بتعيين مادة لصف
3. اضغط على أي رابط في Sidebar
4. **المتوقع:** ظهور dialog التأكيد
5. اضغط "Stay"
6. **المتوقع:** البقاء في الصفحة

### Test Case 2: حفظ التغييرات
1. قم بتغيير التخصيصات
2. اضغط Save
3. اضغط على أي رابط في Sidebar
4. **المتوقع:** الانتقال مباشرة بدون dialog

### Test Case 3: تغيير الترم
1. قم بتغيير التخصيصات
2. غير الترم من Context Bar
3. **المتوقع:** ظهور dialog التأكيد
4. اضغط "Leave"
5. **المتوقع:** تحميل بيانات الترم الجديد

### Test Case 4: Carry Over
1. قم بتغيير التخصيصات
2. نفذ Carry Over من ترم سابق
3. **المتوقع:** بعد النجاح، يتم مسح dirty state
4. التنقل يصبح حراً

### Test Case 5: تحديث المتصفح
1. قم بتغيير التخصيصات
2. اضغط F5 أو Ctrl+R
3. **المتوقع:** المتصفح يعرض تأكيد "Leave site?"

### Test Case 6: Mobile Tabs
1. على الموبايل، قم بتغيير التخصيصات في Matrix
2. اضغط على تبويب Subjects
3. **المتوقع:** الانتقال مباشرة (لا يوجد حماية بين التبويبات المحلية)

## الملفات المعدلة

1. `src/components/features/academics/components/pages/SubjectsAllocationPage.tsx`
   - إضافة `useDirtyKey` hook
   - إزالة `hasUnsavedChanges` state
   - إزالة استخدام `confirm()` المباشر
   - إضافة `handleAllocationsChange` و `handleDirtyChange`
   - تحديث `refreshData` و `handleCarryOverSuccess`

## ملاحظات تقنية

### التكامل مع AllocationMatrix
يستقبل `AllocationMatrix` دالتين:
- `onAllocationsChange`: تُستدعى عند تغيير التخصيصات
- `onDirtyChange`: تُستدعى عند تغيير حالة dirty

هذا يسمح للـ Matrix بالتحكم في متى يتم وضع علامة dirty بدقة.

### Auto-cleanup
عند unmount الصفحة، يقوم `useDirtyKey` تلقائياً بمسح علامة dirty لتجنب الحالات القديمة.

### Feature Key
تم استخدام `"subjects-allocation"` كمفتاح فريد لهذه الصفحة.

## الحالة
✅ تم التطبيق بنجاح
✅ لا توجد أخطاء TypeScript
✅ متوافق مع النظام العام للحماية
✅ جاهز للاختبار
