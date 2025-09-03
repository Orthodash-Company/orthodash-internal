'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Download, FileText, BarChart3, TrendingUp, Users, DollarSign, Clock, Target, Save, FolderOpen, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SessionManagerProps {
  periods: any[];
  locations: any[];
  greyfinchData: any;
  user: any;
}

interface Session {
  id: string;
  name: string;
  description: string;
  periods: string[];
  locations: string[];
  greyfinchData: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Report {
  id: string;
  sessionId: string;
  name: string;
  type: 'summary' | 'detailed' | 'executive';
  data: any;
  createdAt: string;
}

export function SessionManager({ periods, locations, greyfinchData, user }: SessionManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [newSession, setNewSession] = useState({
    name: '',
    description: '',
    selectedPeriods: [] as string[],
    selectedLocations: [] as string[],
    includeCharts: true,
    includeAIInsights: true,
    includeRecommendations: true
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  // Load existing sessions and reports
  useEffect(() => {
    loadSessions();
    loadReports();
  }, []);

  // Auto-create session when data changes
  useEffect(() => {
    if (periods.length > 0 && greyfinchData && Object.keys(greyfinchData).length > 0) {
      autoCreateSession();
    }
  }, [periods, greyfinchData]);

  const loadSessions = async () => {
    try {
      const response = await fetch(`/api/sessions?userId=${authUser?.id}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadReports = async () => {
    try {
      const response = await fetch(`/api/reports?userId=${authUser?.id}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const autoCreateSession = async () => {
    if (!authUser?.id) return;

    try {
      // Check if we already have an active session for today
      const today = new Date().toISOString().split('T')[0];
      const existingSession = sessions.find(session => {
        const sessionDate = new Date(session.createdAt).toISOString().split('T')[0];
        return sessionDate === today && session.isActive;
      });

      if (existingSession) {
        // Update existing session with new data
        await updateSession(existingSession.id);
        return;
      }

      // Create new session with all current data
      const sessionData = {
        name: `Auto-created Session - ${new Date().toLocaleDateString()}`,
        description: `Automatically created session with ${periods.length} analysis periods and Greyfinch data`,
        periods: periods.map(p => p.id),
        locations: locations.map(l => l.id),
        greyfinchData,
        userId: authUser.id,
        includeCharts: true,
        includeAIInsights: true,
        includeRecommendations: true
      };

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        const createdSession = await response.json();
        setSessions(prev => [...prev, createdSession.session]);
        console.log('✅ Auto-created session:', createdSession.session.name);
      }
    } catch (error) {
      console.error('Error auto-creating session:', error);
    }
  };

  const updateSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periods: periods.map(p => p.id),
          locations: locations.map(l => l.id),
          greyfinchData,
          updatedAt: new Date()
        }),
      });

      if (response.ok) {
        const updatedSession = await response.json();
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? updatedSession.session : s
        ));
        console.log('✅ Updated existing session:', updatedSession.session.name);
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const handleCreateSession = async () => {
    if (!newSession.name.trim()) {
      toast({
        title: "Session Name Required",
        description: "Please enter a name for your session.",
        variant: "destructive"
      });
      return;
    }

    if (newSession.selectedPeriods.length === 0) {
      toast({
        title: "Periods Required",
        description: "Please select at least one analysis period.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const sessionData = {
        name: newSession.name,
        description: newSession.description,
        periods: newSession.selectedPeriods,
        locations: newSession.selectedLocations,
        greyfinchData,
        userId: authUser?.id,
        includeCharts: newSession.includeCharts,
        includeAIInsights: newSession.includeAIInsights,
        includeRecommendations: newSession.includeRecommendations
      };

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        const createdSession = await response.json();
        setSessions(prev => [...prev, createdSession.session]);
        
        // Reset form
        setNewSession({
          name: '',
          description: '',
          selectedPeriods: [],
          selectedLocations: [],
          includeCharts: true,
          includeAIInsights: true,
          includeRecommendations: true
        });

        toast({
          title: "Session Created",
          description: "Your analysis session has been saved successfully.",
        });
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Session Creation Failed",
        description: "An error occurred while creating the session.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateReport = async (session: Session, type: 'summary' | 'detailed' | 'executive') => {
    setIsLoading(true);
    try {
      const reportData = {
        sessionId: session.id,
        name: `${session.name} - ${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        type,
        data: {
          session,
          greyfinchData,
          includeCharts: true,
          includeAIInsights: true,
          includeRecommendations: true
        },
        userId: authUser?.id
      };

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        const createdReport = await response.json();
        setReports(prev => [...prev, createdReport.report]);
        
        toast({
          title: "Report Generated",
          description: "Your report has been created and saved successfully.",
        });
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report Generation Failed",
        description: "An error occurred while generating the report.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        toast({
          title: "Session Deleted",
          description: "The session has been removed successfully.",
        });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Deletion Failed",
        description: "An error occurred while deleting the session.",
        variant: "destructive"
      });
    }
  };

  const togglePeriod = (periodId: string) => {
    setNewSession(prev => ({
      ...prev,
      selectedPeriods: prev.selectedPeriods.includes(periodId)
        ? prev.selectedPeriods.filter(id => id !== periodId)
        : [...prev.selectedPeriods, periodId]
    }));
  };

  const toggleLocation = (locationId: string) => {
    setNewSession(prev => ({
      ...prev,
      selectedLocations: prev.selectedLocations.includes(locationId)
        ? prev.selectedLocations.filter(id => id !== locationId)
        : [...prev.selectedLocations, locationId]
    }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{session.name}</h3>
                      {session.name.includes('Auto-created') && (
                        <Badge variant="secondary" className="text-xs">Auto</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{session.description}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>Periods: {session.periods.length}</span>
                      <span>Locations: {session.locations.length}</span>
                      <span>Created: {new Date(session.createdAt).toLocaleDateString()}</span>
                      {session.updatedAt && (
                        <span>Updated: {new Date(session.updatedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateReport(session, 'summary')}
                      disabled={isLoading}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Summary
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateReport(session, 'detailed')}
                      disabled={isLoading}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Detailed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateReport(session, 'executive')}
                      disabled={isLoading}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Executive
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {sessions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No sessions created yet</p>
                <p className="text-sm">Sessions will be automatically created as you add analysis periods and data</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{report.name}</h3>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {report.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </Card>
            ))}
            {reports.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No reports generated yet</p>
                <p className="text-sm">Generate reports from your analysis sessions</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Create New Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Create New Analysis Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Session Name */}
              <div className="space-y-2">
                <Label htmlFor="session-name">Session Name</Label>
                <Input
                  id="session-name"
                  value={newSession.name}
                  onChange={(e) => setNewSession(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Q1 2024 Performance Analysis"
                />
              </div>

              {/* Session Description */}
              <div className="space-y-2">
                <Label htmlFor="session-description">Description</Label>
                <Textarea
                  id="session-description"
                  value={newSession.description}
                  onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this session will analyze..."
                  rows={3}
                />
              </div>

              {/* Period Selection */}
              <div className="space-y-2">
                <Label>Analysis Periods</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {periods.map((period) => (
                    <div key={period.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`period-${period.id}`}
                        checked={newSession.selectedPeriods.includes(period.id)}
                        onCheckedChange={() => togglePeriod(period.id)}
                      />
                      <Label htmlFor={`period-${period.id}`} className="text-sm">
                        {period.title || period.id} ({period.startDate?.toLocaleDateString()} - {period.endDate?.toLocaleDateString()})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Selection */}
              {locations.length > 0 && (
                <div className="space-y-2">
                  <Label>Practice Locations</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {locations.map((location) => (
                      <div key={location.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`location-${location.id}`}
                          checked={newSession.selectedLocations.includes(location.id)}
                          onCheckedChange={() => toggleLocation(location.id)}
                        />
                        <Label htmlFor={`location-${location.id}`} className="text-sm">
                          {location.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Session Options */}
              <div className="space-y-3">
                <Label>Session Content</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-charts"
                      checked={newSession.includeCharts}
                      onCheckedChange={(checked) => setNewSession(prev => ({ ...prev, includeCharts: checked as boolean }))}
                    />
                    <Label htmlFor="include-charts" className="text-sm">
                      Include Charts & Visualizations
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-ai-insights"
                      checked={newSession.includeAIInsights}
                      onCheckedChange={(checked) => setNewSession(prev => ({ ...prev, includeAIInsights: checked as boolean }))}
                    />
                    <Label htmlFor="include-ai-insights" className="text-sm">
                      Include AI-Generated Insights & Summary
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-recommendations"
                      checked={newSession.includeRecommendations}
                      onCheckedChange={(checked) => setNewSession(prev => ({ ...prev, includeRecommendations: checked as boolean }))}
                    />
                    <Label htmlFor="include-recommendations" className="text-sm">
                      Include Business Recommendations
                    </Label>
                  </div>
                </div>
              </div>

              {/* Greyfinch Data Summary */}
              {greyfinchData && Object.keys(greyfinchData).length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Greyfinch Data Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <Users className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                      <div className="font-semibold">{greyfinchData.patients?.count || 0}</div>
                      <div className="text-gray-600">Patients</div>
                    </div>
                    <div className="text-center">
                      <BarChart3 className="h-6 w-6 mx-auto mb-1 text-green-500" />
                      <div className="font-semibold">{greyfinchData.appointments?.count || 0}</div>
                      <div className="text-gray-600">Appointments</div>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                      <div className="font-semibold">{greyfinchData.leads?.count || 0}</div>
                      <div className="text-gray-600">Leads</div>
                    </div>
                    <div className="text-center">
                      <Target className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                      <div className="font-semibold">{greyfinchData.locations ? Object.keys(greyfinchData.locations).length : 0}</div>
                      <div className="text-gray-600">Locations</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Create Button */}
              <Button
                onClick={handleCreateSession}
                disabled={isCreating || !newSession.name.trim() || newSession.selectedPeriods.length === 0}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Session...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Analysis Session
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
