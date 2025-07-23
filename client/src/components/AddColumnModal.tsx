import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Plus, Calendar, MapPin } from "lucide-react";

interface Location {
  id: number;
  name: string;
  greyfinchId?: string;
}

interface PeriodConfig {
  id: string;
  title: string;
  locationId: string;
  startDate: Date;
  endDate: Date;
}

interface AddColumnModalProps {
  locations: Location[];
  onAddPeriod: (period: Omit<PeriodConfig, 'id'>) => void;
  existingPeriodsCount: number;
  children?: React.ReactNode;
}

export function AddColumnModal({ locations, onAddPeriod, existingPeriodsCount, children }: AddColumnModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`Period ${String.fromCharCode(65 + existingPeriodsCount)}`);
  const [locationId, setLocationId] = useState('all');
  const [startDate, setStartDate] = useState<Date>(new Date(2024, 0, 1));
  const [endDate, setEndDate] = useState<Date>(new Date(2024, 2, 31));

  const handleAddPeriod = () => {
    if (!startDate || !endDate) return;
    
    onAddPeriod({
      title,
      locationId,
      startDate,
      endDate,
    });
    
    // Reset form and close modal
    setTitle(`Period ${String.fromCharCode(65 + existingPeriodsCount + 1)}`);
    setLocationId('all');
    setStartDate(new Date(2024, 0, 1));
    setEndDate(new Date(2024, 2, 31));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <div className="w-80 h-full min-h-[600px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer group">
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
              <Button variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Column
              </Button>
            </div>
          </div>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#1d1d52]" />
            Add Analysis Period
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="period-title">Period Name</Label>
            <Input
              id="period-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q1 2024, Summer Campaign"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </Label>
              <DatePicker
                date={startDate}
                setDate={(date) => date && setStartDate(date)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <DatePicker
                date={endDate}
                setDate={(date) => date && setEndDate(date)}
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleAddPeriod} 
            className="flex-1 bg-[#1d1d52] hover:bg-[#1d1d52]/90"
            disabled={!startDate || !endDate || !title.trim()}
          >
            Add Period
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}