import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ date, setDate, placeholder = "Pick a date", className }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal cursor-pointer",
            !date && "text-muted-foreground",
            className
          )}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
        className="w-auto p-0 z-[9999] bg-white shadow-lg border" 
        align="start"
        side="bottom"
        sideOffset={8}
        onInteractOutside={(e) => {
          // Don't close if clicking on calendar elements or navigation
          const target = e.target as Element;
          if (target.closest('[data-date-picker-trigger]') || 
              target.closest('.rdp') || 
              target.closest('[role="button"]') ||
              target.closest('.rdp-nav') ||
              target.closest('.rdp-button') ||
              target.closest('.rdp-day') ||
              target.closest('.rdp-dropdown')) {
            e.preventDefault();
            return;
          }
          setTimeout(() => setOpen(false), 10);
        }}
        onEscapeKeyDown={() => setOpen(false)}
        avoidCollisions={false}
        sticky="always"
        onPointerDownOutside={(e) => {
          const target = e.target as Element;
          if (target.closest('[data-date-picker-trigger]') || 
              target.closest('.rdp') ||
              target.closest('.rdp-day') ||
              target.closest('.rdp-nav') ||
              target.closest('.rdp-dropdown')) {
            e.preventDefault();
          }
        }}
        onFocusOutside={(e) => {
          const target = e.target as Element;
          if (target.closest('[data-date-picker-trigger]') || target.closest('.rdp')) {
            e.preventDefault();
          }
        }}
      >
        <div className="p-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              console.log('Date picker - date selected:', selectedDate);
              if (selectedDate) {
                setDate(selectedDate);
                // Delayed close for better mobile experience
                setTimeout(() => {
                  setOpen(false);
                }, 200);
              }
            }}
            className="rounded-md border-0"
            disabled={false}
            captionLayout="dropdown-buttons"
            fromYear={2020}
            toYear={2030}

          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
