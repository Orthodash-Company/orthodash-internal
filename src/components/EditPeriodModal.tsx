import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Edit3, Calendar, MapPin, Save } from "lucide-react";

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

interface EditPeriodModalProps {
  period: PeriodConfig;
  locations: Location[];
  onUpdatePeriod: (periodId: string, updates: Partial<PeriodConfig>) => void;
  trigger?: React.ReactNode;
}

export function EditPeriodModal({ period, locations, onUpdatePeriod, trigger }: EditPeriodModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(period.title);
  const [locationId, setLocationId] = useState(period.locationId);
  const [startDate, setStartDate] = useState<Date>(period.startDate);
  const [endDate, setEndDate] = useState<Date>(period.endDate);

  const handleSaveChanges = () => {
    if (!startDate || !endDate) return;
    
    onUpdatePeriod(period.id, {
      title,
      locationId,
      startDate,
      endDate,
    });
    
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset form to current period values when opening
      setTitle(period.title);
      setLocationId(period.locationId);
      setStartDate(period.startDate);
      setEndDate(period.endDate);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Edit Period Configuration
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
                placeholder="Select start date"
              />
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <DatePicker
                date={endDate}
                setDate={(date) => date && setEndDate(date)}
                placeholder="Select end date"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveChanges}
            disabled={!title || !startDate || !endDate}
            className="bg-[#1d1d52] hover:bg-[#1d1d52]/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}