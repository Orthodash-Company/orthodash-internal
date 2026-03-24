import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CompactDateInput } from "@/components/ui/compact-date-input";
import { MultiLocationSelector } from "@/components/ui/multi-location-selector";
import { PeriodColumn } from "./PeriodColumn";
import { CompactCostManager } from "../costs/CompactCostManager";
import { Plus, X, Edit3, Calendar, MapPin, Save, Minus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { PeriodConfig, Location, CompactCost } from "@/shared/types";
import type { PeriodQuery } from "@/lib/period-summary";

interface PeriodDraft {
  startDate?: Date;
  endDate?: Date;
  locationId: string;
  locationIds: string[];
}

interface HorizontalFixedColumnLayoutProps {
  periods: PeriodConfig[];
  locations: Location[];
  periodQueries: PeriodQuery[];
  onAddPeriod: (period: Omit<PeriodConfig, 'id'>) => PeriodConfig | void;
  onRemovePeriod: (periodId: string) => void;
  onUpdatePeriod: (periodId: string, updates: Partial<PeriodConfig>) => void;
  onRetryPeriod?: (periodId: string) => void;
  onRefreshPeriod?: (periodId: string) => void;
}

export function HorizontalFixedColumnLayout({
  periods,
  locations,
  periodQueries,
  onAddPeriod,
  onRemovePeriod,
  onUpdatePeriod,
  onRetryPeriod,
  onRefreshPeriod,
}: HorizontalFixedColumnLayoutProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [editingPeriods, setEditingPeriods] = useState<Set<string>>(new Set());
  const [editingTitles, setEditingTitles] = useState<Set<string>>(new Set());
  const [periodDrafts, setPeriodDrafts] = useState<Record<string, PeriodDraft>>({});
  const [periodCosts, setPeriodCosts] = useState<Record<string, CompactCost[]>>({});
  const [newPeriodId, setNewPeriodId] = useState<string | null>(null);

  // Scroll to the new period after the DOM has updated
  useEffect(() => {
    if (!newPeriodId) return;
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(`period-${newPeriodId}`);
      el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [newPeriodId]);

  const createDraftFromPeriod = (period: PeriodConfig): PeriodDraft => ({
    startDate: period.startDate ? new Date(period.startDate) : undefined,
    endDate: period.endDate ? new Date(period.endDate) : undefined,
    locationId: period.locationId,
    locationIds: [...(period.locationIds || [])],
  });

  const setPeriodEditing = (period: PeriodConfig, isEditing: boolean) => {
    setEditingPeriods((prev) => {
      const next = new Set(prev);
      if (isEditing) {
        next.add(period.id);
      } else {
        next.delete(period.id);
      }
      return next;
    });

    setPeriodDrafts((prev) => ({
      ...(isEditing ? prev : Object.fromEntries(Object.entries(prev).filter(([id]) => id !== period.id))),
      ...(isEditing ? { [period.id]: createDraftFromPeriod(period) } : {}),
    }));
  };

  const updatePeriodDraft = (periodId: string, updates: Partial<PeriodDraft>) => {
    setPeriodDrafts((prev) => {
      const current = prev[periodId];
      if (!current) return prev;
      return {
        ...prev,
        [periodId]: {
          ...current,
          ...updates,
        },
      };
    });
  };

  const getLocationSummary = (period: PeriodConfig) => {
    const selectedIds = (period.locationIds || []).filter(Boolean);

    if (selectedIds.length === 0 || selectedIds.length === locations.length) {
      return "All Locations";
    }

    if (selectedIds.length === 1) {
      return locations.find((loc) => loc.id.toString() === selectedIds[0])?.name || "All Locations";
    }

    return `${selectedIds.length} locations`;
  };

  // Handle direct period addition
  const handleDirectAddPeriod = () => {
    const nextPeriodLetter = String.fromCharCode(65 + periods.length);
    const newPeriod: Omit<PeriodConfig, 'id'> = {
      name: `Period ${nextPeriodLetter}`,
      title: `Period ${nextPeriodLetter}`,
      locationId: 'all',
      locationIds: [],
      startDate: undefined,
      endDate: undefined,
      visualizations: []
    };
    const createdPeriod = onAddPeriod(newPeriod);
    if (createdPeriod) {
      setPeriodEditing(createdPeriod, true);
      setNewPeriodId(createdPeriod.id);
      setTimeout(() => setNewPeriodId(null), 600);
    }
  };

  // Handle costs update for a period
  const handleCostsUpdate = (periodId: string, costs: CompactCost[]) => {
    setPeriodCosts(prev => ({
      ...prev,
      [periodId]: costs
    }));
  };

  // Get total costs for a period
  const getPeriodTotalCosts = (periodId: string) => {
    const costs = periodCosts[periodId] || [];
    return costs.reduce((sum, cost) => sum + cost.amount, 0);
  };

  return (
    <div className="relative">

      {/* Period Navigation - Mobile Only */}
      <div className="lg:hidden mb-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Analytics Periods ({periods.length})
              </CardTitle>
              <Button
                size="sm"
                className="h-8 px-3"
                onClick={handleDirectAddPeriod}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {periods.map((period, index) => {
                const location = locations.find(l => l.id.toString() === period.locationId);
                return (
                  <div key={period.id} className="flex-shrink-0">
                    <Badge
                      variant={index === 0 ? "default" : "secondary"}
                      className="cursor-pointer text-xs px-2 py-1"
                      onClick={() => {
                        // Scroll to corresponding period column
                        const periodElement = document.getElementById(`period-${period.id}`);
                        if (periodElement) {
                          periodElement.scrollIntoView({ 
                            behavior: 'smooth', 
                            inline: 'center',
                            block: 'nearest'
                          });
                        }
                      }}
                    >
                      {period.title}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Horizontal Scrolling Container with Fixed Height */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto overflow-y-hidden pb-4 snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          height: 'calc(100vh - 200px)',
          minHeight: '600px'
        }}
      >
        {periods.map((period, index) => {
          const query = periodQueries[index];
          const periodCostsList = periodCosts[period.id] || [];
          const periodDraft = periodDrafts[period.id] || createDraftFromPeriod(period);
          const hasInvalidDateRange = Boolean(
            periodDraft.startDate &&
            periodDraft.endDate &&
            periodDraft.endDate < periodDraft.startDate
          );
          
          return (
            <div
              key={period.id}
              id={`period-${period.id}`}
              className={`group/card flex-shrink-0 snap-center overflow-hidden ${newPeriodId === period.id ? 'animate-in slide-in-from-right-4 duration-300' : ''}`}
              style={{
                width: 'calc(100vw - 2rem)',
                maxWidth: '420px',
                height: '100%'
              }}
            >
              <Card className="h-full border border-[#1C1F4F]/10 shadow-sm transition-shadow duration-200 hover:shadow-md">
                {/* Period Header */}
                <CardHeader className="pb-3 space-y-0 sticky top-0 bg-white z-10 border-b border-[#1C1F4F]/5">
                  <div className="flex items-center justify-between">
                    {/* Title — click to rename */}
                    <div className="flex items-center gap-2 min-w-0">
                      {editingTitles.has(period.id) ? (
                        <input
                          autoFocus
                          className="text-base font-semibold text-[#1C1F4F] border-b border-[#1C1F4F] bg-transparent outline-none w-40"
                          defaultValue={period.title}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val) onUpdatePeriod(period.id, { title: val, name: val });
                            setEditingTitles((prev) => { const next = new Set(prev); next.delete(period.id); return next; });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                            if (e.key === 'Escape') {
                              setEditingTitles((prev) => { const next = new Set(prev); next.delete(period.id); return next; });
                            }
                          }}
                        />
                      ) : (
                        <CardTitle
                          className="text-base font-semibold text-[#1C1F4F] cursor-pointer hover:text-[#1C1F4F]/60 transition-colors truncate"
                          onClick={() => setEditingTitles((prev) => new Set(prev).add(period.id))}
                          title="Click to rename"
                        >
                          {period.title}
                        </CardTitle>
                      )}
                    </div>

                    {/* Action buttons — fade in on card hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-150">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 w-7 p-0 transition-colors ${editingPeriods.has(period.id) ? 'text-[#1C1F4F] bg-[#1C1F4F]/8' : 'text-[#1C1F4F]/30 hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/5'}`}
                        onClick={() => setPeriodEditing(period, !editingPeriods.has(period.id))}
                        title="Edit date range"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      {onRefreshPeriod && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-[#1C1F4F]/30 hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/5 transition-colors"
                          onClick={() => onRefreshPeriod(period.id)}
                          title="Bypass cache & refresh from Greyfinch"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {periods.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-[#1C1F4F]/30 hover:text-red-500 hover:bg-red-50/50 transition-colors"
                          onClick={() => {
                            if (confirm(`Remove ${period.title}?`)) onRemovePeriod(period.id);
                          }}
                          title="Remove period"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* "previous periods" hint — shown briefly on new cards */}
                  {newPeriodId === period.id && index > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-[#1C1F4F]/40 animate-in fade-in duration-300">
                      <span>←</span>
                      <span>{index} previous period{index !== 1 ? 's' : ''} to the left</span>
                    </div>
                  )}

                  {/* Date & location — click to edit */}
                  <button
                    className="flex items-center gap-3 mt-2 text-left w-full group/meta"
                    onClick={() => setPeriodEditing(period, !editingPeriods.has(period.id))}
                    title="Click to edit"
                  >
                    <span className="flex items-center gap-1.5 text-xs text-[#1C1F4F]/40 group-hover/meta:text-[#1C1F4F]/70 transition-colors">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      {period.startDate && period.endDate
                        ? `${format(new Date(period.startDate), 'MMM d')} – ${format(new Date(period.endDate), 'MMM d, yyyy')}`
                        : 'Select date range'}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#1C1F4F]/40 group-hover/meta:text-[#1C1F4F]/70 transition-colors">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {getLocationSummary(period)}
                    </span>
                  </button>
                </CardHeader>

                                  {/* Period Content */}
                  <CardContent className="pt-0 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                    {/* Date Range Editor - Show when editing */}
                    {editingPeriods.has(period.id) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                          <Calendar className="h-4 w-4" />
                          Edit Date Range
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <CompactDateInput
                              date={periodDraft.startDate}
                              setDate={(date) => updatePeriodDraft(period.id, { startDate: date })}
                              label="Start Date"
                              maxDate={periodDraft.endDate}
                            />
                          </div>
                          <div>
                            <CompactDateInput
                              date={periodDraft.endDate}
                              setDate={(date) => updatePeriodDraft(period.id, { endDate: date })}
                              label="End Date"
                              minDate={periodDraft.startDate}
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          {/* Location Selection */}
                          <div>
                            <Label className="text-sm font-medium text-blue-800">Select Locations</Label>
                            <MultiLocationSelector
                              locations={locations.map(loc => ({
                                id: loc.id.toString(),
                                name: loc.name,
                                isActive: loc.isActive
                              }))}
                              selectedLocationIds={periodDraft.locationIds}
                              onSelectionChange={(locationIds) => {
                                const primaryLocationId = locationIds.length === 1 ? locationIds[0] : 
                                                        locationIds.length === 0 ? 'all' : 
                                                        locationIds.length === locations.length ? 'all' : locationIds[0];
                                updatePeriodDraft(period.id, {
                                  locationIds,
                                  locationId: primaryLocationId,
                                });
                              }}
                              placeholder="Select locations"
                            />
                          </div>

                          {hasInvalidDateRange && (
                            <p className="text-sm text-red-600">
                              End date cannot be before the start date.
                            </p>
                          )}
                          
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                onUpdatePeriod(period.id, {
                                  startDate: periodDraft.startDate,
                                  endDate: periodDraft.endDate,
                                  locationIds: periodDraft.locationIds,
                                  locationId: periodDraft.locationId,
                                });
                                setPeriodEditing(period, false);
                              }}
                              className="text-blue-700 border-blue-300 hover:bg-blue-100"
                              disabled={hasInvalidDateRange}
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Compact Cost Management - Top of Column */}
                    <div className="pt-2">
                    <CompactCostManager
                      periodId={period.id}
                      periodName={period.title}
                      locationId={period.locationId}
                      costs={periodCostsList}
                      onCostsUpdate={handleCostsUpdate}
                    />
                    </div>
                    
                    <PeriodColumn
                      period={period}
                      query={query}
                      locations={locations}
                      onUpdatePeriod={onUpdatePeriod}
                      onAddPeriod={onAddPeriod}
                      onRetry={onRetryPeriod ? () => onRetryPeriod(period.id) : undefined}
                      onRefresh={onRefreshPeriod ? () => onRefreshPeriod(period.id) : undefined}
                      isFirstPeriod={index === 0}
                      isCompact={true}
                      periodCosts={periodCostsList}
                    />
                  
                  {/* Visualizations Waterfall */}
                  {period.visualizations?.map((viz, vizIndex) => (
                    <div key={`${period.id}-${viz.id}-${vizIndex}`} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{viz.title}</h4>
                        {editingPeriods.has(period.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            onClick={() => {
                              const updatedViz = period.visualizations?.filter((_, i) => i !== vizIndex) || [];
                              onUpdatePeriod(period.id, { visualizations: updatedViz });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {editingPeriods.has(period.id) ? (
                        <p className="text-sm text-gray-600">{viz.description}</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">{viz.description}</p>
                          {/* Chart Placeholder - Replace with actual chart component */}
                          <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500">
                            {viz.title} Chart Loading...
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Save as Template Button */}
                  {(period.visualizations?.length || 0) > 0 && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const templateName = prompt('Enter template name:', `${period.title} Template`);
                          if (templateName && templateName.trim()) {
                            // Save template to localStorage
                            const templates = JSON.parse(localStorage.getItem('orthodash-templates') || '[]');
                            const newTemplate = {
                              id: Date.now(),
                              name: templateName.trim(),
                              period: {
                                title: period.title,
                                locationId: period.locationId,
                                visualizations: period.visualizations
                              },
                              createdAt: new Date().toISOString()
                            };
                            templates.push(newTemplate);
                            localStorage.setItem('orthodash-templates', JSON.stringify(templates));
                            
                            // Show success message
                            alert(`Template "${templateName}" saved successfully!`);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save as Template
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}

        {/* Add Column Button - Direct Addition */}
        <div 
          className="flex-shrink-0 snap-center sticky-add-column"
          style={{ 
            width: 'calc(100vw - 2rem)',
            maxWidth: '420px',
            height: '100%'
          }}
        >
          <Card className="h-full border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
            <CardContent className="h-full flex flex-col items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#1d1d52] flex items-center justify-center mx-auto group-hover:bg-[#1d1d52]/80 transition-colors">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Analysis Period</h3>
                  <p className="text-sm text-gray-600 max-w-48">
                    Compare data across different time periods and locations for comprehensive insights
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={handleDirectAddPeriod}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Column
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scroll Indicators - Mobile Only */}
      <div className="lg:hidden mt-4 flex justify-center">
        <div className="flex gap-2">
          {Array.from({ length: periods.length + 1 }).map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-gray-300 transition-colors"
              // You could add active state logic here based on scroll position
            />
          ))}
        </div>
      </div>
    </div>
  );
}
