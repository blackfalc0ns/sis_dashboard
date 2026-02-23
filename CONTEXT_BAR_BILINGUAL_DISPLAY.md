# عرض الأسماء الثنائية اللغة في شريط السياق

## المشكلة
كانت أسماء السنة الدراسية والفصل الدراسي تظهر دائماً بنفس اللغة (الإنجليزية) بغض النظر عن اللغة المختارة في التطبيق.

**مثال:**
- عند اختيار العربية: كان يظهر "2024-2025" و "Term 1"
- المتوقع: يجب أن يظهر "٢٠٢٤-٢٠٢٥" و "الفصل الأول"

## السبب
مكون `ContextBar` كان يستخدم حقل `name` مباشرة بدلاً من استخدام `nameAr` أو `nameEn` حسب اللغة المختارة.

```typescript
// قبل
const academicYearOptions = academicYears.map((year) => ({
  value: year.id,
  label: year.name,  // ❌ دائماً نفس القيمة
}));
```

## الحل

### 1. استيراد useLocale
```typescript
import { useTranslations, useLocale } from "next-intl";
```

### 2. الحصول على اللغة الحالية
```typescript
const locale = useLocale();
```

### 3. عرض الاسم حسب اللغة
```typescript
const academicYearOptions = academicYears.map((year) => ({
  value: year.id,
  label: locale === "ar" 
    ? (year.nameAr || year.name)  // عربي أولاً، ثم fallback
    : (year.nameEn || year.name), // إنجليزي أولاً، ثم fallback
}));

const termOptions = terms.map((term) => ({
  value: term.id,
  label: locale === "ar" 
    ? (term.nameAr || term.name) 
    : (term.nameEn || term.name),
}));
```

## النتيجة

### عند اختيار العربية (ar):
```
┌─────────────────────────────────┐
│ السنة الدراسية: ٢٠٢٤-٢٠٢٥      │
│ الفصل الدراسي: الفصل الأول      │
│ الحالة: مفتوح                   │
└─────────────────────────────────┘
```

### عند اختيار الإنجليزية (en):
```
┌─────────────────────────────────┐
│ Academic Year: 2024-2025        │
│ Term: Term 1                    │
│ Status: Open                    │
└─────────────────────────────────┘
```

## Fallback Logic

تم استخدام منطق fallback للتوافق مع البيانات القديمة:

```typescript
locale === "ar" 
  ? (year.nameAr || year.name)  // إذا لم يوجد nameAr، استخدم name
  : (year.nameEn || year.name)  // إذا لم يوجد nameEn، استخدم name
```

هذا يضمن:
1. ✅ عرض الاسم بالعربي عند اختيار العربية
2. ✅ عرض الاسم بالإنجليزي عند اختيار الإنجليزية
3. ✅ التوافق مع البيانات القديمة التي تحتوي على `name` فقط
4. ✅ لا توجد أخطاء إذا كان أحد الحقول فارغاً

## الملفات المُعدّلة
- `src/components/features/academics/components/shared/ContextBar.tsx`

## الاختبار
- [x] لا توجد أخطاء TypeScript
- [ ] اختبار يدوي: التبديل بين العربية والإنجليزية
- [ ] التحقق من عرض أسماء السنوات الدراسية بشكل صحيح
- [ ] التحقق من عرض أسماء الفصول الدراسية بشكل صحيح
- [ ] التحقق من fallback عند عدم وجود الترجمة

## التاريخ
22 فبراير 2026
