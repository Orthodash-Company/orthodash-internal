'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface ScrollDatePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const daysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export function ScrollDatePicker({ 
  date, 
  setDate, 
  placeholder = "Select date",
  disabled = false,
  minDate,
  maxDate
}: ScrollDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(date ? date.getMonth() : new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(date ? date.getDate() : new Date().getDate());
  const [selectedYear, setSelectedYear] = useState(date ? date.getFullYear() : new Date().getFullYear());
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);
  
  const monthRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (date) {
      setSelectedMonth(date.getMonth());
      setSelectedDay(date.getDate());
      setSelectedYear(date.getFullYear());
    }
  }, [date]);

  const updateDate = (month: number, day: number, year: number) => {
    const maxDays = daysInMonth(year, month);
    const adjustedDay = Math.min(day, maxDays);
    
    const newDate = new Date(year, month, adjustedDay);
    
    // Validate against min/max dates
    if (minDate && newDate < minDate) return;
    if (maxDate && newDate > maxDate) return;
    
    setDate(newDate);
    setSelectedMonth(month);
    setSelectedDay(adjustedDay);
    setSelectedYear(year);
  };

  const scrollToCenter = (ref: React.RefObject<HTMLDivElement>, index: number) => {
    if (ref.current) {
      const itemHeight = 40; // Height of each scroll item
      const containerHeight = 128; // Updated height of visible container (h-32 = 128px)
      const scrollTop = (index * itemHeight) - (containerHeight / 2) + (itemHeight / 2);
      ref.current.scrollTop = scrollTop;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToCenter(monthRef, selectedMonth);
        scrollToCenter(dayRef, selectedDay - 1);
        scrollToCenter(yearRef, years.indexOf(selectedYear));
      }, 100);
    }
  }, [isOpen, selectedMonth, selectedDay, selectedYear]);

  const handleMonthChange = (month: number) => {
    updateDate(month, selectedDay, selectedYear);
  };

  const handleDayChange = (day: number) => {
    updateDate(selectedMonth, day, selectedYear);
  };

  const handleYearChange = (year: number) => {
    updateDate(selectedMonth, selectedDay, year);
  };

  const generateDays = () => {
    const maxDays = daysInMonth(selectedYear, selectedMonth);
    return Array.from({ length: maxDays }, (_, i) => i + 1);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${!date && 'text-muted-foreground'}`}
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {date ? format(date, 'MM/dd/yyyy') : placeholder}
          <ChevronDown className="ml-auto h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[9999]" 
        align="center"
        side="bottom"
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={16}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Select Date</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date();
                updateDate(today.getMonth(), today.getDate(), today.getFullYear());
              }}
            >
              Today
            </Button>
          </div>
          
          <div className="flex gap-2">
            {/* Month Scroll */}
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 mb-2 text-center">Month</div>
              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 h-10 bg-blue-50 border-y border-blue-200 -translate-y-1/2 pointer-events-none rounded" />
                <div 
                  ref={monthRef}
                  className="h-32 overflow-y-auto scrollbar-hide"
                  style={{ scrollSnapType: 'y mandatory' }}
                >
                  <div className="h-8" /> {/* Reduced spacer */}
                  {months.map((month, index) => (
                    <div
                      key={month}
                      className={`h-10 flex items-center justify-center text-sm cursor-pointer transition-colors scroll-snap-align-center ${
                        index === selectedMonth 
                          ? 'text-blue-600 font-semibold' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => handleMonthChange(index)}
                    >
                      {month}
                    </div>
                  ))}
                  <div className="h-8" /> {/* Reduced spacer */}
                </div>
              </div>
            </div>

            {/* Day Scroll */}
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 mb-2 text-center">Day</div>
              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 h-10 bg-blue-50 border-y border-blue-200 -translate-y-1/2 pointer-events-none rounded" />
                <div 
                  ref={dayRef}
                  className="h-32 overflow-y-auto scrollbar-hide"
                  style={{ scrollSnapType: 'y mandatory' }}
                >
                  <div className="h-8" /> {/* Reduced spacer */}
                  {generateDays().map((day) => (
                    <div
                      key={day}
                      className={`h-10 flex items-center justify-center text-sm cursor-pointer transition-colors scroll-snap-align-center ${
                        day === selectedDay 
                          ? 'text-blue-600 font-semibold' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => handleDayChange(day)}
                    >
                      {day}
                    </div>
                  ))}
                  <div className="h-8" /> {/* Reduced spacer */}
                </div>
              </div>
            </div>

            {/* Year Scroll */}
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 mb-2 text-center">Year</div>
              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 h-10 bg-blue-50 border-y border-blue-200 -translate-y-1/2 pointer-events-none rounded" />
                <div 
                  ref={yearRef}
                  className="h-32 overflow-y-auto scrollbar-hide"
                  style={{ scrollSnapType: 'y mandatory' }}
                >
                  <div className="h-8" /> {/* Reduced spacer */}
                  {years.map((year) => (
                    <div
                      key={year}
                      className={`h-10 flex items-center justify-center text-sm cursor-pointer transition-colors scroll-snap-align-center ${
                        year === selectedYear 
                          ? 'text-blue-600 font-semibold' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => handleYearChange(year)}
                    >
                      {year}
                    </div>
                  ))}
                  <div className="h-8" /> {/* Reduced spacer */}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
