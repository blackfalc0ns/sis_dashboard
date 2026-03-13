"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import { formatFileSize } from "@/utils/upload/validateFile";
type PreviewAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
};

interface AttendanceAttachmentPreviewModalProps {
  attachment: PreviewAttachment | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AttendanceAttachmentPreviewModal({
  attachment,
  isOpen,
  onClose,
}: AttendanceAttachmentPreviewModalProps) {
  const t = useTranslations("attendance.shared");
  const tCommon = useTranslations("common");

  const handleOpen = () => {
    if (attachment?.url) {
      window.open(attachment.url, "_blank", "noopener,noreferrer");
    }
  };

  const renderContent = () => {
    if (!attachment) return null;

    if (!attachment.url) {
      return (
        <div className="space-y-3 p-4 rounded-xl" style={{ backgroundColor: "var(--background-secondary, var(--color-neutral-50))" }}>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {t("previewUnavailable")}
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("previewUnavailableDescription")}
          </p>
          <div className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
            <div>{t("fileType")}: {attachment.type || "-"}</div>
            <div>{t("fileSize")}: {formatFileSize(attachment.size)}</div>
          </div>
        </div>
      );
    }

    if (attachment.type === "application/pdf") {
      return (
        <div className="h-[70vh] rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-color)" }}>
          <iframe src={attachment.url} title={attachment.name} className="w-full h-full border-0" />
        </div>
      );
    }

    if (attachment.type.startsWith("image/")) {
      return (
        <div className="h-[70vh] rounded-xl overflow-hidden flex items-center justify-center" style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--background)" }}>
          <object data={attachment.url} type={attachment.type} className="max-w-full max-h-full">
            <p style={{ color: "var(--text-secondary)" }}>{t("previewUnavailable")}</p>
          </object>
        </div>
      );
    }

    return (
      <div className="space-y-4 p-4 rounded-xl" style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--background)" }}>
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("previewUnavailable")}</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("openInNewTab")}</p>
        <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />} onClick={handleOpen}>
          {tCommon("open")}
        </Button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={attachment?.name || t("previewAttachment")}
      size="xl"
      footer={attachment?.url ? (
        <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />} onClick={handleOpen}>
          {tCommon("open")}
        </Button>
      ) : undefined}
    >
      {renderContent()}
    </Modal>
  );
}
