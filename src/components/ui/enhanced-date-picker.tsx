import { useState, useRef, useEffect } from "react";
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal hover:bg-gray-50 transition-colors border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              !date && "text-gray-500",
              className
            )}
            disabled={disabled}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
            {date ? format(date, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 z-[9999] bg-white shadow-2xl border border-gray-200 rounded-xl overflow-hidden" 
          align="start"
          side="bottom"
          sideOffset={8}
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
          <div className="p-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  onDateChange(selectedDate);
                  setTimeout(() => {
                    setOpen(false);
                  }, 200);
                }
              }}
              disabled={false}
              captionLayout="dropdown"
              fromYear={2020}
              toYear={2030}
              className="rounded-lg border-0"
              classNames={{
                months: "flex flex-col space-y-4",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center mb-4",
                caption_label: "text-base font-semibold text-gray-900",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center justify-center"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex mb-2",
                head_cell: "text-gray-500 rounded-md w-10 font-medium text-sm text-center",
                row: "flex w-full mt-1",
                cell: cn(
                  "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                ),
                day: cn(
                  "h-10 w-10 p-0 font-normal aria-selected:opacity-100 cursor-pointer hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
                ),
                day_range_end: "day-range-end",
                day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white font-medium",
                day_today: "bg-blue-100 text-blue-900 font-semibold",
                day_outside: "text-gray-400 aria-selected:bg-gray-100 aria-selected:text-gray-600",
                day_disabled: "text-gray-300 opacity-50 cursor-not-allowed",
                day_range_middle: "aria-selected:bg-blue-100 aria-selected:text-blue-700",
                day_hidden: "invisible",
                dropdown: "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                dropdown_month: "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                dropdown_year: "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}