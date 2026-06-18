"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, FileText, Link as LinkIcon, Trash2 } from "lucide-react";
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
  updateLessonContent,
  type LessonContentItem,
  type LessonContentType,
} from "@/features/academics/curriculum/services/curriculumService";
import { curriculumUiError } from "@/features/academics/curriculum/services/curriculumErrors";

interface LearningContentPanelProps {
  curriculumId: string;
  unitId: string;
  lessonId: string;
  isReadOnly: boolean;
  gradeId?: string;
  open: boolean;
  onClose: () => void;
}

type ContentForm = {
  id?: string;
  type: LessonContentType;
  title: string;
  bodyText: string;
  url: string;
  fileId: string;
  estimatedMinutes: string;
  isRequired: boolean;
};

const emptyContentForm: ContentForm = {
  type: "TEXT",
  title: "",
  bodyText: "",
  url: "",
  fileId: "",
  estimatedMinutes: "",
  isRequired: true,
};

const hasBackendFileIdPicker = false;

function buildContentPayload(form: ContentForm) {
  const estimatedMinutes = form.estimatedMinutes.trim()
    ? Number(form.estimatedMinutes)
    : null;

  if (form.type === "TEXT") {
    return {
      type: "TEXT" as const,
      title: form.title.trim(),
      bodyText: form.bodyText.trim(),
      url: null,
      fileId: null,
      estimatedMinutes,
      isRequired: form.isRequired,
    };
  }

  if (form.type === "FILE") {
    if (!form.fileId.trim()) {
      throw new Error("FILE content requires a backend fileId.");
    }

    return {
      type: "FILE" as const,
      title: form.title.trim(),
      bodyText: null,
      url: null,
      fileId: form.fileId.trim(),
      estimatedMinutes,
      isRequired: form.isRequired,
    };
  }

  return {
    type: form.type,
    title: form.title.trim(),
    bodyText: null,
    url: form.url.trim(),
    fileId: null,
    estimatedMinutes,
    isRequired: form.isRequired,
  };
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

  const [items, setItems] = useState<LessonContentItem[]>([]);
  const [form, setForm] = useState<ContentForm>(emptyContentForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listLessonContent(curriculumId, unitId, lessonId));
    } catch (loadError) {
      setError(curriculumUiError(loadError, t("load_failed")).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void loadItems();
  }, [open, curriculumId, unitId, lessonId]);

  const handleSave = async () => {
    if (
      isReadOnly ||
      !form.title.trim() ||
      (form.type === "FILE" && !hasBackendFileIdPicker)
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildContentPayload(form);
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
      setForm(emptyContentForm);
      await loadItems();
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
      await loadItems();
    } catch (deleteError) {
      setError(curriculumUiError(deleteError, t("delete_failed")).message);
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
                  setForm({
                    ...emptyContentForm,
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
                <MenuItem value="FILE" disabled={!hasBackendFileIdPicker}>
                  <Tooltip title={t("file_disabled_tooltip")}>
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
              <Tooltip title={t("file_disabled_tooltip")}>
                <span>
                  <Input
                    label={t("file_id")}
                    value={form.fileId}
                    onChange={(event) => setForm({ ...form, fileId: event.target.value })}
                    disabled
                  />
                </span>
              </Tooltip>
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setForm(emptyContentForm)}
                  disabled={saving || isReadOnly}
                >
                  {t("cancel")}
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving || isReadOnly || !form.title.trim()}
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
              items.map((item) => (
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
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setForm({
                        id: item.id,
                        type: item.type,
                        title: item.title,
                        bodyText: item.bodyText || "",
                        url: item.url || "",
                        fileId: item.fileId || "",
                        estimatedMinutes: item.estimatedMinutes?.toString() || "",
                        isRequired: item.isRequired,
                      })}
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
