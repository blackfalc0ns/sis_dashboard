import { UserPlus } from "lucide-react";
import Avatar from "@/features/communication/conversations_redesign/components/Avatar";
import { ActionButton, PanelLayout, PanelState, ParticipantActionButton, StatusPill } from "@/features/communication/conversations_redesign/components/PanelLayout";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { UserDisplayNameMap } from "@/features/communication/conversations_redesign/types";
import type { ConversationParticipant } from "@/features/communication/types/conversation.types";
import { actorName, displayNameForUserId, getAvatarUrl } from "@/features/communication/conversations_redesign/utils/displayNames";
import { formatRelativeDate, participantUserId } from "@/features/communication/conversations_redesign/utils/formatters";

export default function ParticipantsPanel({
  canLeaveConversation,
  canManage,
  currentUserId,
  error,
  isLoading,
  labels,
  locale,
  onAddParticipant,
  onDemoteParticipant,
  onEditParticipant,
  onLeaveConversation,
  onPromoteParticipant,
  onRemoveParticipant,
  participants,
  presenceByUserId,
  total,
  userDisplayNames,
}: {
  canLeaveConversation: boolean;
  canManage: boolean;
  currentUserId?: string | null;
  error: string | null;
  isLoading: boolean;
  labels: ConversationRedesignLabels;
  locale: string;
  onAddParticipant: () => void;
  onDemoteParticipant: (participant: ConversationParticipant) => void;
  onEditParticipant: (participant: ConversationParticipant) => void;
  onLeaveConversation: () => void;
  onPromoteParticipant: (participant: ConversationParticipant) => void;
  onRemoveParticipant: (participant: ConversationParticipant) => void;
  participants: ConversationParticipant[];
  presenceByUserId: Record<string, { isOnline?: boolean }>;
  total: number;
  userDisplayNames: UserDisplayNameMap;
}) {
  return (
    <PanelLayout
      action={
        <div className="flex flex-wrap justify-end gap-2">
          {canLeaveConversation ? (
            <button
              type="button"
              onClick={onLeaveConversation}
              className="inline-flex h-9 items-center rounded-lg border border-rose-200 bg-white px-3 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
            >
              {labels.leaveConversation}
            </button>
          ) : null}
          {canManage ? (
            <ActionButton
              icon={<UserPlus className="h-4 w-4" />}
              onClick={onAddParticipant}
            >
              {labels.addParticipant}
            </ActionButton>
          ) : null}
        </div>
      }
      title={`${labels.participants} (${total || participants.length})`}
    >
      {isLoading ? <PanelState label={labels.loading} /> : null}
      {error ? <PanelState label={error} /> : null}
      {!isLoading && !error ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {participants.length === 0 ? (
            <PanelState label={labels.participants} />
          ) : null}
          {participants.map((participant) => {
            const userId = participantUserId(participant);
            const name =
              actorName(participant.actor) ||
              displayNameForUserId(userId, userDisplayNames, labels.participant);
            const isCurrentUser = currentUserId && userId === currentUserId;
            const isOnline = Boolean(presenceByUserId[userId]?.isOnline);
            const canManageThisParticipant = canManage && !isCurrentUser;
            return (
              <div
                key={participant.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    avatarUrl={getAvatarUrl(participant.actor)}
                    name={name}
                    online={isOnline}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-950">
                        {name}
                      </p>
                      {participant.role === "owner" ? (
                        <StatusPill tone="blue">{labels.owner}</StatusPill>
                      ) : null}
                      {participant.status === "muted" ? (
                        <StatusPill tone="orange">{labels.muted}</StatusPill>
                      ) : null}
                      {isCurrentUser ? (
                        <StatusPill tone="green">{labels.you}</StatusPill>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-600">
                      {labels.joined}{" "}
                      {formatRelativeDate(participant.joinedAt, locale) ||
                        labels.recently}
                    </p>
                  </div>
                </div>
                {canManageThisParticipant ? (
                  <div className="flex flex-wrap justify-end gap-2">
                    <ParticipantActionButton
                      onClick={() => onEditParticipant(participant)}
                    >
                      {labels.editParticipant}
                    </ParticipantActionButton>
                    <ParticipantActionButton
                      onClick={() => onPromoteParticipant(participant)}
                    >
                      {labels.promote}
                    </ParticipantActionButton>
                    <ParticipantActionButton
                      onClick={() => onDemoteParticipant(participant)}
                    >
                      {labels.demote}
                    </ParticipantActionButton>
                    <button
                      type="button"
                      onClick={() => onRemoveParticipant(participant)}
                      className="h-8 rounded-md border border-rose-200 px-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      {labels.removeParticipant}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </PanelLayout>
  );
}

