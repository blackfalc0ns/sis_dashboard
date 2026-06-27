import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import { MessageComposer } from "@/features/communication/conversations_redesign/components/messages/MessageComposer";

const labels = conversationRedesignLabels.en;
const voiceUnavailableMessage =
  "Voice recording is not available in this browser.";

function renderComposer() {
  return render(
    <MessageComposer
      disabled={false}
      editingMessage={null}
      labels={labels}
      onCancelEdit={vi.fn()}
      onCancelReply={vi.fn()}
      onEditMessage={vi.fn().mockResolvedValue(undefined)}
      onSend={vi.fn().mockResolvedValue(undefined)}
      onSendVoice={vi.fn().mockResolvedValue(undefined)}
      onSendWithAttachment={vi.fn().mockResolvedValue(undefined)}
      onStopTyping={vi.fn()}
      onTyping={vi.fn()}
      replyTo={null}
    />,
  );
}

describe("MessageComposer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a visible error when voice recording is unavailable", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });
    vi.stubGlobal("MediaRecorder", undefined);

    renderComposer();

    fireEvent.click(screen.getByRole("button", { name: labels.voiceNote }));

    await waitFor(() => {
      expect(
        screen.getByText(voiceUnavailableMessage),
      ).toBeInTheDocument();
    });
  });

  it("clears the input immediately, focuses the input, and calls onSend asynchronously", async () => {
    const mockOnSend = vi.fn().mockResolvedValue(undefined);
    const mockOnStopTyping = vi.fn();
    
    render(
      <MessageComposer
        disabled={false}
        editingMessage={null}
        labels={labels}
        onCancelEdit={vi.fn()}
        onCancelReply={vi.fn()}
        onEditMessage={vi.fn().mockResolvedValue(undefined)}
        onSend={mockOnSend}
        onSendVoice={vi.fn().mockResolvedValue(undefined)}
        onSendWithAttachment={vi.fn().mockResolvedValue(undefined)}
        onStopTyping={mockOnStopTyping}
        onTyping={vi.fn()}
        replyTo={null}
      />,
    );

    const input = screen.getByPlaceholderText(labels.writeMessage);
    fireEvent.change(input, { target: { value: "Hello world" } });
    expect(input).toHaveValue("Hello world");

    // Click the submit button
    const sendBtn = screen.getByRole("button", { name: labels.send });
    fireEvent.click(sendBtn);

    // Input should clear immediately (synchronously)
    expect(input).toHaveValue("");

    // Input should be focused
    expect(document.activeElement).toBe(input);

    // onSend should have been called in the background
    expect(mockOnSend).toHaveBeenCalledWith("Hello world");
  });
});
