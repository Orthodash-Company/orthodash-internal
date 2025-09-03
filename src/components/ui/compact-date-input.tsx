import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const newDate = new Date(value);
      setDate(newDate);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-xs text-gray-600">{label}</Label>
      )}
      <Input
        type="date"
        value={date ? date.toISOString().split('T')[0] : ''}
        onChange={handleCalendarChange}
        disabled={disabled}
        className={`h-8 text-sm ${className || ''}`}
        placeholder={placeholder}
      />
    </div>
  );
}
