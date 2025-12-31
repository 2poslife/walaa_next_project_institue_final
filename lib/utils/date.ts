/**
 * Date utility functions
 * These functions format dates in local timezone to avoid UTC conversion issues
 */

/**
 * Format a Date object as YYYY-MM-DD in local timezone
 * This avoids timezone conversion issues when using toISOString()
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date formatted as YYYY-MM-DD in local timezone
 */
export function getTodayLocalDate(): string {
  return formatLocalDate(new Date());
}

/**
 * Get the first day of a month formatted as YYYY-MM-DD
 */
export function getFirstDayOfMonth(year: number, month: number): string {
  return formatLocalDate(new Date(year, month - 1, 1));
}

/**
 * Get the last day of a month formatted as YYYY-MM-DD
 */
export function getLastDayOfMonth(year: number, month: number): string {
  return formatLocalDate(new Date(year, month, 0));
}

