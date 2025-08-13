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
            // Add small delay to ensure proper mobile touch handling
            setTimeout(() => setOpen(!open), 50);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[99999] bg-white shadow-lg border" 
        align="start"
        side="bottom"
        sideOffset={8}
        onInteractOutside={(e) => {
          // More aggressive prevention for modal compatibility
          const target = e.target as Element;
          if (target.closest('[data-date-picker-trigger]') || 
              target.closest('.rdp') || 
              target.closest('[role="button"]') ||
              target.closest('.rdp-nav') ||
              target.closest('.rdp-button') ||
              target.closest('.rdp-day') ||
              target.closest('.rdp-dropdown') ||
              target.closest('[role="dialog"]') ||
              target.closest('.dialog-content')) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          // Only close if genuinely outside
          setTimeout(() => setOpen(false), 10);
        }}
        onEscapeKeyDown={() => setOpen(false)}
        avoidCollisions={true}
        sticky="always"
        onPointerDownOutside={(e) => {
          const target = e.target as Element;
          if (target.closest('[data-date-picker-trigger]') || 
              target.closest('.rdp') ||
              target.closest('.rdp-day') ||
              target.closest('.rdp-nav') ||
              target.closest('.rdp-dropdown') ||
              target.closest('[role="dialog"]')) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onFocusOutside={(e) => {
          const target = e.target as Element;
          if (target.closest('[data-date-picker-trigger]') || 
              target.closest('.rdp') ||
              target.closest('[role="dialog"]')) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <div className="p-3" onClick={(e) => e.stopPropagation()}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              console.log('Enhanced date picker - date selected:', selectedDate);
              if (selectedDate) {
                onDateChange(selectedDate);
                // Delayed close for better mobile experience
                setTimeout(() => {
                  setOpen(false);
                }, 200);
              }
            }}
            disabled={false}
            captionLayout="dropdown-buttons"
            fromYear={2020}
            toYear={2030}
            className="rounded-md border-0 calendar"
            onDayClick={(day, modifiers, e) => {
              // Prevent event bubbling to modal
              e?.stopPropagation?.();
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}