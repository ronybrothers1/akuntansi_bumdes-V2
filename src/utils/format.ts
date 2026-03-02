import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'dd MMM yyyy', { locale: id });
  } catch (e) {
    return dateString;
  }
};

export const formatMonthYear = (dateString: string): string => {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'MMMM yyyy', { locale: id });
  } catch (e) {
    return dateString;
  }
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
