import type {
  CreateReinforcementRewardPayload,
  CreateReinforcementTemplatePayload,
  ReinforcementOverview,
  ReinforcementReward,
  ReinforcementReviewItem,
  ReinforcementRewardType,
  ReinforcementSource,
  ReinforcementStage,
  ReinforcementStatus,
  ReinforcementTask,
  ReinforcementTaskFilters,
  ReinforcementTemplate,
} from "../types/reinforcement";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const now = new Date("2026-03-26T09:00:00.000Z");

const studentSeeds = [
  { studentId: "STD-1001", studentName: "Ahmed Hassan", classId: "CLS-7A", className: "Grade 7 - A" },
  { studentId: "STD-1002", studentName: "Sara Mohammed", classId: "CLS-6B", className: "Grade 6 - B" },
  { studentId: "STD-1003", studentName: "Omar Abdullah", classId: "CLS-8A", className: "Grade 8 - A" },
  { studentId: "STD-1004", studentName: "Fatima Khalid", classId: "CLS-5C", className: "Grade 5 - C" },
  { studentId: "STD-1005", studentName: "Layla Salem", classId: "CLS-7B", className: "Grade 7 - B" },
  { studentId: "STD-1006", studentName: "Noura Mariam", classId: "CLS-9A", className: "Grade 9 - A" },
];

const createStage = (
  id: string,
  titleEn: string,
  titleAr: string,
  proofType: ReinforcementStage["proofType"],
  overrides: Partial<ReinforcementStage> = {},
): ReinforcementStage => ({
  id,
  titleEn,
  titleAr,
  proofType,
  isCompleted: false,
  isApproved: false,
  ...overrides,
});

let templatesStore: ReinforcementTemplate[] = [
  {
    id: "TPL-001",
    titleAr: "مبادرة مساعدة الزملاء",
    titleEn: "Peer Support Initiative",
    descriptionAr: "تكليف الطالب بمساندة زميل في واجب أسبوعي وتوثيق النتائج.",
    descriptionEn: "Assign the student to support a peer in a weekly task and document the outcome.",
    rewardType: "moral",
    rewardValue: "Recognition certificate",
    isActive: true,
    createdAt: "2026-03-05T08:00:00.000Z",
    stages: [
      createStage("TPL-001-ST-1", "Identify a peer need", "تحديد احتياج زميل", "none"),
      createStage("TPL-001-ST-2", "Provide support", "تقديم الدعم", "image"),
      createStage("TPL-001-ST-3", "Teacher reflection", "انعكاس المعلم", "document"),
    ],
  },
  {
    id: "TPL-002",
    titleAr: "تحدي الانضباط الذاتي",
    titleEn: "Self-Discipline Challenge",
    descriptionAr: "سلسلة مهام قصيرة لتحسين الالتزام والسلوك الإيجابي.",
    descriptionEn: "A short task series to improve consistency and positive behavior.",
    rewardType: "xp",
    rewardValue: "150 XP",
    isActive: true,
    createdAt: "2026-03-10T08:00:00.000Z",
    stages: [
      createStage("TPL-002-ST-1", "Daily checklist", "قائمة يومية", "document"),
      createStage("TPL-002-ST-2", "Parent signoff", "اعتماد ولي الأمر", "image"),
    ],
  },
  {
    id: "TPL-003",
    titleAr: "سفير القراءة",
    titleEn: "Reading Ambassador",
    descriptionAr: "تحفيز الطالب على قيادة نشاط قراءة صغير داخل الصف.",
    descriptionEn: "Encourage the student to lead a small reading activity in class.",
    rewardType: "badge",
    rewardValue: "Reading Star",
    isActive: false,
    createdAt: "2026-03-14T08:00:00.000Z",
    stages: [
      createStage("TPL-003-ST-1", "Prepare reading notes", "إعداد ملاحظات القراءة", "document"),
      createStage("TPL-003-ST-2", "Lead mini session", "قيادة جلسة مصغرة", "video"),
    ],
  },
];

