"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import type { ConversationParticipant } from "@/features/communication/types/conversation.types";
import type { CommunicationPresence } from "@/features/communication/hooks/usePresence";
import PresenceAvatar from "./PresenceAvatar";

export interface ParticipantsPanelProps {
  participants: ConversationParticipant[];
  presenceByUserId: Record<string, CommunicationPresence>;
  isMutating?: boolean;
  labels: {
    title: string;
    addParticipant: string;
    userId: string;
    role: string;
    empty: string;
  };
  onAddParticipant: (payload: { userId: string; role?: string }) => Promise<void>;
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

export default function ParticipantsPanel({
  isMutating,
  labels,
  onAddParticipant,
  participants,
  presenceByUserId,
}: ParticipantsPanelProps) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");

  const add = async () => {
    const trimmed = userId.trim();
    if (!trimmed) return;
    await onAddParticipant({ userId: trimmed, role: role.trim() || undefined });
    setUserId("");
    setRole("");
  };

  return (
    <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">{labels.title}</h2>
      <div className="space-y-3">
        {participants.length > 0 ? (
          participants.map((participant) => {
            const userIdValue = participantUserId(participant);
            const name = participantName(participant);
            return (
              <div key={participant.id} className="flex items-center gap-3">
                <PresenceAvatar
                  name={name}
                  presence={presenceByUserId[userIdValue]}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {name}
                  </p>
                  {participant.role ? (
                    <p className="text-xs text-slate-500">{participant.role}</p>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">{labels.empty}</p>
        )}
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <Input
          label={labels.userId}
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
        />
        <Input
          label={labels.role}
          value={role}
          onChange={(event) => setRole(event.target.value)}
        />
        <Button
          type="button"
          variant="secondary"
          fullWidth
          loading={isMutating}
          onClick={() => void add()}
        >
          {labels.addParticipant}
        </Button>
      </div>
    </aside>
  );
}
