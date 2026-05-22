import { type MouseEvent, useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { formatFileSize } from "@/features/communication/conversations_redesign/utils/formatters";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { MessageAttachment } from "@/features/communication/types/message.types";

export function AttachmentCard({
  attachment,
  canDelete,
  isOwn,
  labels,
  onDelete,
}: {
  attachment: MessageAttachment;
  canDelete: boolean;
  isOwn: boolean;
  labels: ConversationRedesignLabels;
  onDelete: () => Promise<unknown>;
}) {
  const file = attachment.file;
  const name =
    attachment.name ||
    file?.originalName ||
    file?.filename ||
    (file as Record<string, unknown> | undefined)?.displayName as string ||
    attachment.url?.split("/").pop() ||
    labels.attachment;
  const size = formatFileSize(
    attachment.size ||
    file?.size ||
    (file as Record<string, unknown> | undefined)?.sizeBytes as string | undefined,
  );
  const fileId = attachment.fileId || file?.id;
  const href = attachment.url || file?.url || (fileId ? `${process.env.NEXT_PUBLIC_API_URL || "https://api.moazez.sa/api/v1"}/files/${fileId}/download` : undefined);
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (
      typeof window !== "undefined" &&
      !window.confirm(labels.deleteAttachmentConfirm)
    )
      return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const content = (
    <div
      className={`flex items-center gap-3 rounded-lg p-3 mb-2 ${
        isOwn ? "bg-primary-700/50" : "bg-slate-100"
      }`}
    >
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${isOwn ? "bg-primary-400" : "bg-white"}`}
      >
        <FileText
          className={`h-5 w-5 ${isOwn ? "text-white" : "text-primary"}`}
        />
      </span>
      <span className="max-w-[150px]">
        <span className="block truncate text-sm font-bold">{name}</span>
        {size ? <span className="block text-xs opacity-85">{size}</span> : null}
      </span>
      {fileId ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void handleDownload();
          }}
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${
            isOwn
              ? "text-white/80 hover:bg-white/10"
              : "text-primary hover:bg-primary/10"
          }`}
          aria-label="Download"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          onClick={(event) => void handleDelete(event)}
          disabled={isDeleting}
          className={`ms-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition disabled:opacity-60 ${
            isOwn
              ? "text-white/80 hover:bg-white/10"
              : "text-rose-700 hover:bg-rose-50"
          }`}
          aria-label={labels.deleteAttachmentConfirm}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );

  const handleDownload = async () => {
    if (!fileId) return;
    try {
      const { apiClient: client } = await import("@/lib/api");
      // Fetch the file as a blob (axios follows the 307 redirect to S3)
      const response = await client.get(`/files/${fileId}/download`, {
        responseType: "blob",
      });
      // Create a download link from the blob
      const blob = new Blob([response.data as BlobPart]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open the URL directly (might work for public files)
      if (href) window.open(href, "_blank");
    }
  };

  return content;
}