let rewardsStore: ReinforcementReward[] = [
  { id: "RWD-001", nameAr: "شهادة تقدير", nameEn: "Recognition Certificate", type: "moral", defaultValue: "Certificate", isActive: true },
  { id: "RWD-002", nameAr: "قسيمة مكتبة", nameEn: "Library Voucher", type: "financial", defaultValue: "50 SAR", isActive: true },
  { id: "RWD-003", nameAr: "نقاط خبرة", nameEn: "XP Points", type: "xp", defaultValue: "120 XP", isActive: true },
  { id: "RWD-004", nameAr: "شارة القائد", nameEn: "Leader Badge", type: "badge", defaultValue: "Leadership Badge", isActive: true },
];

let tasksStore: ReinforcementTask[] = [
  {
    id: "RT-1001",
    titleAr: "قيادة ركن القراءة",
    titleEn: "Lead the Reading Corner",
    descriptionAr: "تنظيم ركن قراءة لمدة أسبوع مع تسجيل حضور الزملاء.",
    descriptionEn: "Organize the reading corner for one week and track peer participation.",
    studentId: studentSeeds[4].studentId,
    studentName: studentSeeds[4].studentName,
    classId: studentSeeds[4].classId,
    className: studentSeeds[4].className,
    source: "teacher",
    status: "under_review",
    rewardType: "badge",
    rewardValue: "Reading Star Badge",
    dueDate: "2026-03-28",
    assignedById: "EMP-201",
    assignedByName: "Ms. Huda",
    createdAt: "2026-03-18T07:00:00.000Z",
    updatedAt: "2026-03-25T10:20:00.000Z",
    stages: [
      createStage("RT-1001-ST-1", "Prepare activity board", "إعداد لوحة النشاط", "image", {
        isCompleted: true,
        isApproved: true,
        submittedAt: "2026-03-19T09:15:00.000Z",
        proofUrl: "/proofs/reading-board.jpg",
      }),
      createStage("RT-1001-ST-2", "Facilitate group session", "تنفيذ جلسة جماعية", "video", {
        isCompleted: true,
        isApproved: false,
        submittedAt: "2026-03-25T10:20:00.000Z",
        proofUrl: "/proofs/reading-session.mp4",
      }),
    ],
  },
  {
    id: "RT-1002",
    titleAr: "مبادرة النظام الصباحي",
    titleEn: "Morning Routine Initiative",
    descriptionAr: "الالتزام بروتين الصباح لمدة خمسة أيام متتالية.",
    descriptionEn: "Maintain the morning routine consistently for five consecutive days.",
    studentId: studentSeeds[0].studentId,
    studentName: studentSeeds[0].studentName,
    classId: studentSeeds[0].classId,
    className: studentSeeds[0].className,
    source: "system",
    status: "active",
    rewardType: "xp",
    rewardValue: "100 XP",
    dueDate: "2026-03-30",
    assignedById: "SYS-001",
    assignedByName: "Behavior Engine",
    createdAt: "2026-03-21T08:30:00.000Z",
    updatedAt: "2026-03-24T11:00:00.000Z",
    stages: [
      createStage("RT-1002-ST-1", "Attendance streak", "سلسلة الحضور", "none", { isCompleted: true, isApproved: true, submittedAt: "2026-03-22T08:00:00.000Z" }),
      createStage("RT-1002-ST-2", "Uniform check", "فحص الزي", "image", { isCompleted: false, isApproved: false }),
      createStage("RT-1002-ST-3", "Reflection note", "ملاحظة انعكاسية", "document", { isCompleted: false, isApproved: false }),
    ],
  },
  {
    id: "RT-1003",
    titleAr: "مساعدة زميل أكاديميًا",
    titleEn: "Academic Peer Support",
    descriptionAr: "دعم زميل في مراجعة مهارات الرياضيات الأساسية.",
    descriptionEn: "Support a peer with revision of core math skills.",
    studentId: studentSeeds[1].studentId,
    studentName: studentSeeds[1].studentName,
    classId: studentSeeds[1].classId,
    className: studentSeeds[1].className,
    source: "teacher",
    status: "completed",
    rewardType: "moral",
    rewardValue: "Recognition Certificate",
    dueDate: "2026-03-22",
    assignedById: "EMP-102",
    assignedByName: "Mr. Kareem",
    createdAt: "2026-03-12T09:00:00.000Z",
    updatedAt: "2026-03-23T14:40:00.000Z",
    stages: [
      createStage("RT-1003-ST-1", "Plan support session", "تخطيط جلسة الدعم", "document", { isCompleted: true, isApproved: true, submittedAt: "2026-03-13T09:10:00.000Z" }),
      createStage("RT-1003-ST-2", "Deliver support", "تنفيذ الدعم", "image", { isCompleted: true, isApproved: true, submittedAt: "2026-03-18T10:15:00.000Z", proofUrl: "/proofs/support.jpg" }),
      createStage("RT-1003-ST-3", "Teacher signoff", "اعتماد المعلم", "none", { isCompleted: true, isApproved: true, submittedAt: "2026-03-23T14:40:00.000Z" }),
    ],
  },
  {
    id: "RT-1004",
    titleAr: "تحدي القيادة الصفية",
    titleEn: "Class Leadership Challenge",
    descriptionAr: "إدارة مهام تنظيم الصف أثناء أسبوع الاختبارات.",
    descriptionEn: "Manage class organization tasks during assessment week.",
    studentId: studentSeeds[2].studentId,
    studentName: studentSeeds[2].studentName,
    classId: studentSeeds[2].classId,
    className: studentSeeds[2].className,
    source: "parent",
    status: "in_progress",
    rewardType: "badge",
    rewardValue: "Leader Badge",
    dueDate: "2026-03-31",
    assignedById: "PAR-501",
    assignedByName: "Parent Portal",
    createdAt: "2026-03-20T07:30:00.000Z",
    updatedAt: "2026-03-24T12:10:00.000Z",
    stages: [
      createStage("RT-1004-ST-1", "Daily prep checklist", "قائمة التحضير اليومية", "document", { isCompleted: true, isApproved: true, submittedAt: "2026-03-21T08:00:00.000Z" }),
      createStage("RT-1004-ST-2", "Lead class line-up", "قيادة اصطفاف الصف", "video", { isCompleted: true, isApproved: false, submittedAt: "2026-03-24T12:10:00.000Z", proofUrl: "/proofs/lineup.mp4" }),
      createStage("RT-1004-ST-3", "Feedback summary", "ملخص التغذية الراجعة", "document"),
    ],
  },
  {
    id: "RT-1005",
    titleAr: "تحدي الحضور المبكر",
    titleEn: "Early Arrival Challenge",
    descriptionAr: "الالتزام بالحضور المبكر ثلاث مرات خلال الأسبوع.",
    descriptionEn: "Arrive early three times during the week.",
    studentId: studentSeeds[3].studentId,
    studentName: studentSeeds[3].studentName,
    classId: studentSeeds[3].classId,
    className: studentSeeds[3].className,
    source: "system",
    status: "rejected",
    rewardType: "financial",
    rewardValue: "25 SAR voucher",
    dueDate: "2026-03-24",
    assignedById: "SYS-001",
    assignedByName: "Behavior Engine",
    createdAt: "2026-03-15T09:20:00.000Z",
    updatedAt: "2026-03-24T09:55:00.000Z",
    stages: [
      createStage("RT-1005-ST-1", "Attendance proof", "إثبات الحضور", "image", {
        isCompleted: true,
        isApproved: false,
        submittedAt: "2026-03-23T08:05:00.000Z",
        proofUrl: "/proofs/attendance.jpg",
      }),
    ],
  },
  {
    id: "RT-1006",
    titleAr: "دعم نادي العلوم",
    titleEn: "Support the Science Club",
    descriptionAr: "المشاركة في تجهيز عرض نادي العلوم وتوثيق الخطوات.",
    descriptionEn: "Help prepare the science club showcase and document progress.",
    studentId: studentSeeds[5].studentId,
    studentName: studentSeeds[5].studentName,
    classId: studentSeeds[5].classId,
    className: studentSeeds[5].className,
    source: "teacher",
    status: "archived",
    rewardType: "moral",
    rewardValue: "Principal appreciation",
    dueDate: "2026-03-18",
    assignedById: "EMP-333",
    assignedByName: "Mr. Sameh",
    createdAt: "2026-03-06T08:20:00.000Z",
    updatedAt: "2026-03-20T12:00:00.000Z",
    stages: [
      createStage("RT-1006-ST-1", "Collect materials", "جمع المواد", "image", { isCompleted: true, isApproved: true, submittedAt: "2026-03-08T09:15:00.000Z" }),
      createStage("RT-1006-ST-2", "Setup support", "المساعدة في التجهيز", "video", { isCompleted: true, isApproved: true, submittedAt: "2026-03-14T11:00:00.000Z" }),
    ],
  },
];

