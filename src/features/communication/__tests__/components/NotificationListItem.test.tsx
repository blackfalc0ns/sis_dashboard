import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NotificationListItem from "../../components/notifications/NotificationListItem";

describe("NotificationListItem", () => {
  const onMarkReadMock = vi.fn();
  const onArchiveMock = vi.fn();
  const onViewDetailsMock = vi.fn();

  const mockNotification = {
    id: "notif-1",
    type: "announcement_published" as const,
    title: "New Announcement",
    body: "This is an announcement body",
    status: "unread" as const,
    priority: "normal" as const,
    createdAt: "2026-06-27T20:00:00.000Z",
  };

  const labels = {
    unread: "Unread",
    read: "Read",
    untitled: "Untitled",
    noBody: "No Preview",
    type: "Type",
    markRead: "Mark read",
    archive: "Archive",
    viewDetails: "View details",
  };

  it("renders notification details correctly", () => {
    render(
      <NotificationListItem
        notification={mockNotification}
        locale="en"
        labels={labels}
      />
    );

    expect(screen.getByText("New Announcement")).toBeInTheDocument();
    expect(screen.getByText("This is an announcement body")).toBeInTheDocument();
    expect(screen.getByText("Unread")).toBeInTheDocument();
  });

  it("triggers onViewDetails when clicking anywhere on the card", () => {
    render(
      <NotificationListItem
        notification={mockNotification}
        locale="en"
        labels={labels}
        onViewDetails={onViewDetailsMock}
      />
    );

    const card = screen.getByTestId("notification-card");
    fireEvent.click(card);

    expect(onViewDetailsMock).toHaveBeenCalledWith("notif-1");
  });

  it("stops propagation when clicking on action buttons", () => {
    render(
      <NotificationListItem
        notification={mockNotification}
        locale="en"
        labels={labels}
        onViewDetails={onViewDetailsMock}
        onMarkRead={onMarkReadMock}
        onArchive={onArchiveMock}
      />
    );

    onViewDetailsMock.mockClear();

    // Click "Mark read" button
    const markReadBtn = screen.getByRole("button", { name: "Mark read" });
    fireEvent.click(markReadBtn);

    expect(onMarkReadMock).toHaveBeenCalledWith("notif-1");
    expect(onViewDetailsMock).not.toHaveBeenCalled(); // No double trigger

    // Click "Archive" button
    const archiveBtn = screen.getByRole("button", { name: "Archive" });
    fireEvent.click(archiveBtn);

    expect(onArchiveMock).toHaveBeenCalledWith("notif-1");
    expect(onViewDetailsMock).not.toHaveBeenCalled(); // No double trigger
  });
});
