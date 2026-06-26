import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { MessageBubble } from "@/features/communication/conversations_redesign/components/messages/MessageBubble";
import { createMessage } from "../utils/test-data-generators";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

describe("MessageBubble Delete Confirmation", () => {
  const labels = conversationRedesignLabels.en;

  const mockProps = {
    allowReactions: true,
    attachments: [],
    currentUserId: "user-1",
    currentUserName: "Test User",
    isFirstInGroup: true,
    isOwn: true,
    isUploadingAttachment: false,
    labels: labels,
    locale: "en",
    onAddReaction: vi.fn().mockResolvedValue(undefined),
    onAttachFile: vi.fn().mockResolvedValue(undefined),
    onDeleteAttachment: vi.fn().mockResolvedValue(undefined),
    onDeleteMessage: vi.fn().mockResolvedValue(undefined),
    onStartEdit: vi.fn(),
    onInfo: vi.fn(),
    onRemoveReaction: vi.fn().mockResolvedValue(undefined),
    onReply: vi.fn(),
    onReport: vi.fn(),
    allMessages: [],
    reactions: [],
    userDisplayNames: {},
  };

  it("shows confirmation dialog when delete is triggered and calls onDeleteMessage when confirmed", async () => {
    const message = createMessage({
      id: "msg-1",
      body: "Delete me!",
      senderId: "user-1",
      status: "sent",
    });

    const onDeleteMessageMock = vi.fn().mockResolvedValue(undefined);

    render(
      <MessageBubble
        {...mockProps}
        message={message}
        onDeleteMessage={onDeleteMessageMock}
      />
    );

    // Assert message body is displayed
    expect(screen.getByText("Delete me!")).toBeInTheDocument();

    // Trigger delete context action. In MessageBubble, context menu handleDelete is called.
    // We can click the delete button in the mobile context action overlay or desktop context menu.
    // Looking at line 504: text is labels.deleteMessage ("Delete").
    //    // Click chevron button to open context menu
    const buttons = screen.getAllByRole("button");
    const chevronBtn = buttons[0];
    fireEvent.click(chevronBtn);

    // Now the delete option should be visible in the DOM
    const deleteOption = screen.getByRole("button", { name: labels.deleteMessage });
    fireEvent.click(deleteOption);

    // Verify confirmation modal is open
    expect(screen.getByText(labels.deleteMessageConfirm)).toBeInTheDocument();

    // Click confirm/Delete button inside the modal
    const confirmButtons = screen.getAllByRole("button", { name: labels.deleteMessage });
    const modalConfirmBtn = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(modalConfirmBtn);

    // Verify onDeleteMessage is called
    await waitFor(() => {
      expect(onDeleteMessageMock).toHaveBeenCalled();
    });
  });
});
