import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquarePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

type FeedbackType = 'bug' | 'idea' | 'praise' | 'other';

export function FeedbackButton() {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('idea');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const reset = () => {
    setType('idea');
    setMessage('');
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      toast({
        title: 'Message too short',
        description: 'Please share at least a sentence (10+ characters).',
        variant: 'destructive',
      });
      return;
    }
    if (trimmed.length > 2000) {
      toast({
        title: 'Message too long',
        description: 'Please keep feedback under 2000 characters.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send-feedback', {
        body: {
          feedback_type: type,
          message: trimmed,
          page_url: window.location.origin + location.pathname,
          user_agent: navigator.userAgent,
        },
      });
      if (error) throw error;
      toast({
        title: 'Thank you!',
        description: 'We got your feedback.',
      });
      reset();
      setOpen(false);
    } catch (err: any) {
      console.error('feedback submit error:', err);
      toast({
        title: 'Could not send feedback',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 shadow-lg rounded-full gap-2 pl-3 pr-4"
          aria-label="Send feedback"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="hidden sm:inline">Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your feedback</DialogTitle>
          <DialogDescription>
            Found a bug? Have an idea? Tell us — it goes straight to the team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
              <SelectTrigger id="feedback-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">🐞 Bug</SelectItem>
                <SelectItem value="idea">💡 Idea</SelectItem>
                <SelectItem value="praise">🎉 Praise</SelectItem>
                <SelectItem value="other">💬 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">Message</Label>
            <Textarea
              id="feedback-message"
              placeholder="What's on your mind?"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/2000
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Page: <span className="font-mono">{location.pathname}</span>
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