const statusOrder: ReinforcementStatus[] = [
  "draft",
  "active",
  "in_progress",
  "under_review",
  "completed",
  "rejected",
  "archived",
];

const rewardTypes: ReinforcementRewardType[] = ["moral", "financial", "xp", "badge"];
const sources: ReinforcementSource[] = ["teacher", "parent", "system"];

const getCompletedStages = (task: ReinforcementTask) =>
  task.stages.filter((stage) => stage.isCompleted).length;

const getCompletionRate = (task: ReinforcementTask) =>
  task.stages.length === 0 ? 0 : (getCompletedStages(task) / task.stages.length) * 100;

const isWithinDays = (dateIso: string, days: number) => {
  const date = new Date(dateIso);
  return now.getTime() - date.getTime() <= days * 24 * 60 * 60 * 1000;
};

const buildReviewQueue = (): ReinforcementReviewItem[] =>
  tasksStore
    .filter((task) => task.status === "under_review")
    .map((task) => {
      const latestSubmittedStage = [...task.stages]
        .filter((stage) => Boolean(stage.submittedAt))
        .sort((a, b) => (a.submittedAt || "").localeCompare(b.submittedAt || ""))
        .at(-1);

      return {
        id: `REV-${task.id}`,
        taskId: task.id,
        taskTitleAr: task.titleAr,
        taskTitleEn: task.titleEn,
        studentId: task.studentId,
        studentName: task.studentName,
        submittedAt: latestSubmittedStage?.submittedAt || task.updatedAt,
        proofType: latestSubmittedStage?.proofType || "none",
        source: task.source,
        status: "under_review",
        stageCountCompleted: getCompletedStages(task),
      };
    });

