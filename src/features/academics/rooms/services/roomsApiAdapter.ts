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
      // If no data but we have items, it might be a list
      if ("items" in response && Array.isArray((response as any).items)) {
        return (response as any).items as T;
      }
      throw new Error(envelope.message || "Missing API response data");
    }
    return envelope.data;
  }

  return response as T;
};




export const createRoomsApiAdapter = (
  basePath: string = "/academics/rooms"
): RoomsAdapter => ({
  async fetchRooms(_schoolId) {
    // GET /academics/rooms — no schoolId query param required by the API
    const res = await unwrap<any>(
      apiWithToken(basePath, {
        method: "GET",
      })
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.items)) return res.items;
    if (res && Array.isArray(res.rooms)) return res.rooms;
    return [];
  },

  // NOTE: /academics/rooms/defaults does not exist in the API yet.
  // These are stubbed as no-ops to prevent 404 errors.
  async fetchRoomDefaultAssignments(_schoolId) {
    return [];
  },

  async createRoomDefaultAssignment(_schoolId, _payload) {
    throw new Error("Room default assignments endpoint is not yet available.");
  },

  async updateRoomDefaultAssignment(_assignmentId, _payload) {
    throw new Error("Room default assignments endpoint is not yet available.");
  },

  async deleteRoomDefaultAssignment(_assignmentId) {
    // no-op
  },

  async createRoom(_schoolId, room) {
    const res = await unwrap<any>(
      apiWithToken(basePath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(room),
      })
    );
    return res?.data ?? res?.item ?? res?.room ?? res;
  },

  async updateRoom(roomId, updates) {
    const res = await unwrap<any>(
      apiWithToken(`${basePath}/${roomId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })
    );
    return res?.data ?? res?.item ?? res?.room ?? res;
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
