"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import RoomDialog from "@/features/academics/rooms/components/RoomDialog";
import { createRoom } from "@/features/academics/rooms/services/roomsService";
import type { Room } from "@/features/academics/timetable/types/timetable";

export interface RoomsSetupStepCopy {
  summary: string;
  savedData: string;
  edit: string;
  cancel: string;
  roomsCount(count: number): string;
  createRoom: string;
  missingSchool: string;
  saveFailed: string;
}

interface RoomsSetupStepProps {
  copy: RoomsSetupStepCopy;
  rooms: Room[];
  schoolId: string;
  refreshStep(stepId: "rooms"): Promise<void> | void;
}

export function RoomsSetupStep({ copy, rooms, schoolId, refreshStep }: RoomsSetupStepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const hasMinimumData = rooms.length > 0;
  const [isEditing, setIsEditing] = useState(!hasMinimumData);

  useEffect(() => {
    setIsEditing(!hasMinimumData);
  }, [hasMinimumData]);

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
      {!isEditing ? (
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="text-base font-semibold text-gray-950">{copy.savedData}</h3>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-950">
              {copy.roomsCount(rooms.length)}
            </p>
          </div>
          <Button onClick={() => setIsEditing(true)} type="button" variant="secondary">
            {copy.edit}
          </Button>
        </section>
      ) : null}
      {isEditing ? (
        <div className="flex flex-wrap gap-2">
          {hasMinimumData ? (
            <Button onClick={() => setIsEditing(false)} type="button" variant="secondary">
              {copy.cancel}
            </Button>
          ) : null}
          <Button onClick={() => setIsDialogOpen(true)} type="button">
            {copy.createRoom}
          </Button>
        </div>
      ) : null}
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
