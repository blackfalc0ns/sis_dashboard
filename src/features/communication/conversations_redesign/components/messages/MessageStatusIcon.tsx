import { CheckCheck, Clock } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Message status checks (WhatsApp-style)                              */
/* ------------------------------------------------------------------ */

export function MessageStatusIcon({
  deliveryStatus,
  isRead,
  isOwn,
}: {
  deliveryStatus?: string;
  isRead: boolean;
  isOwn: boolean;
}) {
  if (!isOwn) return null;

  // Pending — clock icon
  if (deliveryStatus === "pending") {
    return <Clock className="h-3.5 w-3.5" style={{ opacity: 0.6 , marginTop: "auto", marginBottom: "4px"}} />;
  }

  // Failed — red indicator
  if (deliveryStatus === "failed") {
    return (
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full mt-auto mb-1 bg-red-500 text-[8px] font-bold text-white">
        !
      </span>
    );
  }

  // Read — double blue check (override parent color)
  if (isRead) {
    return <CheckCheck className="h-4 w-4" style={{ color: "#38bdf8" ,marginTop: "auto", marginBottom: "4px"}} />;
  }

  // Sent/delivered — double check (visible on both light and dark backgrounds)
  return <CheckCheck className="h-4 w-4" style={{ opacity: 0.7 , marginTop: "auto", marginBottom: "4px"}} />;
}
