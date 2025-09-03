import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';

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
  // Convert Date to YYYY-MM-DD format for HTML date input
  const dateValue = date ? date.toISOString().split('T')[0] : '';
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const newDate = new Date(value);
      setDate(newDate);
    } else {
      setDate(undefined);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-xs text-gray-600">{label}</Label>
      )}
      <div className="relative">
        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          type="date"
          value={dateValue}
          onChange={handleDateChange}
          disabled={disabled}
          className={`h-8 text-sm pl-10 ${className || ''}`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
