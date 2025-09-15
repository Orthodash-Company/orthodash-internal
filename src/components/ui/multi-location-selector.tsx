import React, { useState } from 'react';
import { Check, ChevronDown, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Location {
  id: string;
  name: string;
  isActive?: boolean;
}

interface MultiLocationSelectorProps {
  locations: Location[];
  selectedLocationIds: string[];
  onSelectionChange: (locationIds: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiLocationSelector({
  locations,
  selectedLocationIds,
  onSelectionChange,
  placeholder = "Select locations",
  className,
  disabled = false
}: MultiLocationSelectorProps) {
  const [open, setOpen] = useState(false);

  const activeLocations = locations.filter(loc => loc.isActive !== false);
  const selectedLocations = activeLocations.filter(loc => selectedLocationIds.includes(loc.id));

  const handleLocationToggle = (locationId: string) => {
    const isSelected = selectedLocationIds.includes(locationId);
    if (isSelected) {
      // Remove location
      onSelectionChange(selectedLocationIds.filter(id => id !== locationId));
    } else {
      // Add location
      onSelectionChange([...selectedLocationIds, locationId]);
    }
  };

  const handleSelectAll = () => {
    const allLocationIds = activeLocations.map(loc => loc.id);
    onSelectionChange(allLocationIds);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const getDisplayText = () => {
    if (selectedLocationIds.length === 0) {
      return placeholder;
    }
    if (selectedLocationIds.length === 1) {
      const location = activeLocations.find(loc => loc.id === selectedLocationIds[0]);
      return location?.name || placeholder;
    }
    if (selectedLocationIds.length === activeLocations.length) {
      return "All Locations";
    }
    return `${selectedLocationIds.length} locations selected`;
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between text-left font-normal",
              !selectedLocationIds.length && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{getDisplayText()}</span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select Locations</Label>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 px-2 text-xs"
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {activeLocations.map((location) => {
              const isSelected = selectedLocationIds.includes(location.id);
              return (
                <div
                  key={location.id}
                  className="flex items-center space-x-2 p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleLocationToggle(location.id)}
                >
                  <Checkbox
                    id={location.id}
                    checked={isSelected}
                    onChange={() => handleLocationToggle(location.id)}
                    className="flex-shrink-0"
                  />
                  <Label
                    htmlFor={location.id}
                    className="flex-1 cursor-pointer text-sm font-normal"
                  >
                    {location.name}
                  </Label>
                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected locations summary */}
          {selectedLocationIds.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <div className="flex flex-wrap gap-1">
                {selectedLocations.map((location) => (
                  <Badge
                    key={location.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {location.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLocationToggle(location.id);
                      }}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
