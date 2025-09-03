import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Calendar } from 'lucide-react';
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
  const [showCalendar, setShowCalendar] = useState(false);
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

  const handleCalendarClick = () => {
    if (!disabled) {
      setShowCalendar(!showCalendar);
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

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const newDate = new Date(value);
      setDate(newDate);
      setShowCalendar(false);
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
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleClick}
          disabled={disabled}
          className={`h-8 px-3 text-sm justify-start font-normal flex-1 ${className || ''}`}
        >
          <CalendarIcon className="mr-2 h-3 w-3 text-gray-400" />
          {date ? format(date, 'dd/MM/yyyy') : placeholder}
        </Button>
        <Button
          variant="outline"
          onClick={handleCalendarClick}
          disabled={disabled}
          className="h-8 px-2 text-sm"
          title="Open calendar picker"
        >
          <Calendar className="h-3 w-3" />
        </Button>
      </div>
      
      {/* HTML Calendar Picker */}
      {showCalendar && (
        <div className="mt-2">
          <Input
            type="date"
            value={date ? date.toISOString().split('T')[0] : ''}
            onChange={handleCalendarChange}
            className="h-8 text-sm"
          />
        </div>
      )}
    </div>
  );
}
