// FILE: src/data/mockDataLinked.ts
// Comprehensive linked mock data following the complete admission cycle
// Lead → Application → Test → Interview → Decision → Enrollment → Student

import type {
  Lead,
  Application,
  Test,
  Interview,
  Decision,
} from "@/features/admissions/types/admissions";
import type {
  Student,
  StudentGuardian,
  StudentGuardianLink,
  StudentDocument,
  StudentMedicalProfile,
  StudentNote,
  StudentTimelineEvent,
} from "@/features/students-guardians/students/types";
import { seededNumber, seededPick } from "@/utils/seeded";
import {
  studentDummyData,
  guardianDummyData,
  guardianLinkDummyData,
} from "./studentDummyData";

const splitStudentName = (fullName: string) => {
  const parts = fullName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    firstName: parts[0] || "",
    fatherName: parts[1] || "",
    grandfatherName: parts[2] || "",
    familyName: parts.slice(3).join(" "),
  };
};

const enrichApplicationStudentNames = (application: Application): Application => {
  const arabicNameParts = splitStudentName(application.full_name_ar);
  const englishNameParts = splitStudentName(application.full_name_en);

  return {
    ...application,
    first_name_ar: application.first_name_ar || arabicNameParts.firstName,
    father_name_ar: application.father_name_ar || arabicNameParts.fatherName,
    grandfather_name_ar:
      application.grandfather_name_ar || arabicNameParts.grandfatherName,
    family_name_ar: application.family_name_ar || arabicNameParts.familyName,
    first_name_en: application.first_name_en || englishNameParts.firstName,
    father_name_en: application.father_name_en || englishNameParts.fatherName,
    grandfather_name_en:
      application.grandfather_name_en || englishNameParts.grandfatherName,
    family_name_en: application.family_name_en || englishNameParts.familyName,
  };
};

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
  {
    id: "L009",
    name: "Ahmed Ali",
    phone: "+971-50-890-1234",
    email: "ahmed.ali@email.com",
    channel: "Other",
    status: "New",
    createdAt: "2026-02-10",
    gradeInterest: "Grade 8",
    source: "other",
    studentName: "Hamza Ali",
    studentNameArabic: "حمزة علي",
  },
  {
    id: "L010",
    name: "Omar Saeed",
    phone: "+971-50-901-2233",
    email: "omar.saeed@email.com",
    channel: "In-app",
    status: "New",
    createdAt: "2026-09-07",
    gradeInterest: "Grade 5",
    source: "in_app",
    studentName: "Maha Omar",
    studentNameArabic: "Ù…Ù‡Ø§ Ø¹Ù…Ø±",
  },
  {
    id: "L011",
    name: "Reem Abdullah",
    phone: "+971-50-912-3344",
    email: "reem.abdullah@email.com",
    channel: "Referral",
    status: "Contacted",
    createdAt: "2026-09-14",
    gradeInterest: "Grade 6",
    source: "referral",
    studentName: "Yara Abdullah",
    studentNameArabic: "ÙŠØ§Ø±Ø§ Ø¹Ø¨Ø¯Ø§Ù„Ù„Ù‡",
  },
  {
    id: "L012",
    name: "Khalifa Nasser",
    phone: "+971-50-923-4455",
    email: "khalifa.nasser@email.com",
    channel: "Walk-in",
    status: "Converted",
    createdAt: "2026-10-02",
    gradeInterest: "Grade 7",
    source: "walk_in",
    studentName: "Saif Khalifa",
    studentNameArabic: "Ø³ÙŠÙ Ø®Ù„ÙŠÙØ©",
  },
  {
    id: "L013",
    name: "Huda Mansoor",
    phone: "+971-50-934-5566",
    email: "huda.mansoor@email.com",
    channel: "Other",
    status: "Contacted",
    createdAt: "2026-10-11",
    gradeInterest: "Grade 4",
    source: "other",
    studentName: "Layan Mansoor",
    studentNameArabic: "Ù„ÙŠØ§Ù† Ù…Ù†ØµÙˆØ±",
  },
  {
    id: "L014",
    name: "Nasser Al Hammadi",
    phone: "+971-50-945-6677",
    email: "nasser.hammadi@email.com",
    channel: "Walk-in",
    status: "New",
    createdAt: "2024-09-18",
    gradeInterest: "Grade 4",
    source: "walk_in",
    studentName: "Alya Nasser",
    studentNameArabic: "Alya Nasser",
  },
  {
    id: "L015",
    name: "Mona Youssef",
    phone: "+971-50-956-7788",
    email: "mona.youssef@email.com",
    channel: "Referral",
    status: "Contacted",
    createdAt: "2024-11-06",
    gradeInterest: "Grade 5",
    source: "referral",
    studentName: "Karim Youssef",
    studentNameArabic: "Karim Youssef",
  },
  {
    id: "L016",
    name: "Tariq Al Suwaidi",
    phone: "+971-50-967-8899",
    email: "tariq.suwaidi@email.com",
    channel: "In-app",
    status: "Converted",
    createdAt: "2025-01-22",
    gradeInterest: "Grade 6",
    source: "in_app",
    studentName: "Dana Tariq",
    studentNameArabic: "Dana Tariq",
  },
  {
    id: "L017",
    name: "Noor Al Kaabi",
    phone: "+971-50-978-9900",
    email: "noor.kaabi@email.com",
    channel: "Other",
    status: "Contacted",
    createdAt: "2025-03-10",
    gradeInterest: "Grade 7",
    source: "other",
    studentName: "Rashed Noor",
    studentNameArabic: "Rashed Noor",
  },
  {
    id: "L018",
    name: "Amal Farouk",
    phone: "+971-50-989-1010",
    email: "amal.farouk@email.com",
    channel: "Walk-in",
    status: "New",
    createdAt: "2025-04-24",
    gradeInterest: "Grade 3",
    source: "walk_in",
    studentName: "Salma Farouk",
    studentNameArabic: "Salma Farouk",
  },
  {
    id: "L019",
    name: "Faisal Rahman",
    phone: "+971-50-990-2121",
    email: "faisal.rahman@email.com",
    channel: "Referral",
    status: "Converted",
    createdAt: "2025-10-09",
    gradeInterest: "Grade 8",
    source: "referral",
    studentName: "Hadi Faisal",
    studentNameArabic: "Hadi Faisal",
  },
  {
    id: "L020",
    name: "Sara Al Falahi",
    phone: "+971-50-991-3232",
    email: "sara.falahi@email.com",
    channel: "In-app",
    status: "Contacted",
    createdAt: "2026-05-08",
    gradeInterest: "Grade 9",
    source: "in_app",
    studentName: "Maryam Sara",
    studentNameArabic: "Maryam Sara",
  },
  {
    id: "L021",
    name: "Waleed Jaber",
    phone: "+971-50-992-4343",
    email: "waleed.jaber@email.com",
    channel: "Walk-in",
    status: "New",
    createdAt: "2027-01-19",
    gradeInterest: "Grade 6",
    source: "walk_in",
    studentName: "Joud Waleed",
    studentNameArabic: "Joud Waleed",
  },
  {
    id: "L022",
    name: "Rania Mostafa",
    phone: "+971-50-993-5454",
    email: "rania.mostafa@email.com",
    channel: "Other",
    status: "Contacted",
    createdAt: "2027-04-15",
    gradeInterest: "Grade 5",
    source: "other",
    studentName: "Adam Rania",
    studentNameArabic: "Adam Rania",
  },
];

