"use client";

import { useEffect, useState } from "react";
import { ImageOff, LoaderCircle, RefreshCw } from "lucide-react";
import { downloadFileBlob } from "@/services/filesService";

type ImageState =
  | { requestKey: string | null; status: "idle" | "error"; url: null }
  | { requestKey: string; status: "ready"; url: string };

export interface AuthenticatedFileImageProps {
  fileId?: string | null;
  alt: string;
  canDownload: boolean;
  unavailableLabel: string;
  retryLabel: string;
  className?: string;
}

export default function AuthenticatedFileImage({
  fileId,
  alt,
  canDownload,
  unavailableLabel,
  retryLabel,
  className = "h-12 w-12",
}: AuthenticatedFileImageProps) {
  const [state, setState] = useState<ImageState>({
    requestKey: null,
    status: "idle",
    url: null,
  });
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = fileId && canDownload ? `${fileId}:${retryCount}` : null;

  useEffect(() => {
    if (!fileId || !requestKey) return;

    let active = true;
    let objectUrl: string | null = null;

    void downloadFileBlob(fileId)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ requestKey, status: "ready", url: objectUrl });
      })
      .catch(() => {
        if (active) setState({ requestKey, status: "error", url: null });
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId, requestKey]);

  const visibleState =
    state.requestKey === requestKey
      ? state
      : requestKey
        ? { requestKey, status: "loading" as const, url: null }
        : { requestKey: null, status: "idle" as const, url: null };

  const frameClass = `relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-400 ${className}`;

  if (visibleState.status === "ready") {
    return (
      // Blob URLs are created after authenticated downloads and cannot use Next image optimization.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={visibleState.url}
        alt={alt}
        className={`${className} shrink-0 rounded-lg object-cover`}
      />
    );
  }

  if (visibleState.status === "loading") {
    return (
      <div className={frameClass} aria-label={alt} aria-busy="true">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (visibleState.status === "error") {
    return (
      <div className={`${frameClass} flex-col gap-1 p-1 text-center`}>
        <ImageOff className="h-4 w-4" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setRetryCount((current) => current + 1)}
          className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          {retryLabel}
        </button>
      </div>
    );
  }

  return (
    <div className={`${frameClass} flex-col gap-1 p-1 text-center`}>
      <ImageOff className="h-4 w-4" aria-hidden="true" />
      <span className="line-clamp-2 text-[10px]">{unavailableLabel}</span>
    </div>
  );
}
