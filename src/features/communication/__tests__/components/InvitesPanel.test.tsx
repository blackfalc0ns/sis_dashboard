import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InvitesPanel from "@/features/communication/conversations_redesign/components/InvitesPanel";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { ConversationInvite } from "@/features/communication/types/conversation.types";

describe("InvitesPanel", () => {
  const labels = conversationRedesignLabels.en;

  const mockInvite: ConversationInvite = {
    id: "invite-1",
    conversationId: "conv-1",
    invitedUserId: "user-invited",
    status: "pending",
    createdAt: "2026-06-27T20:00:00.000Z",
    expiresAt: "2026-06-29T20:00:00.000Z",
    invitedUser: {
      id: "user-invited",
      name: "Invited User",
      userType: "school_user",
    },
  };

  it("renders pending invite list item", () => {
    render(
      <InvitesPanel
        canCreate={false}
        canManage={false}
        currentUserId="user-other"
        error={null}
        invites={[mockInvite]}
        isLoading={false}
        isMutating={false}
        labels={labels}
        locale="en"
        onAcceptInvite={vi.fn()}
        onCreateInvite={vi.fn()}
        onRejectInvite={vi.fn()}
        total={1}
        userDisplayNames={{}}
        isActiveParticipant={false}
      />
    );

    expect(screen.getByText("Invited User")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("hides revoke invitation button if canManage is true but user is not an active participant", () => {
    render(
      <InvitesPanel
        canCreate={true}
        canManage={true}
        currentUserId="user-manager"
        error={null}
        invites={[mockInvite]}
        isLoading={false}
        isMutating={false}
        labels={labels}
        locale="en"
        onAcceptInvite={vi.fn()}
        onCreateInvite={vi.fn()}
        onRejectInvite={vi.fn()}
        total={1}
        userDisplayNames={{}}
        isActiveParticipant={false}
      />
    );

    // The revoke button (revokeInvite / rejectInvite) should NOT be in the document
    expect(screen.queryByRole("button", { name: labels.revokeInvite })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.rejectInvite })).not.toBeInTheDocument();
  });

  it("shows revoke invitation button if canManage is true and user is an active participant", () => {
    render(
      <InvitesPanel
        canCreate={true}
        canManage={true}
        currentUserId="user-manager"
        error={null}
        invites={[mockInvite]}
        isLoading={false}
        isMutating={false}
        labels={labels}
        locale="en"
        onAcceptInvite={vi.fn()}
        onCreateInvite={vi.fn()}
        onRejectInvite={vi.fn()}
        total={1}
        userDisplayNames={{}}
        isActiveParticipant={true}
      />
    );

    // The revoke button (revokeInvite) should be in the document
    expect(screen.getByRole("button", { name: labels.revokeInvite })).toBeInTheDocument();
  });

  it("shows accept/reject buttons to the invitee user even if they are not a participant", () => {
    render(
      <InvitesPanel
        canCreate={false}
        canManage={false}
        currentUserId="user-invited"
        error={null}
        invites={[mockInvite]}
        isLoading={false}
        isMutating={false}
        labels={labels}
        locale="en"
        onAcceptInvite={vi.fn()}
        onCreateInvite={vi.fn()}
        onRejectInvite={vi.fn()}
        total={1}
        userDisplayNames={{}}
        isActiveParticipant={false}
      />
    );

    // Accept and reject buttons should be visible to the invitee
    expect(screen.getByRole("button", { name: labels.acceptInvite })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.rejectInvite })).toBeInTheDocument();
  });
});
