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
  const formatDateForInput = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      const newDate = new Date(year, month - 1, day);
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
        value={date ? formatDateForInput(date) : ''}
        onChange={handleCalendarChange}
        disabled={disabled}
        className={`h-8 text-sm ${className || ''}`}
        placeholder={placeholder}
      />
    </div>
  );
}
