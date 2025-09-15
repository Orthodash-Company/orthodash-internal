'use client'

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Eye, Save, FileText, BarChart3, Users, Calendar, DollarSign, Target, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface PDFReportGeneratorProps {
  greyfinchData: any;
  periods: any[];
  acquisitionCosts: any[];
  aiSummary: any;
  onSaveReport?: (reportData: any) => void;
}

interface ReportData {
  id: string;
  title: string;
  type: 'summary' | 'detailed' | 'executive';
  createdAt: string;
  data: any;
  pdfUrl?: string;
}

export function PDFReportGenerator({ 
  greyfinchData, 
  periods, 
  acquisitionCosts, 
  aiSummary, 
  onSaveReport 
}: PDFReportGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'executive'>('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<ReportData[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Extract counter data - memoized for performance
  const getCounterData = useMemo(() => {
    if (!greyfinchData?.data) return {};
    
    const { data } = greyfinchData;
    return {
      patients: data.patients?.count || 0,
      appointments: data.appointments?.count || 0,
      leads: data.leads?.count || 0,
      bookings: data.bookings?.count || 0,
      locations: data.locations?.length || 0
    };
  }, [greyfinchData]);

  // Extract analysis data for a specific period
  const getPeriodAnalysisData = (period: any) => {
    if (!greyfinchData?.data) return {};
    
    const { data } = greyfinchData;
    const startDate = period.startDate ? new Date(period.startDate) : null;
    const endDate = period.endDate ? new Date(period.endDate) : null;
    
    // Filter data by date range and location
    let filteredData = { ...data };
    
    if (startDate && endDate) {
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      
      // Filter appointments, leads, etc. by date range
      if (data.appointments?.data) {
        filteredData.appointments.data = data.appointments.data.filter((apt: any) => {
          const aptTime = new Date(apt.scheduledDate || apt.createdAt).getTime();
          return aptTime >= startTime && aptTime <= endTime;
        });
      }
      
      if (data.leads?.data) {
        filteredData.leads.data = data.leads.data.filter((lead: any) => {
          const leadTime = new Date(lead.createdAt).getTime();
          return leadTime >= startTime && leadTime <= endTime;
        });
      }
    }
    
    if (period.locationId && period.locationId !== 'all') {
      // Filter by specific location
      if (filteredData.appointments?.data) {
        filteredData.appointments.data = filteredData.appointments.data.filter((apt: any) => 
          apt.locationId === period.locationId
        );
      }
      if (filteredData.leads?.data) {
        filteredData.leads.data = filteredData.leads.data.filter((lead: any) => 
          lead.locationId === period.locationId
        );
      }
    }
    
    return filteredData;
  };

  // Save report to database - memoized for performance
  const saveReportToDatabase = useCallback(async (reportData: ReportData) => {
    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to save reports",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          sessionId: `session-${Date.now()}`, // Generate a session ID
          name: reportData.title,
          type: reportData.type,
          data: reportData.data
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save report: ${response.status}`);
      }

      const result = await response.json();
      console.log('Report saved successfully:', result);

        toast({
        title: "Report Saved!",
        description: "Your report has been saved to the reports history",
      });

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save report to database",
        variant: "destructive"
      });
    }
  }, [user?.id, toast]);

  // Generate PDF report - memoized for performance
  const generatePDF = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;
      
      // Header
      doc.setFontSize(24);
      doc.setTextColor(29, 29, 82); // #1d1d52
      doc.text('Orthodash Practice Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      
      // Report Type Header
      doc.setFontSize(16);
      doc.setTextColor(29, 29, 82);
      doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 20, yPosition);
      
      yPosition += 15;
      
      // Counter Data Section
      const counterData = getCounterData;
      doc.setFontSize(14);
      doc.setTextColor(29, 29, 82);
      doc.text('Practice Overview', 20, yPosition);
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      
      const counterTableData = [
        ['Metric', 'Count'],
        ['Total Patients', counterData.patients.toString()],
        ['Total Appointments', counterData.appointments.toString()],
        ['Total Leads', counterData.leads.toString()],
        ['Total Bookings', counterData.bookings.toString()],
        ['Active Locations', counterData.locations.toString()]
      ];
      
      autoTable(doc, {
        head: [counterTableData[0]],
        body: counterTableData.slice(1),
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [29, 29, 82] },
        styles: { fontSize: 10 }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
      
      // Period Analysis Section
      if (periods.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(29, 29, 82);
        doc.text('Period Analysis', 20, yPosition);
        
        yPosition += 10;
        
        periods.forEach((period, index) => {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
          }
          
          const periodData = getPeriodAnalysisData(period);
          const periodTitle = period.title || `Period ${String.fromCharCode(65 + index)}`;
          
          doc.setFontSize(12);
          doc.setTextColor(29, 29, 82);
          doc.text(periodTitle, 20, yPosition);
          
          yPosition += 8;
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          
          if (period.startDate && period.endDate) {
            const startDate = new Date(period.startDate).toLocaleDateString();
            const endDate = new Date(period.endDate).toLocaleDateString();
            doc.text(`Date Range: ${startDate} - ${endDate}`, 25, yPosition);
            yPosition += 6;
          }
          
          if (period.locationId && period.locationId !== 'all') {
            const location = greyfinchData?.data?.locations?.find((loc: any) => loc.id === period.locationId);
            if (location) {
              doc.text(`Location: ${location.name}`, 25, yPosition);
              yPosition += 6;
            }
          }
          
          // Period-specific metrics
          if (periodData.appointments?.data) {
            const appointmentCount = periodData.appointments.data.length;
            doc.text(`Appointments: ${appointmentCount}`, 25, yPosition);
            yPosition += 6;
          }
          
          if (periodData.leads?.data) {
            const leadCount = periodData.leads.data.length;
            doc.text(`Leads: ${leadCount}`, 25, yPosition);
            yPosition += 6;
          }
          
          yPosition += 5;
        });
      }
      
      // Acquisition Costs Section
      if (acquisitionCosts && acquisitionCosts.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(29, 29, 82);
        doc.text('Acquisition Costs', 20, yPosition);
        
        yPosition += 10;
        
        const costTableData = [
          ['Period', 'Cost Type', 'Amount', 'Referral Source']
        ];
        
        acquisitionCosts.forEach((cost: any) => {
          costTableData.push([
            cost.period || 'Unknown',
            cost.type || 'Unknown',
            `$${cost.amount?.toLocaleString() || '0'}`,
            cost.source || 'Unknown'
          ]);
        });
        
        autoTable(doc, {
          head: [costTableData[0]],
          body: costTableData.slice(1),
          startY: yPosition,
          theme: 'grid',
          headStyles: { fillColor: [29, 29, 82] },
          styles: { fontSize: 9 }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // AI Summary Section
      if (aiSummary) {
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(29, 29, 82);
        doc.text('AI Analysis Summary', 20, yPosition);
        
        yPosition += 10;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        
        // Summary text
        if (aiSummary.summary) {
          const summaryLines = doc.splitTextToSize(aiSummary.summary, pageWidth - 40);
          doc.text(summaryLines, 20, yPosition);
          yPosition += (summaryLines.length * 6) + 10;
        }
        
        // Key insights
        if (aiSummary.insights && aiSummary.insights.length > 0) {
          doc.setFontSize(12);
          doc.setTextColor(29, 29, 82);
          doc.text('Key Insights:', 20, yPosition);
          yPosition += 8;
          
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          
          aiSummary.insights.forEach((insight: string) => {
            const insightLines = doc.splitTextToSize(`• ${insight}`, pageWidth - 40);
            doc.text(insightLines, 25, yPosition);
            yPosition += (insightLines.length * 6) + 2;
          });
          
          yPosition += 5;
        }
        
        // Strategic recommendations
        if (aiSummary.strategicRecommendations && aiSummary.strategicRecommendations.length > 0) {
          if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(29, 29, 82);
          doc.text('Strategic Recommendations:', 20, yPosition);
          yPosition += 8;
          
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          
          aiSummary.strategicRecommendations.forEach((rec: string) => {
            const recLines = doc.splitTextToSize(`• ${rec}`, pageWidth - 40);
            doc.text(recLines, 25, yPosition);
            yPosition += (recLines.length * 6) + 2;
          });
        }
      }
      
      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
        doc.text('Orthodash Practice Analytics', 20, pageHeight - 10);
      }
      
      // Generate report data
      const reportData: ReportData = {
        id: Date.now().toString(),
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${new Date().toLocaleDateString()}`,
        type: reportType,
        createdAt: new Date().toISOString(),
        data: {
          greyfinchData,
          periods,
          acquisitionCosts,
          aiSummary,
          counterData: getCounterData
        }
      };
      
      // Save report to state
      setGeneratedReports(prev => [...prev, reportData]);
      
      // Save to reports list if callback provided
      if (onSaveReport) {
        onSaveReport(reportData);
      }

      // Save to database
      await saveReportToDatabase(reportData);
      
      // Download PDF
      const fileName = `orthodash-${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "PDF Generated!",
        description: "Your report has been generated and saved",
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate PDF report",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [reportType, greyfinchData, periods, acquisitionCosts, aiSummary, getCounterData, onSaveReport, saveReportToDatabase, toast]);

  // View generated report - memoized for performance
  const viewReport = useCallback((report: ReportData) => {
    // For now, just show the report data in console
    // In a real implementation, this could open a modal or new tab
    console.log('Viewing report:', report);
  }, []);

  // Delete generated report - memoized for performance
  const deleteReport = useCallback((reportId: string) => {
    setGeneratedReports(prev => prev.filter(r => r.id !== reportId));
  }, []);

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
          <CheckCircle className="h-5 w-5" />
          <span>Report saved successfully!</span>
        </div>
      )}

      {/* Report Generation Controls */}
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
            Generate PDF Report
        </CardTitle>
      </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Report Type
              </label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                  <SelectItem value="executive">Executive Report</SelectItem>
                </SelectContent>
              </Select>
        </div>

            <Button 
              onClick={generatePDF} 
              disabled={isGenerating}
              className="bg-[#1d1d52] hover:bg-[#1d1d52]/90"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Generate PDF'}
            </Button>
              </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Summary Report:</strong> High-level overview with key metrics and insights</p>
            <p><strong>Detailed Report:</strong> Comprehensive analysis with period breakdowns and charts</p>
            <p><strong>Executive Report:</strong> Strategic insights and recommendations for stakeholders</p>
          </div>
        </CardContent>
      </Card>

      {/* Generated Reports List */}
      {generatedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Generated Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#1d1d52]" />
                    <div>
                      <p className="font-medium text-gray-900">{report.title}</p>
                      <p className="text-sm text-gray-500">
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)} • {new Date(report.createdAt).toLocaleDateString()}
                      </p>
          </div>
        </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewReport(report)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Re-generate and download
                        setReportType(report.type);
                        setTimeout(() => generatePDF(), 100);
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteReport(report.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Report Data Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-900">
                {getCounterData.patients || 0}
              </p>
              <p className="text-sm text-blue-700">Patients</p>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-900">
                {getCounterData.appointments || 0}
              </p>
              <p className="text-sm text-green-700">Appointments</p>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-900">
                {getCounterData.leads || 0}
              </p>
              <p className="text-sm text-purple-700">Leads</p>
        </div>

            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-900">
                {periods.length}
              </p>
              <p className="text-sm text-orange-700">Analysis Periods</p>
            </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
