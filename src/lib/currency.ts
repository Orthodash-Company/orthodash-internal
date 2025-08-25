// Currency formatting utilities for dollar inputs

export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[,$]/g, '')) : value;
  if (isNaN(numValue)) return '';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

export const parseCurrency = (value: string): number => {
  const cleanValue = value.replace(/[,$]/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatCurrencyInput = (value: string): string => {
  // Remove all non-numeric characters except decimal point
  const cleanValue = value.replace(/[^0-9.]/g, '');
  
  // Handle multiple decimal points
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    const beforeDecimal = parts[0];
    const afterDecimal = parts.slice(1).join('').substring(0, 2);
    return afterDecimal ? `${beforeDecimal}.${afterDecimal}` : beforeDecimal;
  }
  
  // Limit decimal places to 2
  if (parts.length === 2) {
    parts[1] = parts[1].substring(0, 2);
  }
  
  const result = parts.join('.');
  const numValue = parseFloat(result);
  
  if (isNaN(numValue) || result === '') return '';
  
  // Format with commas for display
  const formatted = formatCurrency(numValue);
  return formatted;
};