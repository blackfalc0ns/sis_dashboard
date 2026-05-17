import { isApiError } from "@/lib/api-error";

function firstString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    return value.find(
      (item): item is string =>
        typeof item === "string" && Boolean(item.trim()),
    );
  }
  return undefined;
}

export function communicationErrorMessage(
  error: unknown,
  fallback = "Action failed. Please try again.",
): string {
  if (isApiError(error)) {
    const fieldMessage = firstString(Object.values(error.errors ?? {})[0]);
    return fieldMessage || error.message || fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
