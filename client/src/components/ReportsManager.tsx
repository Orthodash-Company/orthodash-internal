import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, Eye, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface SavedReport {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  periodConfigs: any[];
  pdfUrl?: string;
  thumbnail?: string;
}

interface ReportsManagerProps {
  trigger?: React.ReactNode;
}

export function ReportsManager({ trigger }: ReportsManagerProps) {
  const queryClient = useQueryClient();
  
  // Query for saved reports
  const { data: reports = [], isLoading, error } = useQuery<SavedReport[]>({
    queryKey: ['/api/reports'],
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await apiRequest('DELETE', `/api/reports/${reportId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
  });

  // Generate PDF mutation
  const generatePdfMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiRequest('POST', `/api/reports/${reportId}/pdf`);
      return response.blob();
    },
    onSuccess: (blob, reportId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orthodash-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });

  const handleDeleteReport = async (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      deleteReportMutation.mutate(reportId);
    }
  };

  const handleDownloadPdf = (reportId: string) => {
    generatePdfMutation.mutate(reportId);
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="flex items-center gap-2">
      <FileText className="h-4 w-4" />
      <span className="hidden sm:inline">Reports</span>
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Saved Reports</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh]">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-red-100 p-3 mb-4">
                <FileText className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Reports</h3>
              <p className="text-gray-500">
                There was an error loading your saved reports. Please try again.
              </p>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-gray-100 p-3 mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Saved</h3>
              <p className="text-gray-500 max-w-sm">
                You haven't saved any reports yet. Create a period comparison and save it as a template to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{report.name}</CardTitle>
                        {report.description && (
                          <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPdf(report.id)}
                          disabled={generatePdfMutation.isPending}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReport(report.id)}
                          disabled={deleteReportMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created {format(new Date(report.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                        {report.pdfUrl && (
                          <Badge variant="secondary" className="text-xs">
                            PDF Available
                          </Badge>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Periods ({report.periodConfigs.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {report.periodConfigs.map((period, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {period.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {report.thumbnail && (
                        <div className="mt-3">
                          <img
                            src={report.thumbnail}
                            alt={`${report.name} preview`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}