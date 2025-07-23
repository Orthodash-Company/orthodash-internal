import React, { useState, useEffect } from 'react';
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
  const [displayValue, setDisplayValue] = useState<string>('');

  // Update display value when prop value changes
  useEffect(() => {
    if (value === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatCurrencyInput(value.toString()));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (inputValue === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    // Format the input and update display
    const formatted = formatCurrencyInput(inputValue);
    setDisplayValue(formatted);
    
    // Parse and send numeric value to parent
    const numericValue = parseCurrency(formatted);
    onChange(numericValue);
  };

  const handleBlur = () => {
    // Ensure proper formatting on blur
    if (displayValue && !isNaN(parseCurrency(displayValue))) {
      const formatted = formatCurrencyInput(displayValue);
      setDisplayValue(formatted);
    }
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
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
};