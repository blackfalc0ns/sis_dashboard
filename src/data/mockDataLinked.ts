// FILE: src/data/mockDataLinked.ts
// Comprehensive linked mock data following the complete admission cycle
// Lead → Application → Test → Interview → Decision → Enrollment → Student

import type {
  Lead,
  Application,
  Test,
  Interview,
  Decision,
} from "@/types/admissions";
import type {
  Student,
  StudentGuardian,
  StudentGuardianLink,
  StudentDocument,
  StudentMedicalProfile,
  StudentNote,
  StudentTimelineEvent,
} from "@/types/students";
import { seededNumber, seededPick } from "@/utils/seeded";

// ============================================================================
// STEP 1: LEADS (Initial Inquiries)
// ============================================================================

export const mockLeads: Lead[] = [
  {
    id: "L001",
    name: "Hassan Ahmed", // Guardian/Parent name
    phone: "+971-50-123-4567",
    email: "hassan.ahmed@email.com",
    channel: "Walk-in",
    status: "Converted",
    createdAt: "2026-01-05",
    gradeInterest: "Grade 6",
    source: "walk_in",
    studentName: "Ahmed Hassan",
    studentNameArabic: "أحمد حسن",
  },
  {
    id: "L002",
    name: "Mohammed Ali",
    phone: "+971-50-234-5678",
    email: "mohammed.ali@email.com",
    channel: "Referral",
    status: "Contacted",
    createdAt: "2026-01-08",
    gradeInterest: "Grade 7",
    source: "referral",
    studentName: "Sara Mohammed",
    studentNameArabic: "سارة محمد",
  },
  {
    id: "L003",
    name: "Abdullah Omar",
    phone: "+971-50-345-6789",
    email: "abdullah.omar@email.com",
    channel: "In-app",
    status: "Contacted",
    createdAt: "2026-01-10",
    gradeInterest: "Grade 8",
    source: "in_app",
    studentName: "Omar Abdullah",
    studentNameArabic: "عمر عبدالله",
  },
  {
    id: "L004",
    name: "Khalid Ibrahim",
    phone: "+971-50-456-7890",
    email: "khalid.ibrahim@email.com",
    channel: "Walk-in",
    status: "New",
    createdAt: "2026-02-01",
    gradeInterest: "Grade 9",
    source: "walk_in",
    studentName: "Fatima Khalid",
    studentNameArabic: "فاطمة خالد",
  },
  {
    id: "L005",
    name: "Fatima Al-Zaabi",
    phone: "+971-50-567-8901",
    email: "fatima.alzaabi@email.com",
    channel: "Referral",
    status: "Closed",
    createdAt: "2025-12-15",
    gradeInterest: "Grade 10",
    source: "referral",
    studentName: "Zayed Fatima",
    studentNameArabic: "زايد فاطمة",
  },
  {
    id: "L006",
    name: "Salem Hassan",
    phone: "+971-50-678-9012",
    email: "salem.hassan@email.com",
    channel: "In-app",
    status: "Contacted",
    createdAt: "2026-01-28",
    gradeInterest: "Grade 6",
    source: "in_app",
    studentName: "Layla Salem",
    studentNameArabic: "ليلى سالم",
  },
  {
    id: "L007",
    name: "Mariam Khalid",
    phone: "+971-50-789-0123",
    email: "mariam.khalid@email.com",
    channel: "Walk-in",
    status: "Contacted",
    createdAt: "2026-01-20",
    gradeInterest: "Grade 7",
    source: "walk_in",
    studentName: "Noura Mariam",
    studentNameArabic: "نورة مريم",
  },
  {
    id: "L008",
    name: "Ahmed Rashid",
    phone: "+971-50-890-1234",
    email: "ahmed.rashid@email.com",
    channel: "Other",
    status: "New",
    createdAt: "2026-02-10",
    gradeInterest: "Grade 8",
    source: "other",
    studentName: "Hamza Ahmed",
    studentNameArabic: "حمزة أحمد",
  },
];

// ============================================================================
// STEP 2: APPLICATIONS (Formal Applications from Leads)
// ============================================================================

