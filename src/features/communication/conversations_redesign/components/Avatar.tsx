"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

export default function Avatar({
  avatarUrl,
  fileId,
  name,
  online,
  size = "md",
}: {
  avatarUrl?: string;
  fileId?: string;
  name?: string;
  online?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(avatarUrl);

  // Fetch avatar from fileId with auth
  useEffect(() => {
    if (avatarUrl) {
      setResolvedUrl(avatarUrl);
      return;
    }
    if (!fileId) {
      setResolvedUrl(undefined);
      return;
    }

    let revoked = false;
    void apiClient
      .get(`/api/files/${fileId}/download`, {
        baseURL: "",
        responseType: "blob",
      })
      .then((response) => {
        if (revoked) return;
        const blob = new Blob([response.data as BlobPart]);
        setResolvedUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (!revoked) setResolvedUrl(undefined);
      });

    return () => {
      revoked = true;
    };
  }, [avatarUrl, fileId]);

  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-11 w-11 text-sm",
  };

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-100 to-primary-300 font-bold text-primary-900 ${sizes[size]}`}
      style={
        resolvedUrl
          ? {
              backgroundImage: `url("${resolvedUrl}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : undefined
      }
      aria-hidden="true"
    >
      {!resolvedUrl ? initials(name) : null}
      {online ? (
        <span className="absolute bottom-0 end-0 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        </span>
      ) : null}
    </div>
  );
}


function initials(name?: string | null) {
  const source = name?.trim() || "?";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
