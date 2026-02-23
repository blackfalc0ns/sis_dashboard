// Mock service for Academic Calendar (TERM SCOPED)
// Replace with real API calls when backend is ready

export interface AcademicEvent {
  id: string;
  termId: string;
  titleAr: string;
  titleEn: string;
  type: "HOLIDAY" | "EXAM" | "ACTIVITY" | "OTHER";
  allDay: boolean;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION";
  scopeId?: string; // ID of stage/grade/section if not SCHOOL
  notesAr?: string;
  notesEn?: string;
  notify?: boolean; // Whether to notify affected users
  createdAt: string;
}

// In-memory mock data keyed by termId
const eventsByTerm: Record<string, AcademicEvent[]> = {
  "term-1-1": [
    {
      id: "event-1",
      termId: "term-1-1",
      titleAr: "بداية الفصل الدراسي",
      titleEn: "Term Start",
      type: "OTHER",
      allDay: true,
      startDate: "2024-09-01",
      endDate: "2024-09-01",
      scopeType: "SCHOOL",
      createdAt: "2024-08-15T00:00:00Z",
    },
    {
      id: "event-2",
      termId: "term-1-1",
      titleAr: "اليوم الوطني",
      titleEn: "National Day",
      type: "HOLIDAY",
      allDay: true,
      startDate: "2024-09-23",
      endDate: "2024-09-23",
      scopeType: "SCHOOL",
      notesAr: "عطلة رسمية",
      notesEn: "Official holiday",
      createdAt: "2024-08-15T00:00:00Z",
    },
    {
      id: "event-3",
      termId: "term-1-1",
      titleAr: "اختبار الرياضيات",
      titleEn: "Mathematics Exam",
      type: "EXAM",
      allDay: false,
      startDate: "2024-10-15",
      endDate: "2024-10-15",
      scopeType: "GRADE",
      scopeId: "grade-1",
      notesAr: "اختبار الوحدة الأولى",
      notesEn: "Unit 1 exam",
      createdAt: "2024-09-01T00:00:00Z",
    },
    {
      id: "event-4",
      termId: "term-1-1",
      titleAr: "رحلة ميدانية",
      titleEn: "Field Trip",
      type: "ACTIVITY",
      allDay: true,
      startDate: "2024-11-05",
      endDate: "2024-11-05",
      scopeType: "STAGE",
      scopeId: "stage-1",
      notesAr: "زيارة المتحف الوطني",
      notesEn: "Visit to National Museum",
      createdAt: "2024-10-01T00:00:00Z",
    },
  ],
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let idCounter = 5000;
const generateId = (prefix: string) => {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
};

/**
 * Fetch all events for a term
 */
export const fetchTermEvents = async (termId: string): Promise<AcademicEvent[]> => {
  await delay(300);
  const events = eventsByTerm[termId] || [];
  console.log(`fetchTermEvents for term ${termId}: found ${events.length} events`);
  return events;
};

/**
 * Create a new event for a term
 */
export const createTermEvent = async (
  termId: string,
  payload: Omit<AcademicEvent, "id" | "termId" | "createdAt">
): Promise<AcademicEvent> => {
  await delay(300);

  const newEvent: AcademicEvent = {
    id: generateId("event"),
    termId,
    ...payload,
    createdAt: new Date().toISOString(),
  };

  if (!eventsByTerm[termId]) {
    eventsByTerm[termId] = [];
  }
  eventsByTerm[termId].push(newEvent);

  console.log("Created new event:", newEvent.id, "for term:", termId);
  console.log("Total events in term:", eventsByTerm[termId].length);

  return newEvent;
};

/**
 * Update an existing event
 */
export const updateEvent = async (
  eventId: string,
  payload: Partial<Omit<AcademicEvent, "id" | "termId" | "createdAt">>
): Promise<AcademicEvent> => {
  await delay(300);

  // Find event across all terms
  for (const termId in eventsByTerm) {
    const events = eventsByTerm[termId];
    const index = events.findIndex((e) => e.id === eventId);

    if (index !== -1) {
      events[index] = { ...events[index], ...payload };
      return events[index];
    }
  }

  throw new Error("Event not found");
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  await delay(300);

  console.log("deleteEvent called with ID:", eventId);
  console.log("Current eventsByTerm keys:", Object.keys(eventsByTerm));
  
  // Find and remove event across all terms
  for (const termId in eventsByTerm) {
    const events = eventsByTerm[termId];
    console.log(`Checking term ${termId}, has ${events.length} events`);
    const index = events.findIndex((e) => e.id === eventId);

    if (index !== -1) {
      console.log(`Found event at index ${index} in term ${termId}`);
      events.splice(index, 1);
      return;
    }
  }

  // Log available event IDs for debugging
  const allEventIds = Object.values(eventsByTerm)
    .flat()
    .map((e) => e.id);
  console.error(`Event not found. Looking for: "${eventId}", Available IDs:`, allEventIds);
  
  throw new Error(`Event not found: ${eventId}`);
};

/**
 * Helper: Check if event is within term date range
 */
export const isEventWithinTermRange = (
  eventStartDate: string,
  eventEndDate: string,
  termStartDate: string,
  termEndDate: string
): boolean => {
  const eventStart = new Date(eventStartDate);
  const eventEnd = new Date(eventEndDate);
  const termStart = new Date(termStartDate);
  const termEnd = new Date(termEndDate);

  return eventStart >= termStart && eventEnd <= termEnd;
};

/**
 * Helper: Get events for a specific date
 */
export const getEventsForDate = (
  events: AcademicEvent[],
  date: Date
): AcademicEvent[] => {
  // Format date without timezone conversion
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  console.log("getEventsForDate called for:", dateStr);

  const filtered = events.filter((event) => {
    const eventStart = event.startDate;
    const eventEnd = event.endDate;
    const matches = dateStr >= eventStart && dateStr <= eventEnd;
    
    if (matches) {
      console.log(`  Event "${event.titleEn}" matches (${eventStart} to ${eventEnd})`);
    }

    return matches;
  });

  console.log(`  Found ${filtered.length} events for ${dateStr}`);
  return filtered;
};

/**
 * Helper: Get events for a date range
 */
export const getEventsForDateRange = (
  events: AcademicEvent[],
  startDate: Date,
  endDate: Date
): AcademicEvent[] => {
  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  return events.filter((event) => {
    // Event overlaps with range if:
    // event.start <= range.end AND event.end >= range.start
    return event.startDate <= endStr && event.endDate >= startStr;
  });
};

/**
 * Send notification for an event (EXAM or HOLIDAY)
 * 
 * TODO: Wire to actual notification API when available
 * For now, this is a stub that logs the notification
 */
export const notifyEvent = async (eventId: string): Promise<void> => {
  await delay(300);

  // Find the event
  for (const termId in eventsByTerm) {
    const event = eventsByTerm[termId].find((e) => e.id === eventId);
    if (event) {
      console.log(`[NOTIFICATION STUB] Sending notification for event: ${event.titleEn}`);
      console.log(`  Type: ${event.type}`);
      console.log(`  Scope: ${event.scopeType}${event.scopeId ? ` (${event.scopeId})` : ""}`);
      console.log(`  Date: ${event.startDate} to ${event.endDate}`);
      
      // TODO: Replace with actual API call
      // await fetch('/api/events/notify', {
      //   method: 'POST',
      //   body: JSON.stringify({ eventId }),
      // });
      
      return;
    }
  }

  throw new Error("Event not found");
};
