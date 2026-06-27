import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TopNavNotificationDropdown from "../TopNavNotificationDropdown";
import { getNotificationMuted, setNotificationMuted } from "@/features/communication/hooks/useNotificationSound";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useNotificationSound hook functions
vi.mock("@/features/communication/hooks/useNotificationSound", () => {
  let mutedState = false;
  return {
    getNotificationMuted: vi.fn(() => mutedState),
    setNotificationMuted: vi.fn((val: boolean) => {
      mutedState = val;
    }),
    useNotificationSound: vi.fn(() => ({
      play: vi.fn(),
    })),
  };
});

describe("TopNavNotificationDropdown", () => {
  const onMarkReadMock = vi.fn();
  const onMarkAllReadMock = vi.fn();
  const onArchiveMock = vi.fn();
  const onCloseMock = vi.fn();

  const mockNotifications = [
    {
      id: "notif-1",
      type: "announcement_published" as const,
      title: "New Announcement",
      body: "This is an announcement",
      status: "unread" as const,
      priority: "urgent" as const,
      deepLink: {
        type: "announcement",
        announcementId: "ann-123",
      },
      createdAt: "2026-06-27T20:00:00.000Z",
    },
    {
      id: "notif-2",
      type: "message_received" as const,
      title: "New Message",
      body: "Hello there",
      status: "unread" as const,
      priority: "normal" as const,
      deepLink: {
        type: "conversation_message",
        conversationId: "conv-456",
        messageId: "msg-789",
      },
      createdAt: "2026-06-27T19:00:00.000Z",
    },
    {
      id: "notif-3",
      type: "attendance_absence" as const,
      title: "Absence Record",
      body: "Absent today",
      status: "read" as const,
      priority: "high" as const,
      deepLink: null,
      createdAt: "2026-06-27T18:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={false}
        onClose={onCloseMock}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders correctly with notifications list, icons, badges, and unread indicator", () => {
    render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />
    );

    // Verify Title and Unread count summary
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText(/2 unread updates/)).toBeInTheDocument();

    // Verify Notification titles are rendered
    expect(screen.getByText("New Announcement")).toBeInTheDocument();
    expect(screen.getByText("New Message")).toBeInTheDocument();
    expect(screen.getByText("Absence Record")).toBeInTheDocument();

    // Verify Priority Pill Badges are rendered
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();

    // Verify unread indicator dots (we will search by data-testid or visual class if any, or just check they exist)
    const unreadDots = screen.getAllByTestId("unread-indicator");
    expect(unreadDots.length).toBe(2);
  });

  it("triggers onMarkRead and redirects to deepLink on item card click", () => {
    render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />
    );

    // Click on the second notification (unread message)
    const messageCard = screen.getByText("New Message").closest('[role="button"]');
    expect(messageCard).toBeInTheDocument();

    if (messageCard) {
      fireEvent.click(messageCard);
    }

    // Verify onMarkRead triggered
    expect(onMarkReadMock).toHaveBeenCalledWith("notif-2");

    // Verify router push was called with the deepLink route for conversation_message
    expect(mockPush).toHaveBeenCalledWith("/communication?conversationId=conv-456");
  });

  it("renders and handles sound control speaker toggle", () => {
    // Reset mocked functions
    vi.mocked(getNotificationMuted).mockReturnValue(false);

    const { rerender } = render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />
    );

    // Find the toggle button
    const soundButton = screen.getByRole("button", { name: /mute notifications/i });
    expect(soundButton).toBeInTheDocument();

    // Click sound control
    fireEvent.click(soundButton);

    // Verify setNotificationMuted is called with true (since it was false/unmuted)
    expect(setNotificationMuted).toHaveBeenCalledWith(true);

    // Rerender with muted state mocked as true
    vi.mocked(getNotificationMuted).mockReturnValue(true);
    rerender(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />
    );

    // Verify the button label / accessibility name changes
    const soundButtonMuted = screen.getByRole("button", { name: /unmute notifications/i });
    expect(soundButtonMuted).toBeInTheDocument();

    // Click it again
    fireEvent.click(soundButtonMuted);
    expect(setNotificationMuted).toHaveBeenCalledWith(false);
  });

  it("renders Archive buttons and triggers onArchive on click", () => {
    render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />
    );

    // Find Archive buttons
    const archiveButtons = screen.getAllByRole("button", { name: /archive notification/i });
    expect(archiveButtons.length).toBe(3);

    // Click the first one
    fireEvent.click(archiveButtons[0]);

    // Verify onArchive triggered
    expect(onArchiveMock).toHaveBeenCalledWith("notif-1");
  });
});
