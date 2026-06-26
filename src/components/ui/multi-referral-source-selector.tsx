import { useState } from "react";
import { Check, ChevronDown, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MultiReferralSourceSelectorProps {
  sources: string[];
  selectedSources: string[];
  onSelectionChange: (sources: string[]) => void;
  className?: string;
  disabled?: boolean;
}

export function MultiReferralSourceSelector({
  sources,
  selectedSources,
  onSelectionChange,
  className,
  disabled = false,
}: MultiReferralSourceSelectorProps) {
  const [open, setOpen] = useState(false);
  const options = Array.from(new Set([...sources, ...selectedSources]))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const toggleSource = (source: string) => {
    onSelectionChange(
      selectedSources.includes(source)
        ? selectedSources.filter((selected) => selected !== source)
        : [...selectedSources, source],
    );
  };

  const displayText = selectedSources.length === 0
    ? "All referral sources"
    : selectedSources.length === 1
      ? selectedSources[0]
      : `${selectedSources.length} referral sources`;

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white text-left font-normal"
            disabled={disabled}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{displayText}</span>
            </span>
            <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="flex items-center justify-between border-b p-3">
            <Label className="text-sm font-medium">Select Referral Sources</Label>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onSelectionChange(options)}
                disabled={options.length === 0}
              >
                Select all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onSelectionChange([])}
              >
                Clear filter
              </Button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                No referral sources are available for this period.
              </p>
            ) : (
              options.map((source) => {
                const isSelected = selectedSources.includes(source);
                return (
                  <button
                    key={source}
                    type="button"
                    className="flex w-full items-center gap-2 p-3 text-left hover:bg-gray-50"
                    onClick={() => toggleSource(source)}
                  >
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                    <span className="flex-1 text-sm">{source}</span>
                    {isSelected && <Check className="h-4 w-4 flex-shrink-0 text-blue-600" />}
                  </button>
                );
              })
            )}
          </div>

          {selectedSources.length > 0 && (
            <div className="border-t bg-gray-50 p-3">
              <div className="flex flex-wrap gap-1">
                {selectedSources.map((source) => (
                  <Badge key={source} variant="secondary" className="text-xs">
                    {source}
                    <button
                      type="button"
                      aria-label={`Remove ${source}`}
                      className="ml-1 rounded-full p-0.5 hover:bg-gray-300"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSource(source);
                      }}
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
