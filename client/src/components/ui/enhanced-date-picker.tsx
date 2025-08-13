import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EnhancedDatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function EnhancedDatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className
}: EnhancedDatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          data-date-picker-trigger
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Enhanced date picker trigger clicked, current open state:', open);
            setOpen(!open);
          }}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-50" 
        align="start"
        side="bottom"
        sideOffset={5}
        onInteractOutside={(e) => {
          // Don't close if clicking on trigger or other calendar elements
          const target = e.target as Element;
          if (target.closest('[role="button"]') || target.closest('.rdp')) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={() => setOpen(false)}
        avoidCollisions={true}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            console.log('Enhanced date picker - date selected:', selectedDate);
            if (selectedDate) {
              onDateChange(selectedDate);
              // Add small delay to ensure the selection is processed
              setTimeout(() => setOpen(false), 150);
            }
          }}
          disabled={false}
          captionLayout="dropdown-buttons"
          fromYear={2020}
          toYear={2030}
          className="rounded-md border-0"
        />
      </PopoverContent>
    </Popover>
  );
}