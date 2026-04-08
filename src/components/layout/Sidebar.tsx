"use client";

import { bottomItems, menuItems } from "@/config/navigation";
import {
  Building2,
  Menu,
  ChevronLeft,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import GuardedLink from "@/components/navigation/GuardedLink";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { usePermissions, type PermissionKey } from "@/hooks/usePermissions";

interface SidebarProps {
  activeItem?: string;
  onSelect?: (item: string) => void;
  schoolName?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  isRTL?: boolean;
}

export default function Sidebar({
  onSelect,
  schoolName = "School Name",
  isOpen = true,
  onToggle,
  isRTL = false,
}: SidebarProps) {
  const t = useTranslations("sidebar");
  const pathname = usePathname();
  const { hasPermission } = usePermissions();
  const isArabic = pathname.startsWith("/ar");
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const visibleMenuItems = useMemo(
    () =>
      menuItems
        .map((item) => {
          if (item.key !== "settings" || !item.children) {
            return item;
          }

          const permissionByChild: Record<string, PermissionKey> = {
            "settings-overview": "settings.overview.view",
            "settings-branding": "settings.branding.view",
            "settings-users": "settings.users.view",
            "settings-roles": "settings.roles.view",
            "settings-policies": "settings.policies.view",
            "settings-admissions-documents":
              "settings.admissionsDocuments.view",
            "settings-templates": "settings.templates.view",
            "settings-integrations": "settings.integrations.view",
            "settings-security": "settings.security.view",
            "settings-backup": "settings.backup.view",
          };

          const nextChildren = item.children.filter((child) => {
            const permission = permissionByChild[child.key];
            return permission ? hasPermission(permission) : true;
          });

          return {
            ...item,
            children: nextChildren,
          };
        })
        .filter((item) => !item.children || item.children.length > 0),
    [hasPermission],
  );

  // Clear pending state when pathname changes (navigation complete)
  useEffect(() => {
    if (pendingHref !== null) {
      setPendingHref(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Auto-expand parent if current route is a child or grandchild
  useEffect(() => {
    visibleMenuItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) => {
          const childHref = isArabic ? child.href_ar : child.href_en;
          if (pathname === childHref) return true;

          // Check grandchildren
          if (child.children) {
            return child.children.some((grandchild) => {
              const grandchildHref = isArabic
                ? grandchild.href_ar
                : grandchild.href_en;
              return pathname === grandchildHref;
            });
          }
          return false;
        });

        if (isChildActive) {
          setExpandedItems((prev) => {
            const newExpanded = [...prev];
            if (!newExpanded.includes(item.key)) {
              newExpanded.push(item.key);
            }

            // Also expand the child if a grandchild is active
            item.children!.forEach((child) => {
              if (child.children) {
                const isGrandchildActive = child.children.some((grandchild) => {
                  const grandchildHref = isArabic
                    ? grandchild.href_ar
                    : grandchild.href_en;
                  return pathname === grandchildHref;
                });
                if (isGrandchildActive && !newExpanded.includes(child.key)) {
                  newExpanded.push(child.key);
                }
              }
            });

            return newExpanded;
          });
        }
      }
    });
  }, [pathname, isArabic, visibleMenuItems]);

  const handleItemClick = (key: string) => {
    onSelect?.(key);
  };

  const handleNavigationStart = (href: string) => {
    // Set pending state only when navigation actually starts
    setPendingHref(href);
  };

  const toggleExpand = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const isItemActive = (item: (typeof menuItems)[0]) => {
    const itemHref = isArabic ? item.href_ar : item.href_en;
    if (pathname === itemHref) return true;

    if (item.children) {
      return item.children.some((child) => {
        const childHref = isArabic ? child.href_ar : child.href_en;
        if (pathname === childHref) return true;

        // Check grandchildren
        if (child.children) {
          return child.children.some((grandchild) => {
            const grandchildHref = isArabic
              ? grandchild.href_ar
              : grandchild.href_en;
            return pathname === grandchildHref;
          });
        }
        return false;
      });
    }
    return false;
  };

  const getVariantClasses = (
    variant?: "default" | "highlight",
    options?: { active?: boolean; pending?: boolean; backgroundImage?: string },
  ) => {
    if (options?.backgroundImage) {
      if (options?.active || options?.pending) {
        return "text-white border border-white/35 ring-1 ring-white/25 shadow-md";
      }
      return "text-white border border-white/20 hover:text-white hover:brightness-110";
    }

    if (options?.active || options?.pending) {
      return "";
    }

    if (variant !== "highlight") {
      return "";
    }

    return "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15";
  };

  const getVariantStyle = (options?: {
    active?: boolean;
    pending?: boolean;
    backgroundImage?: string;
  }): CSSProperties | undefined => {
    const locale = isArabic ? "ar" : "en";
    if (!options?.backgroundImage) {
      return undefined;
    }

    const overlayStrength = options.active || options.pending ? 0.28 : 0.5;

    return {
      backgroundImage: `linear-gradient(${locale === "ar" ? "-90deg" : "90deg"}, rgba(15, 23, 42, ${overlayStrength}) 0%, rgba(15, 23, 42, 0.24) 42%, rgba(15, 23, 42, 0.05) 100%), url(${options.backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  };

  return (
    <>
      {/* Mobile Overlay - only on small screens when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-50 h-screen bg-white flex flex-col transition-all duration-300 ease-in-out
      ${isRTL ? "right-0 border-l" : "left-0 border-r"} border-gray-200
      ${isOpen ? "translate-x-0" : isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"}
      ${isOpen ? "w-[260px] max-w-[80vw]" : "lg:w-20 lg:px-3"}`}
      >
        {/* Toggle Button (fixed top) */}
        <button
          onClick={onToggle}
          className={`hidden lg:block p-2 rounded-lg text-gray-700 hover:bg-primary hover:text-white transition-colors border-primary border-2 mt-2 shrink-0 ${
            isRTL ? "ml-2 mr-auto" : "ml-auto mr-2"
          }`}
        >
          {isOpen ? (
            <ChevronLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {/* Logo Section (fixed top) */}
        <div className="px-4 py-6 flex items-center justify-center shrink-0">
          <div className="text-primary font-bold text-3xl tracking-tight flex items-center justify-center">
            <Image
              src="/images/logo/moazzez_logo.svg"
              alt="Logo"
              width={isOpen ? 120 : 40}
              height={isOpen ? 30 : 40}
              priority
              className="transition-all duration-300"
            />
          </div>
        </div>

        {/* School Selector (fixed top) */}
        {isOpen && (
          <div className="mb-6 shrink-0 p-2">
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-white">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">
                  {t("school")}
                </p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {schoolName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* âœ… Scrollable Menu Only */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 sidebar-scroll">
          <nav className="space-y-1 pb-4">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isHeroJourneyItem = item.key === "hero-journey";

              const isActive = isItemActive(item);
              const isExpanded = expandedItems.includes(item.key);
              const hasChildren = item.children && item.children.length > 0;
              const itemVariantClasses = getVariantClasses(item.buttonVariant, {
                active: isActive,
                backgroundImage: item.buttonBackgroundImage,
              });
              const itemVariantStyle = getVariantStyle({
                active: isActive,
                backgroundImage: item.buttonBackgroundImage,
              });
              const isHighlighted =
                item.buttonVariant === "highlight" &&
                !isActive &&
                !item.buttonBackgroundImage;
              const hasImageBackground = Boolean(item.buttonBackgroundImage);

              return (
                <div key={item.key} className="px-2">
                  {/* Parent Item */}
                  {hasChildren ? (
                    <button
                      onClick={(e) => {
                        if (isOpen) {
                          toggleExpand(item.key, e);
                        } else {
                          // When collapsed, clicking opens sidebar and expands
                          onToggle?.();
                          setTimeout(() => {
                            setExpandedItems((prev) => [...prev, item.key]);
                          }, 100);
                        }
                      }}
                      title={
                        !isOpen
                          ? isArabic
                            ? item.label_ar
                            : item.label_en
                          : undefined
                      }
                      className={`w-full flex items-center gap-3 rounded-[6px] transition-all duration-200 ${
                        isOpen ? "px-4 py-3" : "px-3 py-3 justify-center"
                      } ${
                        isActive
                          ? item.buttonBackgroundImage
                            ? "text-white shadow-sm"
                            : "bg-primary text-white shadow-sm"
                          : "text-gray-700 hover:bg-teal-50 hover:text-primary"
                      } ${isArabic ? "text-right" : "text-left"} ${itemVariantClasses}`}
                      style={itemVariantStyle}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive
                            ? "text-white"
                            : hasImageBackground
                              ? "text-white"
                              : isHighlighted
                                ? "text-primary"
                                : "text-[#A4B4CB]"
                        }`}
                      />
                      {isOpen && (
                        <>
                          <span className="font-semibold text-[15px] flex-1 truncate">
                            {isArabic ? item.label_ar : item.label_en}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform shrink-0 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </>
                      )}
                    </button>
                  ) : (
                    <GuardedLink
                      href={isArabic ? item.href_ar : item.href_en}
                      onClick={() => handleItemClick(item.key)}
                      onNavigationStart={() =>
                        handleNavigationStart(
                          isArabic ? item.href_ar : item.href_en,
                        )
                      }
                      prefetch
                      title={
                        !isOpen
                          ? isArabic
                            ? item.label_ar
                            : item.label_en
                          : undefined
                      }
                      className={`w-full flex items-center gap-3 rounded-[6px] transition-all duration-200 text-left ${
                        isOpen ? "px-4 py-3" : "px-3 py-3 justify-center"
                      } ${
                        isActive ||
                        pendingHref === (isArabic ? item.href_ar : item.href_en)
                          ? item.buttonBackgroundImage
                            ? "text-white shadow-sm"
                            : "bg-primary text-white shadow-sm"
                          : "text-gray-700 hover:bg-teal-50 hover:text-primary"
                      } ${getVariantClasses(item.buttonVariant, {
                        active: isActive,
                        pending:
                          pendingHref ===
                          (isArabic ? item.href_ar : item.href_en),
                        backgroundImage: item.buttonBackgroundImage,
                      })} ${isHeroJourneyItem ? "h-27.5" : ""}`}
                      style={getVariantStyle({
                        active: isActive,
                        pending:
                          pendingHref ===
                          (isArabic ? item.href_ar : item.href_en),
                        backgroundImage: item.buttonBackgroundImage,
                      })}
                    >
                      {!isHeroJourneyItem && (
                        <Icon
                          className={`w-5 h-5 shrink-0 ${
                            isActive ||
                            pendingHref ===
                              (isArabic ? item.href_ar : item.href_en)
                              ? "text-white"
                              : item.buttonBackgroundImage
                                ? "text-white"
                                : item.buttonVariant === "highlight"
                                  ? "text-primary"
                                  : "text-[#A4B4CB]"
                          }`}
                        />
                      )}
                      {isOpen && (
                        <>
                          <span className="font-semibold text-[16px] truncate">
                            {isArabic ? item.label_ar : item.label_en}
                          </span>
                          {pendingHref ===
                            (isArabic ? item.href_ar : item.href_en) && (
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          )}
                        </>
                      )}
                    </GuardedLink>
                  )}

                  {/* Children Items */}
                  {hasChildren && isExpanded && isOpen && (
                    <div
                      className={`relative mt-1 space-y-1 ${
                        isArabic ? "mr-6" : "ml-6"
                      } before:content-[''] before:absolute before:w-[2px] before:h-full before:top-0 before:bg-primary`}
                    >
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const childHref = isArabic
                          ? child.href_ar
                          : child.href_en;
                        const isChildActive = pathname === childHref;
                        const hasGrandchildren =
                          child.children && child.children.length > 0;
                        const isChildExpanded = expandedItems.includes(
                          child.key,
                        );

                        return (
                          <div key={child.key}>
                            {/* Child Item */}
                            {hasGrandchildren ? (
                              <button
                                onClick={(e) => toggleExpand(child.key, e)}
                                className={`w-full flex items-center gap-3 rounded-[6px] transition-all duration-200 px-4 py-2.5 ${
                                  isArabic ? "text-right" : "text-left"
                                } ${
                                  isChildActive
                                    ? "bg-teal-50 text-primary font-semibold"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                              >
                                <ChildIcon className="w-4 h-4 shrink-0" />
                                <span className="text-sm flex-1 truncate">
                                  {isArabic ? child.label_ar : child.label_en}
                                </span>
                                <ChevronDown
                                  className={`w-3 h-3 transition-transform shrink-0 ${
                                    isChildExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            ) : (
                              <GuardedLink
                                href={childHref}
                                onClick={() => handleItemClick(child.key)}
                                onNavigationStart={() =>
                                  handleNavigationStart(childHref)
                                }
                                prefetch
                                className={`w-full flex items-center gap-3 rounded-[6px] transition-all duration-200 px-4 py-2.5 ${
                                  isArabic ? "text-right" : "text-left"
                                } ${
                                  isChildActive || pendingHref === childHref
                                    ? "bg-teal-50 text-primary font-semibold"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                              >
                                <ChildIcon className="w-4 h-4 shrink-0" />
                                <span className="text-sm flex-1 truncate">
                                  {isArabic ? child.label_ar : child.label_en}
                                </span>
                                {pendingHref === childHref && (
                                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                )}
                                {child.badge &&
                                  (() => {
                                    const count = child.badge();
                                    if (count === 0) return null;

                                    const badgeClass =
                                      child.key === "admissions-decisions"
                                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                                        : "bg-blue-100 text-blue-700 border border-blue-200";

                                    return (
                                      <span
                                        className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${badgeClass}`}
                                      >
                                        {count > 99 ? "99+" : count}
                                      </span>
                                    );
                                  })()}
                              </GuardedLink>
                            )}

                            {/* Grandchildren Items */}
                            {hasGrandchildren && isChildExpanded && (
                              <div
                                className={`relative mt-1 space-y-1 ${
                                  isArabic ? "mr-4" : "ml-4"
                                }`}
                              >
                                {child.children!.map((grandchild) => {
                                  const GrandchildIcon = grandchild.icon;
                                  const grandchildHref = isArabic
                                    ? grandchild.href_ar
                                    : grandchild.href_en;
                                  const isGrandchildActive =
                                    pathname === grandchildHref;

                                  return (
                                    <GuardedLink
                                      key={grandchild.key}
                                      href={grandchildHref}
                                      onClick={() =>
                                        handleItemClick(grandchild.key)
                                      }
                                      onNavigationStart={() =>
                                        handleNavigationStart(grandchildHref)
                                      }
                                      prefetch
                                      className={`w-full flex items-center gap-2 rounded-[6px] transition-all duration-200 px-3 py-2 ${
                                        isArabic ? "text-right" : "text-left"
                                      } ${
                                        isGrandchildActive ||
                                        pendingHref === grandchildHref
                                          ? "bg-teal-50 text-primary font-semibold"
                                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                      }`}
                                    >
                                      <GrandchildIcon className="w-3.5 h-3.5 shrink-0" />
                                      <span className="text-xs truncate">
                                        {isArabic
                                          ? grandchild.label_ar
                                          : grandchild.label_en}
                                      </span>
                                      {pendingHref === grandchildHref && (
                                        <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                      )}
                                    </GuardedLink>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* âœ… Bottom Section Ø«Ø§Ø¨Øª ØªØ­Øª */}
        <div className="pb-6 space-y-1 shrink-0 border-t border-gray-100 pt-3">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const itemHref = isArabic ? item.href_ar : item.href_en;
            const isPendingItem = pendingHref === itemHref;
            const itemVariantClasses = getVariantClasses(item.buttonVariant, {
              pending: isPendingItem,
              backgroundImage: item.buttonBackgroundImage,
            });
            const itemVariantStyle = getVariantStyle({
              pending: isPendingItem,
              backgroundImage: item.buttonBackgroundImage,
            });

            return (
              <GuardedLink
                href={itemHref}
                key={item.key}
                onClick={() => handleItemClick(item.key)}
                onNavigationStart={() => handleNavigationStart(itemHref)}
                prefetch
                title={
                  !isOpen
                    ? isArabic
                      ? item.label_ar
                      : item.label_en
                    : undefined
                }
                className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 text-left ${
                  isOpen ? "px-4 py-3" : "px-3 py-3 justify-center"
                } ${
                  isPendingItem
                    ? item.buttonBackgroundImage
                      ? "text-white shadow-sm"
                      : "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                } ${itemVariantClasses}`}
                style={itemVariantStyle}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    item.buttonBackgroundImage && !isPendingItem
                      ? "text-white"
                      : item.buttonVariant === "highlight" && !isPendingItem
                        ? "text-primary"
                        : ""
                  }`}
                />
                {isOpen && (
                  <>
                    <span className="font-medium text-sm truncate">
                      {isArabic ? item.label_ar : item.label_en}
                    </span>
                    {isPendingItem && (
                      <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                    )}
                  </>
                )}
              </GuardedLink>
            );
          })}
        </div>
      </aside>
    </>
  );
}
