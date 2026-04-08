
/**
 * Utility functions for the trade form components
 */

// Format a number as currency
export const formatCurrency = (value: number | null): string => {
  if (value === null) return "-";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

// Format a number as percentage
export const formatPercent = (value: number | null): string => {
  if (value === null) return "-";
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

// Handle numeric input with decimal validation
export const handleNumericInput = (value: string, onChange: (value: string) => void) => {
  // Allow empty string, digits, and one decimal point
  // Updated regex to properly handle decimal numbers
  const numericRegex = /^(\d*\.?\d*)$/;
  
  if (value === '' || numericRegex.test(value)) {
    onChange(value);
  }
};

// Get display name for a token
export const getTokenDisplay = (selectedToken: string, availableTokens: any[]) => {
  if (!selectedToken) return "Select token";
  const token = availableTokens.find(t => t.id === selectedToken);
  return token ? `${token.name} (${token.symbol})` : "Select token";
};
