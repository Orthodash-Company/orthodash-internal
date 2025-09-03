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
  const [showCalendar, setShowCalendar] = useState(false);

  const handleCalendarClick = () => {
    if (!disabled) {
      setShowCalendar(!showCalendar);
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

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-xs text-gray-600">{label}</Label>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleCalendarClick}
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
