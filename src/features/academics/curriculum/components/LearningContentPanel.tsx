"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, FileText, Link as LinkIcon, Trash2, ArrowUp, ArrowDown, Download } from "lucide-react";
import {
  Drawer,
  IconButton,
  MenuItem,
  Select as MuiSelect,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import {
  createLessonContent,
  deleteLessonContent,
  listLessonContent,
  reorderLessonContent,
  updateLessonContent,
  type LessonContentItem,
  type LessonContentType,
} from "@/features/academics/curriculum/services/curriculumService";
import { curriculumUiError } from "@/features/academics/curriculum/services/curriculumErrors";
import { usePermissions } from "@/hooks/usePermissions";
import { downloadFile, uploadFile } from "../services/filesService";
import {
  buildContentPayload,
  LEARNING_CONTENT_FILE_ACCEPT,
  isFileUploadDisabled,
  resolveLessonContentFileId,
  validateLearningContentFile,
  type ContentForm,
} from "./learningContentFile";

interface LearningContentPanelProps {
  curriculumId: string;
  unitId: string;
  lessonId: string;
  isReadOnly: boolean;
  gradeId?: string;
  open: boolean;
  onClose: () => void;
}

function createEmptyContentForm(): ContentForm {
  return {
    type: "TEXT",
    title: "",
    bodyText: "",
    url: "",
    estimatedMinutes: "",
    isRequired: true,
  };
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatFileSize(sizeBytes: number | string) {
  const bytes = Number(sizeBytes);
  if (!Number.isFinite(bytes)) return String(sizeBytes);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LearningContentPanel({
  curriculumId,
  unitId,
  lessonId,
  isReadOnly,
  open,
  onClose,
}: LearningContentPanelProps) {
  const t = useTranslations("academics.curriculum.learningContent");
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isRTL = locale === "ar";
  const { hasPermission } = usePermissions();
  const canUploadFiles = hasPermission("files.uploads.manage");

  const [items, setItems] = useState<LessonContentItem[]>([]);
  const [form, setForm] = useState<ContentForm>(() => createEmptyContentForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [existingFileId, setExistingFileId] = useState<string | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);

  const resetFormToCreate = useCallback(() => {
    setForm(createEmptyContentForm());
    setSelectedFile(undefined);
    setExistingFileId(null);
    setExistingFileName(null);
    setError(null);
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listLessonContent(curriculumId, unitId, lessonId));
    } catch (loadError) {
      setError(curriculumUiError(loadError, t("load_failed")).message);
    } finally {
      setLoading(false);
    }
  }, [curriculumId, lessonId, t, unitId]);

  useEffect(() => {
    resetFormToCreate();
    if (open) void loadItems();
  }, [curriculumId, lessonId, loadItems, open, resetFormToCreate, unitId]);

  const handleSave = async () => {
    const fileValidation = form.type === "FILE"
      ? validateLearningContentFile(selectedFile, existingFileId)
      : null;
    if (
      isReadOnly ||
      !form.title.trim() ||
      (form.type === "TEXT" && !form.bodyText.trim()) ||
      ((form.type === "VIDEO_LINK" || form.type === "EXTERNAL_LINK") &&
        !isValidHttpUrl(form.url.trim())) ||
      (form.type === "FILE" && !canUploadFiles)
    ) {
      return;
    }
    if (fileValidation) {
      setError(t(`file_${fileValidation}`));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fileId = form.type === "FILE"
        ? await resolveLessonContentFileId(selectedFile, existingFileId, uploadFile)
        : null;
      const payload = buildContentPayload(form, fileId);
      if (form.id) {
        await updateLessonContent(
          curriculumId,
          unitId,
          lessonId,
          form.id,
          payload,
        );
      } else {
        await createLessonContent(curriculumId, unitId, lessonId, {
          ...payload,
          sortOrder: items.length,
        });
      }
      await loadItems();
      resetFormToCreate();
    } catch (saveError) {
      setError(curriculumUiError(saveError, t("save_failed")).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: LessonContentItem) => {
    if (isReadOnly || !confirm(t("confirm_delete"))) return;
    try {
      await deleteLessonContent(curriculumId, unitId, lessonId, item.id);
      if (form.id === item.id) {
        resetFormToCreate();
      }
      await loadItems();
    } catch (deleteError) {
      setError(curriculumUiError(deleteError, t("delete_failed")).message);
    }
  };

  const handleReorder = async (item: LessonContentItem, nextIndex: number) => {
    if (isReadOnly) return;
    setError(null);
    try {
      await reorderLessonContent(curriculumId, unitId, lessonId, item.id, {
        sortOrder: nextIndex,
      });
      await loadItems();
    } catch (reorderError) {
      setError(curriculumUiError(reorderError, t("reorder_failed")).message);
    }
  };

  const handleDownload = async (item: LessonContentItem) => {
    if (!item.file) return;
    setError(null);
    try {
      const downloadedFile = await downloadFile(item.file.fileId || item.file.id);
      const objectUrl = URL.createObjectURL(downloadedFile.blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download =
        downloadedFile.filename ||
        item.file.name ||
        item.file.filename ||
        item.file.originalName ||
        item.title;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(curriculumUiError(downloadError, t("download_failed")).message);
    }
  };

  const anchor = isMobile ? "bottom" : isRTL ? "left" : "right";

  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? "100%" : 480,
            maxWidth: "100%",
            height: isMobile ? "90vh" : "100%",
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
          },
        },
      }}
    >
      <div className="h-full flex flex-col bg-gray-50">
        <div className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
          <IconButton size="small" onClick={onClose} title={t("close")}>
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && <div className="text-red-600 bg-red-50 p-3 rounded">{error}</div>}
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-border space-y-4">
            <h3 className="font-medium">{form.id ? t("edit_item") : t("add_item")}</h3>
            
            <Input
              label={t("item_title")}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={isReadOnly}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("item_type")}</label>
              <MuiSelect
                value={form.type}
                onChange={(event) => {
                  const type = event.target.value as LessonContentType;
                  setSelectedFile(undefined);
                  setExistingFileId(null);
                  setExistingFileName(null);
                  setForm({
                    ...createEmptyContentForm(),
                    id: form.id,
                    title: form.title,
                    type,
                    isRequired: form.isRequired,
                  });
                }}
                disabled={isReadOnly}
                size="small"
                fullWidth
              >
                <MenuItem value="TEXT">TEXT</MenuItem>
                <MenuItem value="FILE" disabled={!canUploadFiles}>
                  <Tooltip title={!canUploadFiles ? t("file_permission_tooltip") : ""}>
                    <span>FILE</span>
                  </Tooltip>
                </MenuItem>
                <MenuItem value="VIDEO_LINK">VIDEO_LINK</MenuItem>
                <MenuItem value="EXTERNAL_LINK">EXTERNAL_LINK</MenuItem>
              </MuiSelect>
            </div>

            {form.type === "TEXT" && (
              <TextArea
                label={t("body_text")}
                value={form.bodyText}
                onChange={(event) => setForm({ ...form, bodyText: event.target.value })}
                disabled={isReadOnly}
                rows={5}
              />
            )}
            {form.type === "FILE" && (
              <div className="space-y-2">
                {existingFileName && (
                  <p className="text-sm text-gray-600">{t("current_file", { name: existingFileName })}</p>
                )}
                <input
                  aria-label={t("choose_file")}
                  type="file"
                  accept={LEARNING_CONTENT_FILE_ACCEPT}
                  disabled={isFileUploadDisabled(isReadOnly, canUploadFiles) || saving}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setSelectedFile(file);
                    const validation = validateLearningContentFile(file, existingFileId);
                    setError(validation ? t(`file_${validation}`) : null);
                  }}
                />
                <p className="text-xs text-gray-500">{t("file_help")}</p>
              </div>
            )}
            {(form.type === "VIDEO_LINK" || form.type === "EXTERNAL_LINK") && (
              <Input
                label={t("url")}
                value={form.url}
                onChange={(event) => setForm({ ...form, url: event.target.value })}
                disabled={isReadOnly}
                placeholder="https://example.com"
              />
            )}

            <Input
              label={t("estimated_minutes")}
              value={form.estimatedMinutes}
              onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
              disabled={isReadOnly}
              type="number"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRequired"
                checked={form.isRequired}
                onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
                disabled={isReadOnly}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isRequired" className="text-sm text-gray-700">
                {t("is_required")}
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              {form.id && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={resetFormToCreate}
                    disabled={saving || isReadOnly}
                  >
                    {t("create_new")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={resetFormToCreate}
                    disabled={saving || isReadOnly}
                  >
                    {t("cancel")}
                  </Button>
                </>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={
                  saving ||
                  isReadOnly ||
                  !form.title.trim() ||
                  (form.type === "TEXT" && !form.bodyText.trim()) ||
                  ((form.type === "VIDEO_LINK" || form.type === "EXTERNAL_LINK") &&
                    !isValidHttpUrl(form.url.trim())) ||
                  (form.type === "FILE" && !canUploadFiles)
                }
              >
                {saving ? t("saving") : t("save")}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">{t("content_items")}</h3>
            {loading ? (
              <p className="text-sm text-gray-500">{t("loading")}</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-500">{t("no_items")}</p>
            ) : (
              items.map((item, index) => (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-border flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.type === "TEXT" && <FileText className="w-4 h-4 text-gray-500" />}
                      {(item.type === "VIDEO_LINK" || item.type === "EXTERNAL_LINK") && <LinkIcon className="w-4 h-4 text-gray-500" />}
                      {item.type === "FILE" && <FileText className="w-4 h-4 text-gray-500" />}
                      <h4 className="font-medium text-sm truncate">{item.title}</h4>
                      {item.isRequired && (
                        <span className="text-[10px] uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                          {t("required_badge")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-3">
                      <span>{item.type}</span>
                      {item.estimatedMinutes && <span>{item.estimatedMinutes} min</span>}
                    </div>
                    {item.type === "FILE" && item.file && (
                      <div className="mt-2 text-xs text-gray-600">
                        <div>
                          {item.file.name || item.file.filename || item.file.originalName || item.title}
                        </div>
                        <div>{item.file.mimeType} · {formatFileSize(item.file.sizeBytes)}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {item.type === "FILE" && item.file && (
                      <IconButton
                        size="small"
                        onClick={() => void handleDownload(item)}
                        title={t("download")}
                      >
                        <Download className="w-4 h-4" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleReorder(item, index - 1)}
                      disabled={isReadOnly || index === 0}
                      title={t("move_up")}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleReorder(item, index + 1)}
                      disabled={isReadOnly || index === items.length - 1}
                      title={t("move_down")}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </IconButton>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(undefined);
                        setExistingFileId(item.file?.fileId || item.file?.id || null);
                        setExistingFileName(
                          item.file?.name ||
                          item.file?.filename ||
                          item.file?.originalName ||
                          null,
                        );
                        setForm({
                          id: item.id,
                          type: item.type,
                          title: item.title,
                          bodyText: item.bodyText || "",
                          url: item.url || "",
                          estimatedMinutes: item.estimatedMinutes?.toString() || "",
                          isRequired: item.isRequired,
                        });
                      }}
                      disabled={isReadOnly}
                    >
                      {t("edit")}
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(item)}
                      disabled={isReadOnly}
                    >
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
