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
          // Don't close if clicking on trigger or calendar elements
          const target = e.target as Element;
          if (target.closest('[data-date-picker-trigger]') || target.closest('.rdp')) {
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
            console.log('Date picker - date selected:', selectedDate);
            if (selectedDate) {
              setDate(selectedDate);
              // Add small delay to ensure the selection is processed
              setTimeout(() => setOpen(false), 150);
            }
          }}
          className="rounded-md border-0"
          disabled={false}
          captionLayout="dropdown-buttons"
          fromYear={2020}
          toYear={2030}
        />
      </PopoverContent>
    </Popover>
  );
}
