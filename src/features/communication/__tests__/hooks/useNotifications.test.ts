import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import { createMockSocket, type MockSocket } from "../utils/mock-socket";
import {
  archiveNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/communication/api/communication.service";

let mockSocket: MockSocket;
let getNotificationsMock: ReturnType<typeof vi.fn>;

vi.mock("@/features/communication/api/communication.service", () => ({
  archiveNotification: vi.fn(),
  getNotifications: (...args: unknown[]) => getNotificationsMock(...args),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({
    socket: mockSocket,
    isConnected: true,
    connectionError: null,
    resyncVersion: 0,
    joinConversation: vi.fn(),
    leaveConversation: vi.fn(),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  }),
}));

import { useNotifications } from "@/features/communication/hooks/useNotifications";

describe("useNotifications", () => {
  beforeEach(() => {
    mockSocket = createMockSocket();
    getNotificationsMock = vi.fn().mockResolvedValue({ items: [], total: 0 });
    vi.restoreAllMocks();
  });

  it("cleans up notification socket listeners on unmount", async () => {
    const { unmount } = renderHook(() => useNotifications());

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(1));
    expect(
      mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.notificationCreated)
        .size,
    ).toBeGreaterThan(0);
    expect(
      mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.notificationRead).size,
    ).toBeGreaterThan(0);

    unmount();

    expect(
      mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.notificationCreated)
        .size,
    ).toBe(0);
    expect(
      mockSocket.getListeners(COMMUNICATION_SOCKET_EVENTS.notificationRead).size,
    ).toBe(0);
  });

  it("does not create a polling interval", async () => {
    const setIntervalSpy = vi.spyOn(window, "setInterval");

    renderHook(() => useNotifications());

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(1));
    expect(
      setIntervalSpy.mock.calls.some(([, delay]) => delay === 60_000),
    ).toBe(false);
  });

  it("requests notifications for the provided recipient user", async () => {
    renderHook(() => useNotifications({ recipientUserId: "user-1" }));

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(1));
    expect(getNotificationsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: "user-1",
      }),
    );
  });

  it("does not send a limit parameter by default", async () => {
    renderHook(() => useNotifications());

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(1));
    expect(getNotificationsMock).toHaveBeenCalledWith({});
  });

  it("sends pagination parameters only after pagination changes", async () => {
    getNotificationsMock.mockResolvedValueOnce({
      items: [],
      total: 125,
      page: 1,
      limit: 25,
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(getNotificationsMock).toHaveBeenCalledTimes(1);
      expect(result.current.pagination).toEqual(
        expect.objectContaining({
          total: 125,
          page: 1,
          limit: 25,
        }),
      );
    });

    getNotificationsMock.mockResolvedValueOnce({
      items: [],
      total: 125,
      page: 2,
      limit: 25,
    });

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(2));
    expect(getNotificationsMock).toHaveBeenLastCalledWith({
      page: 2,
    });

    getNotificationsMock.mockResolvedValueOnce({
      items: [],
      total: 125,
      page: 1,
      limit: 50,
    });

    act(() => {
      result.current.setLimit(50);
    });

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(3));
    expect(getNotificationsMock).toHaveBeenLastCalledWith({
      page: 1,
      limit: 50,
    });
  });

  describe("socket throttling", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("refreshes when a notification is created over the socket", async () => {
      renderHook(() => useNotifications());

      await act(async () => {
        vi.advanceTimersByTime(0);
      });
      expect(getNotificationsMock).toHaveBeenCalledTimes(1);

      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.notificationCreated, {
          notification: { id: "notification-1" },
        });
      });

      // It should NOT call refresh immediately
      expect(getNotificationsMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(getNotificationsMock).toHaveBeenCalledTimes(2);
    });

    it("debounces multiple socket events to a single refresh after 100ms", async () => {
      renderHook(() => useNotifications());

      // Advance timers to flush the initial effect refresh
      await act(async () => {
        vi.advanceTimersByTime(0);
      });
      expect(getNotificationsMock).toHaveBeenCalledTimes(1);

      // Simulate a notification created event
      act(() => {
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.notificationCreated, {
          notification: { id: "notification-1" },
        });
      });

      // It should NOT call refresh immediately
      expect(getNotificationsMock).toHaveBeenCalledTimes(1);

      // Simulate another event at 50ms
      act(() => {
        vi.advanceTimersByTime(50);
        mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.notificationRead, {
          notificationId: "notification-1",
        });
      });

      // Still no new call
      expect(getNotificationsMock).toHaveBeenCalledTimes(1);

      // Advance by another 100ms (total 100ms from the second event)
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(getNotificationsMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("optimistic mutations", () => {
    const mockNotifications = [
      { id: "notif-1", status: "unread" as const, readAt: null, archivedAt: null },
      { id: "notif-2", status: "unread" as const, readAt: null, archivedAt: null },
    ];

    beforeEach(() => {
      getNotificationsMock.mockResolvedValue({ items: mockNotifications, total: 2 });
    });

    it("optimistically updates local state for markRead and rolls back on failure", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const markNotificationReadMock = vi.mocked(markNotificationRead);
      
      const apiError = new Error("API failed");
      let resolveApi: any;
      let rejectApi: any;
      const apiPromise = new Promise((resolve, reject) => {
        resolveApi = resolve;
        rejectApi = reject;
      });
      markNotificationReadMock.mockReturnValueOnce(apiPromise);

      const { result } = renderHook(() => useNotifications());
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });
      expect(result.current.unreadCount).toBe(2);

      // Call markRead (fire and don't await yet)
      let markReadPromise;
      act(() => {
        markReadPromise = result.current.markRead("notif-1");
      });

      // Assert optimistic update
      expect(result.current.notifications[0].status).toBe("read");
      expect(result.current.notifications[0].readAt).not.toBeNull();
      expect(result.current.unreadCount).toBe(1);

      // Reject API call to test rollback
      await act(async () => {
        rejectApi(apiError);
        try {
          await markReadPromise;
        } catch (e) {
          // Expected error
        }
      });

      // Assert rollback
      expect(result.current.notifications[0].status).toBe("unread");
      expect(result.current.notifications[0].readAt).toBeNull();
      expect(result.current.unreadCount).toBe(2);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("optimistically updates local state for archive and rolls back on failure", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const archiveNotificationMock = vi.mocked(archiveNotification);
      
      const apiError = new Error("API failed");
      let resolveApi: any;
      let rejectApi: any;
      const apiPromise = new Promise((resolve, reject) => {
        resolveApi = resolve;
        rejectApi = reject;
      });
      archiveNotificationMock.mockReturnValueOnce(apiPromise);

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      let archivePromise;
      act(() => {
        archivePromise = result.current.archive("notif-1");
      });

      // Assert optimistic update
      expect(result.current.notifications[0].status).toBe("archived");
      expect(result.current.notifications[0].archivedAt).not.toBeNull();

      // Reject API call to test rollback
      await act(async () => {
        rejectApi(apiError);
        try {
          await archivePromise;
        } catch (e) {
          // Expected error
        }
      });

      // Assert rollback
      expect(result.current.notifications[0].status).toBe("unread");
      expect(result.current.notifications[0].archivedAt).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("optimistically updates local state for markAllRead and rolls back on failure", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const markAllNotificationsReadMock = vi.mocked(markAllNotificationsRead);
      
      const apiError = new Error("API failed");
      let resolveApi: any;
      let rejectApi: any;
      const apiPromise = new Promise((resolve, reject) => {
        resolveApi = resolve;
        rejectApi = reject;
      });
      markAllNotificationsReadMock.mockReturnValueOnce(apiPromise);

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });
      expect(result.current.unreadCount).toBe(2);

      let markAllReadPromise;
      act(() => {
        markAllReadPromise = result.current.markAllRead();
      });

      // Assert optimistic update: all should be read
      expect(result.current.notifications[0].status).toBe("read");
      expect(result.current.notifications[1].status).toBe("read");
      expect(result.current.unreadCount).toBe(0);

      // Reject API call to test rollback
      await act(async () => {
        rejectApi(apiError);
        try {
          await markAllReadPromise;
        } catch (e) {
          // Expected error
        }
      });

      // Assert rollback
      expect(result.current.notifications[0].status).toBe("unread");
      expect(result.current.notifications[1].status).toBe("unread");
      expect(result.current.unreadCount).toBe(2);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("optimistically updates and then refreshes on success", async () => {
      const markNotificationReadMock = vi.mocked(markNotificationRead);
      let resolveApi: any;
      const apiPromise = new Promise((resolve) => {
        resolveApi = resolve;
      });
      markNotificationReadMock.mockReturnValueOnce(apiPromise);

      const { result } = renderHook(() => useNotifications());
      
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });
      expect(getNotificationsMock).toHaveBeenCalledTimes(1);

      let markReadPromise;
      act(() => {
        markReadPromise = result.current.markRead("notif-1");
      });

      // Assert optimistic update
      expect(result.current.notifications[0].status).toBe("read");
      expect(getNotificationsMock).toHaveBeenCalledTimes(1); // hasn't refreshed yet

      // Mock the next refresh to return the updated item from the server
      getNotificationsMock.mockResolvedValueOnce({
        items: [
          { id: "notif-1", status: "read" as const, readAt: "2026-06-28T00:00:00.000Z" },
          { id: "notif-2", status: "unread" as const, readAt: null },
        ],
        total: 2,
      });

      // Resolve the API call
      await act(async () => {
        resolveApi({ success: true });
        await markReadPromise;
      });

      // Wait for the refreshed list to be loaded
      await waitFor(() => {
        expect(getNotificationsMock).toHaveBeenCalledTimes(2);
      });
      expect(result.current.notifications[0].status).toBe("read");
      expect(result.current.notifications[0].readAt).toBe("2026-06-28T00:00:00.000Z");
    });
  });
});
