"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import RoomDialog from "@/features/academics/rooms/components/RoomDialog";
import { createRoom } from "@/features/academics/rooms/services/roomsService";
import type { Room } from "@/features/academics/timetable/types/timetable";

export interface RoomsSetupStepCopy {
  summary: string;
  createRoom: string;
  missingSchool: string;
  saveFailed: string;
}

interface RoomsSetupStepProps {
  copy: RoomsSetupStepCopy;
  schoolId: string;
  refreshStep(stepId: "rooms"): Promise<void> | void;
}

export function RoomsSetupStep({ copy, schoolId, refreshStep }: RoomsSetupStepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (
    payload: Omit<Room, "id" | "schoolId" | "createdAt" | "updatedAt">,
  ) => {
    if (!schoolId) {
      setError(copy.missingSchool);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await createRoom(schoolId, payload);
      setIsDialogOpen(false);
      await refreshStep("rooms");
    } catch {
      setError(copy.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  if (!schoolId) {
    return <p className="text-sm text-red-700">{copy.missingSchool}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{copy.summary}</p>
      <Button onClick={() => setIsDialogOpen(true)} type="button">
        {copy.createRoom}
      </Button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <RoomDialog
        isSaving={isSaving}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        open={isDialogOpen}
        room={null}
      />
    </div>
  );
}
