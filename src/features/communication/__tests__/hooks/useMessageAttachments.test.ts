import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMessageAttachments } from "@/features/communication/hooks/useMessageAttachments";
import type { ConversationMessage } from "@/features/communication/hooks/useConversationMessages";

const apiMocks = vi.hoisted(() => ({
  deleteAttachment: vi.fn(),
  getAttachments: vi.fn(),
  linkAttachment: vi.fn(),
}));

vi.mock("@/features/communication/api/communication.service", () => apiMocks);

vi.mock("@/features/communication/api/files.service", () => ({
  uploadFile: vi.fn(),
}));

vi.mock("@/features/communication/hooks/useCommunicationSocket", () => ({
  useCommunicationSocket: () => ({ socket: null }),
}));

describe("useMessageAttachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getAttachments.mockResolvedValue({ items: [] });
  });

  it("uses inline message attachments without fetching each message attachment list", async () => {
    const messages = [
      {
        id: "message-1",
        conversationId: "conversation-1",
        body: "📎",
        attachments: [
          {
            id: "attachment-1",
            attachmentId: "attachment-1",
            messageId: "message-1",
            fileId: "file-1",
            displayName: "photo.jpg",
            mimeType: "image/jpeg",
            downloadPath: "/api/v1/files/file-1/download",
          },
        ],
      },
    ] satisfies ConversationMessage[];

    const { result } = renderHook(() => useMessageAttachments(messages));

    await waitFor(() => {
      expect(result.current.attachmentsByMessageId["message-1"]).toHaveLength(1);
    });

    expect(result.current.attachmentsByMessageId["message-1"]?.[0]).toEqual(
      expect.objectContaining({
        id: "attachment-1",
        fileId: "file-1",
        displayName: "photo.jpg",
      }),
    );
    expect(apiMocks.getAttachments).not.toHaveBeenCalled();
  });

  it("does not fetch attachment lists for messages that already include an empty attachments array", async () => {
    const messages = [
      {
        id: "message-1",
        conversationId: "conversation-1",
        body: "No attachments",
        attachments: [],
      },
      {
        id: "message-2",
        conversationId: "conversation-1",
        body: "Also no attachments",
        attachments: [],
      },
    ] satisfies ConversationMessage[];

    renderHook(() => useMessageAttachments(messages));

    await waitFor(() => {
      expect(apiMocks.getAttachments).not.toHaveBeenCalled();
    });
  });

  it("removes stored attachments when their message is removed", async () => {
    const messageWithAttachment = {
      id: "message-1",
      conversationId: "conversation-1",
      body: "Voice message",
      attachments: [
        {
          id: "attachment-1",
          messageId: "message-1",
          fileId: "file-1",
          displayName: "voice-note.webm",
          mimeType: "audio/webm",
          downloadPath: "/api/v1/files/file-1/download",
        },
      ],
    } satisfies ConversationMessage;

    const { result, rerender } = renderHook(
      ({ messages }) => useMessageAttachments(messages),
      { initialProps: { messages: [messageWithAttachment] } },
    );

    await waitFor(() => {
      expect(result.current.attachmentsByMessageId["message-1"]).toHaveLength(1);
    });

    rerender({ messages: [] });

    await waitFor(() => {
      expect(result.current.attachmentsByMessageId["message-1"]).toBeUndefined();
    });
  });

  it("sends delete requests for every stored attachment when removing a message", async () => {
    const messageWithAttachments = {
      id: "message-1",
      conversationId: "conversation-1",
      body: "Files",
      attachments: [
        {
          id: "attachment-1",
          messageId: "message-1",
          fileId: "file-1",
          displayName: "first.pdf",
        },
        {
          id: "attachment-2",
          messageId: "message-1",
          fileId: "file-2",
          displayName: "second.pdf",
        },
      ],
    } satisfies ConversationMessage;
    const messages = [messageWithAttachments];
    apiMocks.deleteAttachment.mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useMessageAttachments(messages));

    await waitFor(() => {
      expect(result.current.attachmentsByMessageId["message-1"]).toHaveLength(2);
    });

    await act(async () => {
      await result.current.removeMessageAttachments("message-1");
    });

    expect(apiMocks.deleteAttachment).toHaveBeenCalledTimes(2);
    expect(apiMocks.deleteAttachment).toHaveBeenCalledWith(
      "message-1",
      "attachment-1",
    );
    expect(apiMocks.deleteAttachment).toHaveBeenCalledWith(
      "message-1",
      "attachment-2",
    );
    expect(result.current.attachmentsByMessageId["message-1"]).toBeUndefined();
  });
});
