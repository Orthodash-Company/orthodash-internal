import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useToast } from "@/hooks/use-toast";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { apiRequest } from "@/lib/queryClient";
import { Save } from "lucide-react";

interface CostManagementProps {
  locationId: number | null;
  period: string;
  initialCosts?: {
    digital: number;
    professional: number;
    direct: number;
  };
}

export function CostManagement({ locationId, period, initialCosts }: CostManagementProps) {
  const [costs, setCosts] = useState({
    digital: initialCosts?.digital || 0,
    professional: initialCosts?.professional || 0,
    direct: initialCosts?.direct || 0
  });

  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(costs).map(([referralType, cost]) =>
        fetch('/api/acquisition-costs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            locationId,
            referralType,
            cost,
            period
          }),
        })
      );
      
      await Promise.all(promises);
      
      toast({
        title: "Success",
        description: "Acquisition costs saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save costs",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCostChange = (type: keyof typeof costs, value: number) => {
    setCosts(prev => ({
      ...prev,
      [type]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acquisition Cost Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="digital-cost">Digital Marketing Cost</Label>
            <CurrencyInput
              id="digital-cost"
              value={costs.digital}
              onChange={(value) => handleCostChange('digital', value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="professional-cost">Professional Relations Cost</Label>
            <CurrencyInput
              id="professional-cost"
              value={costs.professional}
              onChange={(value) => handleCostChange('professional', value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="direct-cost">Direct Marketing Cost</Label>
            <CurrencyInput
              id="direct-cost"
              value={costs.direct}
              onChange={(value) => handleCostChange('direct', value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#1d1d52] hover:bg-[#1d1d52]/90 text-white"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Cost Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
