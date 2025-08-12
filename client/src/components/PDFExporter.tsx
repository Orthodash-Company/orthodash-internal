import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PDFExportOptions {
  title: string;
  description?: string;
  includeCharts: boolean;
  includeData: boolean;
  includeSummary: boolean;
  pageFormat: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
}

interface PDFExporterProps {
  reportData: any;
  reportName?: string;
  trigger?: React.ReactNode;
}

export function PDFExporter({ reportData, reportName = "ORTHODASH Report", trigger }: PDFExporterProps) {
  const [options, setOptions] = useState<PDFExportOptions>({
    title: reportName,
    description: '',
    includeCharts: true,
    includeData: true,
    includeSummary: true,
    pageFormat: 'A4',
    orientation: 'portrait'
  });

  const { toast } = useToast();

  const generatePdfMutation = useMutation({
    mutationFn: async (exportOptions: PDFExportOptions) => {
      const response = await apiRequest('POST', '/api/export/pdf', {
        reportData,
        options: exportOptions
      });
      return response.blob();
    },
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Generated",
        description: "Your report has been downloaded successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to generate PDF",
        variant: "destructive"
      });
    },
  });

  const handleExport = () => {
    generatePdfMutation.mutate(options);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      <Download className="h-4 w-4" />
      Export PDF
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-lg mt-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export to PDF
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                value={options.title}
                onChange={(e) => setOptions(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter report title"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={options.description}
                onChange={(e) => setOptions(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a description for your report"
                rows={3}
              />
            </div>
          </div>

          {/* Content Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include in PDF</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="charts"
                  checked={options.includeCharts}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeCharts: !!checked }))
                  }
                />
                <Label htmlFor="charts" className="text-sm">Charts and Visualizations</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="data"
                  checked={options.includeData}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeData: !!checked }))
                  }
                />
                <Label htmlFor="data" className="text-sm">Raw Data Tables</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="summary"
                  checked={options.includeSummary}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeSummary: !!checked }))
                  }
                />
                <Label htmlFor="summary" className="text-sm">AI Summary & Insights</Label>
              </div>
            </div>
          </div>

          {/* Format Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">PDF Format</Label>
            
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-gray-600">Page Size</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={options.pageFormat === 'A4' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOptions(prev => ({ ...prev, pageFormat: 'A4' }))}
                  >
                    A4
                  </Button>
                  <Button
                    variant={options.pageFormat === 'Letter' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOptions(prev => ({ ...prev, pageFormat: 'Letter' }))}
                  >
                    Letter
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Orientation</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={options.orientation === 'portrait' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOptions(prev => ({ ...prev, orientation: 'portrait' }))}
                  >
                    Portrait
                  </Button>
                  <Button
                    variant={options.orientation === 'landscape' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOptions(prev => ({ ...prev, orientation: 'landscape' }))}
                  >
                    Landscape
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Info */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Preview</p>
                <p className="text-blue-800 mt-1">
                  {options.pageFormat} {options.orientation} format with{' '}
                  {[
                    options.includeCharts && 'charts',
                    options.includeData && 'data',
                    options.includeSummary && 'summary'
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={generatePdfMutation.isPending || !options.title.trim()}
            className="w-full"
          >
            {generatePdfMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}