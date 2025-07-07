import { format, parseISO, isValid, differenceInDays, startOfDay, endOfDay } from 'date-fns';
import { CURRENCY, DATE_FORMATS, TIME_PERIODS } from './constants';

// Date & Time Utilities
export const formatDate = (date, formatString = DATE_FORMATS.DISPLAY) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, formatString) : '';
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const formatDateTime = (date) => {
  return formatDate(date, DATE_FORMATS.DISPLAY_WITH_TIME);
};

export const formatTimeAgo = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const diffInDays = differenceInDays(now, dateObj);
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  } catch (error) {
    console.error('Error calculating time ago:', error);
    return '';
  }
};

export const getDateRange = (period) => {
  const now = new Date();
  const today = startOfDay(now);
  
  switch (period) {
    case TIME_PERIODS.TODAY:
      return { start: today, end: endOfDay(now) };
    
    case TIME_PERIODS.YESTERDAY:
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: endOfDay(yesterday) };
    
    case TIME_PERIODS.THIS_WEEK:
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      return { start: thisWeekStart, end: endOfDay(now) };
    
    case TIME_PERIODS.LAST_WEEK:
      const lastWeekEnd = new Date(today);
      lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
      return { start: startOfDay(lastWeekStart), end: endOfDay(lastWeekEnd) };
    
    case TIME_PERIODS.THIS_MONTH:
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: thisMonthStart, end: endOfDay(now) };
    
    case TIME_PERIODS.LAST_MONTH:
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: lastMonthStart, end: endOfDay(lastMonthEnd) };
    
    default:
      return { start: today, end: endOfDay(now) };
  }
};

//