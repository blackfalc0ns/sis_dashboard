"use client";

interface PanelResizeHandleProps {
  onResizeStart: () => void;
  ariaLabel: string;
  isRTL?: boolean;
}

export default function PanelResizeHandle({
  onResizeStart,
  ariaLabel,
  isRTL = false,
}: PanelResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-label={ariaLabel}
      aria-orientation="vertical"
      tabIndex={0}
      onPointerDown={(e) => {
        e.preventDefault();
        onResizeStart();
      }}
      onKeyDown={(e) => {
        // Allow keyboard resize with arrow keys
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          // Could implement keyboard resize here
        }
      }}
      className={`
        relative w-1 bg-transparent hover:bg-primary/20 active:bg-primary/30
        cursor-col-resize transition-colors group
        flex-shrink-0
      `}
      style={{
        touchAction: "none",
      }}
    >
      {/* Wider hit area */}
      <div className="absolute inset-y-0 -inset-x-2" />
      
      {/* Visual indicator on hover */}
      <div
        className={`
          absolute inset-y-0 ${isRTL ? "right-0" : "left-0"}
          w-1 bg-primary/0 group-hover:bg-primary/40 group-active:bg-primary/60
          transition-colors
        `}
      />
    </div>
  );
}
