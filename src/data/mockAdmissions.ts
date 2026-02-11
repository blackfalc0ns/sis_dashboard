// FILE: src/data/mockAdmissions.ts

import { Application, Test, Interview } from "@/types/admissions";

export const mockApplications: Application[] = [
  {
    id: "APP-2024-001",
    leadId: "L004",
    source: "referral",

    // Student Information
    full_name_ar: "ليلى محمد",
    full_name_en: "Layla Mohammed",
    studentName: "Layla Mohammed",
    studentNameArabic: "ليلى محمد",
    gender: "Female",
    date_of_birth: "2015-03-20",
    dateOfBirth: "2015-03-20",
    nationality: "UAE",

    // Contact Information
    address_line: "Al Wasl Road, Villa 123",
    city: "Dubai",
    district: "Jumeirah",
    student_phone: "",
    student_email: "",

    // Academic Information
    grade_requested: "Grade 4",
    gradeRequested: "Grade 4",
    previous_school: "Al Noor School",
    previousSchool: "Al Noor School",
    join_date: "2024-09-01",

    // Medical & Notes
    medical_conditions: "None",
    notes: "Excellent student with strong academic background",

    // Guardians
    guardians: [
      {
        id: "G001",
        full_name: "Mohammed Ali",
        relation: "father",
        phone_primary: "050-234-5678",
        phone_secondary: "04-123-4567",
        email: "mohammed@email.com",
        national_id: "784-1234-5678901-2",
        job_title: "Engineer",
        workplace: "Emirates Engineering",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
      {
        id: "G002",
        full_name: "Fatima Ali",
        relation: "mother",
        phone_primary: "050-234-5679",
        phone_secondary: "",
        email: "fatima@email.com",
        national_id: "784-1234-5678902-3",
        job_title: "Teacher",
        workplace: "Dubai International School",
        is_primary: false,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Mohammed Ali",
    guardianPhone: "050-234-5678",
    guardianEmail: "mohammed@email.com",

    // Status & Dates
    status: "under_review",
    submittedDate: "2026-01-20",

    // Related Data
    documents: [
      {
        id: "D001",
        type: "Birth Certificate",
        name: "birth_cert.pdf",
        status: "complete",
        uploadedDate: "2024-01-20",
      },
      {
        id: "D002",
        type: "Passport Copy",
        name: "passport.pdf",
        status: "complete",
        uploadedDate: "2024-01-20",
      },
      {
        id: "D003",
        type: "Medical Report",
        name: "medical.pdf",
        status: "missing",
      },
      {
        id: "D004",
        type: "Previous School Certificate",
        name: "school_cert.pdf",
        status: "complete",
        uploadedDate: "2024-01-20",
      },
    ],
    tests: [
      {
        id: "T001",
        applicationId: "APP-2024-001",
        type: "Placement Test",
        subject: "Mathematics",
        date: "2024-01-25",
        time: "10:00 AM",
        location: "Room 101",
        proctor: "Sara Ahmed",
        status: "completed",
        score: 85,
        maxScore: 100,
      },
    ],
    interviews: [
      {
        id: "I001",
        applicationId: "APP-2024-001",
        date: "2024-01-26",
        time: "2:00 PM",
        interviewer: "Dr. Hassan Ali",
        location: "Admin Office",
        status: "completed",
        rating: 4,
        notes: "Excellent communication skills, motivated student",
      },
    ],
  },
  {
    id: "APP-2024-002",
    source: "in_app",

    // Student Information
    full_name_ar: "خالد أحمد",
    full_name_en: "Khalid Ahmed",
    studentName: "Khalid Ahmed",
    gender: "Male",
    date_of_birth: "2014-07-15",
    dateOfBirth: "2014-07-15",
    nationality: "Saudi Arabia",

    // Contact Information
    address_line: "Sheikh Zayed Road, Apt 456",
    city: "Dubai",
    district: "Business Bay",

    // Academic Information
    grade_requested: "Grade 5",
    gradeRequested: "Grade 5",
    previous_school: "Riyadh International School",
    previousSchool: "Riyadh International School",
    join_date: "2024-09-01",

    // Medical & Notes
    medical_conditions: "Asthma - requires inhaler",

    // Guardians
    guardians: [
      {
        id: "G003",
        full_name: "Ahmed Hassan",
        relation: "father",
        phone_primary: "050-567-8901",
        phone_secondary: "",
        email: "ahmed.h@email.com",
        national_id: "784-2345-6789012-3",
        job_title: "Business Manager",
        workplace: "Al Futtaim Group",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Ahmed Hassan",
    guardianPhone: "050-567-8901",
    guardianEmail: "ahmed.h@email.com",

    // Status & Dates
    status: "submitted",
    submittedDate: "2026-01-22",

    // Related Data
    documents: [
      {
        id: "D005",
        type: "Birth Certificate",
        name: "birth.pdf",
        status: "complete",
      },
      {
        id: "D006",
        type: "Passport Copy",
        name: "passport.pdf",
        status: "missing",
      },
      {
        id: "D007",
        type: "Medical Report",
        name: "medical.pdf",
        status: "missing",
      },
      {
        id: "D008",
        type: "Previous School Certificate",
        name: "cert.pdf",
        status: "complete",
      },
    ],
    tests: [],
    interviews: [],
  },
  {
    id: "APP-2024-003",
    source: "walk_in",

    // Student Information
    full_name_ar: "مريم سعيد",
    full_name_en: "Mariam Saeed",
    studentName: "Mariam Saeed",
    gender: "Female",
    date_of_birth: "2013-11-08",
    dateOfBirth: "2013-11-08",
    nationality: "Egypt",

    // Contact Information
    address_line: "Palm Jumeirah, Villa 789",
    city: "Dubai",
    district: "Palm Jumeirah",
    student_email: "mariam.saeed@email.com",

    // Academic Information
    grade_requested: "Grade 6",
    gradeRequested: "Grade 6",
    previous_school: "Cairo American School",
    previousSchool: "Cairo American School",
    join_date: "2024-09-01",

    // Medical & Notes
    medical_conditions: "None",
    notes: "Gifted student, advanced in mathematics",

    // Guardians
    guardians: [
      {
        id: "G004",
        full_name: "Saeed Ali",
        relation: "father",
        phone_primary: "050-678-9012",
        phone_secondary: "04-234-5678",
        email: "saeed@email.com",
        national_id: "784-3456-7890123-4",
        job_title: "Doctor",
        workplace: "Dubai Healthcare City",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Saeed Ali",
    guardianPhone: "050-678-9012",
    guardianEmail: "saeed@email.com",

    // Status & Dates
    status: "accepted",
    submittedDate: "2026-01-18",

    // Related Data
    documents: [
      {
        id: "D009",
        type: "Birth Certificate",
        name: "birth.pdf",
        status: "complete",
      },
      {
        id: "D010",
        type: "Passport Copy",
        name: "passport.pdf",
        status: "complete",
      },
      {
        id: "D011",
        type: "Medical Report",
        name: "medical.pdf",
        status: "complete",
      },
      {
        id: "D012",
        type: "Previous School Certificate",
        name: "cert.pdf",
        status: "complete",
      },
    ],
    tests: [
      {
        id: "T002",
        applicationId: "APP-2024-003",
        type: "Placement Test",
        subject: "English",
        date: "2024-01-22",
        time: "11:00 AM",
        location: "Room 102",
        status: "completed",
        score: 92,
        maxScore: 100,
      },
    ],
    interviews: [
      {
        id: "I002",
        applicationId: "APP-2024-003",
        date: "2024-01-23",
        time: "3:00 PM",
        interviewer: "Ms. Aisha",
        location: "Admin Office",
        status: "completed",
        rating: 5,
      },
    ],
    decision: {
      id: "DEC001",
      applicationId: "APP-2024-003",
      decision: "accept",
      reason: "Excellent test scores and interview performance",
      decisionDate: "2024-01-24",
      decidedBy: "Admissions Committee",
    },
  },
  {
    id: "APP-2024-004",
    source: "in_app",

    // Student Information
    full_name_ar: "يوسف إبراهيم",
    full_name_en: "Youssef Ibrahim",
    studentName: "Youssef Ibrahim",
    gender: "Male",
    date_of_birth: "2015-05-12",
    dateOfBirth: "2015-05-12",
    nationality: "Jordan",

    // Contact Information
    address_line: "Jumeirah Beach Road, Apt 321",
    city: "Dubai",
    district: "Jumeirah",

    // Academic Information
    grade_requested: "Grade 4",
    gradeRequested: "Grade 4",
    previous_school: "Amman Baccalaureate School",
    previousSchool: "Amman Baccalaureate School",
    join_date: "2024-09-01",

    // Guardians
    guardians: [
      {
        id: "G005",
        full_name: "Ibrahim Khalil",
        relation: "father",
        phone_primary: "050-789-1234",
        phone_secondary: "",
        email: "ibrahim@email.com",
        national_id: "784-4567-8901234-5",
        job_title: "Architect",
        workplace: "Dubai Design Studio",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Ibrahim Khalil",
    guardianPhone: "050-789-1234",
    guardianEmail: "ibrahim@email.com",

    // Status & Dates
    status: "documents_pending",
    submittedDate: "2026-01-23",

    // Related Data
    documents: [
      {
        id: "D013",
        type: "Birth Certificate",
        name: "birth.pdf",
        status: "complete",
      },
      {
        id: "D014",
        type: "Passport Copy",
        name: "passport.pdf",
        status: "missing",
      },
      {
        id: "D015",
        type: "Medical Report",
        name: "medical.pdf",
        status: "missing",
      },
      {
        id: "D016",
        type: "Previous School Certificate",
        name: "cert.pdf",
        status: "missing",
      },
    ],
    tests: [],
    interviews: [],
  },
  {
    id: "APP-2024-005",
    source: "referral",

    // Student Information
    full_name_ar: "نور عبدالله",
    full_name_en: "Noor Abdullah",
    studentName: "Noor Abdullah",
    gender: "Female",
    date_of_birth: "2014-09-25",
    dateOfBirth: "2014-09-25",
    nationality: "UAE",

    // Contact Information
    address_line: "Downtown Dubai, Apt 567",
    city: "Dubai",
    district: "Downtown",
    student_phone: "050-111-2222",

    // Academic Information
    grade_requested: "Grade 5",
    gradeRequested: "Grade 5",
    previous_school: "Dubai English Speaking School",
    previousSchool: "Dubai English Speaking School",
    join_date: "2024-09-01",

    // Medical & Notes
    medical_conditions: "Allergies to peanuts",
    notes: "Strong in arts and creative subjects",

    // Guardians
    guardians: [
      {
        id: "G006",
        full_name: "Abdullah Rashid",
        relation: "father",
        phone_primary: "050-890-2345",
        phone_secondary: "04-345-6789",
        email: "abdullah@email.com",
        national_id: "784-5678-9012345-6",
        job_title: "Lawyer",
        workplace: "Dubai Legal Consultancy",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Abdullah Rashid",
    guardianPhone: "050-890-2345",
    guardianEmail: "abdullah@email.com",

    // Status & Dates
    status: "waitlisted",
    submittedDate: "2026-01-19",

    // Related Data
    documents: [
      {
        id: "D017",
        type: "Birth Certificate",
        name: "birth.pdf",
        status: "complete",
      },
      {
        id: "D018",
        type: "Passport Copy",
        name: "passport.pdf",
        status: "complete",
      },
      {
        id: "D019",
        type: "Medical Report",
        name: "medical.pdf",
        status: "complete",
      },
      {
        id: "D020",
        type: "Previous School Certificate",
        name: "cert.pdf",
        status: "complete",
      },
    ],
    tests: [],
    interviews: [],
  },
  {
    id: "APP-2024-006",
    source: "walk_in",

    // Student Information
    full_name_ar: "عمر فيصل",
    full_name_en: "Omar Faisal",
    studentName: "Omar Faisal",
    gender: "Male",
    date_of_birth: "2012-12-03",
    dateOfBirth: "2012-12-03",
    nationality: "Kuwait",

    // Contact Information
    address_line: "Marina Walk, Apt 890",
    city: "Dubai",
    district: "Dubai Marina",
    student_email: "omar.faisal@email.com",
    student_phone: "050-222-3333",

    // Academic Information
    grade_requested: "Grade 7",
    gradeRequested: "Grade 7",
    previous_school: "Kuwait English School",
    previousSchool: "Kuwait English School",
    join_date: "2024-09-01",

    // Medical & Notes
    medical_conditions: "None",
    notes: "Behavioral issues noted in previous school",

    // Guardians
    guardians: [
      {
        id: "G007",
        full_name: "Faisal Mohammed",
        relation: "father",
        phone_primary: "050-901-3456",
        phone_secondary: "",
        email: "faisal@email.com",
        national_id: "784-6789-0123456-7",
        job_title: "Businessman",
        workplace: "Self-employed",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Faisal Mohammed",
    guardianPhone: "050-901-3456",
    guardianEmail: "faisal@email.com",

    // Status & Dates
    status: "rejected",
    submittedDate: "2026-01-17",

    // Related Data
    documents: [
      {
        id: "D021",
        type: "Birth Certificate",
        name: "birth.pdf",
        status: "complete",
      },
      {
        id: "D022",
        type: "Passport Copy",
        name: "passport.pdf",
        status: "complete",
      },
      {
        id: "D023",
        type: "Medical Report",
        name: "medical.pdf",
        status: "complete",
      },
      {
        id: "D024",
        type: "Previous School Certificate",
        name: "cert.pdf",
        status: "complete",
      },
    ],
    tests: [],
    interviews: [],
  },
  // Older applications (31-60 days)
  {
    id: "APP-2024-007",
    source: "in_app",
    full_name_ar: "سارة أحمد",
    full_name_en: "Sara Ahmed",
    studentName: "Sara Ahmed",
    gender: "Female",
    date_of_birth: "2014-04-10",
    dateOfBirth: "2014-04-10",
    nationality: "UAE",
    address_line: "Al Barsha, Villa 234",
    city: "Dubai",
    district: "Al Barsha",
    grade_requested: "Grade 5",
    gradeRequested: "Grade 5",
    previous_school: "Dubai Modern School",
    previousSchool: "Dubai Modern School",
    join_date: "2024-09-01",
    medical_conditions: "None",
    guardians: [
      {
        id: "G008",
        full_name: "Ahmed Khalil",
        relation: "father",
        phone_primary: "050-111-2222",
        phone_secondary: "",
        email: "ahmed.k@email.com",
        national_id: "784-7890-1234567-8",
        job_title: "Manager",
        workplace: "Dubai Corp",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Ahmed Khalil",
    guardianPhone: "050-111-2222",
    guardianEmail: "ahmed.k@email.com",
    status: "accepted",
    submittedDate: "2025-12-25",
    documents: [],
    tests: [],
    interviews: [],
  },
  {
    id: "APP-2024-008",
    source: "referral",
    full_name_ar: "محمد عمر",
    full_name_en: "Mohammed Omar",
    studentName: "Mohammed Omar",
    gender: "Male",
    date_of_birth: "2013-08-15",
    dateOfBirth: "2013-08-15",
    nationality: "Saudi Arabia",
    address_line: "JBR, Apt 567",
    city: "Dubai",
    district: "JBR",
    grade_requested: "Grade 6",
    gradeRequested: "Grade 6",
    previous_school: "Jeddah International",
    previousSchool: "Jeddah International",
    join_date: "2024-09-01",
    medical_conditions: "None",
    guardians: [
      {
        id: "G009",
        full_name: "Omar Hassan",
        relation: "father",
        phone_primary: "050-222-3333",
        phone_secondary: "",
        email: "omar.hassan@email.com",
        national_id: "784-8901-2345678-9",
        job_title: "Engineer",
        workplace: "Tech Solutions",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Omar Hassan",
    guardianPhone: "050-222-3333",
    guardianEmail: "omar.hassan@email.com",
    status: "under_review",
    submittedDate: "2025-12-15",
    documents: [],
    tests: [],
    interviews: [],
  },
  // Older applications (61-90 days)
  {
    id: "APP-2024-009",
    source: "walk_in",
    full_name_ar: "ليلى حسن",
    full_name_en: "Layla Hassan",
    studentName: "Layla Hassan",
    gender: "Female",
    date_of_birth: "2015-02-20",
    dateOfBirth: "2015-02-20",
    nationality: "Egypt",
    address_line: "Deira, Apt 789",
    city: "Dubai",
    district: "Deira",
    grade_requested: "Grade 4",
    gradeRequested: "Grade 4",
    previous_school: "Cairo School",
    previousSchool: "Cairo School",
    join_date: "2024-09-01",
    medical_conditions: "None",
    guardians: [
      {
        id: "G010",
        full_name: "Hassan Ali",
        relation: "father",
        phone_primary: "050-333-4444",
        phone_secondary: "",
        email: "hassan.ali@email.com",
        national_id: "784-9012-3456789-0",
        job_title: "Doctor",
        workplace: "City Hospital",
        is_primary: true,
        can_pickup: true,
        can_receive_notifications: true,
      },
    ],
    guardianName: "Hassan Ali",
    guardianPhone: "050-333-4444",
    guardianEmail: "hassan.ali@email.com",
    status: "accepted",
    submittedDate: "2025-11-20",
    documents: [],
    tests: [],
    interviews: [],
  },
];

export const mockTests: Test[] = [
  {
    id: "T003",
    applicationId: "APP-2024-002",
    type: "Placement Test",
    subject: "Mathematics",
    date: "2024-01-28",
    time: "10:00 AM",
    location: "Room 101",
    proctor: "Sara Ahmed",
    status: "scheduled",
  },
  {
    id: "T004",
    applicationId: "APP-2024-004",
    type: "Placement Test",
    subject: "Science",
    date: "2024-01-29",
    time: "2:00 PM",
    location: "Lab 1",
    status: "scheduled",
  },
];

export const mockInterviews: Interview[] = [
  {
    id: "I003",
    applicationId: "APP-2024-002",
    date: "2024-01-30",
    time: "11:00 AM",
    interviewer: "Dr. Hassan Ali",
    location: "Admin Office",
    status: "scheduled",
  },
];
