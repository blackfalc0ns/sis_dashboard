// FILE: src/components/admissions/TabNavigation.tsx

import React from "react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export default function TabNavigation({
  tabs,
  activeTab,
  onChange,
}: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? "border-[#036b80] text-[#036b80]"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
