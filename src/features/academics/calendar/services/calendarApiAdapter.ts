import { apiWithToken } from "@/lib/api";
import type { CalendarAdapter } from "@/features/academics/calendar/services/calendarAdapter";
import type { AcademicEvent } from "@/features/academics/calendar/services/calendarService";

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

export const createCalendarApiAdapter = (
  basePath: string = "/academics/calendar"
): CalendarAdapter => ({
  async fetchTermEvents(termId) {
    return unwrap<AcademicEvent[]>(
      apiWithToken(`${basePath}${buildQuery({ termId })}`, {
        method: "GET",
      })
    );
  },

  async createTermEvent(termId, payload) {
    return unwrap<AcademicEvent>(
      apiWithToken(basePath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId,
          ...payload,
        }),
      })
    );
  },

  async updateEvent(eventId, payload) {
    return unwrap<AcademicEvent>(
      apiWithToken(`${basePath}/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
    );
  },

  async deleteEvent(eventId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/${eventId}`, {
        method: "DELETE",
      })
    );
  },

  async notifyEvent(eventId) {
    await unwrap<void>(
      apiWithToken(`${basePath}/${eventId}/notify`, {
        method: "POST",
      })
    );
  },
});

export const calendarApiAdapter = createCalendarApiAdapter();
