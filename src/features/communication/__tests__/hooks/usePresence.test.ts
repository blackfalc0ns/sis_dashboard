import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePresence } from "@/features/communication/hooks/usePresence";

describe("usePresence", () => {
  it("maps backend online state without treating updatedAt as last seen", () => {
    const { result } = renderHook(() => usePresence());

    act(() => {
      result.current.handlePresenceUpdated({
        userId: "user-1",
        status: "online",
        online: true,
        updatedAt: "2026-07-26T10:00:00.000Z",
      });
    });

    expect(result.current.presenceByUserId["user-1"]).toEqual({
      userId: "user-1",
      status: "online",
      isOnline: true,
    });
  });
});
