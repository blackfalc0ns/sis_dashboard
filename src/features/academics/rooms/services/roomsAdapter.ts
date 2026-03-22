import type { Room } from "@/features/academics/timetable/types/timetable";
import type { RoomDefaultAssignment } from "@/features/academics/rooms/services/roomsService";

export interface RoomsAdapter {
  fetchRooms(schoolId: string): Promise<Room[]>;
  fetchRoomDefaultAssignments(schoolId: string): Promise<RoomDefaultAssignment[]>;
  createRoomDefaultAssignment(
    schoolId: string,
    payload: Omit<RoomDefaultAssignment, "id" | "schoolId">
  ): Promise<RoomDefaultAssignment>;
  updateRoomDefaultAssignment(
    assignmentId: string,
    payload: Partial<Omit<RoomDefaultAssignment, "id" | "schoolId">>
  ): Promise<RoomDefaultAssignment>;
  deleteRoomDefaultAssignment(assignmentId: string): Promise<void>;
  createRoom(
    schoolId: string,
    room: Omit<Room, "id" | "schoolId" | "createdAt" | "updatedAt">
  ): Promise<Room>;
  updateRoom(
    roomId: string,
    updates: Partial<Omit<Room, "id" | "schoolId" | "createdAt">>
  ): Promise<Room>;
  deleteRoom(roomId: string): Promise<void>;
}