// ============================================================================
// STEP 2: APPLICATIONS (Formal Applications from Leads)
// ============================================================================

const baseMockApplications: Application[] = [
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
    student_phone: "+971-50-999-0001",
    student_email: "ahmed.hassan456@gmail.com",

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
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        fileType: "pdf",
      },
      {
        id: "DOC-001-002",
        type: "Passport",
        name: "passport_ahmed.pdf",
        status: "complete",
        uploadedDate: "2026-01-10",
        url: "https://www.africau.edu/images/default/sample.pdf",
        fileType: "pdf",
      },
      {
        id: "DOC-001-003",
        type: "Previous School Records",
        name: "school_records_ahmed.pdf",
        status: "complete",
        uploadedDate: "2026-01-12",
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        fileType: "pdf",
      },
      {
        id: "DOC-001-004",
        type: "Medical Records",
        name: "medical_ahmed.pdf",
        status: "complete",
        uploadedDate: "2026-01-15",
        url: "https://www.africau.edu/images/default/sample.pdf",
        fileType: "pdf",
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
    student_phone: "+971-50-999-0006",
    student_email: "layla.salem789@yahoo.com",

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
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        fileType: "pdf",
      },
      {
        id: "DOC-004-002",
        type: "Passport",
        name: "passport_layla.pdf",
        status: "complete",
        uploadedDate: "2026-02-12",
        url: "https://www.africau.edu/images/default/sample.pdf",
        fileType: "pdf",
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
  {
    id: "APP-2025-013",
    leadId: "L014",
    source: "walk_in",
    full_name_ar: "Alya Nasser",
    full_name_en: "Alya Nasser",
    studentName: "Alya Nasser",
    studentNameArabic: "Alya Nasser",
    gender: "Female",
    date_of_birth: "2016-03-11",
    dateOfBirth: "2016-03-11",
    nationality: "UAE",
    address_line: "Mirdif Hills Villa 14",
    city: "Dubai",
    district: "Mirdif",
    student_phone: "+971-50-800-1014",
    student_email: "alya.nasser@email.com",
    grade_requested: "Grade 4",
    gradeRequested: "Grade 4",
    previous_school: "Al Mizhar Private School",
    previousSchool: "Al Mizhar Private School",
    join_date: "2025-09-01",
    medical_conditions: "None",
    notes: "Family requested transportation details.",
    guardians: [
      {
        id: "G101",
        full_name: "Nasser Al Hammadi",
        relation: "father",
        phone_primary: "+971-50-945-6677",
        phone_secondary: "",
        email: "nasser.hammadi@email.com",
        national_id: "784-1987-9456677-1",
        job_title: "Operations Lead",
        workplace: "Dubai Aviation",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Nasser Al Hammadi",
    guardianPhone: "+971-50-945-6677",
    guardianEmail: "nasser.hammadi@email.com",
    status: "accepted",
    submittedDate: "2024-10-05",
    tests: [],
    interviews: [],
    documents: [
      {
        id: "DOC-013-001",
        type: "Birth Certificate",
        name: "birth_certificate_alya.pdf",
        status: "complete",
        uploadedDate: "2024-10-05",
      },
    ],
  },
  {
    id: "APP-2025-014",
    leadId: "L015",
    source: "referral",
    full_name_ar: "Karim Youssef",
    full_name_en: "Karim Youssef",
    studentName: "Karim Youssef",
    studentNameArabic: "Karim Youssef",
    gender: "Male",
    date_of_birth: "2015-08-22",
    dateOfBirth: "2015-08-22",
    nationality: "Egypt",
    address_line: "Sharjah Corniche Tower 9",
    city: "Sharjah",
    district: "Al Majaz",
    student_phone: "+971-50-800-1015",
    student_email: "karim.youssef@email.com",
    grade_requested: "Grade 5",
    gradeRequested: "Grade 5",
    previous_school: "International School of Choueifat",
    previousSchool: "International School of Choueifat",
    join_date: "2025-09-01",
    medical_conditions: "Peanut allergy",
    notes: "Requested nurse follow-up on allergy protocol.",
    guardians: [
      {
        id: "G102",
        full_name: "Mona Youssef",
        relation: "mother",
        phone_primary: "+971-50-956-7788",
        phone_secondary: "",
        email: "mona.youssef@email.com",
        national_id: "784-1989-9567788-2",
        job_title: "Finance Manager",
        workplace: "Sharjah Bank",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Mona Youssef",
    guardianPhone: "+971-50-956-7788",
    guardianEmail: "mona.youssef@email.com",
    status: "accepted",
    submittedDate: "2025-02-12",
    tests: [],
    interviews: [],
    documents: [
      {
        id: "DOC-014-001",
        type: "Passport",
        name: "passport_karim.pdf",
        status: "complete",
        uploadedDate: "2025-02-12",
      },
    ],
  },
  {
    id: "APP-2025-015",
    leadId: "L018",
    source: "walk_in",
    full_name_ar: "Salma Farouk",
    full_name_en: "Salma Farouk",
    studentName: "Salma Farouk",
    studentNameArabic: "Salma Farouk",
    gender: "Female",
    date_of_birth: "2017-01-19",
    dateOfBirth: "2017-01-19",
    nationality: "Jordan",
    address_line: "JVC District 11, Building 5",
    city: "Dubai",
    district: "JVC",
    student_phone: "+971-50-800-1018",
    student_email: "salma.farouk@email.com",
    grade_requested: "Grade 3",
    gradeRequested: "Grade 3",
    previous_school: "Little Scholars Academy",
    previousSchool: "Little Scholars Academy",
    join_date: "2025-09-01",
    medical_conditions: "None",
    notes: "Interested in arts enrichment activities.",
    guardians: [
      {
        id: "G103",
        full_name: "Amal Farouk",
        relation: "mother",
        phone_primary: "+971-50-989-1010",
        phone_secondary: "",
        email: "amal.farouk@email.com",
        national_id: "784-1990-9891010-3",
        job_title: "Interior Designer",
        workplace: "Farouk Studio",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Amal Farouk",
    guardianPhone: "+971-50-989-1010",
    guardianEmail: "amal.farouk@email.com",
    status: "rejected",
    submittedDate: "2025-04-24",
    tests: [],
    interviews: [],
    documents: [
      {
        id: "DOC-015-001",
        type: "School Records",
        name: "school_records_salma.pdf",
        status: "complete",
        uploadedDate: "2025-04-24",
      },
    ],
  },
  {
    id: "APP-2026-013",
    leadId: "L019",
    source: "referral",
    full_name_ar: "Hadi Faisal",
    full_name_en: "Hadi Faisal",
    studentName: "Hadi Faisal",
    studentNameArabic: "Hadi Faisal",
    gender: "Male",
    date_of_birth: "2012-07-03",
    dateOfBirth: "2012-07-03",
    nationality: "Pakistan",
    address_line: "Al Nahda Residence 22",
    city: "Dubai",
    district: "Al Nahda",
    student_phone: "+971-50-800-1019",
    student_email: "hadi.faisal@email.com",
    grade_requested: "Grade 8",
    gradeRequested: "Grade 8",
    previous_school: "GEMS Wellington",
    previousSchool: "GEMS Wellington",
    join_date: "2026-09-01",
    medical_conditions: "None",
    notes: "Sibling currently enrolled in middle school.",
    guardians: [
      {
        id: "G104",
        full_name: "Faisal Rahman",
        relation: "father",
        phone_primary: "+971-50-990-2121",
        phone_secondary: "",
        email: "faisal.rahman@email.com",
        national_id: "784-1986-9902121-4",
        job_title: "Project Manager",
        workplace: "Metro Rail Services",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Faisal Rahman",
    guardianPhone: "+971-50-990-2121",
    guardianEmail: "faisal.rahman@email.com",
    status: "accepted",
    submittedDate: "2025-10-09",
    tests: [],
    interviews: [],
    documents: [
      {
        id: "DOC-016-001",
        type: "Passport",
        name: "passport_hadi.pdf",
        status: "complete",
        uploadedDate: "2025-10-09",
      },
    ],
  },
  {
    id: "APP-2026-014",
    leadId: "L020",
    source: "in_app",
    full_name_ar: "Maryam Sara",
    full_name_en: "Maryam Sara",
    studentName: "Maryam Sara",
    studentNameArabic: "Maryam Sara",
    gender: "Female",
    date_of_birth: "2011-11-27",
    dateOfBirth: "2011-11-27",
    nationality: "UAE",
    address_line: "Falcon City Villa 81",
    city: "Dubai",
    district: "Dubailand",
    student_phone: "+971-50-800-1020",
    student_email: "maryam.sara@email.com",
    grade_requested: "Grade 9",
    gradeRequested: "Grade 9",
    previous_school: "American Academy for Girls",
    previousSchool: "American Academy for Girls",
    join_date: "2026-09-01",
    medical_conditions: "Asthma",
    notes: "Needs PE coordination with health office.",
    guardians: [
      {
        id: "G105",
        full_name: "Sara Al Falahi",
        relation: "mother",
        phone_primary: "+971-50-991-3232",
        phone_secondary: "",
        email: "sara.falahi@email.com",
        national_id: "784-1988-9913232-5",
        job_title: "School Counselor",
        workplace: "Abu Dhabi Education Council",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Sara Al Falahi",
    guardianPhone: "+971-50-991-3232",
    guardianEmail: "sara.falahi@email.com",
    status: "waitlisted",
    submittedDate: "2026-05-08",
    tests: [],
    interviews: [],
    documents: [
      {
        id: "DOC-017-001",
        type: "Medical Records",
        name: "medical_maryam.pdf",
        status: "complete",
        uploadedDate: "2026-05-08",
      },
    ],
  },
  {
    id: "APP-2027-013",
    leadId: "L010",
    source: "in_app",
    full_name_ar: "Maha Omar",
    full_name_en: "Maha Omar",
    studentName: "Maha Omar",
    studentNameArabic: "Maha Omar",
    gender: "Female",
    date_of_birth: "2015-05-14",
    dateOfBirth: "2015-05-14",
    nationality: "UAE",
    address_line: "Business Bay Tower 33",
    city: "Dubai",
    district: "Business Bay",
    student_phone: "+971-50-800-1010",
    student_email: "maha.omar@email.com",
    grade_requested: "Grade 5",
    gradeRequested: "Grade 5",
    previous_school: "Hartland International",
    previousSchool: "Hartland International",
    join_date: "2027-09-01",
    medical_conditions: "None",
    notes: "Parent asked about robotics club availability.",
    guardians: [
      {
        id: "G106",
        full_name: "Omar Saeed",
        relation: "father",
        phone_primary: "+971-50-901-2233",
        phone_secondary: "",
        email: "omar.saeed@email.com",
        national_id: "784-1985-9012233-6",
        job_title: "Procurement Director",
        workplace: "Dubai Ports",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Omar Saeed",
    guardianPhone: "+971-50-901-2233",
    guardianEmail: "omar.saeed@email.com",
    status: "accepted",
    submittedDate: "2026-10-08",
    tests: [],
    interviews: [],
    documents: [
      {
        id: "DOC-018-001",
        type: "Birth Certificate",
        name: "birth_certificate_maha.pdf",
        status: "complete",
        uploadedDate: "2026-10-08",
      },
    ],
  },
  {
    id: "APP-2027-014",
    leadId: "L021",
    source: "walk_in",
    full_name_ar: "Joud Waleed",
    full_name_en: "Joud Waleed",
    studentName: "Joud Waleed",
    studentNameArabic: "Joud Waleed",
    gender: "Female",
    date_of_birth: "2014-12-02",
    dateOfBirth: "2014-12-02",
    nationality: "Syria",
    address_line: "Al Barsha South Building 18",
    city: "Dubai",
    district: "Al Barsha",
    student_phone: "+971-50-800-1021",
    student_email: "joud.waleed@email.com",
    grade_requested: "Grade 6",
    gradeRequested: "Grade 6",
    previous_school: "Bright Future School",
    previousSchool: "Bright Future School",
    join_date: "2027-09-01",
    medical_conditions: "None",
    notes: "Family requested transportation and after-school care.",
    guardians: [
      {
        id: "G107",
        full_name: "Waleed Jaber",
        relation: "father",
        phone_primary: "+971-50-992-4343",
        phone_secondary: "",
        email: "waleed.jaber@email.com",
        national_id: "784-1984-9924343-7",
        job_title: "Sales Executive",
        workplace: "Jaber Trading",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Waleed Jaber",
    guardianPhone: "+971-50-992-4343",
    guardianEmail: "waleed.jaber@email.com",
    status: "accepted",
    submittedDate: "2027-02-03",
    tests: [],
    interviews: [],
    documents: [
      {
        id: "DOC-019-001",
        type: "Passport",
        name: "passport_joud.pdf",
        status: "complete",
        uploadedDate: "2027-02-03",
      },
    ],
  },
  {
    id: "APP-2027-015",
    leadId: "L022",
    source: "other",
    full_name_ar: "Adam Rania",
    full_name_en: "Adam Rania",
    studentName: "Adam Rania",
    studentNameArabic: "Adam Rania",
    gender: "Male",
    date_of_birth: "2016-09-21",
    dateOfBirth: "2016-09-21",
    nationality: "Egypt",
    address_line: "Silicon Oasis Residence 42",
    city: "Dubai",
    district: "Silicon Oasis",
    student_phone: "+971-50-800-1022",
    student_email: "adam.rania@email.com",
    grade_requested: "Grade 5",
    gradeRequested: "Grade 5",
    previous_school: "Future Leaders School",
    previousSchool: "Future Leaders School",
    join_date: "2027-09-01",
    medical_conditions: "None",
    notes: "Parent asked about ESL support.",
    guardians: [
      {
        id: "G108",
        full_name: "Rania Mostafa",
        relation: "mother",
        phone_primary: "+971-50-993-5454",
        phone_secondary: "",
        email: "rania.mostafa@email.com",
        national_id: "784-1991-9935454-8",
        job_title: "HR Manager",
        workplace: "Tech Zone FZCO",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Rania Mostafa",
    guardianPhone: "+971-50-993-5454",
    guardianEmail: "rania.mostafa@email.com",
    status: "rejected",
    submittedDate: "2027-05-07",
    tests: [],
    interviews: [],
    documents: [
      {
        id: "DOC-020-001",
        type: "School Records",
        name: "school_records_adam.pdf",
        status: "complete",
        uploadedDate: "2027-05-07",
      },
    ],
  },
];

export const mockApplications: Application[] = baseMockApplications.map(
  enrichApplicationStudentNames,
);

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
    duration: "90",
    location: "Main Campus - Room 101",
    proctor: "Dr. Sarah Johnson",
    proctorPhone: "+971-50-123-4567",
    guardianName: "Hassan Ahmed",
    guardianPhone: "+971-50-123-4567",
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
    duration: "90",
    location: "Main Campus - Room 102",
    proctor: "Mr. Ahmed Al-Mansoori",
    proctorPhone: "+971-50-234-5678",
    guardianName: "Salem Hassan",
    guardianPhone: "+971-50-678-9012",
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
    duration: "90",
    location: "Main Campus - Room 101",
    proctor: "Ms. Fatima Al-Zaabi",
    proctorPhone: "+971-50-345-6789",
    guardianName: "Mariam Khalid",
    guardianPhone: "+971-50-789-0123",
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
    duration: "90",
    location: "Main Campus - Room 101",
    proctor: "Dr. Sarah Johnson",
    proctorPhone: "+971-50-123-4567",
    guardianName: "Khalid Mohammed",
    guardianPhone: "+971-50-456-7890",
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
    duration: "90",
    location: "Main Campus - Room 102",
    proctor: "Mr. Ahmed Al-Mansoori",
    proctorPhone: "+971-50-234-5678",
    guardianName: "Abdullah Omar",
    guardianPhone: "+971-50-345-6789",
    status: "scheduled",
    notes: "Scheduled for Noura Mariam - Grade 7",
  },
  {
    id: "TEST-006",
    applicationId: "APP-2026-004",
    type: "Placement Test",
    subject: "English",
    date: "2026-02-19",
    time: "02:00 PM",
    duration: "60",
    location: "Main Campus - Room 103",
    proctor: "Ms. Fatima Al-Zaabi",
    proctorPhone: "+971-50-345-6789",
    guardianName: "Khalid Mohammed",
    guardianPhone: "+971-50-456-7890",
    status: "scheduled",
    notes: "English language assessment for Layla Salem",
  },
  {
    id: "TEST-007",
    applicationId: "APP-2024-001",
    type: "Placement Test",
    subject: "Mathematics",
    date: "2026-01-15",
    time: "11:00 AM",
    duration: "60",
    location: "Main Campus - Room 104",
    proctor: "Dr. Mohammed Ali",
    proctorPhone: "+971-50-567-8901",
    guardianName: "Hassan Ahmed",
    guardianPhone: "+971-50-123-4567",
    status: "cancelled",
    notes: "Student was sick, test cancelled",
  },
  {
    id: "TEST-008",
    applicationId: "APP-2024-002",
    type: "Placement Test",
    subject: "Science",
    date: "2026-01-28",
    time: "01:00 PM",
    duration: "60",
    location: "Main Campus - Room 105",
    proctor: "Dr. Sarah Johnson",
    proctorPhone: "+971-50-123-4567",
    guardianName: "Salem Hassan",
    guardianPhone: "+971-50-678-9012",
    status: "rescheduled",
    notes: "Rescheduled due to proctor unavailability",
  },
  {
    id: "TEST-009",
    applicationId: "APP-2024-003",
    type: "Placement Test",
    subject: "Arabic",
    date: "2026-02-05",
    time: "10:00 AM",
    duration: "60",
    location: "Main Campus - Room 106",
    proctor: "Ms. Aisha Al-Hashimi",
    proctorPhone: "+971-50-678-9012",
    guardianName: "Mariam Khalid",
    guardianPhone: "+971-50-789-0123",
    status: "completed",
    score: 95,
    maxScore: 100,
    notes: "Exceptional Arabic language proficiency",
  },
  {
    id: "TEST-010",
    applicationId: "APP-2026-005",
    type: "Placement Test",
    subject: "Mathematics",
    date: "2026-02-22",
    time: "11:00 AM",
    duration: "60",
    location: "Main Campus - Room 107",
    proctor: "Dr. Mohammed Ali",
    proctorPhone: "+971-50-567-8901",
    guardianName: "Abdullah Omar",
    guardianPhone: "+971-50-345-6789",
    status: "scheduled",
    notes: "Mathematics placement test",
  },
  {
    id: "TEST-011",
    applicationId: "APP-2024-001",
    type: "Placement Test",
    subject: "English",
    date: "2026-01-18",
    time: "03:00 PM",
    duration: "60",
    location: "Main Campus - Room 108",
    proctor: "Ms. Fatima Al-Zaabi",
    proctorPhone: "+971-50-345-6789",
    guardianName: "Hassan Ahmed",
    guardianPhone: "+971-50-123-4567",
    status: "failed",
    score: 45,
    maxScore: 100,
    notes: "Needs additional English language support",
  },
  {
    id: "TEST-012",
    applicationId: "APP-2026-004",
    type: "Placement Test",
    subject: "Science",
    date: "2026-02-10",
    time: "09:00 AM",
    duration: "60",
    location: "Main Campus - Room 109",
    proctor: "Dr. Sarah Johnson",
    proctorPhone: "+971-50-123-4567",
    guardianName: "Khalid Mohammed",
    guardianPhone: "+971-50-456-7890",
    status: "cancelled",
    notes: "Family emergency, test cancelled",
  },
  {
    id: "TEST-013",
    applicationId: "APP-2024-002",
    type: "Placement Test",
    subject: "General",
    date: "2026-02-12",
    time: "02:00 PM",
    duration: "90",
    location: "Main Campus - Room 110",
    proctor: "Mr. Ahmed Al-Mansoori",
    proctorPhone: "+971-50-234-5678",
    guardianName: "Salem Hassan",
    guardianPhone: "+971-50-678-9012",
    status: "rescheduled",
    notes: "Rescheduled to accommodate student schedule",
  },
  {
    id: "TEST-014",
    applicationId: "APP-2024-003",
    type: "Placement Test",
    subject: "Mathematics",
    date: "2026-02-15",
    time: "10:00 AM",
    duration: "60",
    location: "Main Campus - Room 111",
    proctor: "Dr. Mohammed Ali",
    proctorPhone: "+971-50-567-8901",
    guardianName: "Mariam Khalid",
    guardianPhone: "+971-50-789-0123",
    status: "completed",
    score: 78,
    maxScore: 100,
    notes: "Good understanding of mathematical concepts",
  },
  {
    id: "TEST-015",
    applicationId: "APP-2026-005",
    type: "Placement Test",
    subject: "English",
    date: "2026-02-25",
    time: "01:00 PM",
    duration: "60",
    location: "Main Campus - Room 112",
    proctor: "Ms. Fatima Al-Zaabi",
    proctorPhone: "+971-50-345-6789",
    guardianName: "Abdullah Omar",
    guardianPhone: "+971-50-345-6789",
    status: "scheduled",
    notes: "English proficiency assessment",
  },
  {
    id: "TEST-016",
    applicationId: "APP-2025-013",
    type: "Placement Test",
    subject: "General",
    date: "2024-10-14",
    time: "09:30 AM",
    duration: "90",
    location: "Main Campus - Room 113",
    proctor: "Dr. Sarah Johnson",
    proctorPhone: "+971-50-123-4567",
    guardianName: "Nasser Al Hammadi",
    guardianPhone: "+971-50-945-6677",
    status: "completed",
    score: 89,
    maxScore: 100,
    notes: "Strong readiness for Grade 4.",
  },
  {
    id: "TEST-017",
    applicationId: "APP-2025-014",
    type: "Placement Test",
    subject: "General",
    date: "2025-02-18",
    time: "10:00 AM",
    duration: "90",
    location: "Main Campus - Room 114",
    proctor: "Mr. Ahmed Al-Mansoori",
    proctorPhone: "+971-50-234-5678",
    guardianName: "Mona Youssef",
    guardianPhone: "+971-50-956-7788",
    status: "completed",
    score: 84,
    maxScore: 100,
    notes: "Good performance with minor support needed in writing.",
  },
  {
    id: "TEST-018",
    applicationId: "APP-2025-015",
    type: "Placement Test",
    subject: "General",
    date: "2025-05-02",
    time: "11:00 AM",
    duration: "90",
    location: "Main Campus - Room 115",
    proctor: "Ms. Fatima Al-Zaabi",
    proctorPhone: "+971-50-345-6789",
    guardianName: "Amal Farouk",
    guardianPhone: "+971-50-989-1010",
    status: "completed",
    score: 58,
    maxScore: 100,
    notes: "Below benchmark for current intake.",
  },
  {
    id: "TEST-019",
    applicationId: "APP-2026-013",
    type: "Placement Test",
    subject: "General",
    date: "2025-10-16",
    time: "01:00 PM",
    duration: "90",
    location: "Main Campus - Room 116",
    proctor: "Dr. Mohammed Ali",
    proctorPhone: "+971-50-567-8901",
    guardianName: "Faisal Rahman",
    guardianPhone: "+971-50-990-2121",
    status: "completed",
    score: 91,
    maxScore: 100,
    notes: "Excellent results across all sections.",
  },
  {
    id: "TEST-020",
    applicationId: "APP-2026-014",
    type: "Placement Test",
    subject: "General",
    date: "2026-05-14",
    time: "09:00 AM",
    duration: "90",
    location: "Main Campus - Room 117",
    proctor: "Dr. Sarah Johnson",
    proctorPhone: "+971-50-123-4567",
    guardianName: "Sara Al Falahi",
    guardianPhone: "+971-50-991-3232",
    status: "completed",
    score: 79,
    maxScore: 100,
    notes: "Solid performance with limited Grade 9 capacity.",
  },
  {
    id: "TEST-021",
    applicationId: "APP-2027-013",
    type: "Placement Test",
    subject: "General",
    date: "2026-10-15",
    time: "10:30 AM",
    duration: "90",
    location: "Main Campus - Room 118",
    proctor: "Mr. Ahmed Al-Mansoori",
    proctorPhone: "+971-50-234-5678",
    guardianName: "Omar Saeed",
    guardianPhone: "+971-50-901-2233",
    status: "completed",
    score: 87,
    maxScore: 100,
    notes: "Strong application for the upcoming cycle.",
  },
  {
    id: "TEST-022",
    applicationId: "APP-2027-014",
    type: "Placement Test",
    subject: "General",
    date: "2027-02-10",
    time: "09:30 AM",
    duration: "90",
    location: "Main Campus - Room 119",
    proctor: "Ms. Fatima Al-Zaabi",
    proctorPhone: "+971-50-345-6789",
    guardianName: "Waleed Jaber",
    guardianPhone: "+971-50-992-4343",
    status: "completed",
    score: 86,
    maxScore: 100,
    notes: "Good fit for Grade 6 intake.",
  },
  {
    id: "TEST-023",
    applicationId: "APP-2027-015",
    type: "Placement Test",
    subject: "General",
    date: "2027-05-12",
    time: "02:00 PM",
    duration: "90",
    location: "Main Campus - Room 120",
    proctor: "Dr. Mohammed Ali",
    proctorPhone: "+971-50-567-8901",
    guardianName: "Rania Mostafa",
    guardianPhone: "+971-50-993-5454",
    status: "completed",
    score: 61,
    maxScore: 100,
    notes: "Did not meet the admissions threshold this term.",
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
  {
    id: "INT-006",
    applicationId: "APP-2026-006",
    date: "2026-02-10",
    time: "11:00 AM",
    interviewer: "Ms. Fatima Al-Zaabi",
    location: "Admin Building - Office 205",
    status: "cancelled",
    notes: "Family emergency. Interview cancelled by parent request.",
  },
  {
    id: "INT-007",
    applicationId: "APP-2026-007",
    date: "2026-02-25",
    time: "09:00 AM",
    interviewer: "Dr. Sarah Johnson",
    location: "Admin Building - Office 205",
    status: "rescheduled",
    notes:
      "Originally scheduled for Feb 18. Rescheduled due to interviewer availability.",
  },
  {
    id: "INT-008",
    applicationId: "APP-2026-008",
    date: "2026-02-26",
    time: "01:00 PM",
    interviewer: "Mr. Ahmed Al-Mansoori",
    location: "Admin Building - Office 206",
    status: "scheduled",
    notes: "Initial interview for Grade 8 applicant",
  },
  {
    id: "INT-009",
    applicationId: "APP-2026-009",
    date: "2026-02-12",
    time: "03:30 PM",
    interviewer: "Ms. Fatima Al-Zaabi",
    location: "Admin Building - Office 205",
    status: "completed",
    rating: 3,
    notes:
      "Average performance. Needs improvement in communication skills. Consider for waitlist.",
  },
  {
    id: "INT-010",
    applicationId: "APP-2026-010",
    date: "2026-02-15",
    time: "10:30 AM",
    interviewer: "Dr. Sarah Johnson",
    location: "Admin Building - Office 205",
    status: "cancelled",
    notes: "Student accepted offer from another school. Interview cancelled.",
  },
  {
    id: "INT-011",
    applicationId: "APP-2026-011",
    date: "2026-02-27",
    time: "02:30 PM",
    interviewer: "Mr. Ahmed Al-Mansoori",
    location: "Admin Building - Office 206",
    status: "rescheduled",
    notes: "Rescheduled from Feb 20 due to parent work conflict.",
  },
  {
    id: "INT-012",
    applicationId: "APP-2026-012",
    date: "2026-02-28",
    time: "11:30 AM",
    interviewer: "Ms. Fatima Al-Zaabi",
    location: "Admin Building - Office 205",
    status: "scheduled",
    notes: "Interview for Grade 10 transfer student",
  },
  {
    id: "INT-013",
    applicationId: "APP-2025-013",
    date: "2024-10-21",
    time: "02:00 PM",
    interviewer: "Dr. Sarah Johnson",
    location: "Admin Building - Office 207",
    status: "completed",
    rating: 5,
    notes: "Warm family engagement and strong readiness for Grade 4.",
  },
  {
    id: "INT-014",
    applicationId: "APP-2025-014",
    date: "2025-02-24",
    time: "01:30 PM",
    interviewer: "Mr. Ahmed Al-Mansoori",
    location: "Admin Building - Office 208",
    status: "completed",
    rating: 4,
    notes: "Recommended with light academic support in writing.",
  },
  {
    id: "INT-015",
    applicationId: "APP-2025-015",
    date: "2025-05-08",
    time: "10:00 AM",
    interviewer: "Ms. Fatima Al-Zaabi",
    location: "Admin Building - Office 207",
    status: "completed",
    rating: 2,
    notes: "Not yet ready for the requested level this cycle.",
  },
  {
    id: "INT-016",
    applicationId: "APP-2026-013",
    date: "2025-10-23",
    time: "03:00 PM",
    interviewer: "Dr. Mohammed Ali",
    location: "Admin Building - Office 209",
    status: "completed",
    rating: 5,
    notes: "Excellent interview and clear sibling-school alignment.",
  },
  {
    id: "INT-017",
    applicationId: "APP-2026-014",
    date: "2026-05-20",
    time: "11:00 AM",
    interviewer: "Dr. Sarah Johnson",
    location: "Admin Building - Office 207",
    status: "completed",
    rating: 4,
    notes: "Strong candidate, waitlisted due to limited Grade 9 seats.",
  },
  {
    id: "INT-018",
    applicationId: "APP-2027-013",
    date: "2026-10-22",
    time: "02:30 PM",
    interviewer: "Mr. Ahmed Al-Mansoori",
    location: "Admin Building - Office 208",
    status: "completed",
    rating: 5,
    notes: "Very positive interview and strong co-curricular fit.",
  },
  {
    id: "INT-019",
    applicationId: "APP-2027-014",
    date: "2027-02-17",
    time: "09:45 AM",
    interviewer: "Ms. Fatima Al-Zaabi",
    location: "Admin Building - Office 207",
    status: "completed",
    rating: 4,
    notes: "Recommended for admission with transportation follow-up.",
  },
  {
    id: "INT-020",
    applicationId: "APP-2027-015",
    date: "2027-05-19",
    time: "01:00 PM",
    interviewer: "Dr. Mohammed Ali",
    location: "Admin Building - Office 209",
    status: "completed",
    rating: 2,
    notes: "Interview did not sufficiently support admission this term.",
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
  {
    id: "DEC-006",
    applicationId: "APP-2025-013",
    decision: "accept",
    reason: "Strong academic readiness and excellent family interview.",
    decisionDate: "2024-10-28",
    decidedBy: "Admissions Committee",
  },
  {
    id: "DEC-007",
    applicationId: "APP-2025-014",
    decision: "accept",
    reason: "Good placement outcomes and positive interview recommendation.",
    decisionDate: "2025-02-27",
    decidedBy: "Admissions Committee",
  },
  {
    id: "DEC-008",
    applicationId: "APP-2025-015",
    decision: "reject",
    reason: "Assessment results were below the benchmark for this intake.",
    decisionDate: "2025-05-12",
    decidedBy: "Admissions Committee",
  },
  {
    id: "DEC-009",
    applicationId: "APP-2026-013",
    decision: "accept",
    reason: "Outstanding assessment and interview performance.",
    decisionDate: "2025-10-28",
    decidedBy: "Admissions Committee",
  },
  {
    id: "DEC-010",
    applicationId: "APP-2026-014",
    decision: "waitlist",
    reason: "Qualified candidate, but Grade 9 capacity is currently full.",
    decisionDate: "2026-05-24",
    decidedBy: "Admissions Committee",
  },
  {
    id: "DEC-011",
    applicationId: "APP-2027-013",
    decision: "accept",
    reason: "Excellent fit for the upcoming academic year intake.",
    decisionDate: "2026-10-29",
    decidedBy: "Admissions Committee",
  },
  {
    id: "DEC-012",
    applicationId: "APP-2027-014",
    decision: "accept",
    reason: "Met admissions criteria and interview feedback was positive.",
    decisionDate: "2027-02-21",
    decidedBy: "Admissions Committee",
  },
  {
    id: "DEC-013",
    applicationId: "APP-2027-015",
    decision: "reject",
    reason: "Application did not meet the required threshold this term.",
    decisionDate: "2027-05-23",
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

// Helper function to determine educational stage from grade
const getStageFromGrade = (grade: string): string => {
  const gradeNumber = parseInt(grade.replace(/\D/g, ""));
  if (gradeNumber >= 1 && gradeNumber <= 5) return "Primary";
  if (gradeNumber >= 6 && gradeNumber <= 9) return "Preparatory";
  if (gradeNumber >= 10 && gradeNumber <= 12) return "Secondary";
  return "Primary"; // Default
};

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
      first_name_ar: application.first_name_ar,
      father_name_ar: application.father_name_ar,
      grandfather_name_ar: application.grandfather_name_ar,
      family_name_ar: application.family_name_ar,
      first_name_en: application.first_name_en,
      father_name_en: application.father_name_en,
      grandfather_name_en: application.grandfather_name_en,
      family_name_en: application.family_name_en,
      full_name_ar: application.full_name_ar,
      full_name_en: application.full_name_en,
      gender: application.gender,
      dateOfBirth: application.dateOfBirth ?? application.date_of_birth,
      nationality: application.nationality,
      status: mapApplicationStatus(application.status),
      gradeRequested,
      stage: getStageFromGrade(gradeRequested),
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
    stage: "Preparatory",
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
    stage: "Preparatory",
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
    stage: "Preparatory",
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
    stage: "Preparatory",
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
    stage: "Preparatory",
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
    stage: "Preparatory",
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
    stage: "Preparatory",
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
    stage: "Preparatory",
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
    stage: "Secondary",
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
    stage: "Secondary",
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
    stage: "Preparatory",
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
    stage: "Preparatory",
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
    stage: "Preparatory",
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
  ...studentDummyData,
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
).concat(guardianDummyData);
export const mockStudentGuardianLinks: StudentGuardianLink[] = [
  ...guardianLinks,
  ...guardianLinkDummyData,
];

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
        xpAdjustment:
          seededNumber(`${student.id}-xp-sign-${i}`, 0, 1) === 0
            ? seededNumber(`${student.id}-xp-negative-${i}`, -18, -3)
            : seededNumber(`${student.id}-xp-positive-${i}`, 4, 20),
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
