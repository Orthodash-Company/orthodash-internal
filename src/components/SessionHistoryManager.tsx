import { useState } from "react";
import { useSessionManager } from "@/hooks/use-session-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Calendar, 
  Share2, 
  RotateCcw,
  Save,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface SessionHistoryManagerProps {
  trigger?: React.ReactNode;
  onRestoreSession?: (session: any) => void;
  onPreviewSession?: (session: any) => void;
  onDownloadSession?: (session: any) => void;
  onShareSession?: (session: any) => void;
}

export function SessionHistoryManager({ 
  trigger, 
  onRestoreSession,
  onPreviewSession,
  onDownloadSession,
  onShareSession
}: SessionHistoryManagerProps) {
  const { 
    sessions, 
    isLoading, 
    deleteSession,
    loadSession 
  } = useSessionManager();
  
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isRestoring, setIsRestoring] = useState<number | null>(null);
  const [isPreviewing, setIsPreviewing] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  const [isSharing, setIsSharing] = useState<number | null>(null);

  const handleRestoreSession = async (sessionId: number) => {
    if (!sessionId) return;
    
    setIsRestoring(sessionId);
    try {
      const session = await loadSession(sessionId);
      if (onRestoreSession) {
        onRestoreSession(session);
      }
      toast({
        title: "Session Restored",
        description: "Session data has been loaded into the current workspace",
      });
    } catch (error) {
      console.error('Error restoring session:', error);
      toast({
        title: "Error",
        description: "Failed to restore session",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(null);
    }
  };

  const handlePreviewSession = async (sessionId: number) => {
    if (!sessionId) return;
    
    setIsPreviewing(sessionId);
    try {
      const session = await loadSession(sessionId);
      if (onPreviewSession) {
        onPreviewSession(session);
      }
    } catch (error) {
      console.error('Error previewing session:', error);
      toast({
        title: "Error",
        description: "Failed to preview session",
        variant: "destructive"
      });
    } finally {
      setIsPreviewing(null);
    }
  };

  const handleDownloadSession = async (sessionId: number) => {
    if (!sessionId) return;
    
    setIsDownloading(sessionId);
    try {
      const session = await loadSession(sessionId);
      if (onDownloadSession) {
        onDownloadSession(session);
      } else {
        // Default download behavior
        const sessionData = JSON.stringify(session, null, 2);
        const blob = new Blob([sessionData], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orthodash-session-${sessionId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      toast({
        title: "Download Complete",
        description: "Session data has been downloaded",
      });
    } catch (error) {
      console.error('Error downloading session:', error);
      toast({
        title: "Error",
        description: "Failed to download session",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const handleShareSession = async (sessionId: number) => {
    if (!sessionId) return;
    
    setIsSharing(sessionId);
    try {
      const session = await loadSession(sessionId);
      if (onShareSession) {
        onShareSession(session);
      } else {
        // Default share behavior - copy session data to clipboard
        const sessionData = JSON.stringify(session, null, 2);
        await navigator.clipboard.writeText(sessionData);
        toast({
          title: "Session Shared",
          description: "Session data has been copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing session:', error);
      toast({
        title: "Error",
        description: "Failed to share session",
        variant: "destructive"
      });
    } finally {
      setIsSharing(null);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!sessionId) return;
    
    if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      setIsDeleting(sessionId);
      try {
        await deleteSession(sessionId);
      } catch (error) {
        console.error('Error deleting session:', error);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const getSessionSummary = (session: any) => {
    const summary = [];
    
    if (session.greyfinchData?.counts) {
      const counts = session.greyfinchData.counts;
      summary.push(`${counts.appointments || 0} appointments`);
      summary.push(`${counts.locations || 0} locations`);
      summary.push(`${counts.leads || 0} patients`);
    }
    
    if (session.periods?.length) {
      summary.push(`${session.periods.length} analysis periods`);
    }
    
    if (session.acquisitionCosts?.totals) {
      summary.push(`$${session.acquisitionCosts.totals.total || 0} total costs`);
    }
    
    if (session.aiSummary) {
      summary.push('AI summary generated');
    }
    
    return summary.length > 0 ? summary.join(' • ') : 'No data available';
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="flex items-center gap-2">
      <Clock className="h-4 w-4" />
      <span className="hidden sm:inline">Session History</span>
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Session History</DialogTitle>
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
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-500">
                Your session history will appear here once you save your first session.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {session.name}
                          <Badge variant="secondary" className="text-xs">
                            {format(new Date(session.createdAt || ''), 'MMM dd, yyyy')}
                          </Badge>
                        </CardTitle>
                        {session.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {session.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRestoreSession(session.id!)}
                          disabled={isRestoring === session.id}
                          title="Restore Session"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePreviewSession(session.id!)}
                          disabled={isPreviewing === session.id}
                          title="Preview Summary"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadSession(session.id!)}
                          disabled={isDownloading === session.id}
                          title="Download Session"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleShareSession(session.id!)}
                          disabled={isSharing === session.id}
                          title="Share Session"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSession(session.id!)}
                          disabled={isDeleting === session.id}
                          title="Delete Session"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700">
                        {getSessionSummary(session)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created: {format(new Date(session.createdAt || ''), 'MMM dd, yyyy HH:mm')}
                        </span>
                        {session.updatedAt && session.updatedAt !== session.createdAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Updated: {format(new Date(session.updatedAt), 'MMM dd, yyyy HH:mm')}
                          </span>
                        )}
                      </div>
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
