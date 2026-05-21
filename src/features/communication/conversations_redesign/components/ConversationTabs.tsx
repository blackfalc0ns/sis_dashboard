import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { DetailTab } from "@/features/communication/conversations_redesign/types";

const tabs: Array<{
  value: DetailTab;
  labelKey: "messages" | "participants" | "invites" | "joinRequests";
}> = [
  { value: "messages", labelKey: "messages" },
  { value: "participants", labelKey: "participants" },
  { value: "invites", labelKey: "invites" },
  { value: "joinRequests", labelKey: "joinRequests" },
];

export default function ConversationTabs({
  activeTab,
  labels,
  onTabChange,
}: {
  activeTab: DetailTab;
  labels: ConversationRedesignLabels;
  onTabChange: (tab: DetailTab) => void;
}) {
  return (
    <nav className="flex h-12 shrink-0 items-end gap-1 border-b border-slate-200 bg-white px-4">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
          className={`h-12 border-b-2 px-4 text-sm font-medium transition ${
            activeTab === tab.value
              ? "border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-primary"
          }`}
        >
          {labels[tab.labelKey]}
        </button>
      ))}
    </nav>
  );
}

