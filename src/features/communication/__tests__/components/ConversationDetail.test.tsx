/**
 * Tests for ConversationDetail component.
 *
 * Validates:
 * - Property 1: Error-Free Rendering — all hooks initialize without throwing (Requirements 1.5)
 * - Property 3: Tab Switch Does Not Re-Fetch Loaded Data (Requirements 2.5)
 * - Property 17: ReadOnlyComposer for Restricted Users (Requirements 6.5)
 * - Property 21: Permission-Based Action Visibility (Requirements 8.2, 8.3)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createConversation, createParticipant } from "../utils/test-data-generators";

// ─── Hoisted Mocks ──────────────────────────────────────────────────────────

const useConversationMock = vi.hoisted(() => vi.fn());
const useConversationMessagesMock = vi.hoisted(() => vi.fn());
const useConversationParticipantsMock = vi.hoisted(() => vi.fn());
const useConversationInvitesMock = vi.hoisted(() => vi.fn());
const useConversationJoinRequestsMock = vi.hoisted(() => vi.fn());
const useConversationRealtimeMock = vi.hoisted(() => vi.fn());
const usePresenceMock = vi.hoisted(() => vi.fn());
const useTypingIndicatorMock = vi.hoisted(() => vi.fn());
const useMessageReactionsMock = vi.hoisted(() => vi.fn());
const useMessageAttachmentsMock = vi.hoisted(() => vi.fn());
const useCommunicationPolicyMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => vi.fn());
const markConversationReadMock = vi.hoisted(() => vi.fn());

// ─── Module Mocks ───────────────────────────────────────────────────────────

vi.mock("@/features/communication/hooks/useConversation", () => ({
  useConversation: useConversationMock,
}));

vi.mock("@/features/communication/hooks/useConversationMessages", () => ({
  useConversationMessages: useConversationMessagesMock,
}));

vi.mock("@/features/communication/hooks/useConversationParticipants", () => ({
  useConversationParticipants: useConversationParticipantsMock,
}));

vi.mock("@/features/communication/hooks/useConversationInvites", () => ({
  useConversationInvites: useConversationInvitesMock,
}));

vi.mock("@/features/communication/hooks/useConversationJoinRequests", () => ({
  useConversationJoinRequests: useConversationJoinRequestsMock,
}));

vi.mock("@/features/communication/hooks/useConversationRealtime", () => ({
  useConversationRealtime: useConversationRealtimeMock,
}));

vi.mock("@/features/communication/hooks/usePresence", () => ({
  usePresence: usePresenceMock,
}));

vi.mock("@/features/communication/hooks/useTypingIndicator", () => ({
  useTypingIndicator: useTypingIndicatorMock,
}));

vi.mock("@/features/communication/hooks/useMessageReactions", () => ({
  useMessageReactions: useMessageReactionsMock,
}));

vi.mock("@/features/communication/hooks/useMessageAttachments", () => ({
  useMessageAttachments: useMessageAttachmentsMock,
}));

vi.mock("@/features/communication/hooks/useCommunicationPolicy", () => ({
  useCommunicationPolicy: useCommunicationPolicyMock,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: useAuthMock,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/features/communication/api/communication.service", () => ({
  markConversationRead: markConversationReadMock,
  archiveConversation: vi.fn(),
  closeConversation: vi.fn(),
  reopenConversation: vi.fn(),
  updateConversation: vi.fn(),
}));

// Mock child components to isolate ConversationDetail logic
vi.mock("@/features/communication/conversations_redesign/components/ConversationHeader", () => ({
  default: ({ conversation }: { conversation: unknown }) => (
    <div data-testid="conversation-header">Header</div>
  ),
}));

vi.mock("@/features/communication/conversations_redesign/components/ConversationTabs", () => ({
  default: ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => (
    <div data-testid="conversation-tabs">
      <button data-testid="tab-messages" onClick={() => onTabChange("messages")}>Messages</button>
      <button data-testid="tab-participants" onClick={() => onTabChange("participants")}>Participants</button>
      <button data-testid="tab-invites" onClick={() => onTabChange("invites")}>Invites</button>
      <button data-testid="tab-joinRequests" onClick={() => onTabChange("joinRequests")}>Join Requests</button>
    </div>
  ),
}));

vi.mock("@/features/communication/conversations_redesign/components/MessagesPanel", () => ({
  MessagesPanel: () => <div data-testid="messages-panel">MessagesPanel</div>,
  MessageComposer: () => <div data-testid="message-composer">MessageComposer</div>,
  ReadOnlyComposer: ({ labels }: { labels: { readOnlyComposer: string } }) => (
    <div data-testid="read-only-composer">{labels.readOnlyComposer}</div>
  ),
}));

vi.mock("@/features/communication/conversations_redesign/components/ParticipantsPanel", () => ({
  default: ({ canManage, canLeaveConversation, onAddParticipant, onPromoteParticipant, onDemoteParticipant, onRemoveParticipant, onLeaveConversation }: {
    canManage: boolean;
    canLeaveConversation: boolean;
    onAddParticipant: () => void;
    onPromoteParticipant: (p: unknown) => void;
    onDemoteParticipant: (p: unknown) => void;
    onRemoveParticipant: (p: unknown) => void;
    onLeaveConversation: () => void;
  }) => (
    <div data-testid="participants-panel">
      {canManage && <button data-testid="add-participant-btn">Add</button>}
      {canManage && <button data-testid="promote-btn">Promote</button>}
      {canManage && <button data-testid="demote-btn">Demote</button>}
      {canManage && <button data-testid="remove-btn">Remove</button>}
      {canLeaveConversation && <button data-testid="leave-btn">Leave</button>}
    </div>
  ),
}));

vi.mock("@/features/communication/conversations_redesign/components/InvitesPanel", () => ({
  default: () => <div data-testid="invites-panel">InvitesPanel</div>,
}));

vi.mock("@/features/communication/conversations_redesign/components/JoinRequestsPanel", () => ({
  default: () => <div data-testid="join-requests-panel">JoinRequestsPanel</div>,
}));

vi.mock("@/features/communication/conversations_redesign/components/EditConversationDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/AddParticipantDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/EditParticipantRoleDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/RemoveParticipantDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/LeaveConversationDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/CreateInviteDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/CreateJoinRequestDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/RejectInviteDialog", () => ({
  default: () => null,
}));

vi.mock("@/features/communication/components/conversations/ReviewJoinRequestDialog", () => ({
  default: () => null,
}));

// ─── Import Component Under Test ────────────────────────────────────────────

import ConversationDetail from "@/features/communication/conversations_redesign/components/ConversationDetail";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

// ─── Test Setup ─────────────────────────────────────────────────────────────

const TEST_CONVERSATION_ID = "conv-test-001";
const TEST_USER_ID = "user-test-001";
const labels = conversationRedesignLabels.en;

function setupDefaultMocks() {
  const conversation = createConversation({
    id: TEST_CONVERSATION_ID,
    status: "active",
  });

  useAuthMock.mockReturnValue({
    user: { id: TEST_USER_ID, firstName: "Test", lastName: "User" },
    isAuthenticated: true,
  });

  useConversationMock.mockReturnValue({
    conversation,
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  });

  useConversationMessagesMock.mockReturnValue({
    messages: [],
    isLoading: false,
    isLoadingOlder: false,
    isMutating: false,
    hasOlderMessages: false,
    error: null,
    send: vi.fn(),
    edit: vi.fn(),
    remove: vi.fn(),
    loadOlderMessages: vi.fn(),
    refresh: vi.fn(),
    upsertFromRealtime: vi.fn(),
    deleteFromRealtime: vi.fn(),
    patchFromRealtime: vi.fn(),
    patchReadFromRealtime: vi.fn(),
  });

  useConversationParticipantsMock.mockReturnValue({
    participants: [
      createParticipant({
        userId: TEST_USER_ID,
        role: "member",
        status: "active",
        actor: { id: TEST_USER_ID, name: "Test User" },
      }),
    ],
    isLoading: false,
    isMutating: false,
    total: 1,
    error: null,
    refresh: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    promote: vi.fn(),
    demote: vi.fn(),
    remove: vi.fn(),
    leave: vi.fn(),
  });

  useConversationInvitesMock.mockReturnValue({
    invites: [],
    isLoading: false,
    isMutating: false,
    total: 0,
    error: null,
    refresh: vi.fn(),
    create: vi.fn(),
    accept: vi.fn(),
    reject: vi.fn(),
  });

  useConversationJoinRequestsMock.mockReturnValue({
    joinRequests: [],
    isLoading: false,
    isMutating: false,
    total: 0,
    error: null,
    refresh: vi.fn(),
    create: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  });

  useConversationRealtimeMock.mockImplementation(() => undefined);

  usePresenceMock.mockReturnValue({
    presenceByUserId: {},
    handlePresenceUpdated: vi.fn(),
  });

  useTypingIndicatorMock.mockReturnValue({
    typingUsers: [],
    emitTyping: vi.fn(),
    stopOwnTyping: vi.fn(),
    handleTypingStarted: vi.fn(),
    handleTypingStopped: vi.fn(),
  });

  useMessageReactionsMock.mockReturnValue({
    reactionsByMessageId: {},
    addReaction: vi.fn(),
    removeMyReaction: vi.fn(),
    refreshAll: vi.fn(),
  });

  useMessageAttachmentsMock.mockReturnValue({
    attachmentsByMessageId: {},
    attachFile: vi.fn(),
    removeAttachment: vi.fn(),
    refreshAll: vi.fn(),
    uploadingMessageId: null,
  });

  useCommunicationPolicyMock.mockReturnValue({
    policy: {
      isEnabled: true,
      allowReactions: true,
      allowAttachments: true,
      maxMessageLength: 2000,
      maxAttachmentSizeMb: 10,
    },
  });

  markConversationReadMock.mockResolvedValue({});
}

function renderConversationDetail() {
  return render(
    <ConversationDetail
      conversationId={TEST_CONVERSATION_ID}
      labels={labels}
      onBack={vi.fn()}
      onToast={vi.fn()}
    />,
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("ConversationDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  // ─── Property 1: Error-Free Rendering ───────────────────────────────────

  describe("Property 1: All hooks initialize without throwing", () => {
    /**
     * Validates: Requirements 1.5
     * WHEN the ConversationDetail component mounts with a valid conversation ID,
     * all 8+ hooks SHALL initialize without throwing exceptions.
     */
    it("renders without throwing when all hooks return valid default state", () => {
      expect(() => renderConversationDetail()).not.toThrow();
    });

    it("renders the conversation header and tabs", () => {
      renderConversationDetail();
      expect(screen.getByTestId("conversation-header")).toBeInTheDocument();
      expect(screen.getByTestId("conversation-tabs")).toBeInTheDocument();
    });

    it("renders the messages panel by default", () => {
      renderConversationDetail();
      expect(screen.getByTestId("messages-panel")).toBeInTheDocument();
    });

    it("calls all hooks with the correct conversation ID", () => {
      renderConversationDetail();
      expect(useConversationMock).toHaveBeenCalledWith(TEST_CONVERSATION_ID);
      expect(useConversationMessagesMock).toHaveBeenCalledWith(TEST_CONVERSATION_ID);
      expect(useTypingIndicatorMock).toHaveBeenCalledWith(TEST_CONVERSATION_ID);
    });

    it("does not throw when conversation is null (loading state)", () => {
      useConversationMock.mockReturnValue({
        conversation: null,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
      });
      expect(() => renderConversationDetail()).not.toThrow();
    });
  });

  // ─── Property 3: Tab Switch Does Not Re-Fetch Loaded Data ──────────────

  describe("Property 3: Tab switch does not re-fetch previously loaded data", () => {
    /**
     * Validates: Requirements 2.5
     * For any sequence of tab switches, switching back to a previously loaded tab
     * SHALL not trigger a new API fetch for that tab's data.
     */
    it("does not re-call useConversationParticipants with enabled:true when switching back to participants", () => {
      renderConversationDetail();

      // Switch to participants tab (first load)
      fireEvent.click(screen.getByTestId("tab-participants"));

      const callsAfterFirstSwitch = useConversationParticipantsMock.mock.calls.length;

      // Switch to messages tab
      fireEvent.click(screen.getByTestId("tab-messages"));

      // Switch back to participants tab
      fireEvent.click(screen.getByTestId("tab-participants"));

      // The hook is called on every render (React behavior), but the `enabled` flag
      // should remain true after first load — it should NOT reset to false and back to true
      const allCalls = useConversationParticipantsMock.mock.calls;
      const callsAfterReturn = allCalls.slice(callsAfterFirstSwitch);

      // All subsequent calls should have enabled: true (data stays loaded, no re-fetch trigger)
      for (const call of callsAfterReturn) {
        const options = call[1];
        expect(options?.enabled).toBe(true);
      }
    });

    it("does not re-call useConversationInvites with enabled:true toggling when switching back to invites", () => {
      renderConversationDetail();

      // Switch to invites tab (first load)
      fireEvent.click(screen.getByTestId("tab-invites"));

      // Switch to messages tab
      fireEvent.click(screen.getByTestId("tab-messages"));

      // Switch back to invites tab
      fireEvent.click(screen.getByTestId("tab-invites"));

      // After first load, enabled should stay true (loadedTabs.invites remains true)
      const allCalls = useConversationInvitesMock.mock.calls;
      // Find the first call where enabled is true
      const firstEnabledIndex = allCalls.findIndex(
        (call: unknown[]) => (call[1] as { enabled?: boolean })?.enabled === true,
      );
      // All calls after that should also have enabled: true (no toggling back to false)
      const callsAfterEnabled = allCalls.slice(firstEnabledIndex);
      for (const call of callsAfterEnabled) {
        const options = call[1];
        expect(options?.enabled).toBe(true);
      }
    });

    it("loadedTabs persists across tab switches — joinRequests stays loaded", () => {
      renderConversationDetail();

      // Switch to joinRequests tab
      fireEvent.click(screen.getByTestId("tab-joinRequests"));

      // Switch away
      fireEvent.click(screen.getByTestId("tab-messages"));

      // Switch back
      fireEvent.click(screen.getByTestId("tab-joinRequests"));

      // After first load, enabled should stay true
      const allCalls = useConversationJoinRequestsMock.mock.calls;
      const firstEnabledIndex = allCalls.findIndex(
        (call: unknown[]) => (call[1] as { enabled?: boolean })?.enabled === true,
      );
      const callsAfterEnabled = allCalls.slice(firstEnabledIndex);
      for (const call of callsAfterEnabled) {
        const options = call[1];
        expect(options?.enabled).toBe(true);
      }
    });
  });

  // ─── Property 17: ReadOnlyComposer for Restricted Users ────────────────

  describe("Property 17: ReadOnlyComposer shown when conversation is read-only or user is restricted", () => {
    /**
     * Validates: Requirements 6.5
     * For any conversation state where the conversation is read-only OR the current
     * user's participant status is muted, blocked, or removed, the ReadOnlyComposer
     * SHALL be rendered instead of the MessageComposer.
     */
    it("shows ReadOnlyComposer when conversation status is closed (read-only)", () => {
      useConversationMock.mockReturnValue({
        conversation: createConversation({
          id: TEST_CONVERSATION_ID,
          status: "closed",
        }),
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      renderConversationDetail();
      expect(screen.getByTestId("read-only-composer")).toBeInTheDocument();
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
    });

    it("shows ReadOnlyComposer when conversation has isReadOnly flag", () => {
      const readOnlyConversation = createConversation({
        id: TEST_CONVERSATION_ID,
        status: "active",
      });
      // Add isReadOnly flag (not in base type but checked via record cast)
      (readOnlyConversation as Record<string, unknown>).isReadOnly = true;

      useConversationMock.mockReturnValue({
        conversation: readOnlyConversation,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      });

      renderConversationDetail();
      expect(screen.getByTestId("read-only-composer")).toBeInTheDocument();
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
    });

    it("shows ReadOnlyComposer when current user is muted", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "member",
            status: "muted",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();
      expect(screen.getByTestId("read-only-composer")).toBeInTheDocument();
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
    });

    it("shows ReadOnlyComposer when current user is blocked", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "member",
            status: "blocked",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();
      expect(screen.getByTestId("read-only-composer")).toBeInTheDocument();
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
    });

    it("shows ReadOnlyComposer when current user is removed", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "member",
            status: "removed",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();
      expect(screen.getByTestId("read-only-composer")).toBeInTheDocument();
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
    });

    it("shows MessageComposer when user is active and conversation is not read-only", () => {
      renderConversationDetail();
      expect(screen.getByTestId("message-composer")).toBeInTheDocument();
      expect(screen.queryByTestId("read-only-composer")).not.toBeInTheDocument();
    });

    it("shows ReadOnlyComposer when communication policy is disabled", () => {
      useCommunicationPolicyMock.mockReturnValue({
        policy: {
          isEnabled: false,
          allowReactions: true,
          allowAttachments: true,
          maxMessageLength: 2000,
          maxAttachmentSizeMb: 10,
        },
      });

      renderConversationDetail();
      expect(screen.getByTestId("read-only-composer")).toBeInTheDocument();
      expect(screen.queryByTestId("message-composer")).not.toBeInTheDocument();
    });
  });

  // ─── Property 21: Permission-Based Action Visibility ───────────────────

  describe("Property 21: Permission-based action visibility in participants panel", () => {
    /**
     * Validates: Requirements 8.2, 8.3
     * For any user with management permissions (canManageParticipants: true),
     * the ParticipantsPanel SHALL render add, promote, demote, and remove actions.
     * For any user without management permissions, those actions SHALL be hidden
     * and only the leave conversation option SHALL be available.
     */
    it("shows management actions when user has admin role", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "admin",
            status: "active",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
          createParticipant({
            userId: "other-user-001",
            role: "member",
            status: "active",
            actor: { id: "other-user-001", name: "Other User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 2,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();

      // Switch to participants tab
      fireEvent.click(screen.getByTestId("tab-participants"));

      expect(screen.getByTestId("add-participant-btn")).toBeInTheDocument();
      expect(screen.getByTestId("promote-btn")).toBeInTheDocument();
      expect(screen.getByTestId("demote-btn")).toBeInTheDocument();
      expect(screen.getByTestId("remove-btn")).toBeInTheDocument();
    });

    it("shows management actions when user has owner role", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "owner",
            status: "active",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
          createParticipant({
            userId: "other-user-001",
            role: "member",
            status: "active",
            actor: { id: "other-user-001", name: "Other User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 2,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();
      fireEvent.click(screen.getByTestId("tab-participants"));

      expect(screen.getByTestId("add-participant-btn")).toBeInTheDocument();
      expect(screen.getByTestId("promote-btn")).toBeInTheDocument();
      expect(screen.getByTestId("demote-btn")).toBeInTheDocument();
      expect(screen.getByTestId("remove-btn")).toBeInTheDocument();
    });

    it("hides management actions when user has member role (no management permissions)", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "member",
            status: "active",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 1,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();
      fireEvent.click(screen.getByTestId("tab-participants"));

      expect(screen.queryByTestId("add-participant-btn")).not.toBeInTheDocument();
      expect(screen.queryByTestId("promote-btn")).not.toBeInTheDocument();
      expect(screen.queryByTestId("demote-btn")).not.toBeInTheDocument();
      expect(screen.queryByTestId("remove-btn")).not.toBeInTheDocument();
    });

    it("shows leave button for active participant in non-system conversation", () => {
      renderConversationDetail();
      fireEvent.click(screen.getByTestId("tab-participants"));

      expect(screen.getByTestId("leave-btn")).toBeInTheDocument();
    });

    it("shows management actions when user has moderator role", () => {
      useConversationParticipantsMock.mockReturnValue({
        participants: [
          createParticipant({
            userId: TEST_USER_ID,
            role: "moderator",
            status: "active",
            actor: { id: TEST_USER_ID, name: "Test User" },
          }),
          createParticipant({
            userId: "other-user-001",
            role: "member",
            status: "active",
            actor: { id: "other-user-001", name: "Other User" },
          }),
        ],
        isLoading: false,
        isMutating: false,
        total: 2,
        error: null,
        refresh: vi.fn(),
        add: vi.fn(),
        update: vi.fn(),
        promote: vi.fn(),
        demote: vi.fn(),
        remove: vi.fn(),
        leave: vi.fn(),
      });

      renderConversationDetail();
      fireEvent.click(screen.getByTestId("tab-participants"));

      expect(screen.getByTestId("add-participant-btn")).toBeInTheDocument();
      expect(screen.getByTestId("promote-btn")).toBeInTheDocument();
      expect(screen.getByTestId("demote-btn")).toBeInTheDocument();
      expect(screen.getByTestId("remove-btn")).toBeInTheDocument();
    });
  });
});
