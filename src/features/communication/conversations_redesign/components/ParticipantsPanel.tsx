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
  // Separate active members from former members
  const activeParticipants = participants.filter(
    (p) => p.status === "active" || p.status === "muted",
  );
  const formerParticipants = participants.filter(
    (p) => p.status === "left" || p.status === "removed" || p.status === "blocked",
  );
  const invitedParticipants = participants.filter(
    (p) => p.status === "invited",
  );

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
      title={`${labels.participants} (${activeParticipants.length})`}
    >
      {isLoading ? <PanelState label={labels.loading} /> : null}
      {error ? <PanelState label={error} /> : null}
      {!isLoading && !error ? (
        <>
          {/* Active members */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {activeParticipants.length === 0 ? (
              <PanelState label={labels.participants} />
            ) : null}
            {activeParticipants.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                canManage={canManage}
                currentUserId={currentUserId}
                labels={labels}
                locale={locale}
                presenceByUserId={presenceByUserId}
                userDisplayNames={userDisplayNames}
                onDemoteParticipant={onDemoteParticipant}
                onEditParticipant={onEditParticipant}
                onPromoteParticipant={onPromoteParticipant}
                onRemoveParticipant={onRemoveParticipant}
              />
            ))}
          </div>

          {/* Invited (pending) */}
          {invitedParticipants.length > 0 ? (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                {labels.invited} ({invitedParticipants.length})
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {invitedParticipants.map((participant) => (
                  <ParticipantRow
                    key={participant.id}
                    participant={participant}
                    canManage={canManage}
                    currentUserId={currentUserId}
                    labels={labels}
                    locale={locale}
                    presenceByUserId={presenceByUserId}
                    userDisplayNames={userDisplayNames}
                    onDemoteParticipant={onDemoteParticipant}
                    onEditParticipant={onEditParticipant}
                    onPromoteParticipant={onPromoteParticipant}
                    onRemoveParticipant={onRemoveParticipant}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Former members */}
          {formerParticipants.length > 0 ? (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                {labels.left} ({formerParticipants.length})
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white opacity-60 shadow-sm">
                {formerParticipants.map((participant) => (
                  <ParticipantRow
                    key={participant.id}
                    participant={participant}
                    canManage={false}
                    currentUserId={currentUserId}
                    labels={labels}
                    locale={locale}
                    presenceByUserId={presenceByUserId}
                    userDisplayNames={userDisplayNames}
                    onDemoteParticipant={onDemoteParticipant}
                    onEditParticipant={onEditParticipant}
                    onPromoteParticipant={onPromoteParticipant}
                    onRemoveParticipant={onRemoveParticipant}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </PanelLayout>
  );
}

function ParticipantRow({
  participant,
  canManage,
  currentUserId,
  labels,
  locale,
  presenceByUserId,
  userDisplayNames,
  onDemoteParticipant,
  onEditParticipant,
  onPromoteParticipant,
  onRemoveParticipant,
}: {
  participant: ConversationParticipant;
  canManage: boolean;
  currentUserId?: string | null;
  labels: ConversationRedesignLabels;
  locale: string;
  presenceByUserId: Record<string, { isOnline?: boolean }>;
  userDisplayNames: UserDisplayNameMap;
  onDemoteParticipant: (participant: ConversationParticipant) => void;
  onEditParticipant: (participant: ConversationParticipant) => void;
  onPromoteParticipant: (participant: ConversationParticipant) => void;
  onRemoveParticipant: (participant: ConversationParticipant) => void;
}) {
  const userId = participantUserId(participant);
  const name =
    actorName(participant.actor) ||
    displayNameForUserId(userId, userDisplayNames, labels.participant);
  const isCurrentUser = currentUserId && userId === currentUserId;
  const isOnline = Boolean(presenceByUserId[userId]?.isOnline);
  const canManageThisParticipant = canManage && !isCurrentUser;

  const statusTone = {
    active: undefined,
    muted: "orange" as const,
    invited: "yellow" as const,
    left: "gray" as const,
    removed: "gray" as const,
    blocked: "red" as const,
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0">
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
            {participant.status === "invited" ? (
              <StatusPill tone="yellow">{labels.pending}</StatusPill>
            ) : null}
            {participant.status === "left" ? (
              <StatusPill tone="gray">{labels.left}</StatusPill>
            ) : null}
            {participant.status === "removed" ? (
              <StatusPill tone="gray">{labels.removed}</StatusPill>
            ) : null}
            {participant.status === "blocked" ? (
              <StatusPill tone="red">{labels.blocked}</StatusPill>
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
}

