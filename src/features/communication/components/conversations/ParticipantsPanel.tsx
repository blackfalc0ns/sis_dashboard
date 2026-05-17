"use client";

import { useState } from "react";
import { RefreshCw, UserMinus, UserPlus } from "lucide-react";
import Button from "@/components/ui/button/Button";
import CommunicationErrorState from "@/features/communication/components/layout/CommunicationErrorState";
import CommunicationLoadingState from "@/features/communication/components/layout/CommunicationLoadingState";
import type { CommunicationPresence } from "@/features/communication/hooks/usePresence";
import type {
  ParticipantFormValues,
  ParticipantRoleChangeValues,
} from "@/features/communication/hooks/useConversationParticipants";
import type { ConversationParticipant } from "@/features/communication/types/conversation.types";
import AddParticipantDialog from "./AddParticipantDialog";
import EditParticipantRoleDialog, {
  type ParticipantDialogMode,
} from "./EditParticipantRoleDialog";
import LeaveConversationDialog from "./LeaveConversationDialog";
import PresenceAvatar from "./PresenceAvatar";
import RemoveParticipantDialog from "./RemoveParticipantDialog";

export interface ParticipantsPanelLabels {
  title: string;
  count: string;
  addParticipant: string;
  refresh: string;
  loading: string;
  empty: string;
  errorTitle: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  mutedUntil: string;
  edit: string;
  promote: string;
  demote: string;
  remove: string;
  leave: string;
  cancel: string;
  save: string;
  add: string;
  targetRole: string;
  addTitle: string;
  editTitle: string;
  promoteTitle: string;
  demoteTitle: string;
  removeTitle: string;
  removeDescription: string;
  leaveTitle: string;
  leaveDescription: string;
  userRequired: string;
  owner: string;
  admin: string;
  moderator: string;
  member: string;
  readOnly: string;
  system: string;
  active: string;
  invited: string;
  left: string;
  removed: string;
  muted: string;
  blocked: string;
}

export interface ParticipantsPanelProps {
  participants: ConversationParticipant[];
  total?: number;
  presenceByUserId: Record<string, CommunicationPresence>;
  isLoading?: boolean;
  isRefreshing?: boolean;
  isMutating?: boolean;
  error?: string | null;
  labels: ParticipantsPanelLabels;
  onRefresh: () => Promise<void> | void;
  onAddParticipant: (values: ParticipantFormValues) => Promise<unknown>;
  onUpdateParticipant: (
    participantId: string,
    values: ParticipantFormValues,
  ) => Promise<unknown>;
  onRemoveParticipant: (participantId: string) => Promise<unknown> | unknown;
  onLeaveConversation: () => Promise<unknown> | unknown;
  onPromoteParticipant: (
    participantId: string,
    values: ParticipantRoleChangeValues,
  ) => Promise<unknown>;
  onDemoteParticipant: (
    participantId: string,
    values: ParticipantRoleChangeValues,
  ) => Promise<unknown>;
}

function participantUserId(participant: ConversationParticipant) {
  return participant.userId || participant.actor?.userId || participant.actor?.id || "";
}

