import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Trash2, Edit2, Check, X } from "lucide-react";

interface CostEntry {
  id: string;
  label: string;
  amount: number;
}

interface CostEntryFormProps {
  onCostChange: (totalCost: number) => void;
  initialCosts?: CostEntry[];
}

export function CostEntryForm({ onCostChange, initialCosts = [] }: CostEntryFormProps) {
  const [costEntries, setCostEntries] = useState<CostEntry[]>(initialCosts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({ label: '', amount: 0 });

  const totalCost = costEntries.reduce((sum, entry) => sum + entry.amount, 0);

  // Update parent when total changes - using useCallback to prevent infinite loops
  const totalCostRef = React.useRef(totalCost);
  
  React.useEffect(() => {
    if (totalCostRef.current !== totalCost) {
      totalCostRef.current = totalCost;
      onCostChange(totalCost);
    }
  }, [totalCost, onCostChange]);

  const addCostEntry = () => {
    if (newEntry.label.trim() && newEntry.amount > 0) {
      const entry: CostEntry = {
        id: Date.now().toString(),
        label: newEntry.label.trim(),
        amount: newEntry.amount
      };
      setCostEntries(prev => [...prev, entry]);
      setNewEntry({ label: '', amount: 0 });
    }
  };

  const removeCostEntry = (id: string) => {
    setCostEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const updateCostEntry = (id: string, updates: Partial<CostEntry>) => {
    setCostEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Cost Entries List - Only show if there are entries */}
      {costEntries.length > 0 && (
        <div className="space-y-3">
          {costEntries.map((entry) => (
            <Card key={entry.id} className="border border-gray-200">
              <CardContent className="p-4">
                {editingId === entry.id ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        value={entry.label}
                        onChange={(e) => updateCostEntry(entry.id, { label: e.target.value })}
                        className="mb-2"
                        placeholder="Cost label"
                      />
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          type="number"
                          value={entry.amount}
                          onChange={(e) => updateCostEntry(entry.id, { amount: parseFloat(e.target.value) || 0 })}
                          className="pl-10"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{entry.label}</div>
                      <div className="text-2xl font-bold text-green-600">
                        ${entry.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setEditingId(entry.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => removeCostEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Entry Form */}
      <Card className="border-dashed border-gray-300">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="cost-label" className="text-sm">Cost Label</Label>
              <Input
                id="cost-label"
                value={newEntry.label}
                onChange={(e) => setNewEntry(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., Google Ads, Meta Advertising, Print Materials"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cost-amount" className="text-sm">Amount</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="cost-amount"
                  type="number"
                  value={newEntry.amount || ''}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="pl-10"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <Button 
              onClick={addCostEntry}
              disabled={!newEntry.label.trim() || newEntry.amount <= 0}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Cost Entry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Total Calculator */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-medium">Total Acquisition Costs</span>
              {costEntries.length > 0 && (
                <Badge variant="secondary">{costEntries.length} entries</Badge>
              )}
            </div>
            <div className="text-2xl font-bold text-green-700">
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}