import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COMMUNICATION_SOCKET_EVENTS } from "@/features/communication/realtime/communication-events";
import {
  createMockSocket,
  type MockSocket,
} from "@/features/communication/__tests__/utils/mock-socket";

let mockSocket: MockSocket;
const pushMock = vi.fn();
const joinConversationMock = vi.fn();
const getConversationsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
  }),
}));

vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({
    socket: mockSocket,
    joinConversation: joinConversationMock,
  }),
}));

vi.mock("@/features/communication/api/communication.service", () => ({
  getConversations: (...args: unknown[]) => getConversationsMock(...args),
}));

vi.mock("@/features/communication/hooks/useNotificationSound", () => ({
  useNotificationSound: () => ({ play: vi.fn() }),
}));

import GlobalMessageNotifications from "@/features/communication/components/GlobalMessageNotifications";

describe("GlobalMessageNotifications", () => {
  beforeEach(() => {
    mockSocket = createMockSocket();
    pushMock.mockClear();
    joinConversationMock.mockClear();
    getConversationsMock.mockResolvedValue({ items: [] });
  });

  it("shows one toast when a message also creates a notification event", () => {
    render(<GlobalMessageNotifications />);

    act(() => {
      mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.messageCreated, {
        conversationId: "conversation-1",
        message: {
          id: "message-1",
          conversationId: "conversation-1",
          senderUserId: "user-2",
          senderName: "Teacher",
          body: "Please check this",
        },
      });
      mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.notificationCreated, {
        notification: {
          notificationId: "notification-1",
          id: "notification-1",
          type: "message_received",
          sourceId: "message-1",
          title: "Teacher",
          body: "Please check this",
          deepLink: {
            type: "conversation_message",
            conversationId: "conversation-1",
            messageId: "message-1",
          },
        },
      });
    });

    expect(screen.getAllByText("Teacher")).toHaveLength(1);
    expect(screen.getAllByText("Please check this")).toHaveLength(1);
  });

  it("shows one toast when the notification event arrives before the message event", () => {
    render(<GlobalMessageNotifications />);

    act(() => {
      mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.notificationCreated, {
        notification: {
          notificationId: "notification-1",
          type: "message_received",
          sourceId: "message-1",
          title: "Teacher",
          body: "Please check this",
          deepLink: {
            type: "conversation_message",
            conversationId: "conversation-1",
            messageId: "message-1",
          },
        },
      });
      mockSocket.simulateEvent(COMMUNICATION_SOCKET_EVENTS.messageCreated, {
        conversationId: "conversation-1",
        message: {
          id: "message-1",
          conversationId: "conversation-1",
          senderUserId: "user-2",
          senderName: "Teacher",
          body: "Please check this",
        },
      });
    });

    expect(screen.getAllByText("Teacher")).toHaveLength(1);
    expect(screen.getAllByText("Please check this")).toHaveLength(1);
  });
});
