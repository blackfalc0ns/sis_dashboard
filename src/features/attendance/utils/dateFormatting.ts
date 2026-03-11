/**
 * Date Formatting Utilities
 * 
 * Provides safe date formatting functions that avoid timezone issues
 * when working with local school dates.
 */

/**
 * Format a Date object to local date string (YYYY-MM-DD)
 * Avoids timezone issues by using local date components
 * 
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a local date string (YYYY-MM-DD) to Date object
 * Sets time to midnight local time
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object at midnight local time
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get today's date as local date string (YYYY-MM-DD)
 * 
 * @returns Today's date in YYYY-MM-DD format
 */
export function getTodayLocalDate(): string {
  return formatLocalDate(new Date());
}

/**
 * Check if a date string is valid (YYYY-MM-DD format)
 * 
 * @param dateStr - Date string to validate
 * @returns True if valid date string
 */
export function isValidLocalDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  
  const date = parseLocalDate(dateStr);
  return !isNaN(date.getTime());
}
