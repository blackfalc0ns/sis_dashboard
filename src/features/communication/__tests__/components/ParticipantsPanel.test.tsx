import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ParticipantsPanel from "@/features/communication/conversations_redesign/components/ParticipantsPanel";
import { createParticipant } from "../utils/test-data-generators";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

describe("ParticipantsPanel", () => {
  const labels = conversationRedesignLabels.en;

  it("renders user.displayName and localized userType status pill", () => {
    const participant = createParticipant({
      user: {
        id: "user-1",
        displayName: "Special Demo User",
        userType: "school_user",
      },
    });

    render(
      <ParticipantsPanel
        canLeaveConversation={false}
        canManage={false}
        error={null}
        isLoading={false}
        labels={labels}
        locale="en"
        onAddParticipant={vi.fn()}
        onDemoteParticipant={vi.fn()}
        onEditParticipant={vi.fn()}
        onLeaveConversation={vi.fn()}
        onPromoteParticipant={vi.fn()}
        onRemoveParticipant={vi.fn()}
        participants={[participant]}
        presenceByUserId={{}}
        total={1}
        userDisplayNames={{}}
      />
    );

    expect(screen.getByText("Special Demo User")).toBeInTheDocument();
    expect(screen.getByText("School User")).toBeInTheDocument();
  });
});
