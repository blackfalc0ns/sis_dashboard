"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui";
import Select from "@/components/ui/input/Select";
import { useToast } from "@/components/ui/toast/Toast";
import RoomDialog from "./RoomDialog";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import {
  fetchRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  fetchRoomDefaultAssignments,
  createRoomDefaultAssignment,
  updateRoomDefaultAssignment,
  deleteRoomDefaultAssignment,
  type RoomDefaultAssignment,
} from "@/features/academics/rooms/services/roomsService";
import { Room } from "@/features/academics/timetable/types/timetable";
import MainLoader from "@/components/ui/loaders/MainLoader";
import {
  fetchStructureTree,
  type Classroom,
  type Grade,
  type Stage,
  type Section,
} from "@/features/academics/academic-structure-tree/services/structureService";

interface RoomsViewProps {
  schoolId: string;
  academicYearId: string;
  termId: string;
  isReadOnly: boolean;
}

export default function RoomsView({
  schoolId,
  academicYearId,
  termId,
  isReadOnly,
}: RoomsViewProps) {
  const t = useTranslations("academics.timetable.rooms");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { showToast } = useToast();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomDefaults, setRoomDefaults] = useState<RoomDefaultAssignment[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [defaultScopeType, setDefaultScopeType] = useState<"SECTION" | "CLASSROOM">("SECTION");
  const [defaultStageId, setDefaultStageId] = useState("");
  const [defaultGradeId, setDefaultGradeId] = useState("");
  const [defaultSectionId, setDefaultSectionId] = useState("");
  const [defaultClassroomId, setDefaultClassroomId] = useState("");
  const [defaultRoomId, setDefaultRoomId] = useState("");
  const [editingDefault, setEditingDefault] = useState<RoomDefaultAssignment | null>(null);

  // Dialog states
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const [roomsData, defaultsData] = await Promise.all([
        fetchRooms(schoolId),
        fetchRoomDefaultAssignments(schoolId),
      ]);
      setRooms(roomsData);
      setRoomDefaults(defaultsData);
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

  useEffect(() => {
    const loadStructure = async () => {
      if (!academicYearId || !termId) return;
      try {
        const structure = await fetchStructureTree(academicYearId, termId);
        setStages(structure.stages || []);
        setGrades(structure.grades || []);
        setSections(structure.sections || []);
        setClassrooms(structure.classrooms || []);
      } catch (error) {
        console.error("Failed to load structure for room defaults:", error);
      }
    };

    loadStructure();
  }, [academicYearId, termId]);

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

  const resetDefaultForm = () => {
    setEditingDefault(null);
    setDefaultScopeType("SECTION");
    setDefaultStageId("");
    setDefaultGradeId("");
    setDefaultSectionId("");
    setDefaultClassroomId("");
    setDefaultRoomId("");
  };

  const handleEditDefault = (assignment: RoomDefaultAssignment) => {
    setEditingDefault(assignment);
    setDefaultScopeType(assignment.scopeType);
    if (assignment.scopeType === "SECTION") {
      const section = sections.find((item) => item.id === assignment.scopeId);
      const grade = section ? grades.find((item) => item.id === section.gradeId) : undefined;
      setDefaultStageId(grade?.stageId || "");
      setDefaultSectionId(section?.id || "");
      setDefaultGradeId(section?.gradeId || "");
      setDefaultClassroomId("");
    } else {
      const classroom = classrooms.find((item) => item.id === assignment.scopeId);
      const section = classroom
        ? sections.find((item) => item.id === classroom.sectionId)
        : undefined;
      const grade = section ? grades.find((item) => item.id === section.gradeId) : undefined;
      setDefaultStageId(grade?.stageId || "");
      setDefaultClassroomId(classroom?.id || "");
      setDefaultSectionId(section?.id || "");
      setDefaultGradeId(section?.gradeId || "");
    }
    setDefaultRoomId(assignment.roomId);
  };

  const handleSaveDefault = async () => {
    const scopeId = defaultScopeType === "CLASSROOM" ? defaultClassroomId : defaultSectionId;
    if (!scopeId || !defaultRoomId) {
      showToast(t("defaults.validation"), "error");
      return;
    }

    try {
      if (editingDefault) {
        await updateRoomDefaultAssignment(editingDefault.id, {
          scopeType: defaultScopeType,
          scopeId,
          roomId: defaultRoomId,
        });
      } else {
        await createRoomDefaultAssignment(schoolId, {
          scopeType: defaultScopeType,
          scopeId,
          roomId: defaultRoomId,
        });
      }

      await loadRooms();
      resetDefaultForm();
      showToast(tCommon("save_success"), "success");
    } catch (error) {
      console.error("Failed to save room default:", error);
      showToast(tCommon("save_failed"), "error");
    }
  };

  const handleDeleteDefault = async (assignmentId: string) => {
    try {
      await deleteRoomDefaultAssignment(assignmentId);
      await loadRooms();
      if (editingDefault?.id === assignmentId) {
        resetDefaultForm();
      }
      showToast(tCommon("delete_success"), "success");
    } catch (error) {
      console.error("Failed to delete room default:", error);
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

  const filteredSections = defaultGradeId
    ? sections.filter((section) => section.gradeId === defaultGradeId)
    : sections;
  const filteredGrades = defaultStageId
    ? grades.filter((grade) => grade.stageId === defaultStageId)
    : grades;
  const filteredClassrooms = defaultSectionId
    ? classrooms.filter((classroom) => classroom.sectionId === defaultSectionId)
    : [];

  const getDisplayName = (item?: { nameAr?: string; nameEn?: string }) =>
    item ? (locale === "ar" ? item.nameAr || item.nameEn || "" : item.nameEn || item.nameAr || "") : "";

  const stageOptions = stages.map((stage) => ({
    value: stage.id,
    label: getDisplayName(stage),
  }));
  const filteredGradeOptions = filteredGrades.map((grade) => ({
    value: grade.id,
    label: getDisplayName(grade),
  }));
  const sectionOptions = filteredSections.map((section) => ({
    value: section.id,
    label: getDisplayName(section),
  }));
  const classroomOptions = filteredClassrooms.map((classroom) => ({
    value: classroom.id,
    label: getDisplayName(classroom),
  }));
  const roomOptions = rooms.map((room) => ({
    value: room.id,
    label: getDisplayName(room),
  }));

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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t("defaults.title")}</h3>
              <p className="text-sm text-gray-500">{t("defaults.description")}</p>
            </div>
            {editingDefault && (
              <Button variant="secondary" onClick={resetDefaultForm}>
                {tCommon("cancel")}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            <Select
              label={t("defaults.scopeType")}
              value={defaultScopeType}
              onChange={(value) => {
                setDefaultScopeType(value as "SECTION" | "CLASSROOM");
                setDefaultStageId("");
                setDefaultGradeId("");
                setDefaultSectionId("");
                setDefaultClassroomId("");
              }}
              options={[
                { value: "SECTION", label: t("defaults.section") },
                { value: "CLASSROOM", label: t("defaults.classroom") },
              ]}
              disabled={isReadOnly}
            />
            <Select
              label={t("defaults.stage")}
              value={defaultStageId}
              onChange={(value) => {
                setDefaultStageId(value);
                setDefaultGradeId("");
                setDefaultSectionId("");
                setDefaultClassroomId("");
              }}
              options={stageOptions}
              disabled={isReadOnly}
            />
            <Select
              label={t("defaults.grade")}
              value={defaultGradeId}
              onChange={(value) => {
                setDefaultGradeId(value);
                setDefaultSectionId("");
                setDefaultClassroomId("");
              }}
              options={filteredGradeOptions}
              disabled={isReadOnly || !defaultStageId}
            />
            <Select
              label={t("defaults.section")}
              value={defaultSectionId}
              onChange={(value) => {
                setDefaultSectionId(value);
                setDefaultClassroomId("");
              }}
              options={sectionOptions}
              disabled={isReadOnly || !defaultGradeId}
            />
            <Select
              label={t("defaults.classroom")}
              value={defaultClassroomId}
              onChange={setDefaultClassroomId}
              options={classroomOptions}
              disabled={isReadOnly || defaultScopeType !== "CLASSROOM" || !defaultSectionId}
            />
            <Select
              label={t("defaults.room")}
              value={defaultRoomId}
              onChange={setDefaultRoomId}
              options={roomOptions}
              disabled={isReadOnly}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveDefault} disabled={isReadOnly}>
              {editingDefault ? t("defaults.update") : t("defaults.add")}
            </Button>
          </div>

          <div className="space-y-3">
            {roomDefaults.length === 0 ? (
              <div className="text-sm text-gray-500">{t("defaults.emptyState")}</div>
            ) : (
              roomDefaults.map((assignment) => {
                const room = rooms.find((item) => item.id === assignment.roomId);
                const section =
                  assignment.scopeType === "SECTION"
                    ? sections.find((item) => item.id === assignment.scopeId)
                    : sections.find(
                        (item) =>
                          item.id ===
                          classrooms.find((classroom) => classroom.id === assignment.scopeId)?.sectionId
                      );
                const classroom =
                  assignment.scopeType === "CLASSROOM"
                    ? classrooms.find((item) => item.id === assignment.scopeId)
                    : undefined;
                const grade = section
                  ? grades.find((item) => item.id === section.gradeId)
                  : undefined;
                const stage = grade
                  ? stages.find((item) => item.id === grade.stageId)
                  : undefined;

                return (
                  <div
                    key={assignment.id}
                    className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
                        {assignment.scopeType === "CLASSROOM"
                          ? t("defaults.classroom")
                          : t("defaults.section")}
                      </span>
                      {stage && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                          {t("defaults.stage")}: {getDisplayName(stage)}
                        </span>
                      )}
                      {grade && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                          {t("defaults.grade")}: {getDisplayName(grade)}
                        </span>
                      )}
                      {section && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                          {t("defaults.section")}: {getDisplayName(section)}
                        </span>
                      )}
                      {classroom && (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                          {t("defaults.classroom")}: {getDisplayName(classroom)}
                        </span>
                      )}
                      {room && (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
                          {t("defaults.room")}: {getDisplayName(room)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleEditDefault(assignment)}
                        disabled={isReadOnly}
                      >
                        {tCommon("edit")}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleDeleteDefault(assignment.id)}
                        disabled={isReadOnly}
                      >
                        {tCommon("delete")}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
