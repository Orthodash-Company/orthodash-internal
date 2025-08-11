import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Share2, Copy, Mail, Link, Users, Calendar, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  reportData: any;
  trigger?: React.ReactNode;
}

export function ShareModal({ reportData, trigger }: ShareModalProps) {
  const [shareMethod, setShareMethod] = useState<'link' | 'email'>('link');
  const [shareTitle, setShareTitle] = useState('ORTHODASH Analytics Report');
  const [shareMessage, setShareMessage] = useState('Check out this analytics report from ORTHODASH');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate shareable link (in production, this would be a real API call)
  const shareableLink = `${window.location.origin}/shared/${btoa(JSON.stringify({
    title: shareTitle,
    timestamp: Date.now(),
    periods: reportData?.periods?.length || 0
  }))}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Shareable link has been copied to clipboard."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`${shareMessage}\n\nView the report: ${shareableLink}`);
    const mailtoLink = `mailto:${emailRecipients}?subject=${subject}&body=${body}`;
    window.open(mailtoLink);
    
    toast({
      title: "Email Draft Created",
      description: "Your default email client should open with the report link."
    });
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Report
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Report Summary */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Report Summary</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-700">{shareTitle}</p>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {reportData?.periods?.length || 0} Periods
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Generated {new Date().toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Share Method Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Share Method</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={shareMethod === 'link' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShareMethod('link')}
                className="flex items-center gap-2"
              >
                <Link className="h-4 w-4" />
                Share Link
              </Button>
              <Button
                variant={shareMethod === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShareMethod('email')}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>

          <Separator />

          {shareMethod === 'link' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="share-title">Report Title</Label>
                <Input
                  id="share-title"
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  placeholder="Enter report title"
                />
              </div>

              <div>
                <Label htmlFor="share-link">Shareable Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-link"
                    value={shareableLink}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    size="sm"
                    variant="outline"
                    className="px-3"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  This link allows view-only access to your analytics report
                </p>
              </div>
            </div>
          )}

          {shareMethod === 'email' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-recipients">Recipients</Label>
                <Input
                  id="email-recipients"
                  type="email"
                  multiple
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="colleague@teamorthodontics.com"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Separate multiple emails with commas
                </p>
              </div>

              <div>
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  placeholder="Email subject"
                />
              </div>

              <div>
                <Label htmlFor="email-message">Message</Label>
                <Textarea
                  id="email-message"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Add a personal message"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleEmailShare}
                disabled={!emailRecipients.trim()}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                Create Email
              </Button>
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Secure Sharing</p>
                <p className="text-blue-800 mt-1">
                  Shared reports are view-only and expire after 30 days. Recipients cannot edit or download raw data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}