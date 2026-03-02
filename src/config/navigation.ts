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
  UserCheck,
  FolderOpen,
  ArrowLeftRight,
  UserMinus,
  BookOpen,
  Network,
  Clock,
  Calendar,
} from "lucide-react";
import {
  mockLeads,
  mockApplications,
  mockTests,
  mockInterviews,
  mockDecisions,
} from "@/data/mockDataLinked";

interface MenuItem {
  key: string;
  label_en: string;
  label_ar: string;
  href_en: string;
  href_ar: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
  badge?: () => number; // Function to get dynamic badge count
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
    key: "admissions-registration",
    label_en: "Admissions & Registration",
    label_ar: "القبول والتسجيل",
    href_en: "/en/admissions",
    href_ar: "/ar/admissions",
    icon: UserPlus,
    children: [
      {
        key: "admissions-dashboard",
        label_en: "Over View",
        label_ar: "نظرة عامة",
        href_en: "/en/admissions",
        href_ar: "/ar/admissions",
        icon: LayoutDashboard,
      },
      {
        key: "admissions-leads",
        label_en: "Leads",
        label_ar: "الاستفسارات",
        href_en: "/en/admissions/leads",
        href_ar: "/ar/admissions/leads",
        icon: Users,
        badge: () => mockLeads.filter((lead) => lead.status === "New").length,
      },
      {
        key: "admissions-applications",
        label_en: "Applications",
        label_ar: "طلبات الالتحاق",
        href_en: "/en/admissions/applications",
        href_ar: "/ar/admissions/applications",
        icon: FileText,
        badge: () =>
          mockApplications.filter((app) => app.status === "submitted").length,
      },
      {
        key: "admissions-tests",
        label_en: "Tests",
        label_ar: "الاختبارات",
        href_en: "/en/admissions/tests",
        href_ar: "/ar/admissions/tests",
        icon: ClipboardCheck,
        badge: () =>
          mockTests.filter((test) => test.status === "scheduled").length,
      },
      {
        key: "admissions-interviews",
        label_en: "Interviews",
        label_ar: "المقابلات",
        href_en: "/en/admissions/interviews",
        href_ar: "/ar/admissions/interviews",
        icon: MessageSquare,
        badge: () =>
          mockInterviews.filter((interview) => interview.status === "scheduled")
            .length,
      },
      {
        key: "admissions-decisions",
        label_en: "Decisions",
        label_ar: "القرارات",
        href_en: "/en/admissions/decisions",
        href_ar: "/ar/admissions/decisions",
        icon: CheckCircle,
        badge: () =>
          mockDecisions.filter((decision) => decision.decision === "waitlist")
            .length,
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
        label_ar: "نظرة عامة",
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
      {
        key: "guardians-list",
        label_en: "Guardians",
        label_ar: "أولياء الأمور",
        href_en: "/en/students-guardians/guardians",
        href_ar: "/ar/students-guardians/guardians",
        icon: UserCheck,
      },
      {
        key: "documents-center",
        label_en: "Documents",
        label_ar: "المستندات",
        href_en: "/en/students-guardians/documents",
        href_ar: "/ar/students-guardians/documents",
        icon: FolderOpen,
      },
      {
        key: "transfers",
        label_en: "Transfers",
        label_ar: "التحويلات",
        href_en: "/en/students-guardians/transfers-withdrawals/transfers",
        href_ar: "/ar/students-guardians/transfers-withdrawals/transfers",
        icon: ArrowLeftRight,
        children: [
          {
            key: "transfers-overview",
            label_en: "Overview",
            label_ar: "نظرة عامة",
            href_en: "/en/students-guardians/transfers-withdrawals/transfers",
            href_ar: "/ar/students-guardians/transfers-withdrawals/transfers",
            icon: LayoutDashboard,
          },
          {
            key: "transfers-applications",
            label_en: "Applications",
            label_ar: "الطلبات",
            href_en:
              "/en/students-guardians/transfers-withdrawals/transfers/applications",
            href_ar:
              "/ar/students-guardians/transfers-withdrawals/transfers/applications",
            icon: FileText,
          },
        ],
      },
      {
        key: "withdrawals",
        label_en: "Withdrawals",
        label_ar: "الانسحابات",
        href_en: "/en/students-guardians/transfers-withdrawals/withdrawals",
        href_ar: "/ar/students-guardians/transfers-withdrawals/withdrawals",
        icon: UserMinus,
        children: [
          {
            key: "withdrawals-overview",
            label_en: "Overview",
            label_ar: "نظرة عامة",
            href_en: "/en/students-guardians/transfers-withdrawals/withdrawals",
            href_ar: "/ar/students-guardians/transfers-withdrawals/withdrawals",
            icon: LayoutDashboard,
          },
          {
            key: "withdrawals-applications",
            label_en: "Applications",
            label_ar: "الطلبات",
            href_en:
              "/en/students-guardians/transfers-withdrawals/withdrawals/applications",
            href_ar:
              "/ar/students-guardians/transfers-withdrawals/withdrawals/applications",
            icon: FileText,
          },
        ],
      },
    ],
  },
  {
    key: "academics",
    label_en: "Academics",
    label_ar: "الأكاديميات",
    href_en: "/en/academics/structure",
    href_ar: "/ar/academics/structure",
    icon: BookOpen,
    children: [
      {
        key: "academics-structure",
        label_en: "Academic Structure",
        label_ar: "الهيكل الأكاديمي",
        href_en: "/en/academics/structure",
        href_ar: "/ar/academics/structure",
        icon: Network,
      },
      {
        key: "academics-subjects",
        label_en: "Subjects & Allocation",
        label_ar: "المواد وتوزيعها",
        href_en: "/en/academics/subjects",
        href_ar: "/ar/academics/subjects",
        icon: BookOpen,
      },
      {
        key: "academics-curriculum",
        label_en: "Curriculum",
        label_ar: "المنهج",
        href_en: "/en/academics/curriculum",
        href_ar: "/ar/academics/curriculum",
        icon: FileText,
      },
      {
        key: "academics-calendar",
        label_en: "Academic Calendar",
        label_ar: "التقويم الأكاديمي",
        href_en: "/en/academics/calendar",
        href_ar: "/ar/academics/calendar",
        icon: ClipboardCheck,
      },
      {
        key: "academics-timetable",
        label_en: "Time Table",
        label_ar: "الجدول",
        href_en: "/en/academics/timetable",
        href_ar: "/ar/academics/timetable",
        icon: Clock,
      },
      {
        key: "academics-lesson-plans",
        label_en: "Lesson Plans",
        label_ar: "خطة الدروس",
        href_en: "/en/academics/lesson-plans",
        href_ar: "/ar/academics/lesson-plans",
        icon: Calendar,
      },
      {
        key: "academics-teacher-allocation",
        label_en: "Teacher Allocation",
        label_ar: "توزيع المعلمين",
        href_en: "/en/academics/teacher-allocation",
        href_ar: "/ar/academics/teacher-allocation",
        icon: UserCheck,
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
