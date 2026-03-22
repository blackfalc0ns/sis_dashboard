import type { AcademicEvent } from "@/features/academics/calendar/services/calendarService";

export interface CalendarAdapter {
  fetchTermEvents(termId: string): Promise<AcademicEvent[]>;
  createTermEvent(
    termId: string,
    payload: Omit<AcademicEvent, "id" | "termId" | "createdAt">
  ): Promise<AcademicEvent>;
  updateEvent(
    eventId: string,
    payload: Partial<Omit<AcademicEvent, "id" | "termId" | "createdAt">>
  ): Promise<AcademicEvent>;
  deleteEvent(eventId: string): Promise<void>;
  notifyEvent(eventId: string): Promise<void>;
}
