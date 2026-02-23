"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Plus, MoreVertical, Edit2, Trash2, ChevronDown, ChevronRight, FileText, Link as LinkIcon, Calendar, Award } from "lucide-react";
import Button from "@/components/ui/button/Button";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import FileUploadButton from "@/components/ui/file-upload/FileUploadButton";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import AssignmentDialog from "./AssignmentDialog";
import AssignmentQuestionsBuilder from "./AssignmentQuestionsBuilder";
import { validateHttpUrl, normalizeUrl, getUrlErrorKey } from "@/utils/validation/url";
import {
  Assignment,
  AssignmentAttachment,
  fetchLessonAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  fetchAssignmentAttachments,
  uploadAssignmentAttachmentFile,
  createAssignmentAttachmentLink,
  deleteAssignmentAttachment,
} from "@/services/academics/curriculumService";
import { AcademicEvent, fetchTermEvents } from "@/services/academics/calendarService";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";

interface LessonAssignmentsProps {
  lessonId: string;
  isReadOnly: boolean;
  gradeId?: string; // For scope-aware holiday checking
}

export default function LessonAssignments({ lessonId, isReadOnly, gradeId }: LessonAssignmentsProps) {
  const t = useTranslations("academics.curriculum.assignments");
  const tMaterials = useTranslations("academics.curriculum.materials");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(new Set());
  const [attachmentsByAssignment, setAttachmentsByAssignment] = useState<Record<string, AssignmentAttachment[]>>({});
  const [showDialog, setShowDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [currentAssignmentId, setCurrentAssignmentId] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkErrors, setLinkErrors] = useState<{ title?: string; url?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [termEvents, setTermEvents] = useState<AcademicEvent[]>([]);

  // Fetch term events for holiday checking
  useEffect(() => {
    const termId = searchParams.get("term");
    if (termId) {
      fetchTermEvents(termId)
        .then(setTermEvents)
        .catch((error) => console.error("Failed to fetch term events:", error));
    }
  }, [searchParams]);

  useEffect(() => {
    loadAssignments();
  }, [lessonId]);

  const loadAssignments = async () => {
    try {
      const data = await fetchLessonAssignments(lessonId);
      setAssignments(data);
    } catch (error) {
      console.error("Failed to load assignments:", error);
    }
  };

  const loadAttachments = async (assignmentId: string) => {
    try {
      const data = await fetchAssignmentAttachments(assignmentId);
      setAttachmentsByAssignment(prev => ({ ...prev, [assignmentId]: data }));
    } catch (error) {
      console.error("Failed to load attachments:", error);
    }
  };

  const toggleExpand = (assignmentId: string) => {
    setExpandedAssignments(prev => {
      const next = new Set(prev);
      if (next.has(assignmentId)) {
        next.delete(assignmentId);
      } else {
        next.add(assignmentId);
        if (!attachmentsByAssignment[assignmentId]) {
          loadAttachments(assignmentId);
        }
      }
      return next;
    });
  };

  const handleSaveAssignment = async (data: Partial<Assignment>) => {
    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, data);
      } else {
        await createAssignment(lessonId, data as Omit<Assignment, "id" | "lessonId" | "createdAt">);
      }
      await loadAssignments();
      setShowDialog(false);
      setEditingAssignment(null);
    } catch (error) {
      console.error("Failed to save assignment:", error);
      throw error;
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm(t("delete_assignment_confirm"))) return;

    try {
      await deleteAssignment(assignmentId);
      await loadAssignments();
    } catch (error) {
      console.error("Failed to delete assignment:", error);
    }
  };

  const handleFileUpload = async (assignmentId: string, files: File[]) => {
    setIsLoading(true);
    try {
      for (const file of files) {
        await uploadAssignmentAttachmentFile(assignmentId, file);
      }
      await loadAttachments(assignmentId);
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLink = (assignmentId: string) => {
    setCurrentAssignmentId(assignmentId);
    setLinkTitle("");
    setLinkUrl("");
    setLinkErrors({});
    setShowLinkDialog(true);
  };

  const handleSaveLink = async () => {
    const errors: { title?: string; url?: string } = {};
    if (!linkTitle.trim()) errors.title = tMaterials("title_required");
    
    const urlValidation = validateHttpUrl(linkUrl);
    if (!urlValidation.ok) {
      errors.url = tValidation(getUrlErrorKey(urlValidation.reason).replace('validation.', ''));
    }

    if (Object.keys(errors).length > 0) {
      setLinkErrors(errors);
      return;
    }

    if (!currentAssignmentId) return;

    setIsLoading(true);
    try {
      await createAssignmentAttachmentLink(currentAssignmentId, {
        title: linkTitle.trim(),
        url: urlValidation.normalized || linkUrl.trim(),
      });
      await loadAttachments(currentAssignmentId);
      setShowLinkDialog(false);
    } catch (error) {
      console.error("Failed to add link:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAttachment = async (assignmentId: string, attachmentId: string) => {
    if (!confirm(tMaterials("remove_material_confirm"))) return;

    try {
      await deleteAssignmentAttachment(attachmentId);
      await loadAttachments(assignmentId);
    } catch (error) {
      console.error("Failed to delete attachment:", error);
    }
  };

  const getDisplayTitle = (assignment: Assignment) => {
    return locale === "ar" 
      ? (assignment.titleAr || assignment.titleEn) 
      : (assignment.titleEn || assignment.titleAr);
  };

  const getDisplayDescription = (assignment: Assignment) => {
    return locale === "ar" 
      ? (assignment.descriptionAr || assignment.descriptionEn) 
      : (assignment.descriptionEn || assignment.descriptionAr);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {!isReadOnly && (
          <Button
            onClick={() => {
              setEditingAssignment(null);
              setShowDialog(true);
            }}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t("add_assignment")}
          </Button>
        )}
      </div>

      {isReadOnly && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          {t("readonly_message")}
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{t("no_assignments")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((assignment) => {
            const isExpanded = expandedAssignments.has(assignment.id);
            const attachments = attachmentsByAssignment[assignment.id] || [];

            return (
              <div key={assignment.id} className="border border-border rounded-lg">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => toggleExpand(assignment.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <h4 className="font-medium">{getDisplayTitle(assignment)}</h4>
                      </div>

                      {getDisplayDescription(assignment) && (
                        <p className="text-sm text-gray-600 mb-2 ml-7">
                          {getDisplayDescription(assignment)}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600 ml-7">
                        {assignment.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {dayjs(assignment.dueDate).format("MMM D, YYYY")}
                          </div>
                        )}
                        {assignment.maxScore !== undefined && (
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            {assignment.maxScore} {t("max_score")}
                          </div>
                        )}
                      </div>
                    </div>

                    {!isReadOnly && (
                      <DropdownMenu
                        trigger={
                          <button className="p-2 hover:bg-gray-100 rounded">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        }
                        items={[
                          {
                            label: t("edit_assignment"),
                            value: "edit",
                            icon: <Edit2 className="w-4 h-4" />,
                            onClick: () => {
                              setEditingAssignment(assignment);
                              setShowDialog(true);
                            },
                          },
                          {
                            label: t("delete_assignment"),
                            value: "delete",
                            icon: <Trash2 className="w-4 h-4" />,
                            onClick: () => handleDeleteAssignment(assignment.id),
                          },
                        ]}
                      />
                    )}
                  </div>

                  {/* Attachments Section */}
                  {isExpanded && (
                    <div className="mt-4 ml-7 pt-4 border-t space-y-6">
                      {/* Questions Builder */}
                      <AssignmentQuestionsBuilder
                        assignment={assignment}
                        isReadOnly={isReadOnly}
                        onQuestionsChange={() => {
                          // Optionally refresh assignments if needed
                        }}
                      />

                      {/* Attachments */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium">{t("attachments")}</h5>
                        {!isReadOnly && (
                          <div className="flex gap-2">
                            <FileUploadButton
                              onFilesSelected={(files: File[]) => handleFileUpload(assignment.id, files)}
                              multiple
                              disabled={isLoading}
                              buttonLabel={tMaterials("upload_files")}
                              buttonProps={{ variant: "secondary", size: "sm" }}
                            />
                            <Button
                              onClick={() => handleAddLink(assignment.id)}
                              variant="secondary"
                              size="sm"
                              leftIcon={<LinkIcon className="w-4 h-4" />}
                            >
                              {tMaterials("add_link")}
                            </Button>
                          </div>
                        )}
                      </div>

                        {attachments.length === 0 ? (
                          <p className="text-sm text-gray-500">{tMaterials("no_materials")}</p>
                        ) : (
                          <div className="space-y-2">
                            {attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {attachment.type === "FILE" ? (
                                    <FileText className="w-5 h-5 text-gray-600 shrink-0" />
                                  ) : (
                                    <LinkIcon className="w-5 h-5 text-gray-600 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {attachment.title}
                                    </div>
                                    {attachment.type === "FILE" && attachment.size && (
                                      <div className="text-xs text-gray-500">
                                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() => window.open(attachment.url, "_blank", "noopener,noreferrer")}
                                    variant="secondary"
                                    size="sm"
                                  >
                                    {tMaterials("open")}
                                  </Button>
                                  {!isReadOnly && (
                                    <Button
                                      onClick={() => handleDeleteAttachment(assignment.id, attachment.id)}
                                      variant="danger"
                                      size="sm"
                                    >
                                      {tMaterials("remove_material")}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignment Dialog */}
      <AssignmentDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          setEditingAssignment(null);
        }}
        onSave={handleSaveAssignment}
        assignment={editingAssignment}
        isReadOnly={isReadOnly}
        termEvents={termEvents}
        gradeId={gradeId}
      />

      {/* Add Link Dialog */}
      <Modal
        isOpen={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        title={tMaterials("add_link")}
        size="sm"
        footer={
          <>
            <Button onClick={() => setShowLinkDialog(false)} variant="secondary">
              {tMaterials("cancel")}
            </Button>
            <Button onClick={handleSaveLink} variant="primary" disabled={isLoading}>
              {tMaterials("save")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={tMaterials("link_title")}
            value={linkTitle}
            onChange={(e) => {
              setLinkTitle(e.target.value);
              setLinkErrors({ ...linkErrors, title: undefined });
            }}
            error={linkErrors.title}
            required
          />
          <Input
            label={tMaterials("link_url")}
            value={linkUrl}
            onChange={(e) => {
              setLinkUrl(e.target.value);
              setLinkErrors({ ...linkErrors, url: undefined });
            }}
            onBlur={() => {
              const normalized = normalizeUrl(linkUrl);
              if (normalized !== linkUrl) {
                setLinkUrl(normalized);
              }
            }}
            error={linkErrors.url}
            placeholder="https://example.com"
            required
          />
        </div>
      </Modal>
    </div>
  );
}
