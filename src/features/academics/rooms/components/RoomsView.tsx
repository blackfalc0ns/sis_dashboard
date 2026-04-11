"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Plus, Edit2, Trash2, Download } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import Select from "@/components/ui/input/Select";
import { useToast } from "@/components/ui/toast/Toast";
import RoomDialog from "./RoomDialog";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  formatExportDate,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
} from "@/features/academics/utils/exportAdapter";
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

type RoomsQueryState = {
  searchQuery: string;
  defaultScopeType: "SECTION" | "CLASSROOM";
  defaultStageId: string;
  defaultGradeId: string;
  defaultSectionId: string;
  defaultClassroomId: string;
};

export default function RoomsView({
  schoolId,
  academicYearId,
  termId,
  isReadOnly,
}: RoomsViewProps) {
  const t = useTranslations("academics.timetable.rooms");
  const tCommon = useTranslations("common");
  const tExport = useTranslations("academics.export");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomDefaults, setRoomDefaults] = useState<RoomDefaultAssignment[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryState = useMemo<RoomsQueryState>(
    () => ({
      searchQuery: searchParams.get("roomSearch") || "",
      defaultScopeType:
        searchParams.get("defaultScope") === "CLASSROOM"
          ? "CLASSROOM"
          : "SECTION",
      defaultStageId: searchParams.get("defaultStage") || "",
      defaultGradeId: searchParams.get("defaultGrade") || "",
      defaultSectionId: searchParams.get("defaultSection") || "",
      defaultClassroomId: searchParams.get("defaultClassroom") || "",
    }),
    [searchParams]
  );
  const [searchInputValue, setSearchInputValue] = useState(queryState.searchQuery);
  useEffect(() => {
    setSearchInputValue(queryState.searchQuery);
  }, [queryState.searchQuery]);
  const [defaultRoomId, setDefaultRoomId] = useState("");
  const [editingDefault, setEditingDefault] = useState<RoomDefaultAssignment | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Dialog states
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  const syncQueryParams = useCallback(
    (
      nextState: Partial<{
        searchQuery: string;
        defaultScopeType: "SECTION" | "CLASSROOM";
        defaultStageId: string;
        defaultGradeId: string;
        defaultSectionId: string;
        defaultClassroomId: string;
      }>,
      historyMode: "push" | "replace" = "push"
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const mergedState = {
        searchQuery: nextState.searchQuery ?? queryState.searchQuery,
        defaultScopeType:
          nextState.defaultScopeType ?? queryState.defaultScopeType,
        defaultStageId: nextState.defaultStageId ?? queryState.defaultStageId,
        defaultGradeId: nextState.defaultGradeId ?? queryState.defaultGradeId,
        defaultSectionId:
          nextState.defaultSectionId ?? queryState.defaultSectionId,
        defaultClassroomId:
          nextState.defaultClassroomId ?? queryState.defaultClassroomId,
      };

      if (mergedState.searchQuery) {
        params.set("roomSearch", mergedState.searchQuery);
      } else {
        params.delete("roomSearch");
      }

      if (mergedState.defaultScopeType === "CLASSROOM") {
        params.set("defaultScope", "CLASSROOM");
      } else {
        params.delete("defaultScope");
      }

      const entries: Array<[string, string]> = [
        ["defaultStage", mergedState.defaultStageId],
        ["defaultGrade", mergedState.defaultGradeId],
        ["defaultSection", mergedState.defaultSectionId],
        ["defaultClassroom", mergedState.defaultClassroomId],
      ];

      entries.forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) {
        return;
      }

      const nextUrl = nextQuery ? `?${nextQuery}` : "?";
      if (historyMode === "push") {
        router.push(nextUrl, { scroll: false });
        return;
      }
      router.replace(nextUrl, { scroll: false });
    },
    [
      queryState.defaultClassroomId,
      queryState.defaultGradeId,
      queryState.defaultScopeType,
      queryState.defaultSectionId,
      queryState.defaultStageId,
      queryState.searchQuery,
      router,
      searchParams,
    ]
  );
  const syncSearchQueryParam = useDebouncedCallback((value: string) => {
    syncQueryParams({ searchQuery: value }, "replace");
  }, 250);

  useEffect(() => () => {
    syncSearchQueryParam.cancel();
  }, [syncSearchQueryParam]);

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

  useEffect(() => {
    if (stages.length === 0 && grades.length === 0 && sections.length === 0) {
      return;
    }

    const normalizedStageId = stages.some(
      (stage) => stage.id === queryState.defaultStageId
    )
      ? queryState.defaultStageId
      : "";

    const normalizedGradeId = grades.some(
      (grade) =>
        grade.id === queryState.defaultGradeId &&
        (!normalizedStageId || grade.stageId === normalizedStageId)
    )
      ? queryState.defaultGradeId
      : "";

    const normalizedSectionId = sections.some(
      (section) =>
        section.id === queryState.defaultSectionId &&
        (!normalizedGradeId || section.gradeId === normalizedGradeId)
    )
      ? queryState.defaultSectionId
      : "";

    const normalizedClassroomId =
      queryState.defaultScopeType === "CLASSROOM" &&
      classrooms.some(
        (classroom) =>
          classroom.id === queryState.defaultClassroomId &&
          (!normalizedSectionId || classroom.sectionId === normalizedSectionId)
      )
        ? queryState.defaultClassroomId
        : "";

    if (
      normalizedStageId === queryState.defaultStageId &&
      normalizedGradeId === queryState.defaultGradeId &&
      normalizedSectionId === queryState.defaultSectionId &&
      normalizedClassroomId === queryState.defaultClassroomId
    ) {
      return;
    }

    syncQueryParams(
      {
        defaultStageId: normalizedStageId,
        defaultGradeId: normalizedGradeId,
        defaultSectionId: normalizedSectionId,
        defaultClassroomId: normalizedClassroomId,
      },
      "replace"
    );
  }, [
    classrooms,
    grades,
    queryState.defaultClassroomId,
    queryState.defaultGradeId,
    queryState.defaultScopeType,
    queryState.defaultSectionId,
    queryState.defaultStageId,
    sections,
    stages,
    syncQueryParams,
  ]);

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
    syncQueryParams(
      {
        defaultScopeType: "SECTION",
        defaultStageId: "",
        defaultGradeId: "",
        defaultSectionId: "",
        defaultClassroomId: "",
      },
      "replace"
    );
    setDefaultRoomId("");
  };

  const handleEditDefault = (assignment: RoomDefaultAssignment) => {
    setEditingDefault(assignment);
    if (assignment.scopeType === "SECTION") {
      const section = sections.find((item) => item.id === assignment.scopeId);
      const grade = section ? grades.find((item) => item.id === section.gradeId) : undefined;
      syncQueryParams(
        {
          defaultScopeType: "SECTION",
          defaultStageId: grade?.stageId || "",
          defaultGradeId: section?.gradeId || "",
          defaultSectionId: section?.id || "",
          defaultClassroomId: "",
        },
        "replace"
      );
    } else {
      const classroom = classrooms.find((item) => item.id === assignment.scopeId);
      const section = classroom
        ? sections.find((item) => item.id === classroom.sectionId)
        : undefined;
      const grade = section ? grades.find((item) => item.id === section.gradeId) : undefined;
      syncQueryParams(
        {
          defaultScopeType: "CLASSROOM",
          defaultStageId: grade?.stageId || "",
          defaultGradeId: section?.gradeId || "",
          defaultSectionId: section?.id || "",
          defaultClassroomId: classroom?.id || "",
        },
        "replace"
      );
    }
    setDefaultRoomId(assignment.roomId);
  };

  const handleSaveDefault = async () => {
    const scopeId =
      queryState.defaultScopeType === "CLASSROOM"
        ? queryState.defaultClassroomId
        : queryState.defaultSectionId;
    if (!scopeId || !defaultRoomId) {
      showToast(t("defaults.validation"), "error");
      return;
    }

    try {
      if (editingDefault) {
        await updateRoomDefaultAssignment(editingDefault.id, {
          scopeType: queryState.defaultScopeType,
          scopeId,
          roomId: defaultRoomId,
        });
      } else {
        await createRoomDefaultAssignment(schoolId, {
          scopeType: queryState.defaultScopeType,
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
    if (!searchInputValue) return true;
    const query = searchInputValue.toLowerCase();
    return (
      room.nameAr.toLowerCase().includes(query) ||
      room.nameEn.toLowerCase().includes(query)
    );
  });

  const filteredSections = queryState.defaultGradeId
    ? sections.filter((section) => section.gradeId === queryState.defaultGradeId)
    : sections;
  const filteredGrades = queryState.defaultStageId
    ? grades.filter((grade) => grade.stageId === queryState.defaultStageId)
    : grades;
  const filteredClassrooms = queryState.defaultSectionId
    ? classrooms.filter((classroom) => classroom.sectionId === queryState.defaultSectionId)
    : [];

  const getDisplayName = useCallback(
    (item?: { nameAr?: string; nameEn?: string }) =>
      item
        ? locale === "ar"
          ? item.nameAr || item.nameEn || ""
          : item.nameEn || item.nameAr || ""
        : "",
    [locale],
  );

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

  const roomExportRows = useMemo(() => {
    const roomRows = filteredRooms.map((room) => ({
      dataset: locale === "ar" ? "الغرف" : "Rooms",
      name: locale === "ar" ? room.nameAr : room.nameEn,
      secondaryName: locale === "ar" ? room.nameEn : room.nameAr,
      type: t(`types.${room.type}`),
      capacity: room.capacity,
      status: room.isActive ? t("active") : t("inactive"),
      scopeType: "",
      scopePath: "",
      assignedRoom: "",
    }));

    const defaultRows = roomDefaults.map((assignment) => {
      const room = rooms.find((item) => item.id === assignment.roomId);
      const classroom =
        assignment.scopeType === "CLASSROOM"
          ? classrooms.find((item) => item.id === assignment.scopeId)
          : undefined;
      const section =
        assignment.scopeType === "SECTION"
          ? sections.find((item) => item.id === assignment.scopeId)
          : classroom
            ? sections.find((item) => item.id === classroom.sectionId)
            : undefined;
      const grade = section
        ? grades.find((item) => item.id === section.gradeId)
        : undefined;
      const stage = grade
        ? stages.find((item) => item.id === grade.stageId)
        : undefined;

      return {
        dataset: locale === "ar" ? "التعيينات الافتراضية" : "Default Assignments",
        name: "",
        secondaryName: "",
        type: "",
        capacity: "",
        status: "",
        scopeType: assignment.scopeType,
        scopePath: [stage, grade, section, classroom]
          .filter(Boolean)
          .map((item) => getDisplayName(item))
          .join(" / "),
        assignedRoom: room ? getDisplayName(room) : "",
      };
    });

    return [...roomRows, ...defaultRows];
  }, [
    classrooms,
    filteredRooms,
    getDisplayName,
    grades,
    locale,
    roomDefaults,
    rooms,
    sections,
    stages,
    t,
  ]);

  const handleExport = (format: AcademicsExportFormat) => {
    const metadata: ExportMetadata = {
      yearName: academicYearId || undefined,
      termName: termId || undefined,
      exportDate: formatExportDate(locale),
    };
    const columnsForExport: ExportColumn[] = [
      { key: "dataset", label: locale === "ar" ? "مجموعة البيانات" : "Dataset" },
      { key: "name", label: locale === "ar" ? "الاسم" : "Name" },
      {
        key: "secondaryName",
        label: locale === "ar" ? "الاسم الثانوي" : "Secondary name",
      },
      { key: "type", label: locale === "ar" ? "النوع" : "Type" },
      { key: "capacity", label: locale === "ar" ? "السعة" : "Capacity" },
      { key: "status", label: locale === "ar" ? "الحالة" : "Status" },
      {
        key: "scopeType",
        label: locale === "ar" ? "نوع النطاق" : "Scope type",
      },
      {
        key: "scopePath",
        label: locale === "ar" ? "مسار النطاق" : "Scope path",
      },
      {
        key: "assignedRoom",
        label: locale === "ar" ? "الغرفة المعيّنة" : "Assigned room",
      },
    ];

    exportAcademicsData({
      title: t("title"),
      metadata,
      filename: generateExportFilename("rooms", termId),
      format,
      columns: columnsForExport,
      rows: roomExportRows,
      locale,
      jsonData: {
        title: "Rooms",
        metadata,
        rooms: filteredRooms,
        roomDefaults,
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowExportModal(true)}
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              disabled={roomExportRows.length === 0}
            >
              {tExport("button")}
            </Button>
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              value={searchInputValue}
              onChange={(e) => {
                const value = e.target.value;
                setSearchInputValue(value);
                syncSearchQueryParam(value);
              }}
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
              searchQuery={searchInputValue}
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
              value={queryState.defaultScopeType}
              onChange={(value) => {
                syncQueryParams(
                  {
                    defaultScopeType: value as "SECTION" | "CLASSROOM",
                    defaultStageId: "",
                    defaultGradeId: "",
                    defaultSectionId: "",
                    defaultClassroomId: "",
                  },
                  "push"
                );
              }}
              options={[
                { value: "SECTION", label: t("defaults.section") },
                { value: "CLASSROOM", label: t("defaults.classroom") },
              ]}
              disabled={isReadOnly}
            />
            <Select
              label={t("defaults.stage")}
              value={queryState.defaultStageId}
              onChange={(value) => {
                syncQueryParams(
                  {
                    defaultStageId: value,
                    defaultGradeId: "",
                    defaultSectionId: "",
                    defaultClassroomId: "",
                  },
                  "push"
                );
              }}
              options={stageOptions}
              disabled={isReadOnly}
            />
            <Select
              label={t("defaults.grade")}
              value={queryState.defaultGradeId}
              onChange={(value) => {
                syncQueryParams(
                  {
                    defaultGradeId: value,
                    defaultSectionId: "",
                    defaultClassroomId: "",
                  },
                  "push"
                );
              }}
              options={filteredGradeOptions}
              disabled={isReadOnly || !queryState.defaultStageId}
            />
            <Select
              label={t("defaults.section")}
              value={queryState.defaultSectionId}
              onChange={(value) => {
                syncQueryParams(
                  {
                    defaultSectionId: value,
                    defaultClassroomId: "",
                  },
                  "push"
                );
              }}
              options={sectionOptions}
              disabled={isReadOnly || !queryState.defaultGradeId}
            />
            <Select
              label={t("defaults.classroom")}
              value={queryState.defaultClassroomId}
              onChange={(value) =>
                syncQueryParams({ defaultClassroomId: value }, "push")
              }
              options={classroomOptions}
              disabled={
                isReadOnly ||
                queryState.defaultScopeType !== "CLASSROOM" ||
                !queryState.defaultSectionId
              }
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

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={t("title")}
        datasetCount={roomExportRows.length}
      />
    </div>
  );
}
