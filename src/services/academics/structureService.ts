// Mock service for Academic Structure
// Replace with real API calls when backend is ready

export interface Stage {
  id: string;
  name: string;
  description?: string;
}

export interface Grade {
  id: string;
  name: string;
  stageId: string;
  order: number;
  notes?: string;
}

export interface Section {
  id: string;
  name: string;
  gradeId: string;
  capacity: number;
  notes?: string;
}

export interface StructureTree {
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Term {
  id: string;
  name: string;
  yearId: string;
  status: "open" | "closed";
  startDate: string;
  endDate: string;
}

export interface CarryOverOptions {
  fromYearId: string;
  fromTermId: string;
  toYearId: string;
  toTermId: string;
  copyCapacities?: boolean;
  copyOrdering?: boolean;
}

// In-memory mock data
const mockAcademicYears: AcademicYear[] = [
  { id: "year-1", name: "2024-2025", startDate: "2024-09-01", endDate: "2025-06-30" },
  { id: "year-2", name: "2025-2026", startDate: "2025-09-01", endDate: "2026-06-30" },
  { id: "year-3", name: "2026-2027", startDate: "2026-09-01", endDate: "2027-06-30" },
];

const mockTerms: Term[] = [
  { id: "term-1-1", name: "Term 1", yearId: "year-1", status: "open", startDate: "2024-09-01", endDate: "2024-12-31" },
  { id: "term-1-2", name: "Term 2", yearId: "year-1", status: "closed", startDate: "2025-01-01", endDate: "2025-03-31" },
  { id: "term-1-3", name: "Term 3", yearId: "year-1", status: "closed", startDate: "2025-04-01", endDate: "2025-06-30" },
  { id: "term-2-1", name: "Term 1", yearId: "year-2", status: "open", startDate: "2025-09-01", endDate: "2025-12-31" },
  { id: "term-2-2", name: "Term 2", yearId: "year-2", status: "open", startDate: "2026-01-01", endDate: "2026-03-31" },
  { id: "term-2-3", name: "Term 3", yearId: "year-2", status: "open", startDate: "2026-04-01", endDate: "2026-06-30" },
];

// Term-scoped structure data: key = `${yearId}-${termId}`
const mockStructureData: Record<string, StructureTree> = {
  "year-1-term-1-1": {
    stages: [
      { id: "stage-1", name: "Primary", description: "Primary education stage" },
      { id: "stage-2", name: "Middle", description: "Middle school stage" },
      { id: "stage-3", name: "High", description: "High school stage" },
    ],
    grades: [
      { id: "grade-1", name: "Grade 1", stageId: "stage-1", order: 1 },
      { id: "grade-2", name: "Grade 2", stageId: "stage-1", order: 2 },
      { id: "grade-3", name: "Grade 3", stageId: "stage-1", order: 3 },
      { id: "grade-4", name: "Grade 6", stageId: "stage-2", order: 1 },
      { id: "grade-5", name: "Grade 7", stageId: "stage-2", order: 2 },
    ],
    sections: [
      { id: "section-1", name: "Section A", gradeId: "grade-1", capacity: 30 },
      { id: "section-2", name: "Section B", gradeId: "grade-1", capacity: 28 },
      { id: "section-3", name: "Section A", gradeId: "grade-2", capacity: 25 },
      { id: "section-4", name: "Section A", gradeId: "grade-3", capacity: 0 },
    ],
  },
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simple unique ID generator with better uniqueness
let idCounter = 1000;
let lastTimestamp = 0;

const generateId = (prefix: string) => {
  const now = Date.now();
  
  // If same timestamp, increment counter more aggressively
  if (now === lastTimestamp) {
    idCounter += Math.floor(Math.random() * 100) + 1;
  } else {
    idCounter++;
    lastTimestamp = now;
  }
  
  return `${prefix}-${now}-${idCounter}-${Math.random().toString(36).substring(2, 9)}`;
};

const getTermKey = (yearId: string, termId: string) => `${yearId}-${termId}`;

const getStructureForTerm = (yearId: string, termId: string): StructureTree => {
  const key = getTermKey(yearId, termId);
  return mockStructureData[key] || { stages: [], grades: [], sections: [] };
};

const setStructureForTerm = (yearId: string, termId: string, data: StructureTree) => {
  const key = getTermKey(yearId, termId);
  mockStructureData[key] = data;
};

// Academic Years & Terms
export const fetchAcademicYears = async (): Promise<AcademicYear[]> => {
  await delay(200);
  return [...mockAcademicYears];
};

export const fetchTermsByYear = async (yearId: string): Promise<Term[]> => {
  await delay(200);
  return mockTerms.filter((t) => t.yearId === yearId);
};

export const createAcademicYear = async (payload: Omit<AcademicYear, "id">): Promise<AcademicYear> => {
  await delay(200);
  const newYear: AcademicYear = {
    id: generateId("year"),
    ...payload,
  };
  mockAcademicYears.push(newYear);
  return newYear;
};

export const updateAcademicYear = async (id: string, payload: Partial<Omit<AcademicYear, "id">>): Promise<AcademicYear> => {
  await delay(200);
  const index = mockAcademicYears.findIndex((y) => y.id === id);
  if (index === -1) throw new Error("Academic year not found");
  mockAcademicYears[index] = { ...mockAcademicYears[index], ...payload };
  return mockAcademicYears[index];
};

export const createTerm = async (payload: Omit<Term, "id">): Promise<Term> => {
  await delay(200);
  const newTerm: Term = {
    id: generateId("term"),
    ...payload,
  };
  mockTerms.push(newTerm);
  return newTerm;
};

export const updateTerm = async (id: string, payload: Partial<Omit<Term, "id">>): Promise<Term> => {
  await delay(200);
  const index = mockTerms.findIndex((t) => t.id === id);
  if (index === -1) throw new Error("Term not found");
  mockTerms[index] = { ...mockTerms[index], ...payload };
  return mockTerms[index];
};

export const fetchStructureTree = async (yearId: string, termId: string): Promise<StructureTree> => {
  await delay(300);
  const data = getStructureForTerm(yearId, termId);
  return { ...data };
};

export const createStage = async (yearId: string, termId: string, payload: Omit<Stage, "id">): Promise<Stage> => {
  await delay(200);
  const newStage: Stage = {
    id: generateId("stage"),
    ...payload,
  };
  const data = getStructureForTerm(yearId, termId);
  data.stages.push(newStage);
  setStructureForTerm(yearId, termId, data);
  return newStage;
};

export const updateStage = async (yearId: string, termId: string, id: string, payload: Partial<Stage>): Promise<Stage> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  const index = data.stages.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Stage not found");
  data.stages[index] = { ...data.stages[index], ...payload };
  setStructureForTerm(yearId, termId, data);
  return data.stages[index];
};

export const deleteStage = async (yearId: string, termId: string, id: string): Promise<void> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  data.stages = data.stages.filter((s) => s.id !== id);
  data.grades = data.grades.filter((g) => g.stageId !== id);
  setStructureForTerm(yearId, termId, data);
};

