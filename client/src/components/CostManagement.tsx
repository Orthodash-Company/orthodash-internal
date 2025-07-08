import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  const queryClient = useQueryClient();

  const saveCostsMutation = useMutation({
    mutationFn: async (costData: typeof costs) => {
      const promises = Object.entries(costData).map(([referralType, cost]) =>
        apiRequest('POST', '/api/acquisition-costs', {
          locationId,
          referralType,
          cost,
          period
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Acquisition costs saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save costs",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    saveCostsMutation.mutate(costs);
  };

  const handleCostChange = (type: keyof typeof costs, value: string) => {
    setCosts(prev => ({
      ...prev,
      [type]: parseFloat(value) || 0
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
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400">$</span>
              <Input
                id="digital-cost"
                type="number"
                className="pl-8"
                value={costs.digital}
                onChange={(e) => handleCostChange('digital', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="professional-cost">Professional Relations Cost</Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400">$</span>
              <Input
                id="professional-cost"
                type="number"
                className="pl-8"
                value={costs.professional}
                onChange={(e) => handleCostChange('professional', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="direct-cost">Direct Marketing Cost</Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400">$</span>
              <Input
                id="direct-cost"
                type="number"
                className="pl-8"
                value={costs.direct}
                onChange={(e) => handleCostChange('direct', e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saveCostsMutation.isPending}
            className="bg-secondary hover:bg-secondary/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveCostsMutation.isPending ? 'Saving...' : 'Save Cost Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