export const mockApplications: Application[] = [
  {
    id: "APP-2024-001",
    leadId: "L001", // Linked to lead
    source: "walk_in",

    // Student Information
    full_name_ar: "أحمد حسن",
    full_name_en: "Ahmed Hassan",
    studentName: "Ahmed Hassan",
    studentNameArabic: "أحمد حسن",
    gender: "Male",
    date_of_birth: "2014-05-15",
    dateOfBirth: "2014-05-15",
    nationality: "UAE",

    // Contact
    address_line: "Al Wasl Road, Villa 45",
    city: "Dubai",
    district: "Jumeirah",
    student_phone: "",
    student_email: "",

    // Academic
    grade_requested: "Grade 6",
    gradeRequested: "Grade 6",
    previous_school: "Dubai International School",
    previousSchool: "Dubai International School",
    join_date: "2026-09-01",

    // Medical
    medical_conditions: "None",
    notes: "Excellent student, interested in STEM",

    // Guardians
    guardians: [
      {
        id: "G001",
        full_name: "Hassan Ahmed",
        relation: "father",
        phone_primary: "+971-50-123-4567",
        phone_secondary: "+971-4-123-4567",
        email: "hassan.ahmed@email.com",
        national_id: "784-1990-1234567-1",
        job_title: "Engineer",
        workplace: "Emirates Engineering",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
      {
        id: "G002",
        full_name: "Aisha Hassan",
        relation: "mother",
        phone_primary: "+971-50-123-4568",
        phone_secondary: "",
        email: "aisha.hassan@email.com",
        national_id: "784-1992-1234568-2",
        job_title: "Doctor",
        workplace: "Dubai Hospital",
        is_primary: false,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Hassan Ahmed",
    guardianPhone: "+971-50-123-4567",
    guardianEmail: "hassan.ahmed@email.com",

    // Status
    status: "accepted", // Will become student
    submittedDate: "2026-01-10",

    // Related Data
    tests: [],
    interviews: [],

    // Documents
    documents: [
      {
        id: "DOC-001-001",
        type: "Birth Certificate",
        name: "birth_certificate_ahmed.pdf",
        status: "complete",
        uploadedDate: "2026-01-10",
      },
      {
        id: "DOC-001-002",
        type: "Passport",
        name: "passport_ahmed.pdf",
        status: "complete",
        uploadedDate: "2026-01-10",
      },
      {
        id: "DOC-001-003",
        type: "Previous School Records",
        name: "school_records_ahmed.pdf",
        status: "complete",
        uploadedDate: "2026-01-12",
      },
      {
        id: "DOC-001-004",
        type: "Medical Records",
        name: "medical_ahmed.pdf",
        status: "complete",
        uploadedDate: "2026-01-15",
      },
    ],
  },
  {
    id: "APP-2026-004",
    leadId: "L006",
    source: "in_app",

    full_name_ar: "ليلى سالم",
    full_name_en: "Layla Salem",
    studentName: "Layla Salem",
    studentNameArabic: "ليلى سالم",
    gender: "Female",
    date_of_birth: "2014-04-10",
    dateOfBirth: "2014-04-10",
    nationality: "UAE",

    address_line: "Marina Walk, Tower 15",
    city: "Dubai",
    district: "Dubai Marina",
    student_phone: "",
    student_email: "",

    grade_requested: "Grade 6",
    gradeRequested: "Grade 6",
    previous_school: "Al Noor International School",
    previousSchool: "Al Noor International School",
    join_date: "2026-09-01",

    medical_conditions: "None",
    notes: "Interested in bilingual program",

    guardians: [
      {
        id: "G020",
        full_name: "Salem Hassan",
        relation: "father",
        phone_primary: "+971-50-678-9012",
        phone_secondary: "+971-4-678-9012",
        email: "salem.hassan@email.com",
        national_id: "784-1989-6789012-1",
        job_title: "Businessman",
        workplace: "Salem Trading LLC",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Salem Hassan",
    guardianPhone: "+971-50-678-9012",
    guardianEmail: "salem.hassan@email.com",

    status: "submitted",
    submittedDate: "2026-02-12",

    tests: [],
    interviews: [],

    documents: [
      {
        id: "DOC-004-001",
        type: "Birth Certificate",
        name: "birth_certificate_layla.pdf",
        status: "complete",
        uploadedDate: "2026-02-12",
      },
      {
        id: "DOC-004-002",
        type: "Passport",
        name: "passport_layla.pdf",
        status: "complete",
        uploadedDate: "2026-02-12",
      },
    ],
  },
  {
    id: "APP-2026-005",
    leadId: "L007",
    source: "referral",

    full_name_ar: "نورة مريم",
    full_name_en: "Noura Mariam",
    studentName: "Noura Mariam",
    studentNameArabic: "نورة مريم",
    gender: "Female",
    date_of_birth: "2013-09-18",
    dateOfBirth: "2013-09-18",
    nationality: "UAE",

    address_line: "Jumeirah Beach Road, Villa 88",
    city: "Dubai",
    district: "Jumeirah",
    student_phone: "",
    student_email: "",

    grade_requested: "Grade 7",
    gradeRequested: "Grade 7",
    previous_school: "Dubai British School",
    previousSchool: "Dubai British School",
    join_date: "2026-09-01",

    medical_conditions: "None",
    notes: "Strong academic record, parent discussing payment plans",

    guardians: [
      {
        id: "G021",
        full_name: "Mariam Khalid",
        relation: "mother",
        phone_primary: "+971-50-789-0123",
        phone_secondary: "",
        email: "mariam.khalid@email.com",
        national_id: "784-1988-7890123-2",
        job_title: "Doctor",
        workplace: "Dubai Medical Center",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Mariam Khalid",
    guardianPhone: "+971-50-789-0123",
    guardianEmail: "mariam.khalid@email.com",

    status: "under_review",
    submittedDate: "2026-02-10",

    tests: [],
    interviews: [],

    documents: [
      {
        id: "DOC-005-001",
        type: "Birth Certificate",
        name: "birth_certificate_noura.pdf",
        status: "complete",
        uploadedDate: "2026-02-10",
      },
      {
        id: "DOC-005-002",
        type: "Passport",
        name: "passport_noura.pdf",
        status: "complete",
        uploadedDate: "2026-02-10",
      },
      {
        id: "DOC-005-003",
        type: "Previous School Records",
        name: "school_records_noura.pdf",
        status: "complete",
        uploadedDate: "2026-02-11",
      },
    ],
  },
  {
    id: "APP-2024-002",
    leadId: "L002",
    source: "referral",

    full_name_ar: "سارة محمد",
    full_name_en: "Sara Mohammed",
    studentName: "Sara Mohammed",
    studentNameArabic: "سارة محمد",
    gender: "Female",
    date_of_birth: "2013-08-22",
    dateOfBirth: "2013-08-22",
    nationality: "UAE",

    address_line: "Sheikh Zayed Road, Apt 302",
    city: "Dubai",
    district: "Business Bay",
    student_phone: "",
    student_email: "",

    grade_requested: "Grade 7",
    gradeRequested: "Grade 7",
    previous_school: "Al Noor School",
    previousSchool: "Al Noor School",
    join_date: "2026-09-01",

    medical_conditions: "Mild asthma",
    notes: "Strong in mathematics and science",

    guardians: [
      {
        id: "G003",
        full_name: "Mohammed Ali",
        relation: "father",
        phone_primary: "+971-50-234-5678",
        phone_secondary: "+971-4-234-5678",
        email: "mohammed.ali@email.com",
        national_id: "784-1988-2345678-3",
        job_title: "Business Owner",
        workplace: "Ali Trading LLC",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
      {
        id: "G004",
        full_name: "Mariam Mohammed",
        relation: "mother",
        phone_primary: "+971-50-234-5679",
        phone_secondary: "",
        email: "mariam.mohammed@email.com",
        national_id: "784-1990-2345679-4",
        job_title: "Teacher",
        workplace: "Dubai International School",
        is_primary: false,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Mohammed Ali",
    guardianPhone: "+971-50-234-5678",
    guardianEmail: "mohammed.ali@email.com",

    status: "accepted",
    submittedDate: "2026-01-12",

    tests: [],
    interviews: [],

    documents: [
      {
        id: "DOC-002-001",
        type: "Birth Certificate",
        name: "birth_certificate_sara.pdf",
        status: "complete",
        uploadedDate: "2026-01-12",
      },
      {
        id: "DOC-002-002",
        type: "Passport",
        name: "passport_sara.pdf",
        status: "complete",
        uploadedDate: "2026-01-12",
      },
      {
        id: "DOC-002-003",
        type: "Previous School Records",
        name: "school_records_sara.pdf",
        status: "complete",
        uploadedDate: "2026-01-14",
      },
      {
        id: "DOC-002-004",
        type: "Medical Records",
        name: "medical_sara.pdf",
        status: "complete",
        uploadedDate: "2026-01-16",
      },
    ],
  },
  {
    id: "APP-2024-003",
    leadId: "L003",
    source: "in_app",

    full_name_ar: "عمر عبدالله",
    full_name_en: "Omar Abdullah",
    studentName: "Omar Abdullah",
    studentNameArabic: "عمر عبدالله",
    gender: "Male",
    date_of_birth: "2012-11-30",
    dateOfBirth: "2012-11-30",
    nationality: "UAE",

    address_line: "Palm Jumeirah, Villa 78",
    city: "Dubai",
    district: "Palm Jumeirah",
    student_phone: "",
    student_email: "",

    grade_requested: "Grade 8",
    gradeRequested: "Grade 8",
    previous_school: "Emirates International School",
    previousSchool: "Emirates International School",
    join_date: "2026-09-01",

    medical_conditions: "None",
    notes: "Excellent Arabic language skills",

    guardians: [
      {
        id: "G005",
        full_name: "Abdullah Omar",
        relation: "father",
        phone_primary: "+971-50-345-6789",
        phone_secondary: "+971-4-345-6789",
        email: "abdullah.omar@email.com",
        national_id: "784-1985-3456789-5",
        job_title: "Lawyer",
        workplace: "Omar Legal Consultancy",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
      {
        id: "G006",
        full_name: "Layla Abdullah",
        relation: "mother",
        phone_primary: "+971-50-345-6790",
        phone_secondary: "",
        email: "layla.abdullah@email.com",
        national_id: "784-1987-3456790-6",
        job_title: "Architect",
        workplace: "Dubai Design Studio",
        is_primary: false,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Abdullah Omar",
    guardianPhone: "+971-50-345-6789",
    guardianEmail: "abdullah.omar@email.com",

    status: "accepted",
    submittedDate: "2026-01-15",

    tests: [],
    interviews: [],

    documents: [
      {
        id: "DOC-003-001",
        type: "Birth Certificate",
        name: "birth_certificate_omar.pdf",
        status: "complete",
        uploadedDate: "2026-01-15",
      },
      {
        id: "DOC-003-002",
        type: "Passport",
        name: "passport_omar.pdf",
        status: "complete",
        uploadedDate: "2026-01-15",
      },
      {
        id: "DOC-003-003",
        type: "Previous School Records",
        name: "school_records_omar.pdf",
        status: "complete",
        uploadedDate: "2026-01-17",
      },
      {
        id: "DOC-003-004",
        type: "Medical Records",
        name: "medical_omar.pdf",
        status: "complete",
        uploadedDate: "2026-01-18",
      },
    ],
  },
];

// ============================================================================
// STEP 3: TESTS (Placement/Entrance Tests)
// ============================================================================

export const mockTests: Test[] = [
  {
    id: "TEST-001",
    applicationId: "APP-2024-001",
    type: "Placement Test",
    subject: "General",
    date: "2026-01-20",
    time: "09:00 AM",
    location: "Main Campus - Room 101",
    proctor: "Dr. Sarah Johnson",
    status: "completed",
    score: 85,
    maxScore: 100,
    notes: "Strong performance in mathematics and science",
  },
  {
    id: "TEST-002",
    applicationId: "APP-2024-002",
    type: "Placement Test",
    subject: "General",
    date: "2026-01-22",
    time: "10:00 AM",
    location: "Main Campus - Room 102",
    proctor: "Mr. Ahmed Al-Mansoori",
    status: "completed",
    score: 92,
    maxScore: 100,
    notes: "Excellent overall performance",
  },
  {
    id: "TEST-003",
    applicationId: "APP-2024-003",
    type: "Placement Test",
    subject: "General",
    date: "2026-01-25",
    time: "09:00 AM",
    location: "Main Campus - Room 101",
    proctor: "Ms. Fatima Al-Zaabi",
    status: "completed",
    score: 88,
    maxScore: 100,
    notes: "Outstanding Arabic language skills",
  },
  {
    id: "TEST-004",
    applicationId: "APP-2026-004",
    type: "Placement Test",
    subject: "General",
    date: "2026-02-18",
    time: "10:00 AM",
    location: "Main Campus - Room 101",
    proctor: "Dr. Sarah Johnson",
    status: "scheduled",
    notes: "Scheduled for Layla Salem - Grade 6",
  },
  {
    id: "TEST-005",
    applicationId: "APP-2026-005",
    type: "Placement Test",
    subject: "General",
    date: "2026-02-20",
    time: "09:00 AM",
    location: "Main Campus - Room 102",
    proctor: "Mr. Ahmed Al-Mansoori",
    status: "scheduled",
    notes: "Scheduled for Noura Mariam - Grade 7",
  },
  {
    id: "TEST-006",
    applicationId: "APP-2026-004",
    type: "English Proficiency",
    subject: "English",
    date: "2026-02-19",
    time: "02:00 PM",
    location: "Main Campus - Room 103",
    proctor: "Ms. Fatima Al-Zaabi",
    status: "scheduled",
    notes: "English language assessment for Layla Salem",
  },
];

// ============================================================================
// STEP 4: INTERVIEWS
// ============================================================================

export const mockInterviews: Interview[] = [
  {
    id: "INT-001",
    applicationId: "APP-2024-001",
    date: "2026-01-27",
    time: "02:00 PM",
    interviewer: "Dr. Sarah Johnson",
    location: "Admin Building - Office 205",
    status: "completed",
    rating: 5,
    notes:
      "Confident and well-prepared. Shows genuine interest in STEM programs. Strongly recommend acceptance.",
  },
  {
    id: "INT-002",
    applicationId: "APP-2024-002",
    date: "2026-01-28",
    time: "03:00 PM",
    interviewer: "Mr. Ahmed Al-Mansoori",
    location: "Admin Building - Office 206",
    status: "completed",
    rating: 5,
    notes:
      "Excellent communication skills. Strong academic background. Strongly recommend acceptance.",
  },
  {
    id: "INT-003",
    applicationId: "APP-2024-003",
    date: "2026-01-30",
    time: "02:00 PM",
    interviewer: "Ms. Fatima Al-Zaabi",
    location: "Admin Building - Office 205",
    status: "completed",
    rating: 4,
    notes:
      "Articulate and mature. Excellent Arabic language proficiency. Recommend acceptance.",
  },
  {
    id: "INT-004",
    applicationId: "APP-2026-004",
    date: "2026-02-22",
    time: "10:00 AM",
    interviewer: "Dr. Sarah Johnson",
    location: "Admin Building - Office 205",
    status: "scheduled",
    notes: "Scheduled interview for Layla Salem - Grade 6 applicant",
  },
  {
    id: "INT-005",
    applicationId: "APP-2026-005",
    date: "2026-02-24",
    time: "02:00 PM",
    interviewer: "Mr. Ahmed Al-Mansoori",
    location: "Admin Building - Office 206",
    status: "scheduled",
    notes: "Scheduled interview for Noura Mariam - Grade 7 applicant",
  },
];

// ============================================================================
// STEP 5: DECISIONS
// ============================================================================

export const mockDecisions: Decision[] = [
  {
    id: "DEC-001",
    applicationId: "APP-2024-001",
    decision: "accept",
    reason: "Strong academic performance and test scores. Excellent interview.",
    decisionDate: "2026-02-01",
    decidedBy: "Admissions Committee",
  },
  {
    id: "DEC-002",
    applicationId: "APP-2024-002",
    decision: "accept",
    reason: "Excellent test scores and interview. Strong overall profile.",
    decisionDate: "2026-02-01",
    decidedBy: "Admissions Committee",
  },
  {
    id: "DEC-003",
    applicationId: "APP-2024-003",
    decision: "accept",
    reason: "Strong overall profile. Excellent Arabic language skills.",
    decisionDate: "2026-02-02",
    decidedBy: "Admissions Committee",
  },
  {
    id: "DEC-004",
    applicationId: "APP-2026-004",
    decision: "waitlist",
    reason:
      "Strong candidate but limited space in Grade 6. Placed on waitlist pending enrollment confirmations.",
    decisionDate: "2026-02-14",
    decidedBy: "Admissions Committee",
  },
  {
    id: "DEC-005",
    applicationId: "APP-2026-005",
    decision: "waitlist",
    reason:
      "Good academic record. Waitlisted for Grade 7 pending final enrollment numbers.",
    decisionDate: "2026-02-13",
    decidedBy: "Admissions Committee",
  },
];

// ============================================================================
// STEP 6: STUDENTS (Enrolled from Accepted Applications)
// ============================================================================

// Helper function to map application status
function mapApplicationStatus(
  status: Application["status"],
): Student["status"] {
  if (status === "accepted") return "Active";
  if (status === "rejected") return "Withdrawn";
  return "Active";
}

// Helper function to generate risk flags based on student performance
function generateRiskFlags(studentId: string): Student["risk_flags"] {
  const flags: Student["risk_flags"] = [];
  const attendanceRate = seededNumber(studentId, 85, 98);
  const averageGrade = seededNumber(studentId, 75, 95);

  // Low attendance risk
  if (attendanceRate < 90) {
    flags.push("attendance");
  }

  // Low grades risk
  if (averageGrade < 80) {
    flags.push("grades");
  }

  // Random behavior issues (10% chance)
  if (seededNumber(studentId + "behavior", 0, 100) < 10) {
    flags.push("behavior");
  }

  return flags.length > 0 ? flags : undefined;
}

// Generate students from accepted applications
const studentsFromApplications: Student[] = mockApplications
  .filter((app) => app.status === "accepted")
  .map((application) => {
    const studentId = `STU-${application.id}`;
    const gradeRequested =
      application.gradeRequested ?? application.grade_requested;

    return {
      id: studentId,
      applicationId: application.id,
      leadId: application.leadId,
      full_name_ar: application.full_name_ar,
      full_name_en: application.full_name_en,
      gender: application.gender,
      dateOfBirth: application.dateOfBirth ?? application.date_of_birth,
      nationality: application.nationality,
      status: mapApplicationStatus(application.status),
      gradeRequested,
      source: application.source,
      submittedDate: application.submittedDate,
      contact: {
        address_line: application.address_line,
        city: application.city,
        district: application.district,
        student_phone: application.student_phone,
        student_email: application.student_email,
      },

      // Backward compatibility fields (deprecated - use enrollment data)
      name: application.full_name_en,
      student_id: studentId,
      created_at: application.submittedDate,
      updated_at: application.submittedDate,
      date_of_birth: application.dateOfBirth ?? application.date_of_birth,

      // Mock performance data (deprecated - should come from enrollment terms)
      attendance_percentage: seededNumber(studentId, 85, 98),
      current_average: seededNumber(studentId, 75, 95),
      risk_flags: generateRiskFlags(studentId),
    };
  });

// Previously enrolled students (not from current admission cycle)
const previouslyEnrolledStudentsBase: Omit<
  Student,
  "attendance_percentage" | "current_average" | "risk_flags"
>[] = [
  // 2025-2026 Academic Year Students
  {
    id: "2025-G6-001",
    full_name_ar: "محمد علي",
    full_name_en: "Mohammed Ali",
    name: "Mohammed Ali",
    student_id: "2025-G6-001",
    gender: "Male",
    dateOfBirth: "2014-03-15",
    date_of_birth: "2014-03-15",
    nationality: "UAE",
    status: "Active",
    gradeRequested: "Grade 6",
    source: "walk_in",
    submittedDate: "2024-08-15",
    contact: {
      address_line: "Al Wasl Road, Villa 12",
      city: "Dubai",
      district: "Jumeirah",
    },
    created_at: "2024-08-15",
    updated_at: "2026-02-14",
  },
  {
    id: "2025-G6-002",
    full_name_ar: "ليلى حسن",
    full_name_en: "Layla Hassan",
    name: "Layla Hassan",
    student_id: "2025-G6-002",
    gender: "Female",
    dateOfBirth: "2014-07-22",
    date_of_birth: "2014-07-22",
    nationality: "UAE",
    status: "Active",
    gradeRequested: "Grade 6",
    source: "referral",
    submittedDate: "2024-08-18",
    contact: {
      address_line: "Jumeirah Beach Road, Apt 501",
      city: "Dubai",
      district: "Jumeirah",
    },
    created_at: "2024-08-18",
    updated_at: "2026-02-14",
  },
  {
    id: "2025-G7-001",
    full_name_ar: "فاطمة أحمد",
    full_name_en: "Fatima Ahmed",
    name: "Fatima Ahmed",
    student_id: "2025-G7-001",
    gender: "Female",
    dateOfBirth: "2013-06-20",
    date_of_birth: "2013-06-20",
    nationality: "UAE",
    status: "Active",
    gradeRequested: "Grade 7",
    source: "referral",
    submittedDate: "2024-08-20",
    contact: {
      address_line: "Sheikh Zayed Road, Tower 5",
      city: "Dubai",
      district: "Business Bay",
    },
    created_at: "2024-08-20",
    updated_at: "2026-02-14",
  },
  {
    id: "2025-G7-002",
    full_name_ar: "عبدالرحمن سالم",
    full_name_en: "Abdulrahman Salem",
    name: "Abdulrahman Salem",
    student_id: "2025-G7-002",
    gender: "Male",
    dateOfBirth: "2013-09-10",
    date_of_birth: "2013-09-10",
    nationality: "UAE",
    status: "Active",
    gradeRequested: "Grade 7",
    source: "in_app",
    submittedDate: "2024-08-22",
    contact: {
      address_line: "Marina Walk, Tower 12",
      city: "Dubai",
      district: "Dubai Marina",
    },
    created_at: "2024-08-22",
    updated_at: "2026-02-14",
  },
  {
    id: "2025-G8-001",
    full_name_ar: "خالد حسن",
    full_name_en: "Khalid Hassan",
    name: "Khalid Hassan",
    student_id: "2025-G8-001",
    gender: "Male",
    dateOfBirth: "2012-09-10",
    date_of_birth: "2012-09-10",
    nationality: "UAE",
    status: "Active",
    gradeRequested: "Grade 8",
    source: "in_app",
    submittedDate: "2024-08-10",
    contact: {
      address_line: "Palm Jumeirah, Villa 23",
      city: "Dubai",
      district: "Palm Jumeirah",
    },
    created_at: "2024-08-10",
    updated_at: "2026-02-14",
  },
  {
    id: "2025-G8-002",
    full_name_ar: "مريم خالد",
    full_name_en: "Mariam Khalid",
    name: "Mariam Khalid",
    student_id: "2025-G8-002",
    gender: "Female",
    dateOfBirth: "2012-11-15",
    date_of_birth: "2012-11-15",
    nationality: "UAE",
    status: "Active",
    gradeRequested: "Grade 8",
    source: "walk_in",
    submittedDate: "2024-08-12",
    contact: {
      address_line: "Downtown Dubai, Apt 2301",
      city: "Dubai",
      district: "Downtown",
    },
    created_at: "2024-08-12",
    updated_at: "2026-02-14",
  },
  {
    id: "2025-G9-001",
    full_name_ar: "نورة سالم",
    full_name_en: "Noura Salem",
    name: "Noura Salem",
    student_id: "2025-G9-001",
    gender: "Female",
    dateOfBirth: "2011-12-05",
    date_of_birth: "2011-12-05",
    nationality: "UAE",
    status: "Active",
    gradeRequested: "Grade 9",
    source: "walk_in",
    submittedDate: "2024-08-25",
    contact: {
      address_line: "Downtown Dubai, Apt 1205",
      city: "Dubai",
      district: "Downtown",
    },
    created_at: "2024-08-25",
    updated_at: "2026-02-14",
  },
  {
    id: "2025-G9-002",
    full_name_ar: "علي محمد",
    full_name_en: "Ali Mohammed",
    name: "Ali Mohammed",
    student_id: "2025-G9-002",
    gender: "Male",
    dateOfBirth: "2011-08-18",
    date_of_birth: "2011-08-18",
    nationality: "UAE",
    status: "Active",
    gradeRequested: "Grade 9",
    source: "referral",
    submittedDate: "2024-08-28",
    contact: {
      address_line: "Al Barsha, Villa 89",
      city: "Dubai",
      district: "Al Barsha",
    },
    created_at: "2024-08-28",
    updated_at: "2026-02-14",
  },
  {
    id: "2025-G10-001",
    full_name_ar: "يوسف عمر",
    full_name_en: "Youssef Omar",
    name: "Youssef Omar",
    student_id: "2025-G10-001",
    gender: "Male",
    dateOfBirth: "2010-04-18",
    date_of_birth: "2010-04-18",
    nationality: "UAE",
    status: "Suspended",
    gradeRequested: "Grade 10",
    source: "referral",
    submittedDate: "2024-08-12",
    contact: {
      address_line: "Marina Walk, Tower 8",
      city: "Dubai",
      district: "Dubai Marina",
    },
    created_at: "2024-08-12",
    updated_at: "2026-02-14",
  },
  {
    id: "2025-G10-002",
    full_name_ar: "سارة إبراهيم",
    full_name_en: "Sara Ibrahim",
    name: "Sara Ibrahim",
    student_id: "2025-G10-002",
    gender: "Female",
    dateOfBirth: "2010-06-25",
    date_of_birth: "2010-06-25",
    nationality: "UAE",
    status: "Active",
    gradeRequested: "Grade 10",
    source: "in_app",
    submittedDate: "2024-08-15",
    contact: {
      address_line: "Jumeirah Lakes Towers, Tower 3",
      city: "Dubai",
      district: "JLT",
    },
    created_at: "2024-08-15",
    updated_at: "2026-02-14",
  },

  // 2024-2025 Academic Year Students (Older enrollments)
  {
    id: "2024-G7-001",
    full_name_ar: "أحمد راشد",
    full_name_en: "Ahmed Rashid",
    name: "Ahmed Rashid",
    student_id: "2024-G7-001",
    gender: "Male",
    dateOfBirth: "2013-05-10",
    date_of_birth: "2013-05-10",
    nationality: "UAE",
    status: "Active",
    gradeRequested: "Grade 7",
    source: "walk_in",
    submittedDate: "2023-08-10",
    contact: {
      address_line: "Al Quoz, Villa 45",
      city: "Dubai",
      district: "Al Quoz",
    },
    created_at: "2023-08-10",
    updated_at: "2026-02-14",
  },
  {
    id: "2024-G8-001",
    full_name_ar: "هند عبدالله",
    full_name_en: "Hind Abdullah",
    name: "Hind Abdullah",
    student_id: "2024-G8-001",
    gender: "Female",
    dateOfBirth: "2012-03-22",
    date_of_birth: "2012-03-22",
    nationality: "UAE",
    status: "Active",
    gradeRequested: "Grade 8",
    source: "referral",
    submittedDate: "2023-08-12",
    contact: {
      address_line: "Arabian Ranches, Villa 102",
      city: "Dubai",
      district: "Arabian Ranches",
    },
    created_at: "2023-08-12",
    updated_at: "2026-02-14",
  },
  {
    id: "2024-G9-001",
    full_name_ar: "زيد حمد",
    full_name_en: "Zayed Hamad",
    name: "Zayed Hamad",
    student_id: "2024-G9-001",
    gender: "Male",
    dateOfBirth: "2011-10-15",
    date_of_birth: "2011-10-15",
    nationality: "UAE",
    status: "Withdrawn",
    gradeRequested: "Grade 9",
    source: "in_app",
    submittedDate: "2023-08-15",
    contact: {
      address_line: "Sports City, Apt 701",
      city: "Dubai",
      district: "Sports City",
    },
    created_at: "2023-08-15",
    updated_at: "2026-01-20",
  },
];

// Add performance data to previously enrolled students
const previouslyEnrolledStudents: Student[] =
  previouslyEnrolledStudentsBase.map((student) => ({
    ...student,
    attendance_percentage: seededNumber(student.id, 85, 98),
    current_average: seededNumber(student.id, 75, 95),
    risk_flags: generateRiskFlags(student.id),
  }));

// Combine all students
export const mockStudents: Student[] = [
  ...studentsFromApplications,
  ...previouslyEnrolledStudents,
];

// ============================================================================
// GUARDIANS (Extracted from Applications + Previously Enrolled Students)
// ============================================================================

const guardianMap = new Map<string, StudentGuardian>();
const guardianLinks: StudentGuardianLink[] = [];

// Add guardians from applications
mockApplications.forEach((application) => {
  const studentId = `STU-${application.id}`;

  application.guardians.forEach((guardian) => {
    const guardianKey = guardian.id || guardian.national_id;
    const guardianId = guardian.id || `G-${guardianKey}`;

    if (!guardianMap.has(guardianKey)) {
      guardianMap.set(guardianKey, {
        guardianId,
        full_name: guardian.full_name,
        relation: guardian.relation,
        phone_primary: guardian.phone_primary,
        phone_secondary: guardian.phone_secondary,
        email: guardian.email,
        national_id: guardian.national_id,
        job_title: guardian.job_title,
        workplace: guardian.workplace,
        is_primary: guardian.is_primary,
        can_pickup: guardian.can_pickup,
        can_receive_notifications: guardian.can_receive_notifications,
      });
    }

    guardianLinks.push({
      studentId,
      guardianId,
      relation: guardian.relation,
      is_primary: guardian.is_primary,
    });
  });
});

// Add guardians for previously enrolled students
const previousGuardians: Array<{
  studentId: string;
  guardians: Array<{
    id: string;
    full_name: string;
    relation: string;
    phone_primary: string;
    phone_secondary?: string;
    email: string;
    national_id: string;
    job_title: string;
    workplace: string;
    is_primary: boolean;
  }>;
}> = [
  {
    studentId: "2025-G6-001",
    guardians: [
      {
        id: "G007",
        full_name: "Ali Mohammed",
        relation: "father",
        phone_primary: "+971-50-111-2222",
        phone_secondary: "+971-4-111-2222",
        email: "ali.mohammed@email.com",
        national_id: "784-1989-1112222-7",
        job_title: "Manager",
        workplace: "Dubai Corporation",
        is_primary: true,
      },
      {
        id: "G008",
        full_name: "Maryam Ali",
        relation: "mother",
        phone_primary: "+971-50-111-2223",
        email: "maryam.ali@email.com",
        national_id: "784-1991-1112223-8",
        job_title: "Teacher",
        workplace: "Al Noor School",
        is_primary: false,
      },
    ],
  },
  {
    studentId: "2025-G7-001",
    guardians: [
      {
        id: "G009",
        full_name: "Ahmed Khalid",
        relation: "father",
        phone_primary: "+971-50-222-3333",
        phone_secondary: "+971-4-222-3333",
        email: "ahmed.khalid@email.com",
        national_id: "784-1987-2223333-9",
        job_title: "Doctor",
        workplace: "Dubai Medical Center",
        is_primary: true,
      },
    ],
  },
  {
    studentId: "2025-G8-001",
    guardians: [
      {
        id: "G010",
        full_name: "Hassan Ibrahim",
        relation: "father",
        phone_primary: "+971-50-333-4444",
        email: "hassan.ibrahim@email.com",
        national_id: "784-1986-3334444-10",
        job_title: "Businessman",
        workplace: "Hassan Trading LLC",
        is_primary: true,
      },
    ],
  },
  {
    studentId: "2025-G9-001",
    guardians: [
      {
        id: "G011",
        full_name: "Salem Abdullah",
        relation: "father",
        phone_primary: "+971-50-444-5555",
        phone_secondary: "+971-4-444-5555",
        email: "salem.abdullah@email.com",
        national_id: "784-1984-4445555-11",
        job_title: "Engineer",
        workplace: "Emirates Engineering",
        is_primary: true,
      },
      {
        id: "G012",
        full_name: "Hessa Salem",
        relation: "mother",
        phone_primary: "+971-50-444-5556",
        email: "hessa.salem@email.com",
        national_id: "784-1986-4445556-12",
        job_title: "Architect",
        workplace: "Dubai Design",
        is_primary: false,
      },
    ],
  },
  {
    studentId: "2025-G10-001",
    guardians: [
      {
        id: "G013",
        full_name: "Omar Rashid",
        relation: "father",
        phone_primary: "+971-50-555-6666",
        email: "omar.rashid@email.com",
        national_id: "784-1983-5556666-13",
        job_title: "Lawyer",
        workplace: "Rashid Legal",
        is_primary: true,
      },
    ],
  },
];

previousGuardians.forEach(({ studentId, guardians }) => {
  guardians.forEach((guardian) => {
    const guardianKey = guardian.id;
    const guardianId = guardian.id;

    if (!guardianMap.has(guardianKey)) {
      guardianMap.set(guardianKey, {
        guardianId,
        full_name: guardian.full_name,
        relation: guardian.relation,
        phone_primary: guardian.phone_primary,
        phone_secondary: guardian.phone_secondary || "",
        email: guardian.email,
        national_id: guardian.national_id,
        job_title: guardian.job_title,
        workplace: guardian.workplace,
        is_primary: guardian.is_primary,
        can_pickup: true,
        can_receive_notifications: true,
      });
    }

    guardianLinks.push({
      studentId,
      guardianId,
      relation: guardian.relation,
      is_primary: guardian.is_primary,
    });
  });
});

export const mockStudentGuardians: StudentGuardian[] = Array.from(
  guardianMap.values(),
);
export const mockStudentGuardianLinks: StudentGuardianLink[] = guardianLinks;

// ============================================================================
// STUDENT DOCUMENTS
// ============================================================================

export const mockStudentDocuments: StudentDocument[] = mockApplications
  .filter((app) => app.status === "accepted")
  .flatMap((application) => {
    const studentId = `STU-${application.id}`;
    return application.documents.map((doc) => ({
      id: `SDOC-${doc.id}`,
      studentId,
      type: doc.type,
      name: doc.name,
      status: doc.status,
      uploadedDate: doc.uploadedDate,
    }));
  });

// ============================================================================
// MEDICAL PROFILES
// ============================================================================

export const mockStudentMedicalProfiles: StudentMedicalProfile[] =
  mockStudents.map((student) => {
    const application = mockApplications.find(
      (app) => app.id === student.applicationId,
    );
    const bloodTypes = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];

    // For students from applications
    if (application) {
      return {
        studentId: student.id,
        blood_type: seededPick(`${student.id}-blood`, bloodTypes),
        allergies: application?.medical_conditions?.includes("asthma")
          ? "Dust, Pollen"
          : undefined,
        notes: application?.medical_conditions || undefined,
        emergency_plan:
          application?.medical_conditions &&
          application.medical_conditions !== "None"
            ? "Contact guardian immediately. Follow medical protocol. Call emergency services if needed."
            : undefined,
      };
    }

    // For previously enrolled students
    return {
      studentId: student.id,
      blood_type: seededPick(`${student.id}-blood`, bloodTypes),
      allergies: undefined,
      notes: undefined,
      emergency_plan: undefined,
    };
  });

// ============================================================================
// STUDENT NOTES
// ============================================================================

export const mockStudentNotes: StudentNote[] = mockStudents.flatMap(
  (student, studentIndex) => {
    const notes: StudentNote[] = [];
    const noteCount = seededNumber(`${student.id}-notecount`, 2, 4); // 2-4 notes per student

    for (let i = 0; i < noteCount; i++) {
      const categories: StudentNote["category"][] = [
        "academic",
        "behavioral",
        "medical",
        "general",
      ];
      const category = seededPick(`${student.id}-cat-${i}`, categories);
      const visibility: StudentNote["visibility"] =
        seededNumber(`${student.id}-vis-${i}`, 0, 1) > 0
          ? "internal"
          : "visible_to_guardian";

      const noteTexts = {
        academic: [
          "Excellent progress in mathematics this term",
          "Needs additional support in reading comprehension",
          "Outstanding performance in science projects",
        ],
        behavioral: [
          "Shows great leadership skills in group activities",
          "Very respectful and cooperative with peers",
          "Actively participates in class discussions",
        ],
        medical: [
          "Reminder: Student has mild asthma, inhaler available",
          "No medical concerns this term",
          "Regular check-ups completed",
        ],
        general: [
          "Parent meeting scheduled for next week",
          "Student interested in joining robotics club",
          "Excellent attendance record",
        ],
      };

      notes.push({
        id: `NOTE-${student.id}-${i + 1}`,
        studentId: student.id,
        date: new Date(2026, 1, 1 + i * 7).toISOString(),
        category,
        note: seededPick(`${student.id}-note-${i}`, noteTexts[category]),
        visibility,
        created_by: [
          "Ms. Sarah Johnson",
          "Mr. Ahmed Al-Mansoori",
          "Dr. Fatima Al-Zaabi",
        ][studentIndex % 3],
      });
    }

    return notes;
  },
);

// ============================================================================
// TIMELINE EVENTS
// ============================================================================

export const mockStudentTimelineEvents: StudentTimelineEvent[] =
  mockStudents.flatMap((student) => {
    const application = mockApplications.find(
      (app) => app.id === student.applicationId,
    );
    if (!application) return [];

    const events: StudentTimelineEvent[] = [];
    let eventId = 1;

    // Application submitted
    events.push({
      id: `EVT-${student.id}-${eventId++}`,
      studentId: student.id,
      type: "application_submitted",
      date: application.submittedDate,
      title: "Application Submitted",
      meta: {
        grade: student.grade,
        source: student.source,
      },
    });

    // Documents uploaded
    application.documents.forEach((doc) => {
      if (doc.uploadedDate) {
        events.push({
          id: `EVT-${student.id}-${eventId++}`,
          studentId: student.id,
          type: "document_uploaded",
          date: doc.uploadedDate,
          title: `Document Uploaded: ${doc.type}`,
          meta: {
            documentType: doc.type,
            documentName: doc.name,
          },
        });
      }
    });

    // Test scheduled and completed
    const test = mockTests.find((t) => t.applicationId === application.id);
    if (test) {
      events.push({
        id: `EVT-${student.id}-${eventId++}`,
        studentId: student.id,
        type: "test_scheduled",
        date: test.date,
        title: "Placement Test Scheduled",
        meta: {
          testType: test.type,
          location: test.location,
        },
      });

      if (test.status === "completed") {
        events.push({
          id: `EVT-${student.id}-${eventId++}`,
          studentId: student.id,
          type: "test_completed",
          date: test.date,
          title: "Placement Test Completed",
          meta: {
            score: test.score,
            maxScore: test.maxScore,
          },
        });
      }
    }

    // Interview scheduled and completed
    const interview = mockInterviews.find(
      (i) => i.applicationId === application.id,
    );
    if (interview) {
      events.push({
        id: `EVT-${student.id}-${eventId++}`,
        studentId: student.id,
        type: "interview_scheduled",
        date: interview.date,
        title: "Interview Scheduled",
        meta: {
          interviewer: interview.interviewer,
          location: interview.location,
        },
      });

      if (interview.status === "completed") {
        events.push({
          id: `EVT-${student.id}-${eventId++}`,
          studentId: student.id,
          type: "interview_completed",
          date: interview.date,
          title: "Interview Completed",
          meta: {
            interviewer: interview.interviewer,
            rating: interview.rating,
          },
        });
      }
    }

    // Decision made
    const decision = mockDecisions.find(
      (d) => d.applicationId === application.id,
    );
    if (decision) {
      events.push({
        id: `EVT-${student.id}-${eventId++}`,
        studentId: student.id,
        type: "decision_made",
        date: decision.decisionDate,
        title: `Application ${decision.decision.charAt(0).toUpperCase() + decision.decision.slice(1)}ed`,
        meta: {
          decision: decision.decision,
          decidedBy: decision.decidedBy,
        },
      });
    }

    return events.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  });

// ============================================================================
// LINK TESTS AND INTERVIEWS TO APPLICATIONS
// ============================================================================

// Populate tests and interviews arrays in applications after all data is defined
mockApplications.forEach((application) => {
  // Link tests
  application.tests = mockTests.filter(
    (test) => test.applicationId === application.id,
  );

  // Link interviews
  application.interviews = mockInterviews.filter(
    (interview) => interview.applicationId === application.id,
  );

  // Link decision
  const decision = mockDecisions.find(
    (dec) => dec.applicationId === application.id,
  );
  if (decision) {
    application.decision = decision;
  }
});