function participantName(participant: ConversationParticipant) {
  return (
    participant.actor?.name ||
    participant.actor?.nameEn ||
    participant.actor?.nameAr ||
    participant.userId ||
    participant.id
  );
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export default function ParticipantsPanel({
  error,
  isLoading,
  isMutating,
  isRefreshing,
  labels,
  onAddParticipant,
  onDemoteParticipant,
  onLeaveConversation,
  onPromoteParticipant,
  onRefresh,
  onRemoveParticipant,
  onUpdateParticipant,
  participants,
  presenceByUserId,
  total,
}: ParticipantsPanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [roleDialogMode, setRoleDialogMode] =
    useState<ParticipantDialogMode>("edit");
  const [selectedParticipant, setSelectedParticipant] =
    useState<ConversationParticipant | null>(null);
  const [removingParticipant, setRemovingParticipant] =
    useState<ConversationParticipant | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const closeRoleDialog = () => setSelectedParticipant(null);

  const submitRoleDialog = async (
    values: ParticipantFormValues | ParticipantRoleChangeValues,
  ) => {
    if (!selectedParticipant?.id) return;
    if (roleDialogMode === "promote") {
      await onPromoteParticipant(
        selectedParticipant.id,
        values as ParticipantRoleChangeValues,
      );
    } else if (roleDialogMode === "demote") {
      await onDemoteParticipant(
        selectedParticipant.id,
        values as ParticipantRoleChangeValues,
      );
    } else {
      await onUpdateParticipant(
        selectedParticipant.id,
        values as ParticipantFormValues,
      );
    }
    closeRoleDialog();
  };

  const confirmRemove = async () => {
    if (!removingParticipant?.id) return;
    await onRemoveParticipant(removingParticipant.id);
    setRemovingParticipant(null);
  };

  const confirmLeave = async () => {
    await onLeaveConversation();
    setLeaveOpen(false);
  };

  return (
    <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            {labels.title}
          </h2>
          <p className="text-xs text-slate-500">
            {labels.count.replace("{count}", String(total ?? participants.length))}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={isRefreshing}
            onClick={() => void onRefresh()}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            {labels.refresh}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isMutating}
            onClick={() => setAddOpen(true)}
            leftIcon={<UserPlus className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            {labels.addParticipant}
          </Button>
        </div>
      </div>

      {error ? (
        <CommunicationErrorState title={labels.errorTitle} message={error} />
      ) : null}

      {isLoading ? (
        <CommunicationLoadingState label={labels.loading} />
      ) : participants.length > 0 ? (
        <div className="space-y-3">
          {participants.map((participant) => {
            const userId = participantUserId(participant);
            const joinedAt = formatDate(participant.joinedAt);
            const mutedUntil = formatDate(participant.mutedUntil);

            return (
              <div
                key={participant.id}
                className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
              >
                <div className="flex items-start gap-3">
                  <PresenceAvatar
                    name={participantName(participant)}
                    presence={presenceByUserId[userId]}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {participantName(participant)}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {labels.userId}: {userId || participant.id}
                    </p>
                    <div className="mt-2 grid gap-1 text-xs text-slate-600">
                      <span>
                        {labels.role}: {participant.role ?? "-"}
                      </span>
                      <span>
                        {labels.status}: {participant.status ?? "-"}
                      </span>
                      {joinedAt ? (
                        <span>
                          {labels.joinedAt}: {joinedAt}
                        </span>
                      ) : null}
                      {mutedUntil ? (
                        <span>
                          {labels.mutedUntil}: {mutedUntil}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => {
                      setRoleDialogMode("edit");
                      setSelectedParticipant(participant);
                    }}
                  >
                    {labels.edit}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => {
                      setRoleDialogMode("promote");
                      setSelectedParticipant(participant);
                    }}
                  >
                    {labels.promote}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => {
                      setRoleDialogMode("demote");
                      setSelectedParticipant(participant);
                    }}
                  >
                    {labels.demote}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => setRemovingParticipant(participant)}
                  >
                    {labels.remove}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          {labels.empty}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        fullWidth
        disabled={isMutating}
        onClick={() => setLeaveOpen(true)}
        leftIcon={<UserMinus className="h-4 w-4" aria-hidden="true" />}
      >
        {labels.leave}
      </Button>

      <AddParticipantDialog
        open={addOpen}
        labels={{
          title: labels.addTitle,
          userId: labels.userId,
          role: labels.role,
          status: labels.status,
          mutedUntil: labels.mutedUntil,
          cancel: labels.cancel,
          add: labels.add,
          userRequired: labels.userRequired,
          owner: labels.owner,
          admin: labels.admin,
          moderator: labels.moderator,
          member: labels.member,
          readOnly: labels.readOnly,
          system: labels.system,
          active: labels.active,
          invited: labels.invited,
          left: labels.left,
          removed: labels.removed,
          muted: labels.muted,
          blocked: labels.blocked,
        }}
        isSubmitting={isMutating}
        onClose={() => setAddOpen(false)}
        onSubmit={async (values) => {
          await onAddParticipant(values);
          setAddOpen(false);
        }}
      />
      <EditParticipantRoleDialog
        key={`${selectedParticipant?.id ?? "participant"}-${roleDialogMode}`}
        open={Boolean(selectedParticipant)}
        mode={roleDialogMode}
        participant={selectedParticipant}
        labels={{
          editTitle: labels.editTitle,
          promoteTitle: labels.promoteTitle,
          demoteTitle: labels.demoteTitle,
          role: labels.role,
          targetRole: labels.targetRole,
          status: labels.status,
          mutedUntil: labels.mutedUntil,
          cancel: labels.cancel,
          save: labels.save,
          promote: labels.promote,
          demote: labels.demote,
          owner: labels.owner,
          admin: labels.admin,
          moderator: labels.moderator,
          member: labels.member,
          readOnly: labels.readOnly,
          system: labels.system,
          active: labels.active,
          invited: labels.invited,
          left: labels.left,
          removed: labels.removed,
          muted: labels.muted,
          blocked: labels.blocked,
        }}
        isSubmitting={isMutating}
        onClose={closeRoleDialog}
        onSubmit={submitRoleDialog}
      />
      <RemoveParticipantDialog
        open={Boolean(removingParticipant)}
        participant={removingParticipant}
        labels={{
          title: labels.removeTitle,
          description: labels.removeDescription,
          cancel: labels.cancel,
          remove: labels.remove,
        }}
        isSubmitting={isMutating}
        onClose={() => setRemovingParticipant(null)}
        onConfirm={confirmRemove}
      />
      <LeaveConversationDialog
        open={leaveOpen}
        labels={{
          title: labels.leaveTitle,
          description: labels.leaveDescription,
          cancel: labels.cancel,
          leave: labels.leave,
        }}
        isSubmitting={isMutating}
        onClose={() => setLeaveOpen(false)}
        onConfirm={confirmLeave}
      />
    </aside>
  );
}
