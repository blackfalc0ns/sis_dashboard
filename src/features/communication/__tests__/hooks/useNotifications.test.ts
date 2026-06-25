import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import { createMockSocket, type MockSocket } from "../utils/mock-socket";

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

  it("refreshes when a notification is created over the socket", async () => {
    renderHook(() => useNotifications());

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.notificationCreated, {
        notification: { id: "notification-1" },
      });
    });

    await waitFor(() => expect(getNotificationsMock).toHaveBeenCalledTimes(2));
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
});
