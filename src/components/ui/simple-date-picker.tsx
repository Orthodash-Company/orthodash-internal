'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';

interface SimpleDatePickerProps {
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

export function SimpleDatePicker({ 
  date, 
  setDate, 
  placeholder = "MM/DD/YYYY",
  disabled = false,
  minDate,
  maxDate
}: SimpleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(date ? date.getMonth() : new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(date ? date.getDate() : new Date().getDate());
  const [selectedYear, setSelectedYear] = useState(date ? date.getFullYear() : new Date().getFullYear());
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (date) {
      setInputValue(format(date, 'MM/dd/yyyy'));
      setSelectedMonth(date.getMonth());
      setSelectedDay(date.getDate());
      setSelectedYear(date.getFullYear());
    } else {
      setInputValue('');
    }
  }, [date]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
    setInputValue(format(newDate, 'MM/dd/yyyy'));
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    // Try to parse the input as a date
    if (value.length === 10) { // MM/DD/YYYY format
      const parsedDate = parse(value, 'MM/dd/yyyy', new Date());
      if (isValid(parsedDate)) {
        updateDate(parsedDate.getMonth(), parsedDate.getDate(), parsedDate.getFullYear());
      }
    }
  };

  const handleInputBlur = () => {
    // Try to parse the current input value
    if (inputValue) {
      const parsedDate = parse(inputValue, 'MM/dd/yyyy', new Date());
      if (isValid(parsedDate)) {
        updateDate(parsedDate.getMonth(), parsedDate.getDate(), parsedDate.getFullYear());
      } else {
        // Reset to current date if invalid
        setInputValue(date ? format(date, 'MM/dd/yyyy') : '');
      }
    }
  };

  const generateDays = () => {
    const maxDays = daysInMonth(selectedYear, selectedMonth);
    return Array.from({ length: maxDays }, (_, i) => i + 1);
  };

  const scrollToValue = (container: HTMLDivElement, value: number, itemHeight: number = 40) => {
    const scrollTop = (value - 1) * itemHeight;
    container.scrollTop = scrollTop;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Input Field */}
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10 cursor-pointer"
        />
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown with Scroll Wheels */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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
            
            <div className="flex gap-2 mb-4">
              {/* Month Scroll */}
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 mb-2 text-center">Month</div>
                <div className="relative h-32 overflow-hidden border border-gray-200 rounded">
                  <div className="h-16" /> {/* Top spacer */}
                  <div className="h-32 overflow-y-auto scrollbar-hide">
                    {months.map((month, index) => (
                      <div
                        key={month}
                        className={`h-8 flex items-center justify-center text-sm cursor-pointer transition-colors ${
                          index === selectedMonth 
                            ? 'text-blue-600 font-semibold bg-blue-50' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        onClick={() => updateDate(index, selectedDay, selectedYear)}
                      >
                        {month}
                      </div>
                    ))}
                  </div>
                  <div className="h-16" /> {/* Bottom spacer */}
                </div>
              </div>

              {/* Day Scroll */}
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 mb-2 text-center">Day</div>
                <div className="relative h-32 overflow-hidden border border-gray-200 rounded">
                  <div className="h-16" /> {/* Top spacer */}
                  <div className="h-32 overflow-y-auto scrollbar-hide">
                    {generateDays().map((day) => (
                      <div
                        key={day}
                        className={`h-8 flex items-center justify-center text-sm cursor-pointer transition-colors ${
                          day === selectedDay 
                            ? 'text-blue-600 font-semibold bg-blue-50' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        onClick={() => updateDate(selectedMonth, day, selectedYear)}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="h-16" /> {/* Bottom spacer */}
                </div>
              </div>

              {/* Year Scroll */}
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 mb-2 text-center">Year</div>
                <div className="relative h-32 overflow-hidden border border-gray-200 rounded">
                  <div className="h-16" /> {/* Top spacer */}
                  <div className="h-32 overflow-y-auto scrollbar-hide">
                    {years.map((year) => (
                      <div
                        key={year}
                        className={`h-8 flex items-center justify-center text-sm cursor-pointer transition-colors ${
                          year === selectedYear 
                            ? 'text-blue-600 font-semibold bg-blue-50' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        onClick={() => updateDate(selectedMonth, selectedDay, year)}
                      >
                        {year}
                      </div>
                    ))}
                  </div>
                  <div className="h-16" /> {/* Bottom spacer */}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
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
        </div>
      )}
    </div>
  );
}
