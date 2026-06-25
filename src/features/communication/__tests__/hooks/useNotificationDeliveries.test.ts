import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let getNotificationDeliveriesMock: ReturnType<typeof vi.fn>;

vi.mock("@/features/communication/api/communication.service", () => ({
  getNotificationDeliveries: (...args: unknown[]) =>
    getNotificationDeliveriesMock(...args),
}));

import { useNotificationDeliveries } from "@/features/communication/hooks/useNotificationDeliveries";

describe("useNotificationDeliveries", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getNotificationDeliveriesMock = vi
      .fn()
      .mockResolvedValue({ items: [], total: 0 });
  });

  it("does not create a polling interval", async () => {
    const setIntervalSpy = vi.spyOn(window, "setInterval");

    renderHook(() => useNotificationDeliveries());

    await waitFor(() =>
      expect(getNotificationDeliveriesMock).toHaveBeenCalledTimes(1),
    );
    expect(
      setIntervalSpy.mock.calls.some(([, delay]) => delay === 60_000),
    ).toBe(false);
  });
});
