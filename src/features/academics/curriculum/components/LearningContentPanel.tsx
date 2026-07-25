"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Clock3,
  Eye,
  FilePlus2,
  FileText,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import FilePreviewModal, { type PreviewAttachment } from "@/components/ui/file-preview-modal";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import Select from "@/components/ui/input/Select";
import {
  createLessonContent,
  archiveLessonContent,
  deleteLessonContent,
  listLessonContent,
  publishLessonContent,
  reorderLessonContent,
  unpublishLessonContent,
  updateLessonContent,
  type LessonContentItem,
  type LessonContentType,
} from "@/features/academics/curriculum/services/curriculumService";
import {
  curriculumFormErrors,
  curriculumUiError,
} from "@/features/academics/curriculum/services/curriculumErrors";
import { usePermissions } from "@/hooks/usePermissions";
import { downloadFile, uploadLearningMedia } from "../services/filesService";
import {
  buildContentPayload,
  LEARNING_CONTENT_FILE_ACCEPT,
  isFileUploadDisabled,
  learningContentTypeOptions,
  resolveLessonContentFileId,
  validateLearningContentFile,
  type ContentForm,
} from "./learningContentFile";
import LearningContentActionsMenu, {
  type LearningContentAction,
} from "./LearningContentActionsMenu";

