import React from 'react';
import { Input } from '@/components/ui/input';
import { formatCurrencyInput, parseCurrency } from '@/lib/currency';

interface CurrencyInputProps {
  value?: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value = 0,
  onChange,
  placeholder = "0.00",
  className = "",
  id,
  disabled = false
}) => {
  const displayValue = value === 0 ? '' : formatCurrencyInput(value.toString())

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (inputValue === '') {
      onChange(0);
      return;
    }

    // Format the input and update display
    const formatted = formatCurrencyInput(inputValue);
    
    // Parse and send numeric value to parent
    const numericValue = parseCurrency(formatted);
    onChange(numericValue);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-2 text-gray-400 z-10">$</span>
      <Input
        id={id}
        type="text"
        className={`pl-8 ${className}`}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
};
