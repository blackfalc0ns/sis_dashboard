import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import { createMockSocket, type MockSocket } from "@/features/communication/__tests__/utils/mock-socket";
import TopNav from "../TopNav";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/en/dashboard",
  useSearchParams: () => new URLSearchParams(""),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

// Mock useAuth
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
  }),
}));

// Mock useNotificationSound
vi.mock("@/features/communication/hooks/useNotificationSound", () => ({
  getNotificationMuted: () => false,
  setNotificationMuted: vi.fn(),
}));

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
  }),
}));

describe("TopNav Notification Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    getNotificationsMock = vi.fn().mockResolvedValue({ items: [], total: 0 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens the dropdown when the Bell button is clicked", async () => {
    render(
      <TopNav
        userName="Test User"
        userRole="Admin"
        schoolName="Test School"
      />
    );

    // Let any initial mount updates resolve
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    // Initial state: dropdown dialog is not in the document
    expect(screen.queryByRole("dialog", { name: "Notifications" })).not.toBeInTheDocument();

    // Click the Bell button
    const bellButton = screen.getByRole("button", { name: /notifications/i });
    act(() => {
      fireEvent.click(bellButton);
    });

    // Dropdown dialog should now be in the document
    expect(screen.getByRole("dialog", { name: "Notifications" })).toBeInTheDocument();
  });

  it("updates correctly when socket events alter notification list size or unread badge status", async () => {
    // 1. Initial render with 0 notifications
    render(
      <TopNav
        userName="Test User"
        userRole="Admin"
        schoolName="Test School"
      />
    );

    // Wait for first call to fetch notifications and let mount finish
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(getNotificationsMock).toHaveBeenCalledTimes(1);

    // Initially no count badge should be rendered
    const bellButton = screen.getByRole("button", { name: /notifications/i });
    expect(bellButton).toHaveTextContent("");

    // 2. Set up mock API response for next fetch
    const testNotif = {
      id: "notif-100",
      type: "message_received",
      title: "Incoming Alert",
      body: "Emergency maintenance has begun.",
      status: "unread",
      createdAt: "2026-06-27T20:00:00.000Z",
    };

    getNotificationsMock.mockResolvedValue({
      items: [testNotif],
      total: 1,
    });

    // 3. Simulate socket event: notificationCreated
    await act(async () => {
      mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.notificationCreated, {
        notification: testNotif,
      });
      // advance debounce timer
      await vi.advanceTimersByTimeAsync(150);
    });

    // 4. Verify notification is fetched and badge updates to 1
    expect(getNotificationsMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("1")).toBeInTheDocument();

    // 5. Click the Bell button and check if dropdown shows the new notification
    act(() => {
      fireEvent.click(bellButton);
    });
    expect(screen.getByRole("dialog", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByText("Incoming Alert")).toBeInTheDocument();
  });
});
