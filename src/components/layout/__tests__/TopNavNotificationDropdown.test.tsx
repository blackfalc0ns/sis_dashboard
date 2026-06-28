import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TopNavNotificationDropdown from "../TopNavNotificationDropdown";
import { getNotificationMuted, setNotificationMuted } from "@/features/communication/hooks/useNotificationSound";
import { getMessage } from "@/features/communication/api/communication.service";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
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

vi.mock("@/features/communication/api/communication.service", () => ({
  getMessage: vi.fn(),
}));

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
    vi.mocked(getMessage).mockResolvedValue({});
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

    // Verify router push was called with the same conversations route as the toast
    expect(mockPush).toHaveBeenCalledWith(
      "/en/communication/conversations?conversationId=conv-456",
    );
  });

  it("opens a communication conversation when the notification has a top-level conversationId", () => {
    render(
      <TopNavNotificationDropdown
        notifications={[
          {
            id: "notif-conversation",
            type: "message_received",
            sourceModule: "communication",
            title: "New Message",
            body: "Open the conversation",
            status: "unread",
            priority: "normal",
            conversationId: "conv-from-notification",
            createdAt: "2026-06-27T19:00:00.000Z",
          },
        ]}
        unreadCount={1}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />
    );

    const messageCard = screen.getByText("New Message").closest('[role="button"]');
    expect(messageCard).toBeInTheDocument();

    if (messageCard) {
      fireEvent.click(messageCard);
    }

    expect(onMarkReadMock).toHaveBeenCalledWith("notif-conversation");
    expect(mockPush).toHaveBeenCalledWith(
      "/en/communication/conversations?conversationId=conv-from-notification",
    );
  });

  it("opens a communication conversation from persisted snake-case notification fields", () => {
    render(
      <TopNavNotificationDropdown
        notifications={[
          {
            id: "notif-snake-case",
            type: "message_received",
            sourceModule: "communication",
            title: "Stored Message",
            body: "Open stored conversation",
            status: "unread",
            priority: "normal",
            deep_link: {
              type: "conversation_message",
              conversation_id: "conv-from-deep-link",
              message_id: "msg-from-deep-link",
            },
            createdAt: "2026-06-27T19:00:00.000Z",
          },
        ]}
        unreadCount={1}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />
    );

    const messageCard = screen.getByText("Stored Message").closest('[role="button"]');
    expect(messageCard).toBeInTheDocument();

    if (messageCard) {
      fireEvent.click(messageCard);
    }

    expect(mockPush).toHaveBeenCalledWith(
      "/en/communication/conversations?conversationId=conv-from-deep-link",
    );
  });

  it("opens a conversation when the persisted notification source is a conversation", () => {
    render(
      <TopNavNotificationDropdown
        notifications={[
          {
            id: "notif-source-conversation",
            type: "message_received",
            sourceModule: "communication",
            title: "Source Conversation",
            body: "Open source conversation",
            status: "unread",
            priority: "normal",
            source_type: "conversation",
            source_id: "conv-from-source",
            createdAt: "2026-06-27T19:00:00.000Z",
          },
        ]}
        unreadCount={1}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />
    );

    const messageCard = screen
      .getByText("Source Conversation")
      .closest('[role="button"]');
    expect(messageCard).toBeInTheDocument();

    if (messageCard) {
      fireEvent.click(messageCard);
    }

    expect(mockPush).toHaveBeenCalledWith(
      "/en/communication/conversations?conversationId=conv-from-source",
    );
  });

  it("opens a conversation by resolving the source message notification", async () => {
    vi.mocked(getMessage).mockResolvedValueOnce({
      id: "msg-source",
      conversationId: "conv-from-message",
    });

    render(
      <TopNavNotificationDropdown
        notifications={[
          {
            id: "notif-message-source",
            type: "message_received",
            sourceModule: "communication",
            title: "Message Source",
            body: "Open message conversation",
            status: "unread",
            priority: "normal",
            sourceType: "message",
            sourceId: "msg-source",
            createdAt: "2026-06-27T19:00:00.000Z",
          },
        ]}
        unreadCount={1}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
      />
    );

    const messageCard = screen
      .getByText("Message Source")
      .closest('[role="button"]');
    expect(messageCard).toBeInTheDocument();

    if (messageCard) {
      fireEvent.click(messageCard);
    }

    await waitFor(() => expect(getMessage).toHaveBeenCalledWith("msg-source"));
    expect(mockPush).toHaveBeenCalledWith(
      "/en/communication/conversations?conversationId=conv-from-message",
    );
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

  it("renders four filter tabs: All, Chat, Announcements, and Academics", () => {
    const onTabChangeMock = vi.fn();
    render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
        activeTab="all"
        onTabChange={onTabChangeMock}
      />
    );

    expect(screen.getByRole("tab", { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Chat/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Announcements/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Academics/i })).toBeInTheDocument();
  });

  it("calls onTabChange callback when a tab is clicked", () => {
    const onTabChangeMock = vi.fn();
    render(
      <TopNavNotificationDropdown
        notifications={mockNotifications}
        unreadCount={2}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
        activeTab="all"
        onTabChange={onTabChangeMock}
      />
    );

    fireEvent.click(screen.getByRole("tab", { name: /Chat/i }));
    expect(onTabChangeMock).toHaveBeenCalledWith("chat");

    fireEvent.click(screen.getByRole("tab", { name: /Announcements/i }));
    expect(onTabChangeMock).toHaveBeenCalledWith("announcements");

    fireEvent.click(screen.getByRole("tab", { name: /Academics/i }));
    expect(onTabChangeMock).toHaveBeenCalledWith("academics");
  });

  it("filters notifications to show only academics modules when activeTab is academics", () => {
    const academicNotifications = [
      {
        id: "academic-1",
        type: "attendance_absence" as const,
        sourceModule: "attendance" as const,
        title: "Attendance Notification",
        body: "Absent",
        status: "unread" as const,
        createdAt: "2026-06-27T20:00:00.000Z",
      },
      {
        id: "academic-2",
        type: "grade_posted" as const,
        sourceModule: "grades" as const,
        title: "Grade Notification",
        body: "A Grade",
        status: "unread" as const,
        createdAt: "2026-06-27T19:00:00.000Z",
      },
      {
        id: "chat-1",
        type: "message_received" as const,
        sourceModule: "communication" as const,
        title: "Chat Notification",
        body: "Hello",
        status: "unread" as const,
        createdAt: "2026-06-27T18:00:00.000Z",
      },
    ];

    const { rerender } = render(
      <TopNavNotificationDropdown
        notifications={academicNotifications}
        unreadCount={3}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
        activeTab="all"
        onTabChange={vi.fn()}
      />
    );

    // Verify all 3 are shown
    expect(screen.getByText("Attendance Notification")).toBeInTheDocument();
    expect(screen.getByText("Grade Notification")).toBeInTheDocument();
    expect(screen.getByText("Chat Notification")).toBeInTheDocument();

    // Rerender with activeTab="academics"
    rerender(
      <TopNavNotificationDropdown
        notifications={academicNotifications}
        unreadCount={3}
        onMarkRead={onMarkReadMock}
        onMarkAllRead={onMarkAllReadMock}
        onArchive={onArchiveMock}
        isOpen={true}
        onClose={onCloseMock}
        activeTab="academics"
        onTabChange={vi.fn()}
      />
    );

    // Verify chat notification is NOT shown, but academic ones are
    expect(screen.getByText("Attendance Notification")).toBeInTheDocument();
    expect(screen.getByText("Grade Notification")).toBeInTheDocument();
    expect(screen.queryByText("Chat Notification")).not.toBeInTheDocument();
  });
});
