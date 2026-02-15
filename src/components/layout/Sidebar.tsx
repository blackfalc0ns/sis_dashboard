"use client";

import { bottomItems, menuItems } from "@/config/navigation";
import { Building2, Menu, ChevronLeft, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

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
  const isArabic =
    typeof document !== "undefined" && document.documentElement.lang === "ar";
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  // Auto-expand parent if current route is a child
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) => {
          const childHref = isArabic ? child.href_ar : child.href_en;
          return pathname === childHref;
        });
        if (isChildActive) {
          setExpandedItems((prev) => {
            if (!prev.includes(item.key)) {
              return [...prev, item.key];
            }
            return prev;
          });
        }
      }
    });
  }, [pathname, isArabic]);

  const handleItemClick = (key: string) => {
    onSelect?.(key);
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
        return pathname === childHref;
      });
    }
    return false;
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
        className={`
          fixed z-50 h-screen bg-white flex flex-col transition-all duration-300 ease-in-out
          ${isRTL ? "right-0 border-l" : "left-0 border-r"} border-gray-200
          ${isOpen ? "translate-x-0" : isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isOpen ? "w-[240px] p-2" : "w-[240px]  lg:w-20 lg:px-3"}
        `}
      >
        {/* Desktop Toggle Button */}
        <button
          onClick={onToggle}
          className={`hidden lg:block p-2 rounded-lg text-gray-700 hover:bg-[#036b80] hover:text-white transition-colors border-[#036b80] border-2 mt-2 ${
            isRTL ? "ml-2 mr-auto" : "ml-auto mr-2"
          }`}
        >
          {isOpen ? (
            <ChevronLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
        {/* Logo Section */}
        <div className="px-6 py-6 flex items-center justify-center">
          {isOpen && (
            <div className="text-[#036b80] font-bold text-3xl tracking-tight flex items-center justify-center">
              <Image
                src="/images/logo/moazzez_logo.svg"
                alt="Logo"
                width={100}
                height={20}
                priority
              />
            </div>
          )}
        </div>

        {/* School Selector */}
        {isOpen && (
          <div className="mb-6">
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-white">
              <div className="w-10 h-10 rounded-full bg-[#036b80] flex items-center justify-center shrink-0">
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

        {/* Navigation Menu */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item);
              const isExpanded = expandedItems.includes(item.key);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.key}>
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
                      className={`
                        w-full flex items-center gap-3 rounded-[6px]
                        transition-all duration-200 
                        ${isOpen ? "px-4 py-3" : "px-3 py-3 justify-center"}
                        ${
                          isActive
                            ? "bg-[#036b80] text-white shadow-sm"
                            : "text-gray-700 hover:bg-teal-50 hover:text-[#036b80]"
                        }
                      ${isArabic ? "text-right" : "text-left"}`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-[#A4B4CB]"}`}
                      />
                      {isOpen && (
                        <>
                          <span className="font-semibold text-[15px] flex-1">
                            {isArabic ? item.label_ar : item.label_en}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={isArabic ? item.href_ar : item.href_en}
                      onClick={() => handleItemClick(item.key)}
                      title={
                        !isOpen
                          ? isArabic
                            ? item.label_ar
                            : item.label_en
                          : undefined
                      }
                      className={`
                        w-full flex items-center gap-3 rounded-[6px]
                        transition-all duration-200 text-left
                        ${isOpen ? "px-4 py-3" : "px-3 py-3 justify-center"}
                        ${
                          isActive
                            ? "bg-[#036b80] text-white shadow-sm"
                            : "text-gray-700 hover:bg-teal-50 hover:text-[#036b80]"
                        }
                      `}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-[#A4B4CB]"}`}
                      />
                      {isOpen && (
                        <span className="font-semibold text-[16px]">
                          {isArabic ? item.label_ar : item.label_en}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Children Items */}
                  {hasChildren && isExpanded && isOpen && (
                    <div
                      className={`relative mt-1 space-y-1 ${isArabic ? "mr-6" : "ml-6"} before:content-[''] before:absolute before:w-[2px] before:h-full before:top-0 before:bg-[#036b80]`}
                    >
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const childHref = isArabic
                          ? child.href_ar
                          : child.href_en;
                        const isChildActive = pathname === childHref;

                        return (
                          <Link
                            key={child.key}
                            href={childHref}
                            onClick={() => handleItemClick(child.key)}
                            className={`
                              w-full flex items-center gap-3 rounded-[6px]
                              transition-all duration-200 px-4 py-2.5
                              ${isArabic ? "text-right" : "text-left"}
                              ${
                                isChildActive
                                  ? "bg-teal-50 text-[#036b80] font-semibold"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              }
                            `}
                          >
                            <ChildIcon className="w-4 h-4 shrink-0" />
                            <span className="text-xs flex-1">
                              {isArabic ? child.label_ar : child.label_en}
                            </span>
                            {child.badge &&
                              (() => {
                                const count = child.badge();
                                if (count === 0) return null;

                                // Use amber badge for decisions (waitlisted), blue for others
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
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="pb-6 space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                href={isArabic ? item.href_ar : item.href_en}
                key={item.key}
                onClick={() => handleItemClick(item.key)}
                title={
                  !isOpen
                    ? isArabic
                      ? item.label_ar
                      : item.label_en
                    : undefined
                }
                className={`
                  w-full flex items-center gap-3 rounded-xl text-gray-500 
                  hover:bg-gray-50 hover:text-gray-700 transition-all duration-200 text-left
                  ${isOpen ? "px-4 py-3" : "px-3 py-3 justify-center"}
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {isOpen && (
                  <span className="font-medium text-sm">
                    {isArabic ? item.label_ar : item.label_en}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