export async function getReinforcementOverview(): Promise<ReinforcementOverview> {
  const completedThisWeekTasks = tasksStore.filter(
    (task) => task.status === "completed" && isWithinDays(task.updatedAt, 7),
  );

  const rewardedStudents = new Set(
    tasksStore.filter((task) => task.status === "completed").map((task) => task.studentId),
  ).size;

  const totalRewardsIssued = tasksStore.filter((task) => task.status === "completed").length;
  const averageCompletionRate =
    tasksStore.reduce((sum, task) => sum + getCompletionRate(task), 0) /
    Math.max(tasksStore.length, 1);

  const topClassesMap = new Map<string, number>();
  const topStudentsMap = new Map<string, number>();

  tasksStore.forEach((task) => {
    const completionWeight = task.status === "completed" ? 2 : task.status === "under_review" ? 1.5 : 1;
    if (task.className) {
      topClassesMap.set(task.className, (topClassesMap.get(task.className) || 0) + completionWeight);
    }
    topStudentsMap.set(task.studentName, (topStudentsMap.get(task.studentName) || 0) + completionWeight);
  });

  return clone({
    kpis: {
      activeTasks: tasksStore.filter((task) => ["active", "in_progress"].includes(task.status)).length,
      underReview: tasksStore.filter((task) => task.status === "under_review").length,
      completedThisWeek: completedThisWeekTasks.length,
      rewardedStudents,
      averageCompletionRate: Number(averageCompletionRate.toFixed(1)),
      totalRewardsIssued,
    },
    tasksByStatus: statusOrder.map((status) => ({
      id: status,
      label: status,
      value: tasksStore.filter((task) => task.status === status).length,
    })),
    tasksBySource: sources.map((source) => ({
      id: source,
      label: source,
      value: tasksStore.filter((task) => task.source === source).length,
    })),
    rewardsByType: rewardTypes.map((type) => ({
      id: type,
      label: type,
      value: tasksStore.filter((task) => task.rewardType === type && task.status === "completed").length,
    })),
    topClasses: [...topClassesMap.entries()]
      .map(([name, value], index) => ({ id: `class-${index}`, name, value: Number(value.toFixed(1)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
    topStudents: [...topStudentsMap.entries()]
      .map(([name, value], index) => ({ id: `student-${index}`, name, value: Number(value.toFixed(1)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
    recentActivity: [
      {
        id: "ACT-1",
        titleAr: "تم إرسال مهمة للمراجعة",
        titleEn: "Task moved to review",
        descriptionAr: "ليلى سالم أنهت المرحلة الأخيرة لمهمة ركن القراءة.",
        descriptionEn: "Layla Salem submitted the final stage of the reading corner task.",
        timestamp: "2026-03-25T10:20:00.000Z",
        type: "review",
      },
      {
        id: "ACT-2",
        titleAr: "تم صرف مكافأة",
        titleEn: "Reward issued",
        descriptionAr: "سارة محمد حصلت على شهادة تقدير بعد إكمال مهمة الدعم الأكاديمي.",
        descriptionEn: "Sara Mohammed received a recognition certificate after completing Academic Peer Support.",
        timestamp: "2026-03-23T14:40:00.000Z",
        type: "reward",
      },
      {
        id: "ACT-3",
        titleAr: "تم إنشاء مهمة جديدة",
        titleEn: "New task created",
        descriptionAr: "تم إنشاء مهمة روتين الصباح لأحمد حسن بشكل آلي.",
        descriptionEn: "A morning routine task was automatically created for Ahmed Hassan.",
        timestamp: "2026-03-21T08:30:00.000Z",
        type: "task",
      },
    ],
    quickActions: [
      {
        id: "tasks",
        titleAr: "إدارة المهام",
        titleEn: "Manage tasks",
        href: "/reinforcement/tasks",
        descriptionAr: "مراجعة المهام الحالية والنسخ والأرشفة التمهيدية.",
        descriptionEn: "Review current tasks, duplicate flows, and mock archive actions.",
      },
      {
        id: "templates",
        titleAr: "تحرير القوالب",
        titleEn: "Edit templates",
        href: "/reinforcement/templates",
        descriptionAr: "إنشاء قوالب مهام قابلة لإعادة الاستخدام للمعلمين والإدارة.",
        descriptionEn: "Create reusable task templates for staff and administrators.",
      },
      {
        id: "review",
        titleAr: "طابور المراجعة",
        titleEn: "Review queue",
        href: "/reinforcement/review",
        descriptionAr: "الموافقة السريعة على الإنجازات المرسلة من الطلاب.",
        descriptionEn: "Quickly approve student submissions waiting for review.",
      },
    ],
  });
}

export async function getReinforcementTasks(
  filters: ReinforcementTaskFilters = {},
): Promise<ReinforcementTask[]> {
  const search = filters.search?.trim().toLowerCase();

  const tasks = tasksStore.filter((task) => {
    if (search) {
      const haystack = [
        task.id,
        task.studentName,
        task.className,
        task.titleEn,
        task.titleAr,
        task.assignedByName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) {
        return false;
      }
    }

    if (filters.student && task.studentId !== filters.student) return false;
    if (filters.className && task.className !== filters.className) return false;
    if (filters.source && filters.source !== "all" && task.source !== filters.source) return false;
    if (filters.status && filters.status !== "all" && task.status !== filters.status) return false;
    if (filters.rewardType && filters.rewardType !== "all" && task.rewardType !== filters.rewardType) return false;
    if (filters.dueDate && task.dueDate !== filters.dueDate) return false;

    return true;
  });

  return clone(tasks);
}

export async function getReinforcementTaskById(taskId: string): Promise<ReinforcementTask | null> {
  const task = tasksStore.find((item) => item.id === taskId);
  return task ? clone(task) : null;
}

export async function getReinforcementTemplates(): Promise<ReinforcementTemplate[]> {
  return clone(templatesStore);
}

export async function getReinforcementRewards(): Promise<ReinforcementReward[]> {
  return clone(rewardsStore);
}

export async function getReinforcementReviewQueue(): Promise<ReinforcementReviewItem[]> {
  return clone(buildReviewQueue());
}

export async function createReinforcementTemplate(
  payload: CreateReinforcementTemplatePayload,
): Promise<ReinforcementTemplate> {
  const template: ReinforcementTemplate = {
    ...payload,
    id: `TPL-${String(templatesStore.length + 1).padStart(3, "0")}`,
    createdAt: now.toISOString(),
  };
  templatesStore = [template, ...templatesStore];
  return clone(template);
}

export async function updateReinforcementTemplate(
  id: string,
  payload: Partial<CreateReinforcementTemplatePayload>,
): Promise<ReinforcementTemplate | null> {
  const current = templatesStore.find((template) => template.id === id);
  if (!current) return null;
  const next = { ...current, ...payload, stages: payload.stages || current.stages };
  templatesStore = templatesStore.map((template) => (template.id === id ? next : template));
  return clone(next);
}

export async function createReward(
  payload: CreateReinforcementRewardPayload,
): Promise<ReinforcementReward> {
  const reward: ReinforcementReward = {
    ...payload,
    id: `RWD-${String(rewardsStore.length + 1).padStart(3, "0")}`,
  };
  rewardsStore = [reward, ...rewardsStore];
  return clone(reward);
}

export async function updateReward(
  id: string,
  payload: Partial<CreateReinforcementRewardPayload>,
): Promise<ReinforcementReward | null> {
  const current = rewardsStore.find((reward) => reward.id === id);
  if (!current) return null;
  const next = { ...current, ...payload };
  rewardsStore = rewardsStore.map((reward) => (reward.id === id ? next : reward));
  return clone(next);
}

export async function approveTask(taskId: string): Promise<ReinforcementTask | null> {
  const task = tasksStore.find((item) => item.id === taskId);
  if (!task) return null;

  const updatedTask: ReinforcementTask = {
    ...task,
    status: "completed",
    updatedAt: now.toISOString(),
    stages: task.stages.map((stage) =>
      stage.isCompleted ? { ...stage, isApproved: true } : stage,
    ),
  };

  tasksStore = tasksStore.map((item) => (item.id === taskId ? updatedTask : item));
  return clone(updatedTask);
}

export async function rejectTask(taskId: string): Promise<ReinforcementTask | null> {
  const task = tasksStore.find((item) => item.id === taskId);
  if (!task) return null;

  const updatedTask: ReinforcementTask = {
    ...task,
    status: "rejected",
    updatedAt: now.toISOString(),
  };

  tasksStore = tasksStore.map((item) => (item.id === taskId ? updatedTask : item));
  return clone(updatedTask);
}

export async function requestResubmission(taskId: string): Promise<ReinforcementTask | null> {
  const task = tasksStore.find((item) => item.id === taskId);
  if (!task) return null;

  const updatedTask: ReinforcementTask = {
    ...task,
    status: "active",
    updatedAt: now.toISOString(),
    stages: task.stages.map((stage) => ({
      ...stage,
      isApproved: stage.isApproved && stage.isCompleted,
    })),
  };

  tasksStore = tasksStore.map((item) => (item.id === taskId ? updatedTask : item));
  return clone(updatedTask);
}

export async function duplicateTask(taskId: string): Promise<ReinforcementTask | null> {
  const task = tasksStore.find((item) => item.id === taskId);
  if (!task) return null;

  const duplicate: ReinforcementTask = {
    ...clone(task),
    id: `RT-${1000 + tasksStore.length + 1}`,
    status: "draft",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    stages: task.stages.map((stage, index) => ({
      ...stage,
      id: `${task.id}-COPY-ST-${index + 1}`,
      isCompleted: false,
      isApproved: false,
      submittedAt: undefined,
      proofUrl: undefined,
    })),
  };

  tasksStore = [duplicate, ...tasksStore];
  return clone(duplicate);
}

export async function archiveTask(taskId: string): Promise<ReinforcementTask | null> {
  const task = tasksStore.find((item) => item.id === taskId);
  if (!task) return null;

  const updatedTask: ReinforcementTask = {
    ...task,
    status: "archived",
    updatedAt: now.toISOString(),
  };
  tasksStore = tasksStore.map((item) => (item.id === taskId ? updatedTask : item));
  return clone(updatedTask);
}

export async function getReinforcementSummaryCard() {
  const overview = await getReinforcementOverview();
  return clone({
    activeTasks: overview.kpis.activeTasks,
    underReview: overview.kpis.underReview,
    completionRate: overview.kpis.averageCompletionRate,
  });
}

export async function getReinforcementFilterOptions() {
  return clone({
    students: studentSeeds,
    classes: [...new Set(studentSeeds.map((student) => student.className))],
  });
}
