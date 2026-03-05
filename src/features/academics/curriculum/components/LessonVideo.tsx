"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Video, Link as LinkIcon, Trash2, Eye, ExternalLink } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import Modal from "@/components/ui/modal/Modal";
import { validateArEnDifferent } from "@/utils/validation/bilingualValidation";
import { validateHttpUrl, normalizeUrl, getUrlErrorKey } from "@/utils/validation/url";
import {
  getUploadRules,
  formatFileSize,
  getAllowedTypesKey,
} from "@/utils/upload/validateFile";
import {
  LessonVideo as LessonVideoType,
  fetchLessonVideo,
  upsertLessonVideoLink,
  uploadLessonVideoFile,
  deleteLessonVideo,
} from "@/features/academics/curriculum/services/curriculumService";

interface LessonVideoProps {
  lessonId: string;
  isReadOnly: boolean;
}

const UPLOAD_AREA = "VIDEO" as const;

export default function LessonVideo({ lessonId, isReadOnly }: LessonVideoProps) {
  const t = useTranslations("academics.curriculum.video");
  const tValidation = useTranslations("validation");
  const tUpload = useTranslations("upload");
  const locale = useLocale();

  const uploadRules = getUploadRules(UPLOAD_AREA);
  const allowedTypesKey = getAllowedTypesKey(UPLOAD_AREA);

  const [video, setVideo] = useState<LessonVideoType | null>(null);
  const [mode, setMode] = useState<"UPLOAD" | "LINK">("LINK");
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ ar?: string; en?: string; url?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const loadVideo = async () => {
    try {
      const data = await fetchLessonVideo(lessonId);
      setVideo(data);
      if (data) {
        setMode(data.type);
        setTitleAr(data.titleAr);
        setTitleEn(data.titleEn);
        setUrl(data.url);
      }
    } catch (error) {
      console.error("Failed to load video:", error);
    }
  };

  const validate = (): boolean => {
    const newErrors: { ar?: string; en?: string; url?: string } = {};

    if (!titleAr.trim()) newErrors.ar = tValidation("required_ar");
    if (!titleEn.trim()) newErrors.en = tValidation("required_en");

    if (titleAr.trim() && titleEn.trim()) {
      const arEnErrors = validateArEnDifferent(titleAr, titleEn);
      if (arEnErrors.arError) newErrors.ar = tValidation("arEnMustDiffer");
      if (arEnErrors.enError) newErrors.en = tValidation("arEnMustDiffer");
    }

    if (mode === "LINK") {
      const urlValidation = validateHttpUrl(url);
      if (!urlValidation.ok) {
        newErrors.url = tValidation(getUrlErrorKey(urlValidation.reason).replace('validation.', ''));
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (mode === "LINK") {
        const urlValidation = validateHttpUrl(url);
        const saved = await upsertLessonVideoLink(lessonId, {
          titleAr: titleAr.trim(),
          titleEn: titleEn.trim(),
          url: urlValidation.normalized || url.trim(),
        });
        setVideo(saved);
      } else if (file) {
        const saved = await uploadLessonVideoFile(lessonId, file, {
          titleAr: titleAr.trim(),
          titleEn: titleEn.trim(),
        });
        setVideo(saved);
        setFile(null);
      }
    } catch (error) {
      console.error("Failed to save video:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("remove_video_confirm"))) return;

    setIsLoading(true);
    try {
      await deleteLessonVideo(lessonId);
      setVideo(null);
      setTitleAr("");
      setTitleEn("");
      setUrl("");
      setFile(null);
    } catch (error) {
      console.error("Failed to delete video:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isYouTube = (url: string) => url.includes("youtube.com") || url.includes("youtu.be");
  const isVimeo = (url: string) => url.includes("vimeo.com");

  const getEmbedUrl = (url: string) => {
    if (isYouTube(url)) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (isVimeo(url)) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
    return url;
  };

  const displayTitle = locale === "ar" 
    ? (video?.titleAr || video?.titleEn) 
    : (video?.titleEn || video?.titleAr);

  return (
    <div className="space-y-4">
      {isReadOnly && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          {t("readonly_message")}
        </div>
      )}

      {!video ? (
        <div className="space-y-4">
          {/* Mode Switch */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={mode === "LINK"}
                onChange={() => setMode("LINK")}
                disabled={isReadOnly}
                className="rounded-full"
              />
              <LinkIcon className="w-4 h-4" />
              <span>{t("link")}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={mode === "UPLOAD"}
                onChange={() => setMode("UPLOAD")}
                disabled={isReadOnly}
                className="rounded-full"
              />
              <Video className="w-4 h-4" />
              <span>{t("upload")}</span>
            </label>
          </div>

          {/* Title Fields */}
          <BilingualTextField
            label={t("video_title")}
            value={{ ar: titleAr, en: titleEn }}
            onChange={(value) => {
              setTitleAr(value.ar);
              setTitleEn(value.en);
              setErrors({});
            }}
            requiredAr
            requiredEn
            errors={errors}
            disabled={isReadOnly}
          />

          {/* Link Mode */}
          {mode === "LINK" && (
            <Input
              label={t("video_url")}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setErrors({ ...errors, url: undefined });
              }}
              onBlur={() => {
                const normalized = normalizeUrl(url);
                if (normalized !== url) {
                  setUrl(normalized);
                }
              }}
              error={errors.url}
              placeholder="https://example.com"
              disabled={isReadOnly}
              required
            />
          )}

          {/* Upload Mode */}
          {mode === "UPLOAD" && (
            <div>
              <DragDropUploadArea
                title={tUpload("dragHereTitle")}
                subtitle={tUpload("dragHereSubtitle")}
                buttonLabel={t("upload_video")}
                onFilesSelected={(files) => setFile(files[0])}
                isUploading={isLoading}
                disabled={isReadOnly}
                multiple={false}
                uploadArea={UPLOAD_AREA}
                helperText={
                  isReadOnly
                    ? tUpload("termClosed")
                    : tUpload("allowedHint", {
                        types: tUpload(allowedTypesKey),
                        size: formatFileSize(uploadRules.maxSizeBytes),
                      })
                }
              />
              {file && (
                <div className="mt-2 text-sm text-gray-600">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              variant="primary"
              disabled={isReadOnly || isLoading || (mode === "UPLOAD" && !file)}
            >
              {isLoading ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Video Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium mb-2">{displayTitle}</div>
            <div className="text-sm text-gray-600">
              {video.type === "UPLOAD" && video.fileName && (
                <div>{video.fileName} ({video.size ? (video.size / 1024 / 1024).toFixed(2) + " MB" : ""})</div>
              )}
              {video.type === "LINK" && <div className="truncate">{video.url}</div>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => setShowPreview(true)}
              variant="secondary"
              leftIcon={<Eye className="w-4 h-4" />}
            >
              {t("preview")}
            </Button>
            {video.type === "LINK" && (
              <Button
                onClick={() => window.open(video.url, "_blank", "noopener,noreferrer")}
                variant="secondary"
                leftIcon={<ExternalLink className="w-4 h-4" />}
              >
                {t("open")}
              </Button>
            )}
            {!isReadOnly && (
              <Button
                onClick={handleDelete}
                variant="danger"
                leftIcon={<Trash2 className="w-4 h-4" />}
                disabled={isLoading}
              >
                {t("remove_video")}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {video && showPreview && (
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title={displayTitle || t("preview")}
          size="lg"
        >
          <div className="aspect-video bg-black rounded">
            {video.type === "UPLOAD" ? (
              <video controls className="w-full h-full">
                <source src={video.url} type={video.mimeType} />
              </video>
            ) : (isYouTube(video.url) || isVimeo(video.url)) ? (
              <iframe
                src={getEmbedUrl(video.url)}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <p className="mb-4">Preview not available</p>
                  <Button
                    onClick={() => window.open(video.url, "_blank", "noopener,noreferrer")}
                    variant="secondary"
                  >
                    {t("open")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
