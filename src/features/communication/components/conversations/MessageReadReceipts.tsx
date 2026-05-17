import type { ReadSummaryState } from "@/features/communication/hooks/useConversationMessages";

export interface MessageReadReceiptsProps {
  readSummary?: ReadSummaryState;
  labels: {
    read: string;
    unread: string;
  };
}

export default function MessageReadReceipts({
  labels,
  readSummary,
}: MessageReadReceiptsProps) {
  if (
    typeof readSummary?.readCount !== "number" &&
    typeof readSummary?.unreadCount !== "number"
  ) {
    return null;
  }

  return (
    <div className="text-xs text-slate-500">
      {typeof readSummary.readCount === "number" ? (
        <span>
          {labels.read}: {readSummary.readCount}
        </span>
      ) : null}
      {typeof readSummary.readCount === "number" &&
      typeof readSummary.unreadCount === "number" ? (
        <span className="mx-1">•</span>
      ) : null}
      {typeof readSummary.unreadCount === "number" ? (
        <span>
          {labels.unread}: {readSummary.unreadCount}
        </span>
      ) : null}
    </div>
  );
}
