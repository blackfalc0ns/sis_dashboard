import { useRouter } from "next/navigation";
import { useNavigationGuard } from "@/providers/NavigationGuardProvider";
import { useCallback } from "react";

/**
 * Hook that provides guarded router methods
 * Use this instead of useRouter() when you need programmatic navigation
 * 
 * @example
 * const router = useGuardedRouter();
 * 
 * // All navigation is guarded
 * router.push("/dashboard/academics");
 * router.replace("/dashboard/calendar");
 * router.back();
 */
export function useGuardedRouter() {
  const router = useRouter();
  const { guardedNavigate } = useNavigationGuard();

  const push = useCallback(
    (href: string) => {
      guardedNavigate(() => router.push(href));
    },
    [guardedNavigate, router]
  );

  const replace = useCallback(
    (href: string) => {
      guardedNavigate(() => router.replace(href));
    },
    [guardedNavigate, router]
  );

  const back = useCallback(() => {
    guardedNavigate(() => router.back());
  }, [guardedNavigate, router]);

  return {
    push,
    replace,
    back,
    // Pass through other router methods that don't need guarding
    refresh: router.refresh,
    prefetch: router.prefetch,
    forward: router.forward,
  };
}
