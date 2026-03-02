"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ui/toast/Toast";
import RoomDialog from "./RoomDialog";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { fetchRooms, createRoom, updateRoom, deleteRoom } from "@/services/academics/roomsService";
import { Room } from "@/types/academics/timetable";
import MainLoader from "@/components/ui/loaders/MainLoader";

interface RoomsViewProps {
  schoolId: string;
  isReadOnly: boolean;
}

export default function RoomsView({ schoolId, isReadOnly }: RoomsViewProps) {
  const t = useTranslations("academics.timetable.rooms");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { showToast } = useToast();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchRooms(schoolId);
      setRooms(data);
    } catch (error) {
      console.error("Failed to load rooms:", error);
      showToast("Failed to load rooms", "error");
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, showToast]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleAddRoom = () => {
    setEditingRoom(null);
    setRoomDialogOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomDialogOpen(true);
  };

  const handleDeleteClick = (room: Room) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const handleRoomSave = async (roomData: Omit<Room, "id" | "schoolId" | "createdAt" | "updatedAt">) => {
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, roomData);
        showToast(tCommon("save_success"), "success");
      } else {
        await createRoom(schoolId, roomData);
        showToast(tCommon("save_success"), "success");
      }
      await loadRooms();
      setRoomDialogOpen(false);
    } catch (error) {
      console.error("Failed to save room:", error);
      showToast(tCommon("save_failed"), "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;

    try {
      await deleteRoom(roomToDelete.id);
      showToast(tCommon("deleted"), "success");
      await loadRooms();
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    } catch (error) {
      console.error("Failed to delete room:", error);
      showToast(tCommon("delete_failed"), "error");
    }
  };

  const filteredRooms = rooms.filter((room) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      room.nameAr.toLowerCase().includes(query) ||
      room.nameEn.toLowerCase().includes(query)
    );
  });

  const columns = [
    {
      key: "name",
      label: t("table.name"),
      render: (_value: unknown, room: Room) => (
        <div>
          <div className="font-medium text-gray-900">
            {locale === "ar" ? room.nameAr : room.nameEn}
          </div>
          <div className="text-sm text-gray-500">
            {locale === "ar" ? room.nameEn : room.nameAr}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: t("table.type"),
      render: (_value: unknown, room: Room) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {t(`types.${room.type}`)}
        </span>
      ),
    },
    {
      key: "capacity",
      label: t("table.capacity"),
      render: (_value: unknown, room: Room) => <span className="text-gray-900">{room.capacity}</span>,
    },
    {
      key: "status",
      label: t("table.status"),
      render: (_value: unknown, room: Room) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            room.isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {room.isActive ? t("active") : t("inactive")}
        </span>
      ),
    },
    {
      key: "actions",
      label: t("table.actions"),
      render: (_value: unknown, room: Room) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditRoom(room)}
            disabled={isReadOnly}
            className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(room)}
            disabled={isReadOnly}
            className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
          <Button
            onClick={handleAddRoom}
            disabled={isReadOnly}
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t("addRoom")}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
             <MainLoader />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">{t("emptyState")}</div>
            </div>
          ) : (
            <DataTable
              data={filteredRooms as unknown as { [key: string]: unknown }[]}
              columns={columns as unknown as Array<{ key: string; label: string; render?: (value: unknown, row: unknown) => React.ReactNode }>}
              searchQuery={searchQuery}
            />
          )}
        </div>
      </div>

      {/* Room Dialog */}
      {roomDialogOpen && (
        <RoomDialog
          open={roomDialogOpen}
          room={editingRoom}
          onSave={handleRoomSave}
          onClose={() => setRoomDialogOpen(false)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteDialogOpen && roomToDelete && (
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          title={t("deleteRoom")}
          description={t("deleteConfirm")}
          confirmLabel={tCommon("delete")}
          cancelLabel={tCommon("cancel")}
          onConfirm={handleDeleteConfirm}
          onClose={() => {
            setDeleteDialogOpen(false);
            setRoomToDelete(null);
          }}
          severity="danger"
        />
      )}
    </div>
  );
}
