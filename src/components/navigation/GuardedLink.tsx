"use client";

import { useRouter } from "next/navigation";
import { useNavigationGuard } from "@/providers/NavigationGuardProvider";
import React from "react";

interface GuardedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  replace?: boolean;
  prefetch?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  disabled?: boolean;
  title?: string;
}

/**
 * Guarded navigation link that checks for unsaved changes before navigating
 * Use this instead of next/link in dashboard navigation
 * 
 * @example
 * <GuardedLink href="/dashboard/academics">
 *   Academics
 * </GuardedLink>
 */
export default function GuardedLink({
  href,
  children,
  className,
  replace = false,
  prefetch,
  onClick,
  disabled = false,
  title,
}: GuardedLinkProps) {
  const router = useRouter();
  const { guardedNavigate } = useNavigationGuard();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (disabled) return;
    
    // Call custom onClick if provided
    onClick?.(e);
    
    // Guard the navigation
    guardedNavigate(() => {
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    });
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      title={title}
      aria-disabled={disabled}
      style={{ cursor: disabled ? "not-allowed" : "pointer" }}
    >
      {children}
    </a>
  );
}