interface LearningContentPanelProps {
  curriculumId: string;
  unitId: string;
  lessonId: string;
  isReadOnly: boolean;
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

type ContentField = Exclude<keyof ContentForm, "id"> | "fileId";
const contentFields = [
  "type",
  "title",
  "bodyText",
  "url",
  "fileId",
  "estimatedMinutes",
  "isRequired",
] as const satisfies readonly ContentField[];

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
  onClose,
}: LearningContentPanelProps) {
  const t = useTranslations("academics.curriculum.learningContent");
  const { hasPermission } = usePermissions();
  const canUploadFiles = hasPermission("files.uploads.manage");

  const [items, setItems] = useState<LessonContentItem[]>([]);
  const [form, setForm] = useState<ContentForm>(() => createEmptyContentForm());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ContentField, string>>
  >({});
  const [formMessages, setFormMessages] = useState<string[]>([]);
  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<LessonContentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingArchiveItem, setPendingArchiveItem] =
    useState<LessonContentItem | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [uploadStage, setUploadStage] = useState<
    "preparing" | "uploading" | "verifying" | null
  >(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploadRetryAvailable, setIsUploadRetryAvailable] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [existingFileId, setExistingFileId] = useState<string | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<PreviewAttachment | null>(null);

  const handlePreview = (item: LessonContentItem) => {
    if (item.type === "FILE" && item.file) {
      setPreviewAttachment({
        id: item.file.fileId,
        name: item.file.filename || item.title,
        size: Number(item.file.sizeBytes) || 0,
        type: item.file.mimeType,
      });
    } else if (item.url) {
      setPreviewAttachment({
        id: item.id,
        name: item.title,
        size: 0,
        type: item.type === "VIDEO_LINK" ? "video/mp4" : "text/html",
        url: item.url,
      });
    }
  };

  const resetFormToCreate = useCallback(() => {
    setForm(createEmptyContentForm());
    setSelectedFile(undefined);
    setExistingFileId(null);
    setExistingFileName(null);
    setError(null);
    setFieldErrors({});
    setFormMessages([]);
    setPendingDeleteItem(null);
    setPendingArchiveItem(null);
    setUploadStage(null);
    setUploadProgress(null);
    setIsUploadRetryAvailable(false);
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
    void Promise.resolve().then(() => {
      resetFormToCreate();
      void loadItems();
    });
  }, [curriculumId, lessonId, loadItems, resetFormToCreate, unitId]);

  const updateFormField = <Field extends Exclude<keyof ContentForm, "id">>(
    field: Field,
    value: ContentForm[Field],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const selectLearningContentFile = (file: File | undefined) => {
    setSelectedFile(file);
    setIsUploadRetryAvailable(false);
    const validation = validateLearningContentFile(file, existingFileId);
    setError(validation ? t(`file_${validation}`) : null);
    setFieldErrors((current) => ({ ...current, fileId: undefined }));
  };

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
    setFieldErrors({});
    setFormMessages([]);
    setIsUploadRetryAvailable(false);
    setUploadProgress(null);
    try {
      const fileId = form.type === "FILE"
        ? await resolveLessonContentFileId(
          selectedFile,
          existingFileId,
          uploadLearningMedia,
          setUploadStage,
          setUploadProgress,
        )
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
      const mapped = curriculumUiError(saveError, t("save_failed"));
      const projected = curriculumFormErrors(mapped, contentFields);
      setError(mapped.message);
      setFieldErrors(projected.fieldErrors);
      setFormMessages(projected.formMessages);
      setIsUploadRetryAvailable(form.type === "FILE" && Boolean(selectedFile));
    } finally {
      setSaving(false);
      setUploadStage(null);
      setUploadProgress(null);
    }
  };

  const confirmDeleteItem = async () => {
    if (!pendingDeleteItem) return;

    setIsDeleting(true);
    try {
      await deleteLessonContent(
        curriculumId,
        unitId,
        lessonId,
        pendingDeleteItem.id,
      );
      if (form.id === pendingDeleteItem.id) {
        resetFormToCreate();
      }
      await loadItems();
      setPendingDeleteItem(null);
    } catch (deleteError) {
      setError(curriculumUiError(deleteError, t("delete_failed")).message);
    } finally {
      setIsDeleting(false);
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

  const runPublicationTransition = async (
    item: LessonContentItem,
    action: "publish" | "unpublish" | "archive",
  ) => {
    if (isReadOnly) return;
    setError(null);
    try {
      if (action === "publish") {
        await publishLessonContent(curriculumId, unitId, lessonId, item.id);
      } else if (action === "unpublish") {
        await unpublishLessonContent(curriculumId, unitId, lessonId, item.id);
      } else {
        await archiveLessonContent(curriculumId, unitId, lessonId, item.id);
      }
      if (form.id === item.id) resetFormToCreate();
      await loadItems();
    } catch (lifecycleError) {
      setError(curriculumUiError(lifecycleError, t("lifecycle_failed")).message);
    }
  };

  const startEditing = (item: LessonContentItem) => {
    setError(null);
    setFieldErrors({});
    setFormMessages([]);
    setSelectedFile(undefined);
    setExistingFileId(item.file?.fileId || null);
    setExistingFileName(item.file?.filename || null);
    setForm({
      id: item.id,
      type: item.type,
      title: item.title,
      bodyText: item.bodyText || "",
      url: item.url || "",
      estimatedMinutes: item.estimatedMinutes?.toString() || "",
      isRequired: item.isRequired,
    });
  };

  const runContentAction = (
    contentItem: LessonContentItem,
    index: number,
    action: LearningContentAction,
  ) => {
    switch (action) {
      case "preview":
        handlePreview(contentItem);
        return;
      case "download":
        void handleDownload(contentItem);
        return;
      case "moveUp":
        void handleReorder(contentItem, index - 1);
        return;
      case "moveDown":
        void handleReorder(contentItem, index + 1);
        return;
      case "edit":
        startEditing(contentItem);
        return;
      case "delete":
        setPendingDeleteItem(contentItem);
        return;
      case "publish":
      case "unpublish":
        void runPublicationTransition(contentItem, action);
        return;
      case "archive":
        setPendingArchiveItem(contentItem);
        return;
    }
  };

  const confirmArchiveItem = async () => {
    if (!pendingArchiveItem) return;
    setIsArchiving(true);
    await runPublicationTransition(pendingArchiveItem, "archive");
    setIsArchiving(false);
    setPendingArchiveItem(null);
  };

  const handleDownload = async (item: LessonContentItem) => {
    if (!item.file) return;
    setError(null);
    try {
      const downloadedFile = await downloadFile(item.file.fileId);
      const objectUrl = URL.createObjectURL(downloadedFile.blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download =
        downloadedFile.filename || item.file.filename || item.title;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(curriculumUiError(downloadError, t("download_failed")).message);
    }
  };

  return (
    <>
      <div
        role="region"
        aria-label={t("title")}
        className="h-full flex flex-col bg-slate-50"
      >

        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {isUploadRetryAvailable && error && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {t("retry_upload")}
            </Button>
          )}
          {uploadStage && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary"
            >
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {uploadStage === "uploading" && uploadProgress !== null
                    ? t("upload_progress", { progress: uploadProgress })
                    : t(`upload_${uploadStage}`)}
                </span>
              </div>
              {uploadStage === "uploading" && uploadProgress !== null && (
                <div
                  role="progressbar"
                  aria-label={t("upload_progress", { progress: uploadProgress })}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={uploadProgress}
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/15"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}
          {formMessages.length > 0 && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {formMessages.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}
          
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-4 sm:px-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-primary">
                <FilePlus2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{form.id ? t("edit_item") : t("add_item")}</h3>
                <p className="mt-0.5 text-sm text-slate-600">{t("form_hint")}</p>
              </div>
            </div>
            <div className="space-y-4 p-4 sm:p-5">
            
            <Input
              label={t("item_title")}
              value={form.title}
              onChange={(e) => updateFormField("title", e.target.value)}
              error={fieldErrors.title}
              disabled={isReadOnly}
              required
            />

            <Select
                label={t("item_type")}
                value={form.type}
                options={learningContentTypeOptions(canUploadFiles)}
                helperText={!canUploadFiles ? t("file_permission_tooltip") : undefined}
                onChange={(value) => {
                  const type = value as LessonContentType;
                  setSelectedFile(undefined);
                  setExistingFileId(null);
                  setExistingFileName(null);
                  setFieldErrors({});
                  setFormMessages([]);
                  setForm({
                    ...createEmptyContentForm(),
                    id: form.id,
                    title: form.title,
                    type,
                    isRequired: form.isRequired,
                  });
                }}
                disabled={isReadOnly}
                selectSize="sm"
                error={fieldErrors.type}
              />

            {form.type === "TEXT" && (
              <TextArea
                label={t("body_text")}
                value={form.bodyText}
                onChange={(event) => updateFormField("bodyText", event.target.value)}
                error={fieldErrors.bodyText}
                disabled={isReadOnly}
                rows={5}
              />
            )}
            {form.type === "FILE" && (
              <div className="space-y-3">
                {existingFileName && (
                  <p className="text-sm text-gray-600">{t("current_file", { name: existingFileName })}</p>
                )}
                <DragDropUploadArea
                  title={t("dropzone_title")}
                  subtitle={t("dropzone_subtitle")}
                  accept={LEARNING_CONTENT_FILE_ACCEPT}
                  multiple={false}
                  disabled={isFileUploadDisabled(isReadOnly, canUploadFiles) || saving}
                  isUploading={saving && uploadStage !== null}
                  onFilesSelected={(files) => selectLearningContentFile(files[0])}
                  helperText={t("file_help")}
                  buttonLabel={t("choose_file")}
                />
                {selectedFile && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                    <span className="min-w-0 truncate font-medium">{selectedFile.name}</span>
                    <span className="shrink-0 text-xs text-emerald-700">{formatFileSize(selectedFile.size)}</span>
                  </div>
                )}
                {fieldErrors.fileId && (
                  <p role="alert" className="text-xs text-red-600">
                    {fieldErrors.fileId}
                  </p>
                )}
              </div>
            )}
            {(form.type === "VIDEO_LINK" || form.type === "EXTERNAL_LINK") && (
              <Input
                label={t("url")}
                value={form.url}
                onChange={(event) => updateFormField("url", event.target.value)}
                error={fieldErrors.url}
                disabled={isReadOnly}
                placeholder="https://example.com"
              />
            )}

            <Input
              label={t("estimated_minutes")}
              value={form.estimatedMinutes}
              onChange={(e) => updateFormField("estimatedMinutes", e.target.value)}
              error={fieldErrors.estimatedMinutes}
              disabled={isReadOnly}
              type="number"
            />

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition-colors duration-200 hover:bg-slate-100">
              <input
                type="checkbox"
                checked={form.isRequired}
                onChange={(e) => updateFormField("isRequired", e.target.checked)}
                disabled={isReadOnly}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-slate-700">
                {t("is_required")}
              </span>
              {fieldErrors.isRequired && (
                <span role="alert" className="text-xs text-red-600">
                  {fieldErrors.isRequired}
                </span>
              )}
            </label>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
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
                leftIcon={<FilePlus2 className="h-4 w-4" />}
              >
                {saving ? t("saving") : t("save")}
              </Button>
            </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3 px-1">
              <div>
                <h3 className="font-semibold text-slate-900">{t("content_items")}</h3>
                <p className="mt-0.5 text-sm text-slate-600">{t("content_list_hint")}</p>
              </div>
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {t("items_count", { count: items.length })}
              </span>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {t("loading")}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-primary">
                  <FilePlus2 className="h-5 w-5" />
                </div>
                <p className="mt-3 font-medium text-slate-900">{t("no_items")}</p>
                <p className="mt-1 text-sm text-slate-600">{t("empty_hint")}</p>
              </div>
            ) : (
              items.map((item, index) => (
                <article key={item.id} className="group flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-200 hover:border-indigo-200 hover:bg-indigo-50/20">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        {item.type === "TEXT" || item.type === "FILE" ? <FileText className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                      </div>
                      <h4 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{item.title}</h4>
                      {item.isRequired && (
                        <span className="text-[10px] uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                          {t("required_badge")}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          item.publicationStatus === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.publicationStatus === "archived"
                              ? "bg-slate-200 text-slate-700"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {t(`status_${item.publicationStatus}`)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="font-medium text-slate-500">{item.type}</span>
                      {item.estimatedMinutes && <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{t("minutes", { count: item.estimatedMinutes })}</span>}
                    </div>
                    {item.publicationStatus !== "draft" && (
                      <p className="mt-2 text-xs text-gray-600">
                        {t(
                          item.publicationStatus === "published"
                            ? "published_read_only"
                            : "archived_read_only",
                        )}
                      </p>
                    )}
                    {item.type === "FILE" && item.file && (
                      <div className="mt-2 text-xs text-gray-600">
                        <button
                          type="button"
                          onClick={() => handlePreview(item)}
                          className="font-medium text-primary hover:underline text-left cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0" />
                          <span>{item.file.filename || item.title}</span>
                        </button>
                        <div>{item.file.mimeType} · {formatFileSize(item.file.sizeBytes)}</div>
                      </div>
                    )}
                    {(item.type === "VIDEO_LINK" || item.type === "EXTERNAL_LINK") && item.url && (
                      <div className="mt-2 text-xs text-gray-600">
                        <button
                          type="button"
                          onClick={() => handlePreview(item)}
                          className="font-medium text-primary hover:underline text-left cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate max-w-xs">{item.url}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <LearningContentActionsMenu
                    contentItem={item}
                    index={index}
                    totalItems={items.length}
                    isReadOnly={isReadOnly}
                    labels={{
                      menu: t("actions_menu"),
                      download: t("download"),
                      preview: t("preview"),
                      moveUp: t("move_up"),
                      moveDown: t("move_down"),
                      edit: t("edit"),
                      delete: t("delete"),
                      publish: t("publish"),
                      unpublish: t("unpublish"),
                      archive: t("archive"),
                    }}
                    onAction={(action) => runContentAction(item, index, action)}
                  />
                </article>
              ))
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={pendingDeleteItem !== null}
        onClose={() => {
          if (!isDeleting) setPendingDeleteItem(null);
        }}
        onConfirm={() => void confirmDeleteItem()}
        title={t("delete")}
        description={t("confirm_delete")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        loading={isDeleting}
        severity="danger"
      />
      <ConfirmDialog
        isOpen={pendingArchiveItem !== null}
        onClose={() => {
          if (!isArchiving) setPendingArchiveItem(null);
        }}
        onConfirm={() => void confirmArchiveItem()}
        title={t("archive_title")}
        description={t("archive_description")}
        confirmLabel={t("archive_confirm")}
        cancelLabel={t("cancel")}
        loading={isArchiving}
        severity="danger"
      />
      <FilePreviewModal
        attachment={previewAttachment}
        isOpen={previewAttachment !== null}
        onClose={() => setPreviewAttachment(null)}
      />
    </>
  );
}
