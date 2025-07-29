import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats a number with null/undefined checks
 */
export function safeToFixed(value: number | null | undefined, decimals: number = 2, fallback: string = 'N/A'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return value.toFixed(decimals);
}

/**
 * Safely formats a date with null/undefined checks
 */
export function safeFormatDate(date: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return 'N/A';

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';

    return dateObj.toLocaleDateString([], options || {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Safely formats a time with null/undefined checks
 */
export function safeFormatTime(date: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return 'N/A';

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';

    return dateObj.toLocaleTimeString([], options || {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/A';
  }
}
