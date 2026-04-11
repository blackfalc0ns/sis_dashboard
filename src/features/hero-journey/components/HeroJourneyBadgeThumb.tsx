"use client";

import { useState } from "react";
import Image from "next/image";
import { Award } from "lucide-react";
import { useLocale } from "next-intl";
import type { HeroJourneyBadge } from "../types";
import {
  getHeroJourneyBadgeAssetPath,
  getHeroJourneyBadgePlaceholderPath,
} from "../utils/badgeAssetRegistry";

interface HeroJourneyBadgeThumbProps {
  badge?: HeroJourneyBadge | null;
  size?: "sm" | "md";
  showLabel?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

const imageSizes = {
  sm: 32,
  md: 40,
};

export default function HeroJourneyBadgeThumb({
  badge,
  size = "sm",
  showLabel = false,
}: HeroJourneyBadgeThumbProps) {
  const locale = useLocale();
  const placeholder = getHeroJourneyBadgePlaceholderPath();
  const [failedBadgeSlugs, setFailedBadgeSlugs] = useState<
    Record<string, boolean>
  >({});
  const slug = badge?.slug || "";
  const source =
    slug && failedBadgeSlugs[slug]
      ? placeholder
      : getHeroJourneyBadgeAssetPath(slug);

  const label =
    locale === "ar" ? badge?.nameAr || "شارة" : badge?.nameEn || "Badge";

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`inline-flex ${sizeClasses[size]} items-center justify-center overflow-hidden rounded-xl`}
      >
        {badge ? (
          <Image
            src={source}
            alt={label}
            width={imageSizes[size]}
            height={imageSizes[size]}
            className="h-full w-full object-cover"
            onError={() =>
              setFailedBadgeSlugs((current) => ({
                ...current,
                [slug]: true,
              }))
            }
          />
        ) : (
          <Award className="h-4 w-4 text-teal-600" />
        )}
      </div>
      {showLabel ? (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      ) : null}
    </div>
  );
}
