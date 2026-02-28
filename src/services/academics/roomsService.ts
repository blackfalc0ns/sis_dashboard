import { Room } from "@/types/academics/timetable";

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

export async function fetchRooms(schoolId: string): Promise<Room[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return mockRooms.filter((room) => room.schoolId === schoolId);
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
