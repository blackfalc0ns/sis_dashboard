import { describe, expect, it } from "vitest";
import { getConversationPermissionFlags } from "./conversation-permissions";
import type { ConversationParticipant } from "@/features/communication/types/conversation.types";

function participant(
  role: ConversationParticipant["role"],
  status: ConversationParticipant["status"] = "active",
): ConversationParticipant {
  return {
    id: `${role}-participant`,
    userId: `${role}-user`,
    role,
    status,
  };
}

describe("getConversationPermissionFlags", () => {
  it.each(["owner", "admin", "moderator"] as const)(
    "allows %s to manage participants",
    (role) => {
      const current = participant(role);
      const flags = getConversationPermissionFlags({
        currentUserId: current.userId,
        participants: [current],
      });

      expect(flags.canManageParticipants).toBe(true);
      expect(flags.canManageInvites).toBe(true);
      expect(flags.canReviewJoinRequests).toBe(true);
    },
  );

  it("does not allow a member to manage participants", () => {
    const current = participant("member");
    const flags = getConversationPermissionFlags({
      currentUserId: current.userId,
      participants: [current],
    });

    expect(flags.canManageParticipants).toBe(false);
  });

  it("allows a non-participant to create a join request", () => {
    const flags = getConversationPermissionFlags({
      currentUserId: "outside-user",
      participants: [participant("member")],
    });

    expect(flags.canCreateJoinRequest).toBe(true);
  });

  it("does not allow an active participant to create a join request", () => {
    const current = participant("member");
    const flags = getConversationPermissionFlags({
      currentUserId: current.userId,
      participants: [current],
    });

    expect(flags.canCreateJoinRequest).toBe(false);
  });
});
