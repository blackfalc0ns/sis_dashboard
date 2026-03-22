import { apiWithToken } from "@/lib/api";
import type { Room } from "@/features/academics/timetable/types/timetable";
import type { RoomsAdapter } from "@/features/academics/rooms/services/roomsAdapter";
import type { RoomDefaultAssignment } from "@/features/academics/rooms/services/roomsService";

interface ApiEnvelope<T> {
  data?: T;
  error?: string;
  message?: string;
}

const unwrap = async <T>(request: Promise<ApiEnvelope<T> | T>): Promise<T> => {
  const response = await request;

  if (
    response &&
    typeof response === "object" &&
    ("data" in response || "error" in response || "message" in response)
  ) {
    const envelope = response as ApiEnvelope<T>;
    if (envelope.error) {
      throw new Error(envelope.error);
    }
    if (typeof envelope.data === "undefined") {
      throw new Error(envelope.message || "Missing API response data");
    }
    return envelope.data;
  }

  return response as T;
};

const buildQuery = (params: Record<string, string>) => {
  const search = new URLSearchParams(params);
  return `?${search.toString()}`;
};

export const createRoomsApiAdapter = (
  basePath: string = "/academics/rooms"
): RoomsAdapter => ({
  async fetchRooms(schoolId) {
    return unwrap<Room[]>(
      apiWithToken(`${basePath}${buildQuery({ schoolId })}`, {
        method: "GET",
      })
    );
  },

  async fetchRoomDefaultAssignments(schoolId) {
    return unwrap<RoomDefaultAssignment[]>(
      apiWithToken(`${basePath}/defaults${buildQuery({ schoolId })}`, {
        method: "GET",
      })
    );
  },

  async createRoomDefaultAssignment(schoolId, payload) {
    return unwrap<RoomDefaultAssignment>(
      apiWithToken(`${basePath}/defaults`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolId,
          ...payload,
        }),
      })
    );
  },

  async updateRoomDefaultAssignment(assignmentId, payload) {
    return unwrap<RoomDefaultAssignment>(
      apiWithToken(`${basePath}/defaults/${assignmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
    );
  },

  async deleteRoomDefaultAssignment(assignmentId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/defaults/${assignmentId}`, {
        method: "DELETE",
      })
    );
  },

  async createRoom(schoolId, room) {
    return unwrap<Room>(
      apiWithToken(basePath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolId,
          ...room,
        }),
      })
    );
  },

  async updateRoom(roomId, updates) {
    return unwrap<Room>(
      apiWithToken(`${basePath}/${roomId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })
    );
  },

  async deleteRoom(roomId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/${roomId}`, {
        method: "DELETE",
      })
    );
  },
});

export const roomsApiAdapter = createRoomsApiAdapter();
