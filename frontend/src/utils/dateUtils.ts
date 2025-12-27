/**
 * Date utility functions for consistent formatting across the application
 * Enforces DD/MM/YY format and Asia/Kolkata timezone
 */

// Default timezone for the application
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';
export const DEFAULT_DATE_FORMAT = 'DD/MM/YY';

/**
 * Format a date to DD/MM/YY format in Asia/Kolkata timezone
 */
export const formatDate = (date: string | Date, includeTime: boolean = false): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Create formatter for Asia/Kolkata timezone
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: DEFAULT_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    });

    if (includeTime) {
      return formatter.format(dateObj).replace(',', '');
    } else {
      const parts = formatter.formatToParts(dateObj);
      const day = parts.find(part => part.type === 'day')?.value;
      const month = parts.find(part => part.type === 'month')?.value;
      const year = parts.find(part => part.type === 'year')?.value;
      
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a timestamp to include both date and time
 */
export const formatDateTime = (timestamp: string | Date): string => {
  return formatDate(timestamp, true);
};

/**
 * Get current date in DD/MM/YY format for Asia/Kolkata timezone
 */
export const getCurrentDate = (): string => {
  return formatDate(new Date());
};

/**
 * Get current date and time for Asia/Kolkata timezone
 */
export const getCurrentDateTime = (): string => {
  return formatDateTime(new Date());
};

/**
 * Convert a date to Asia/Kolkata timezone
 */
export const toKolkataTime = (date: string | Date): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Get the time in Asia/Kolkata timezone
  const kolkataTime = new Date(dateObj.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE }));
  
  return kolkataTime;
};

/**
 * Check if a date is today in Asia/Kolkata timezone
 */
export const isToday = (date: string | Date): boolean => {
  const today = getCurrentDate();
  const checkDate = formatDate(date);
  return today === checkDate;
};

/**
 * Check if a date is yesterday in Asia/Kolkata timezone
 */
export const isYesterday = (date: string | Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = formatDate(yesterday);
  const checkDate = formatDate(date);
  return yesterdayFormatted === checkDate;
};

/**
 * Get relative date string (Today, Yesterday, or formatted date)
 */
export const getRelativeDateString = (date: string | Date): string => {
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return formatDate(date);
  }
};