export const createGrade = async (yearId: string, termId: string, payload: Omit<Grade, "id">): Promise<Grade> => {
  await delay(200);
  const newGrade: Grade = {
    id: generateId("grade"),
    ...payload,
  };
  const data = getStructureForTerm(yearId, termId);
  data.grades.push(newGrade);
  setStructureForTerm(yearId, termId, data);
  return newGrade;
};

export const updateGrade = async (yearId: string, termId: string, id: string, payload: Partial<Grade>): Promise<Grade> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  const index = data.grades.findIndex((g) => g.id === id);
  if (index === -1) throw new Error("Grade not found");
  data.grades[index] = { ...data.grades[index], ...payload };
  setStructureForTerm(yearId, termId, data);
  return data.grades[index];
};

export const deleteGrade = async (yearId: string, termId: string, id: string): Promise<void> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  data.grades = data.grades.filter((g) => g.id !== id);
  data.sections = data.sections.filter((s) => s.gradeId !== id);
  setStructureForTerm(yearId, termId, data);
};

export const createSection = async (yearId: string, termId: string, payload: Omit<Section, "id">): Promise<Section> => {
  await delay(200);
  const newSection: Section = {
    id: generateId("section"),
    ...payload,
  };
  const data = getStructureForTerm(yearId, termId);
  data.sections.push(newSection);
  setStructureForTerm(yearId, termId, data);
  return newSection;
};

export const updateSection = async (yearId: string, termId: string, id: string, payload: Partial<Section>): Promise<Section> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  const index = data.sections.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Section not found");
  data.sections[index] = { ...data.sections[index], ...payload };
  setStructureForTerm(yearId, termId, data);
  return data.sections[index];
};

export const deleteSection = async (yearId: string, termId: string, id: string): Promise<void> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  data.sections = data.sections.filter((s) => s.id !== id);
  setStructureForTerm(yearId, termId, data);
};

export const reorderGrades = async (yearId: string, termId: string, stageId: string, orderedGradeIds: string[]): Promise<void> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  orderedGradeIds.forEach((gradeId, index) => {
    const grade = data.grades.find((g) => g.id === gradeId);
    if (grade && grade.stageId === stageId) {
      grade.order = index + 1;
    }
  });
  setStructureForTerm(yearId, termId, data);
};

export const carryOverStructure = async (options: CarryOverOptions): Promise<void> => {
  await delay(500);
  const { fromYearId, fromTermId, toYearId, toTermId, copyCapacities = true, copyOrdering = true } = options;
  
  const sourceData = getStructureForTerm(fromYearId, fromTermId);
  
  // Deep clone the structure
  const newStages = sourceData.stages.map((s) => ({
    ...s,
    id: generateId("stage"),
  }));
  
  const stageIdMap = new Map(sourceData.stages.map((s, i) => [s.id, newStages[i].id]));
  
  const newGrades = sourceData.grades.map((g) => ({
    ...g,
    id: generateId("grade"),
    stageId: stageIdMap.get(g.stageId) || g.stageId,
    order: copyOrdering ? g.order : 1,
  }));
  
  const gradeIdMap = new Map(sourceData.grades.map((g, i) => [g.id, newGrades[i].id]));
  
  const newSections = sourceData.sections.map((s) => ({
    ...s,
    id: generateId("section"),
    gradeId: gradeIdMap.get(s.gradeId) || s.gradeId,
    capacity: copyCapacities ? s.capacity : 0,
  }));
  
  setStructureForTerm(toYearId, toTermId, {
    stages: newStages,
    grades: newGrades,
    sections: newSections,
  });
};
