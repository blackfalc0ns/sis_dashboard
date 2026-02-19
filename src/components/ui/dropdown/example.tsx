"use client";

import { User, Settings, LogOut, Mail, Bell, Calendar } from "lucide-react";
import { DropdownMenu } from "./index";

export default function DropdownExamples() {
  // Example 1: Simple dropdown with text items
  const simpleItems = [
    { label: "Option 1", value: "1" },
    { label: "Option 2", value: "2" },
    { label: "Option 3", value: "3" },
    { label: "Disabled Option", value: "4", disabled: true },
  ];

  // Example 2: Dropdown with icons
  const iconItems = [
    { label: "Profile", value: "profile", icon: <User className="w-4 h-4" /> },
    {
      label: "Settings",
      value: "settings",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      label: "Messages",
      value: "messages",
      icon: <Mail className="w-4 h-4" />,
    },
    {
      label: "Notifications",
      value: "notifications",
      icon: <Bell className="w-4 h-4" />,
    },
    {
      label: "Calendar",
      value: "calendar",
      icon: <Calendar className="w-4 h-4" />,
    },
  ];

  // Example 3: User menu dropdown
  const userMenuItems = [
    {
      label: "My Profile",
      value: "profile",
      icon: <User className="w-4 h-4" />,
      onClick: () => console.log("Navigate to profile"),
    },
    {
      label: "Settings",
      value: "settings",
      icon: <Settings className="w-4 h-4" />,
      onClick: () => console.log("Navigate to settings"),
    },
    {
      label: "Sign Out",
      value: "logout",
      icon: <LogOut className="w-4 h-4 text-red-500" />,
      onClick: () => console.log("Sign out"),
    },
  ];

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900">
        Dropdown Menu Examples
      </h1>

      {/* Example 1: Basic Dropdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Basic Dropdown</h2>
        <DropdownMenu
          items={simpleItems}
          placeholder="Choose an option"
          onSelect={(value) => console.log("Selected:", value)}
        />
      </div>

      {/* Example 2: Dropdown with Icons */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Dropdown with Icons</h2>
        <DropdownMenu
          items={iconItems}
          placeholder="Select a page"
          onSelect={(value) => console.log("Selected:", value)}
          width="w-56"
        />
      </div>

      {/* Example 3: Dropdown with Label */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Dropdown with Label</h2>
        <DropdownMenu
          label="Status"
          items={[
            { label: "Active", value: "active" },
            { label: "Pending", value: "pending" },
            { label: "Inactive", value: "inactive" },
          ]}
          onSelect={(value) => console.log("Selected:", value)}
        />
      </div>

      {/* Example 4: Right-aligned Dropdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Right-aligned Dropdown</h2>
        <div className="flex justify-end">
          <DropdownMenu
            items={iconItems}
            placeholder="Menu"
            onSelect={(value) => console.log("Selected:", value)}
          />
        </div>
      </div>

      {/* Example 5: Custom Trigger */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Custom Trigger Button</h2>
        <DropdownMenu
          trigger={
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              <User className="w-4 h-4" />
              <span>User Menu</span>
            </div>
          }
          items={userMenuItems}
          width="w-48"
        />
      </div>

      {/* Example 6: Disabled Dropdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Disabled Dropdown</h2>
        <DropdownMenu
          items={simpleItems}
          placeholder="Disabled"
          disabled={true}
        />
      </div>

      {/* Example 7: Wide Dropdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Wide Dropdown</h2>
        <DropdownMenu
          items={[
            {
              label: "Very Long Option Name That Needs More Space",
              value: "1",
            },
            { label: "Another Long Option", value: "2" },
            { label: "Short", value: "3" },
          ]}
          placeholder="Select"
          width="w-96"
        />
      </div>
    </div>
  );
}
