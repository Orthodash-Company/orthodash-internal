'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, DollarSign, Edit2, Trash2, Calculator } from 'lucide-react'
import { CompactCost, PeriodCosts } from '@/shared/types'

interface CompactCostManagerProps {
  periodId: string
  periodName: string
  locationId: string | null
  costs: CompactCost[]
  onCostsUpdate: (periodId: string, costs: CompactCost[]) => void
  trigger?: React.ReactNode
}

export function CompactCostManager({
  periodId,
  periodName,
  locationId,
  costs,
  onCostsUpdate,
  trigger
}: CompactCostManagerProps) {
  const [open, setOpen] = useState(false)
  const [editingCost, setEditingCost] = useState<CompactCost | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'manual',
    date: new Date().toISOString().split('T')[0]
  })

  const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0)

  const handleAddCost = () => {
    if (!formData.name.trim() || !formData.amount) return

    const newCost: CompactCost = {
      id: editingCost?.id || `cost-${Date.now()}`,
      name: formData.name.trim(),
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date
    }

    let updatedCosts: CompactCost[]
    if (editingCost) {
      // Update existing cost
      updatedCosts = costs.map(cost => cost.id === editingCost.id ? newCost : cost)
    } else {
      // Add new cost
      updatedCosts = [...costs, newCost]
    }

    onCostsUpdate(periodId, updatedCosts)
    
    // Reset form
    setFormData({
      name: '',
      amount: '',
      category: 'manual',
      date: new Date().toISOString().split('T')[0]
    })
    setEditingCost(null)
  }

  const handleEditCost = (cost: CompactCost) => {
    setEditingCost(cost)
    setFormData({
      name: cost.name,
      amount: cost.amount.toString(),
      category: cost.category,
      date: cost.date
    })
  }

  const handleDeleteCost = (costId: string) => {
    if (confirm('Are you sure you want to delete this cost?')) {
      const updatedCosts = costs.filter(cost => cost.id !== costId)
      onCostsUpdate(periodId, updatedCosts)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: '',
      amount: '',
      category: 'manual',
      date: new Date().toISOString().split('T')[0]
    })
    setEditingCost(null)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'digital': return 'bg-blue-100 text-blue-800'
      case 'professional': return 'bg-green-100 text-green-800'
      case 'direct': return 'bg-purple-100 text-purple-800'
      case 'manual': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'digital': return 'Digital Ads'
      case 'professional': return 'Professional'
      case 'direct': return 'Direct'
      case 'manual': return 'Manual Entry'
      default: return category
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            <span className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Costs
            </span>
            <span className="font-semibold">${totalCosts.toLocaleString()}</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Cost Management - {periodName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add/Edit Cost Form */}
          <Card className="bg-gray-50">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cost-name" className="text-sm">Cost Name</Label>
                  <Input
                    id="cost-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Facebook Ads"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="cost-amount" className="text-sm">Amount</Label>
                  <Input
                    id="cost-amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cost-category" className="text-sm">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Entry</SelectItem>
                      <SelectItem value="digital">Digital Ads</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cost-date" className="text-sm">Date</Label>
                  <Input
                    id="cost-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={handleAddCost}
                  disabled={!formData.name.trim() || !formData.amount}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {editingCost ? 'Update Cost' : 'Add Cost'}
                </Button>
                {editingCost && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Costs List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Current Costs</Label>
              <Badge variant="secondary" className="text-xs">
                {costs.length} cost{costs.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {costs.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No costs added yet</p>
                <p className="text-xs">Add your first cost above</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {costs.map((cost) => (
                  <div key={cost.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{cost.name}</p>
                        <Badge className={`text-xs ${getCategoryColor(cost.category)}`}>
                          {getCategoryLabel(cost.category)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">{cost.date}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="text-sm font-semibold">${cost.amount.toLocaleString()}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditCost(cost)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCost(cost.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Summary */}
          {costs.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-900">Total Costs:</span>
                <span className="text-xl font-bold text-blue-900">${totalCosts.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
