import {
  Home,
  Users,
  HelpCircle,
  Settings,
  UserPlus,
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  MessageSquare,
  CheckCircle,
  GraduationCap,
} from "lucide-react";

interface MenuItem {
  key: string;
  label_en: string;
  label_ar: string;
  href_en: string;
  href_ar: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    key: "dashboard",
    label_en: "Dashboard",
    label_ar: "لوحة المراقبة",
    href_en: "/en/dashboard",
    href_ar: "/ar/dashboard",
    icon: Home,
  },
  {
    key: "students-guardians",
    label_en: "Students & Guardians",
    label_ar: "الطلاب وأولياء الأمور",
    href_en: "/en/students-guardians",
    href_ar: "/ar/students-guardians",
    icon: GraduationCap,
    children: [
      {
        key: "students-guardians-dashboard",
        label_en: "Overview",
        label_ar: "لوحة التحكم",
        href_en: "/en/students-guardians",
        href_ar: "/ar/students-guardians",
        icon: LayoutDashboard,
      },
      {
        key: "students-list",
        label_en: "Students",
        label_ar: "الطلاب",
        href_en: "/en/students-guardians/students",
        href_ar: "/ar/students-guardians/students",
        icon: Users,
      },
    ],
  },
  {
    key: "admissions",
    label_en: "Admissions",
    label_ar: "القبول",
    href_en: "/en/admissions",
    href_ar: "/ar/admissions",
    icon: UserPlus,
    children: [
      {
        key: "admissions-dashboard",
        label_en: "Over View",
        label_ar: "لوحة التحكم",
        href_en: "/en/admissions",
        href_ar: "/ar/admissions",
        icon: LayoutDashboard,
      },
      {
        key: "admissions-leads",
        label_en: "Leads",
        label_ar: "العملاء المحتملون",
        href_en: "/en/admissions/leads",
        href_ar: "/ar/admissions/leads",
        icon: Users,
      },
      {
        key: "admissions-applications",
        label_en: "Applications",
        label_ar: "الطلبات",
        href_en: "/en/admissions/applications",
        href_ar: "/ar/admissions/applications",
        icon: FileText,
      },
      {
        key: "admissions-tests",
        label_en: "Tests",
        label_ar: "الاختبارات",
        href_en: "/en/admissions/tests",
        href_ar: "/ar/admissions/tests",
        icon: ClipboardCheck,
      },
      {
        key: "admissions-interviews",
        label_en: "Interviews",
        label_ar: "المقابلات",
        href_en: "/en/admissions/interviews",
        href_ar: "/ar/admissions/interviews",
        icon: MessageSquare,
      },
      {
        key: "admissions-decisions",
        label_en: "Decisions",
        label_ar: "القرارات",
        href_en: "/en/admissions/decisions",
        href_ar: "/ar/admissions/decisions",
        icon: CheckCircle,
      },
      {
        key: "admissions-enrollment",
        label_en: "Enrollment",
        label_ar: "التسجيل",
        href_en: "/en/admissions/enrollment",
        href_ar: "/ar/admissions/enrollment",
        icon: GraduationCap,
      },
    ],
  },
];

export const bottomItems = [
  {
    key: "help",
    label_en: "Get Help",
    label_ar: "المساعدة",
    href_en: "/en/dashboard/help",
    href_ar: "/ar/dashboard/help",
    icon: HelpCircle,
  },
  {
    key: "settings",
    label_en: "Settings",
    label_ar: "ألاعدادات",
    href_en: "/en/dashboard/settings",
    href_ar: "/ar/dashboard/settings",
    icon: Settings,
  },
];
