import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface CompactDateInputProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CompactDateInput({ 
  date, 
  setDate, 
  label,
  placeholder = "Select date",
  className,
  disabled = false
}: CompactDateInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize input value when date changes
  useEffect(() => {
    if (date) {
      setInputValue(format(date, 'dd/MM/yyyy'));
    } else {
      setInputValue('');
    }
  }, [date]);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);

    // Parse the input value
    if (inputValue.trim()) {
      const parts = inputValue.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);

        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const newDate = new Date(year, month, day);
          if (newDate.toString() !== 'Invalid Date') {
            setDate(newDate);
            return;
          }
        }
      }
    }

    // If parsing failed, reset to original date
    if (date) {
      setInputValue(format(date, 'dd/MM/yyyy'));
    } else {
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      if (date) {
        setInputValue(format(date, 'dd/MM/yyyy'));
      } else {
        setInputValue('');
      }
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {label && (
          <Label className="text-xs text-gray-600">{label}</Label>
        )}
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder="DD/MM/YYYY"
          className={`h-8 text-sm ${className || ''}`}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-xs text-gray-600">{label}</Label>
      )}
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={disabled}
        className={`h-8 px-3 text-sm justify-start font-normal ${className || ''}`}
      >
        <CalendarIcon className="mr-2 h-3 w-3 text-gray-400" />
        {date ? format(date, 'dd/MM/yyyy') : placeholder}
      </Button>
    </div>
  );
}
