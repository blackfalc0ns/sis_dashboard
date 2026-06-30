import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthenticatedFileImage from "../AuthenticatedFileImage";

const fileMocks = vi.hoisted(() => ({ downloadFileBlob: vi.fn() }));

vi.mock("@/services/filesService", () => fileMocks);

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

describe("AuthenticatedFileImage", () => {
  beforeEach(() => {
    fileMocks.downloadFileBlob.mockReset();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn((blob: Blob & { marker?: string }) => `blob:${blob.marker}`),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("loads a protected image and revokes its URL on unmount", async () => {
    const blob = new Blob(["image"], { type: "image/png" }) as Blob & {
      marker: string;
    };
    blob.marker = "file-1";
    fileMocks.downloadFileBlob.mockResolvedValue(blob);

    const { unmount } = render(
      <AuthenticatedFileImage
        fileId="file-1"
        alt="Reward"
        canDownload
        unavailableLabel="Unavailable"
        retryLabel="Retry"
      />,
    );

    expect(await screen.findByRole("img", { name: "Reward" })).toHaveAttribute(
      "src",
      "blob:file-1",
    );
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:file-1");
  });

  it("does not request a file without download permission", () => {
    render(
      <AuthenticatedFileImage
        fileId="file-1"
        alt="Reward"
        canDownload={false}
        unavailableLabel="Unavailable"
        retryLabel="Retry"
      />,
    );

    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(fileMocks.downloadFileBlob).not.toHaveBeenCalled();
  });

  it("shows a retry action after a failed request", async () => {
    const user = userEvent.setup();
    const blob = new Blob(["image"], { type: "image/png" }) as Blob & {
      marker: string;
    };
    blob.marker = "retry";
    fileMocks.downloadFileBlob
      .mockRejectedValueOnce(new Error("failed"))
      .mockResolvedValueOnce(blob);

    render(
      <AuthenticatedFileImage
        fileId="file-1"
        alt="Reward"
        canDownload
        unavailableLabel="Unavailable"
        retryLabel="Retry"
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("img", { name: "Reward" })).toHaveAttribute(
      "src",
      "blob:retry",
    );
  });

  it("ignores a stale response after the file changes", async () => {
    const first = deferred<Blob>();
    const second = deferred<Blob>();
    fileMocks.downloadFileBlob
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { rerender } = render(
      <AuthenticatedFileImage
        fileId="file-1"
        alt="Reward"
        canDownload
        unavailableLabel="Unavailable"
        retryLabel="Retry"
      />,
    );
    rerender(
      <AuthenticatedFileImage
        fileId="file-2"
        alt="Reward"
        canDownload
        unavailableLabel="Unavailable"
        retryLabel="Retry"
      />,
    );

    const secondBlob = new Blob(["second"]) as Blob & { marker: string };
    secondBlob.marker = "file-2";
    second.resolve(secondBlob);
    await waitFor(() =>
      expect(screen.getByRole("img", { name: "Reward" })).toHaveAttribute(
        "src",
        "blob:file-2",
      ),
    );

    const firstBlob = new Blob(["first"]) as Blob & { marker: string };
    firstBlob.marker = "file-1";
    first.resolve(firstBlob);
    await Promise.resolve();

    expect(screen.getByRole("img", { name: "Reward" })).toHaveAttribute(
      "src",
      "blob:file-2",
    );
  });
});
