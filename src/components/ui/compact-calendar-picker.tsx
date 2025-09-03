import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

interface CompactCalendarPickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export function CompactCalendarPicker({ 
  date, 
  setDate, 
  placeholder = "Pick a date", 
  className,
  disabled = false,
  minDate,
  maxDate
}: CompactCalendarPickerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        const target = event.target as Element;
        if (!target.closest('.rdp') && !target.closest('[data-radix-popper-content-wrapper]')) {
          setOpen(false);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant={"outline"}
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal cursor-pointer hover:bg-gray-50 transition-colors border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "min-h-[36px] px-3 py-2 text-sm",
              !date && "text-gray-500",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!disabled) {
                setOpen(!open);
              }
            }}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">
              {date ? format(date, "MMM d, yyyy") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 z-[9999] bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden" 
          align="start"
          side="bottom"
          sideOffset={4}
          alignOffset={0}
          avoidCollisions={true}
          collisionPadding={16}
          onEscapeKeyDown={() => setOpen(false)}
          onInteractOutside={(e) => {
            const target = e.target as Element;
            if (!target.closest('.rdp') && !target.closest('[data-radix-popper-content-wrapper]')) {
              setOpen(false);
            }
          }}
        >
          <div className="p-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  setDate(selectedDate);
                  setTimeout(() => {
                    setOpen(false);
                  }, 150);
                }
              }}
              disabled={disabled}
              fromDate={minDate}
              toDate={maxDate}
              className="rounded-md border-0"
              classNames={{
                months: "flex flex-col space-y-2",
                month: "space-y-2",
                caption: "flex justify-center pt-1 relative items-center mb-2",
                caption_label: "text-sm font-semibold text-gray-900",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-6 w-6 bg-transparent p-0 opacity-60 hover:opacity-100 hover:bg-gray-100 rounded-md transition-all duration-200 flex items-center justify-center"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex mb-1",
                head_cell: "text-gray-500 rounded-md w-7 font-medium text-xs text-center",
                row: "flex w-full mt-1",
                cell: cn(
                  "relative p-0 text-center text-sm focus-within:relative focus-within:z-20"
                ),
                day: cn(
                  "h-7 w-7 p-0 font-normal aria-selected:opacity-100 cursor-pointer hover:bg-blue-50 hover:text-blue-700 rounded-md transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500 flex items-center justify-center text-xs"
                ),
                day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white font-medium",
                day_today: "bg-blue-100 text-blue-900 font-semibold",
                day_outside: "text-gray-400",
                day_disabled: "text-gray-300 opacity-50 cursor-not-allowed",
                day_hidden: "invisible",
              }}
              fixedWeeks
              showOutsideDays={false}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
