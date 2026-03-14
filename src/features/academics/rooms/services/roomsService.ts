import { Room } from "@/features/academics/timetable/types/timetable";

export interface RoomDefaultAssignment {
  id: string;
  schoolId: string;
  scopeType: "SECTION" | "CLASSROOM";
  scopeId: string;
  roomId: string;
}

export type RoomAssignmentSource =
  | "CLASSROOM_DEFAULT"
  | "SECTION_DEFAULT"
  | "RECOMMENDED"
  | "MANUAL";

// Mock data for development
const mockRooms: Room[] = [
  {
    id: "room-1",
    schoolId: "school-1",
    nameAr: "الفصل 101",
    nameEn: "Classroom 101",
    type: "CLASSROOM",
    capacity: 30,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "room-2",
    schoolId: "school-1",
    nameAr: "الفصل 102",
    nameEn: "Classroom 102",
    type: "CLASSROOM",
    capacity: 30,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "room-3",
    schoolId: "school-1",
    nameAr: "مختبر العلوم",
    nameEn: "Science Lab",
    type: "LAB",
    capacity: 25,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "room-4",
    schoolId: "school-1",
    nameAr: "مختبر الحاسوب",
    nameEn: "Computer Lab",
    type: "LAB",
    capacity: 25,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
];

const mockRoomDefaults: RoomDefaultAssignment[] = [
  {
    id: "room-default-1",
    schoolId: "school-1",
    scopeType: "CLASSROOM",
    scopeId: "classroom-1",
    roomId: "room-1",
  },
  {
    id: "room-default-2",
    schoolId: "school-1",
    scopeType: "CLASSROOM",
    scopeId: "classroom-2",
    roomId: "room-2",
  },
  {
    id: "room-default-3",
    schoolId: "school-1",
    scopeType: "SECTION",
    scopeId: "section-3",
    roomId: "room-3",
  },
  {
    id: "room-default-4",
    schoolId: "school-1",
    scopeType: "SECTION",
    scopeId: "section-4",
    roomId: "room-4",
  },
];

const findRoomDefaultIndex = (params: {
  schoolId: string;
  scopeType: RoomDefaultAssignment["scopeType"];
  scopeId: string;
  excludeId?: string;
}) =>
  mockRoomDefaults.findIndex(
    (item) =>
      item.schoolId === params.schoolId &&
      item.scopeType === params.scopeType &&
      item.scopeId === params.scopeId &&
      item.id !== params.excludeId
  );

export async function fetchRooms(schoolId: string): Promise<Room[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return mockRooms.filter((room) => room.schoolId === schoolId);
}

export async function fetchRoomDefaultAssignments(
  schoolId: string
): Promise<RoomDefaultAssignment[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockRoomDefaults.filter((item) => item.schoolId === schoolId);
}

export async function createRoomDefaultAssignment(
  schoolId: string,
  payload: Omit<RoomDefaultAssignment, "id" | "schoolId">
): Promise<RoomDefaultAssignment> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const existingIndex = findRoomDefaultIndex({
    schoolId,
    scopeType: payload.scopeType,
    scopeId: payload.scopeId,
  });

  if (existingIndex >= 0) {
    mockRoomDefaults[existingIndex] = {
      ...mockRoomDefaults[existingIndex],
      roomId: payload.roomId,
    };
    return mockRoomDefaults[existingIndex];
  }

  const newAssignment: RoomDefaultAssignment = {
    id: `room-default-${Date.now()}`,
    schoolId,
    ...payload,
  };

  mockRoomDefaults.push(newAssignment);
  return newAssignment;
}

export async function updateRoomDefaultAssignment(
  assignmentId: string,
  payload: Partial<Omit<RoomDefaultAssignment, "id" | "schoolId">>
): Promise<RoomDefaultAssignment> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const index = mockRoomDefaults.findIndex((item) => item.id === assignmentId);
  if (index === -1) {
    throw new Error("Room default assignment not found");
  }

  const nextAssignment = {
    ...mockRoomDefaults[index],
    ...payload,
  };

  const conflictingIndex = findRoomDefaultIndex({
    schoolId: nextAssignment.schoolId,
    scopeType: nextAssignment.scopeType,
    scopeId: nextAssignment.scopeId,
    excludeId: assignmentId,
  });

  if (conflictingIndex >= 0) {
    mockRoomDefaults[conflictingIndex] = {
      ...mockRoomDefaults[conflictingIndex],
      roomId: nextAssignment.roomId,
    };
    mockRoomDefaults.splice(index, 1);
    return mockRoomDefaults[conflictingIndex > index ? conflictingIndex - 1 : conflictingIndex];
  }

  mockRoomDefaults[index] = nextAssignment;

  return mockRoomDefaults[index];
}

export async function deleteRoomDefaultAssignment(assignmentId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const index = mockRoomDefaults.findIndex((item) => item.id === assignmentId);
  if (index === -1) {
    throw new Error("Room default assignment not found");
  }

  mockRoomDefaults.splice(index, 1);
}

export function resolveDefaultRoomAssignmentForTarget(
  defaults: RoomDefaultAssignment[],
  params: {
    schoolId: string;
    sectionId: string;
    classroomId?: string;
  }
): RoomDefaultAssignment | null {
  const { schoolId, sectionId, classroomId } = params;

  const classroomDefault = classroomId
    ? defaults.find(
        (item) =>
          item.schoolId === schoolId &&
          item.scopeType === "CLASSROOM" &&
          item.scopeId === classroomId
      )
    : undefined;

  if (classroomDefault) {
    return classroomDefault;
  }

  return (
    defaults.find(
      (item) =>
        item.schoolId === schoolId &&
        item.scopeType === "SECTION" &&
        item.scopeId === sectionId
    ) || null
  );
}

export function resolveDefaultRoomSourceForTarget(
  defaults: RoomDefaultAssignment[],
  params: {
    schoolId: string;
    sectionId: string;
    classroomId?: string;
  }
): Extract<RoomAssignmentSource, "CLASSROOM_DEFAULT" | "SECTION_DEFAULT"> | null {
  const assignment = resolveDefaultRoomAssignmentForTarget(defaults, params);

  if (!assignment) {
    return null;
  }

  return assignment.scopeType === "CLASSROOM"
    ? "CLASSROOM_DEFAULT"
    : "SECTION_DEFAULT";
}

export function resolveDefaultRoomForTarget(
  rooms: Room[],
  defaults: RoomDefaultAssignment[],
  params: {
    schoolId: string;
    sectionId: string;
    classroomId?: string;
  }
): Room | null {
  const assignment = resolveDefaultRoomAssignmentForTarget(defaults, params);
  return assignment ? rooms.find((room) => room.id === assignment.roomId) || null : null;
}

export async function createRoom(
  schoolId: string,
  room: Omit<Room, "id" | "schoolId" | "createdAt" | "updatedAt">
): Promise<Room> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newRoom: Room = {
    ...room,
    id: `room-${Date.now()}`,
    schoolId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockRooms.push(newRoom);
  return newRoom;
}

export async function updateRoom(
  roomId: string,
  updates: Partial<Omit<Room, "id" | "schoolId" | "createdAt">>
): Promise<Room> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const index = mockRooms.findIndex((r) => r.id === roomId);
  if (index === -1) {
    throw new Error("Room not found");
  }

  mockRooms[index] = {
    ...mockRooms[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return mockRooms[index];
}

export async function deleteRoom(roomId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const index = mockRooms.findIndex((r) => r.id === roomId);
  if (index === -1) {
    throw new Error("Room not found");
  }

  mockRooms.splice(index, 1);
}
