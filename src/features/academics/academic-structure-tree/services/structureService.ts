import { structureApiAdapter } from "@/features/academics/academic-structure-tree/services/structureApiAdapter";

export interface Stage {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  order: number;
  description?: string;
}

export interface Grade {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  stageId: string;
  capacity: number;
  order: number;
  notes?: string;
}

export interface Section {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  gradeId: string;
  capacity: number;
  order: number;
  notes?: string;
}

export interface Classroom {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  sectionId: string;
  capacity: number;
  order: number;
  notes?: string;
}

export interface StructureTree {
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
}

export interface AcademicYear {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface Term {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
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

const unsupportedMessage =
  "This action is not supported by the current Academic Structure API contract.";

let yearsCache: AcademicYear[] = [];
const termsByYearCache = new Map<string, Term[]>();
const structureByTermCache = new Map<string, StructureTree>();

const fallbackAcademicYears: AcademicYear[] = [
  {
    id: "year-2",
    name: "2025-2026",
    nameAr: "2025-2026",
    nameEn: "2025-2026",
    startDate: "2025-09-01",
    endDate: "2026-06-30",
    isActive: true,
  },
];

const fallbackTermsByYear = new Map<string, Term[]>([
  [
    "year-2",
    [
      {
        id: "term-2-2",
        name: "Term 2",
        nameAr: "الفصل الثاني",
        nameEn: "Term 2",
        yearId: "year-2",
        status: "open",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
      },
    ],
  ],
]);

const fallbackStructureTree: StructureTree = {
  stages: [
    { id: "stage-1", name: "Primary", nameAr: "ابتدائي", nameEn: "Primary", order: 1 },
    { id: "stage-2", name: "Middle", nameAr: "متوسط", nameEn: "Middle", order: 2 },
    { id: "stage-3", name: "High", nameAr: "ثانوي", nameEn: "High", order: 3 },
  ],
  grades: [
    { id: "grade-1", name: "Grade 1", nameAr: "الصف الأول", nameEn: "Grade 1", stageId: "stage-1", capacity: 30, order: 1 },
    { id: "grade-4", name: "Grade 6", nameAr: "الصف السادس", nameEn: "Grade 6", stageId: "stage-2", capacity: 30, order: 1 },
    { id: "grade-5", name: "Grade 7", nameAr: "الصف السابع", nameEn: "Grade 7", stageId: "stage-2", capacity: 30, order: 2 },
    { id: "grade-6", name: "Grade 8", nameAr: "الصف الثامن", nameEn: "Grade 8", stageId: "stage-2", capacity: 30, order: 3 },
    { id: "grade-7", name: "Grade 9", nameAr: "الصف التاسع", nameEn: "Grade 9", stageId: "stage-3", capacity: 30, order: 1 },
  ],
  sections: [
    { id: "section-1", name: "Section A", nameAr: "شعبة أ", nameEn: "Section A", gradeId: "grade-1", capacity: 30, order: 1 },
    { id: "section-5", name: "Section A", nameAr: "شعبة أ", nameEn: "Section A", gradeId: "grade-4", capacity: 30, order: 1 },
    { id: "section-7", name: "Section A", nameAr: "شعبة أ", nameEn: "Section A", gradeId: "grade-5", capacity: 28, order: 1 },
    { id: "section-8", name: "Section B", nameAr: "شعبة ب", nameEn: "Section B", gradeId: "grade-5", capacity: 28, order: 2 },
    { id: "section-9", name: "Section A", nameAr: "شعبة أ", nameEn: "Section A", gradeId: "grade-6", capacity: 26, order: 1 },
    { id: "section-11", name: "Section A", nameAr: "شعبة أ", nameEn: "Section A", gradeId: "grade-7", capacity: 24, order: 1 },
  ],
  classrooms: [
    { id: "classroom-1", name: "Classroom 101", nameAr: "فصل 101", nameEn: "Classroom 101", sectionId: "section-1", capacity: 30, order: 1 },
    { id: "classroom-6", name: "Classroom 601", nameAr: "فصل 601", nameEn: "Classroom 601", sectionId: "section-5", capacity: 30, order: 1 },
    { id: "classroom-9", name: "Classroom 701", nameAr: "فصل 701", nameEn: "Classroom 701", sectionId: "section-7", capacity: 28, order: 1 },
    { id: "classroom-10", name: "Classroom 702", nameAr: "فصل 702", nameEn: "Classroom 702", sectionId: "section-8", capacity: 28, order: 1 },
    { id: "classroom-11", name: "Classroom 801", nameAr: "فصل 801", nameEn: "Classroom 801", sectionId: "section-9", capacity: 26, order: 1 },
    { id: "classroom-13", name: "Classroom 901", nameAr: "فصل 901", nameEn: "Classroom 901", sectionId: "section-11", capacity: 24, order: 1 },
  ],
};

const keyForTerm = (yearId: string, termId: string) => `${yearId}::${termId}`;

const cloneTree = (tree: StructureTree): StructureTree => ({
  stages: tree.stages.map((item) => ({ ...item })),
  grades: tree.grades.map((item) => ({ ...item })),
  sections: tree.sections.map((item) => ({ ...item })),
  classrooms: tree.classrooms.map((item) => ({ ...item })),
});

const cloneYears = (years: AcademicYear[]) => years.map((item) => ({ ...item }));
const cloneTerms = (terms: Term[]) => terms.map((item) => ({ ...item }));

const getFallbackTermsByYear = (yearId: string) =>
  cloneTerms(fallbackTermsByYear.get(yearId) || []);

const readTreeFromCache = (yearId: string, termId: string): StructureTree => {
  const cached = structureByTermCache.get(keyForTerm(yearId, termId));
  if (!cached) {
    return cloneTree(fallbackStructureTree);
  }
  return cloneTree(cached);
};

const writeTreeToCache = (yearId: string, termId: string, tree: StructureTree) => {
  structureByTermCache.set(keyForTerm(yearId, termId), cloneTree(tree));
};

const applyStageOrder = (stages: Stage[], orderedStageIds: string[]) => {
  const orderLookup = new Map(orderedStageIds.map((id, index) => [id, index + 1]));
  return stages
    .map((item) => ({
      ...item,
      order: orderLookup.get(item.id) ?? item.order,
    }))
    .sort((a, b) => a.order - b.order);
};

const applyGradeOrder = (grades: Grade[], stageId: string, orderedGradeIds: string[]) => {
  const orderLookup = new Map(orderedGradeIds.map((id, index) => [id, index + 1]));
  return grades
    .map((item) =>
      item.stageId === stageId
        ? {
            ...item,
            order: orderLookup.get(item.id) ?? item.order,
          }
        : item
    )
    .sort((a, b) => a.order - b.order);
};

const applySectionOrder = (
  sections: Section[],
  gradeId: string,
  orderedSectionIds: string[]
) => {
  const orderLookup = new Map(orderedSectionIds.map((id, index) => [id, index + 1]));
  return sections
    .map((item) =>
      item.gradeId === gradeId
        ? {
            ...item,
            order: orderLookup.get(item.id) ?? item.order,
          }
        : item
    )
    .sort((a, b) => a.order - b.order);
};

const applyClassroomOrder = (
  classrooms: Classroom[],
  sectionId: string,
  orderedClassroomIds: string[]
) => {
  const orderLookup = new Map(
    orderedClassroomIds.map((id, index) => [id, index + 1])
  );
  return classrooms
    .map((item) =>
      item.sectionId === sectionId
        ? {
            ...item,
            order: orderLookup.get(item.id) ?? item.order,
          }
        : item
    )
    .sort((a, b) => a.order - b.order);
};

export const fetchAcademicYears = async (): Promise<AcademicYear[]> => {
  const years = await structureApiAdapter.fetchAcademicYears();
  yearsCache = years.map((item) => ({ ...item }));
  return years;
};

export const fetchTermsByYear = async (yearId: string): Promise<Term[]> => {
  const terms = await structureApiAdapter.fetchTermsByYear(yearId);
  termsByYearCache.set(
    yearId,
    terms.map((item) => ({ ...item }))
  );
  return terms;
};

export const createAcademicYear = async (
  payload: Omit<AcademicYear, "id">
): Promise<AcademicYear> => {
  const created = await structureApiAdapter.createAcademicYear(payload);
  yearsCache = [...yearsCache, { ...created }];
  return created;
};

export const createTerm = async (payload: Omit<Term, "id">): Promise<Term> => {
  const created = await structureApiAdapter.createTerm(payload);
  const previous = termsByYearCache.get(payload.yearId) || [];
  termsByYearCache.set(payload.yearId, [...previous, { ...created }]);
  return created;
};

export const fetchStructureTree = async (
  yearId: string,
  termId: string
): Promise<StructureTree> => {
  const tree = await structureApiAdapter.fetchStructureTree(yearId, termId);
  writeTreeToCache(yearId, termId, tree);
  return tree;
};

export const createStage = async (
  yearId: string,
  termId: string,
  payload: Omit<Stage, "id">
): Promise<Stage> => {
  const created = await structureApiAdapter.createStage(yearId, termId, payload);
  const tree = readTreeFromCache(yearId, termId);
  tree.stages = [...tree.stages, created].sort((a, b) => a.order - b.order);
  writeTreeToCache(yearId, termId, tree);
  return created;
};

export const deleteStage = async (
  yearId: string,
  termId: string,
  id: string
): Promise<void> => {
  await structureApiAdapter.deleteStage(yearId, termId, id);
};

export const createGrade = async (
  yearId: string,
  termId: string,
  payload: Omit<Grade, "id">
): Promise<Grade> => {
  const created = await structureApiAdapter.createGrade(yearId, termId, payload);
  const tree = readTreeFromCache(yearId, termId);
  tree.grades.push(created);
  writeTreeToCache(yearId, termId, tree);
  return created;
};

export const deleteGrade = async (
  yearId: string,
  termId: string,
  id: string
): Promise<void> => {
  await structureApiAdapter.deleteGrade(yearId, termId, id);
};

export const createSection = async (
  yearId: string,
  termId: string,
  payload: Omit<Section, "id">
): Promise<Section> => {
  const created = await structureApiAdapter.createSection(yearId, termId, payload);
  const tree = readTreeFromCache(yearId, termId);
  tree.sections.push(created);
  writeTreeToCache(yearId, termId, tree);
  return created;
};

export const deleteSection = async (
  yearId: string,
  termId: string,
  id: string
): Promise<void> => {
  await structureApiAdapter.deleteSection(yearId, termId, id);
};

export const createClassroom = async (
  yearId: string,
  termId: string,
  payload: Omit<Classroom, "id">
): Promise<Classroom> => {
  const created = await structureApiAdapter.createClassroom(yearId, termId, payload);
  const tree = readTreeFromCache(yearId, termId);
  tree.classrooms.push(created);
  writeTreeToCache(yearId, termId, tree);
  return created;
};

export const deleteClassroom = async (
  yearId: string,
  termId: string,
  id: string
): Promise<void> => {
  await structureApiAdapter.deleteClassroom(yearId, termId, id);
};

export const updateAcademicYear = async (
  id: string,
  payload: Partial<Omit<AcademicYear, "id">>
): Promise<AcademicYear> => {
  const updated = await structureApiAdapter.updateAcademicYear(id, payload);
  yearsCache = (yearsCache.length > 0 ? yearsCache : fallbackAcademicYears).map((item) =>
    item.id === id ? { ...updated } : { ...item }
  );
  return updated;
};

export const updateTerm = async (
  id: string,
  payload: Partial<Omit<Term, "id">>
): Promise<Term> => {
  const updated = await structureApiAdapter.updateTerm(id, payload);
  const yearId = updated.yearId;
  const existing = termsByYearCache.get(yearId) || getFallbackTermsByYear(yearId);
  termsByYearCache.set(
    yearId,
    existing.map((item) => (item.id === id ? { ...updated } : { ...item }))
  );
  return updated;
};

export const updateStage = async (
  yearId: string,
  termId: string,
  id: string,
  payload: Partial<Stage>
): Promise<Stage> => {
  const updated = await structureApiAdapter.updateStage(yearId, termId, id, payload);
  const tree = readTreeFromCache(yearId, termId);
  tree.stages = tree.stages
    .map((item) => (item.id === id ? { ...item, ...updated } : item))
    .sort((a, b) => a.order - b.order);
  writeTreeToCache(yearId, termId, tree);
  return updated;
};

export const updateGrade = async (
  yearId: string,
  termId: string,
  id: string,
  payload: Partial<Grade>
): Promise<Grade> => {
  const updated = await structureApiAdapter.updateGrade(yearId, termId, id, payload);
  const tree = readTreeFromCache(yearId, termId);
  tree.grades = tree.grades
    .map((item) => (item.id === id ? { ...item, ...updated } : item))
    .sort((a, b) => a.order - b.order);
  writeTreeToCache(yearId, termId, tree);
  return updated;
};

export const updateSection = async (
  yearId: string,
  termId: string,
  id: string,
  payload: Partial<Section>
): Promise<Section> => {
  const updated = await structureApiAdapter.updateSection(yearId, termId, id, payload);
  const tree = readTreeFromCache(yearId, termId);
  tree.sections = tree.sections
    .map((item) => (item.id === id ? { ...item, ...updated } : item))
    .sort((a, b) => a.order - b.order);
  writeTreeToCache(yearId, termId, tree);
  return updated;
};

export const updateClassroom = async (
  yearId: string,
  termId: string,
  id: string,
  payload: Partial<Classroom>
): Promise<Classroom> => {
  const updated = await structureApiAdapter.updateClassroom(
    yearId,
    termId,
    id,
    payload
  );
  const tree = readTreeFromCache(yearId, termId);
  tree.classrooms = tree.classrooms
    .map((item) => (item.id === id ? { ...item, ...updated } : item))
    .sort((a, b) => a.order - b.order);
  writeTreeToCache(yearId, termId, tree);
  return updated;
};

export const reorderStages = async (
  yearId: string,
  termId: string,
  orderedStageIds: string[]
): Promise<void> => {
  await structureApiAdapter.reorderStages(yearId, termId, orderedStageIds);
  const tree = readTreeFromCache(yearId, termId);
  tree.stages = applyStageOrder(tree.stages, orderedStageIds);
  writeTreeToCache(yearId, termId, tree);
};

export const reorderGrades = async (
  yearId: string,
  termId: string,
  stageId: string,
  orderedGradeIds: string[]
): Promise<void> => {
  await structureApiAdapter.reorderGrades(yearId, termId, stageId, orderedGradeIds);
  const tree = readTreeFromCache(yearId, termId);
  tree.grades = applyGradeOrder(tree.grades, stageId, orderedGradeIds);
  writeTreeToCache(yearId, termId, tree);
};

export const reorderSections = async (
  yearId: string,
  termId: string,
  gradeId: string,
  orderedSectionIds: string[]
): Promise<void> => {
  await structureApiAdapter.reorderSections(
    yearId,
    termId,
    gradeId,
    orderedSectionIds
  );
  const tree = readTreeFromCache(yearId, termId);
  tree.sections = applySectionOrder(tree.sections, gradeId, orderedSectionIds);
  writeTreeToCache(yearId, termId, tree);
};

export const reorderClassrooms = async (
  yearId: string,
  termId: string,
  sectionId: string,
  orderedClassroomIds: string[]
): Promise<void> => {
  await structureApiAdapter.reorderClassrooms(
    yearId,
    termId,
    sectionId,
    orderedClassroomIds
  );
  const tree = readTreeFromCache(yearId, termId);
  tree.classrooms = applyClassroomOrder(
    tree.classrooms,
    sectionId,
    orderedClassroomIds
  );
  writeTreeToCache(yearId, termId, tree);
};

export const carryOverStructure = async (
  options: CarryOverOptions
): Promise<never> => {
  void options;
  throw new Error(unsupportedMessage);
};

export const setStructureAdapter = () => {};
export const resetStructureAdapter = () => {};
export const activateStructureAdapter = () => {};

export const getAcademicYearsSnapshot = (): AcademicYear[] =>
  cloneYears(yearsCache.length > 0 ? yearsCache : fallbackAcademicYears);

export const getTermsSnapshotByYear = (yearId: string): Term[] =>
  cloneTerms(
    (termsByYearCache.get(yearId) || []).length > 0
      ? termsByYearCache.get(yearId) || []
      : getFallbackTermsByYear(yearId)
  );

export const getAcademicYearById = (yearId: string): AcademicYear | undefined =>
  (yearsCache.length > 0 ? yearsCache : fallbackAcademicYears).find(
    (year) => year.id === yearId
  );

export const getTermById = (termId: string): Term | undefined => {
  for (const terms of termsByYearCache.values()) {
    const found = terms.find((term) => term.id === termId);
    if (found) {
      return found;
    }
  }
  for (const terms of fallbackTermsByYear.values()) {
    const found = terms.find((term) => term.id === termId);
    if (found) {
      return { ...found };
    }
  }
  return undefined;
};

export const getStructureTreeSnapshot = (
  yearId: string,
  termId: string
): StructureTree => readTreeFromCache(yearId, termId);

export const resolveStructureContextForAcademicYear = (
  academicYearName: string
): { academicYearId: string; termId: string } | null => {
  const year = yearsCache.find(
    (item) =>
      item.name === academicYearName ||
      item.nameAr === academicYearName ||
      item.nameEn === academicYearName
  ) || fallbackAcademicYears.find(
    (item) =>
      item.name === academicYearName ||
      item.nameAr === academicYearName ||
      item.nameEn === academicYearName
  );

  if (!year) {
    return null;
  }

  const terms = (termsByYearCache.get(year.id) || []).length > 0
    ? termsByYearCache.get(year.id) || []
    : getFallbackTermsByYear(year.id);
  const openTerm = terms.find((term) => term.status === "open");
  const firstTerm = openTerm || terms[0];

  if (!firstTerm) {
    return null;
  }

  return {
    academicYearId: year.id,
    termId: firstTerm.id,
  };
};

export const normalizeName = (name: string, isArabic = false): string => {
  let normalized = name.trim().replace(/\s+/g, " ");
  if (!isArabic) {
    normalized = normalized.toLowerCase();
  }
  return normalized;
};

export const isStageNameUnique = (
  yearId: string,
  termId: string,
  nameAr: string,
  nameEn: string,
  excludeId?: string
): { uniqueAr: boolean; uniqueEn: boolean } => {
  const tree = readTreeFromCache(yearId, termId);
  const normalizedAr = normalizeName(nameAr, true);
  const normalizedEn = normalizeName(nameEn);

  const duplicateAr = tree.stages.some(
    (stage) => stage.id !== excludeId && normalizeName(stage.nameAr, true) === normalizedAr
  );
  const duplicateEn = tree.stages.some(
    (stage) => stage.id !== excludeId && normalizeName(stage.nameEn) === normalizedEn
  );

  return { uniqueAr: !duplicateAr, uniqueEn: !duplicateEn };
};

export const isGradeNameUnique = (
  yearId: string,
  termId: string,
  stageId: string,
  nameAr: string,
  nameEn: string,
  excludeId?: string
): { uniqueAr: boolean; uniqueEn: boolean } => {
  const tree = readTreeFromCache(yearId, termId);
  const normalizedAr = normalizeName(nameAr, true);
  const normalizedEn = normalizeName(nameEn);

  const duplicateAr = tree.grades.some(
    (grade) =>
      grade.stageId === stageId &&
      grade.id !== excludeId &&
      normalizeName(grade.nameAr, true) === normalizedAr
  );
  const duplicateEn = tree.grades.some(
    (grade) =>
      grade.stageId === stageId &&
      grade.id !== excludeId &&
      normalizeName(grade.nameEn) === normalizedEn
  );

  return { uniqueAr: !duplicateAr, uniqueEn: !duplicateEn };
};

export const isSectionNameUnique = (
  yearId: string,
  termId: string,
  gradeId: string,
  nameAr: string,
  nameEn: string,
  excludeId?: string
): { uniqueAr: boolean; uniqueEn: boolean } => {
  const tree = readTreeFromCache(yearId, termId);
  const normalizedAr = normalizeName(nameAr, true);
  const normalizedEn = normalizeName(nameEn);

  const duplicateAr = tree.sections.some(
    (section) =>
      section.gradeId === gradeId &&
      section.id !== excludeId &&
      normalizeName(section.nameAr, true) === normalizedAr
  );
  const duplicateEn = tree.sections.some(
    (section) =>
      section.gradeId === gradeId &&
      section.id !== excludeId &&
      normalizeName(section.nameEn) === normalizedEn
  );

  return { uniqueAr: !duplicateAr, uniqueEn: !duplicateEn };
};

export const isClassroomNameUnique = (
  yearId: string,
  termId: string,
  sectionId: string,
  nameAr: string,
  nameEn: string,
  excludeId?: string
): { uniqueAr: boolean; uniqueEn: boolean } => {
  const tree = readTreeFromCache(yearId, termId);
  const normalizedAr = normalizeName(nameAr, true);
  const normalizedEn = normalizeName(nameEn);

  const duplicateAr = tree.classrooms.some(
    (classroom) =>
      classroom.sectionId === sectionId &&
      classroom.id !== excludeId &&
      normalizeName(classroom.nameAr, true) === normalizedAr
  );
  const duplicateEn = tree.classrooms.some(
    (classroom) =>
      classroom.sectionId === sectionId &&
      classroom.id !== excludeId &&
      normalizeName(classroom.nameEn) === normalizedEn
  );

  return { uniqueAr: !duplicateAr, uniqueEn: !duplicateEn };
};
