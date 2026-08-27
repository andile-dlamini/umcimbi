import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { MessageSquare, Bug, Lightbulb, PartyPopper, MessageCircle, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FeedbackRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  feedback_type: 'bug' | 'idea' | 'praise' | 'other' | 'unmet_demand';
  message: string;
  page_url: string | null;
  user_agent: string | null;
  status: 'new' | 'reviewed' | 'resolved';
  created_at: string;
}

const TYPE_META: Record<FeedbackRow['feedback_type'], { label: string; icon: any; className: string }> = {
  bug: { label: 'Bug', icon: Bug, className: 'bg-red-500/10 text-red-700 border-red-500/30' },
  idea: { label: 'Idea', icon: Lightbulb, className: 'bg-amber-500/10 text-amber-700 border-amber-500/30' },
  praise: { label: 'Praise', icon: PartyPopper, className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' },
  other: { label: 'Other', icon: MessageCircle, className: 'bg-slate-500/10 text-slate-700 border-slate-500/30' },
  unmet_demand: { label: 'Unmet demand', icon: MessageSquare, className: 'bg-amber-500/10 text-amber-700 border-amber-500/30' },
};

export default function AdminFeedback() {
  const { toast } = useToast();
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<FeedbackRow | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  const fetchPhone = async (userId: string | null) => {
    if (!userId) {
      setSelectedPhone(null);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('phone_number')
      .eq('id', userId)
      .single();
    setSelectedPhone(data?.phone_number || null);
  };

  const handleSelect = async (row: FeedbackRow) => {
    setSelected(row);
    await fetchPhone(row.user_id);
  };

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setRows(data as unknown as FeedbackRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = rows.filter(r =>
    (typeFilter === 'all' || r.feedback_type === typeFilter) &&
    (statusFilter === 'all' || r.status === statusFilter)
  );

  const updateStatus = async (id: string, status: FeedbackRow['status']) => {
    const { error } = await supabase
      .from('feedback' as any)
      .update({ status })
      .eq('id', id);
    if (error) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
      return;
    }
    setRows(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
    if (selected?.id === id) setSelected({ ...selected, status });
    toast({ title: 'Updated', description: `Marked as ${status}.` });
  };

  const counts = {
    new: rows.filter(r => r.status === 'new').length,
    reviewed: rows.filter(r => r.status === 'reviewed').length,
    resolved: rows.filter(r => r.status === 'resolved').length,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          Feedback
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          User-submitted feedback from across the platform.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{counts.new}</p>
          <p className="text-xs text-muted-foreground">New</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{counts.reviewed}</p>
          <p className="text-xs text-muted-foreground">Reviewed</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{counts.resolved}</p>
          <p className="text-xs text-muted-foreground">Resolved</p>
        </CardContent></Card>
      </div>

      <div className="flex gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="idea">Idea</SelectItem>
            <SelectItem value="praise">Praise</SelectItem>
            <SelectItem value="other">Other</SelectItem>
            <SelectItem value="unmet_demand">Unmet demand</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No feedback yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => {
                    const meta = TYPE_META[r.feedback_type];
                    const Icon = meta.icon;
                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => handleSelect(r)}
                      >
                        <TableCell>
                          <Badge variant="outline" className={`${meta.className} gap-1`}>
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm truncate">{r.message}</p>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="truncate max-w-[180px]">{r.user_email || '—'}</div>
                          <div className="capitalize">{r.user_role || ''}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'new' ? 'default' : 'secondary'} className="capitalize text-xs">
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setSelectedPhone(null); } }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = TYPE_META[selected.feedback_type].icon;
                    return <Icon className="h-5 w-5" />;
                  })()}
                  {TYPE_META[selected.feedback_type].label}
                </SheetTitle>
                <SheetDescription>
                  {selected.user_email || 'Unknown user'} · {selected.user_role}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 mt-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Message</p>
                  <div className="p-3 rounded-md bg-muted/50 whitespace-pre-line text-sm">
                    {selected.message}
                  </div>
                </div>

                {selected.page_url && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Page</p>
                    <p className="text-sm font-mono break-all">{selected.page_url}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                  <p className="text-sm">{format(new Date(selected.created_at), 'dd MMM yyyy, HH:mm')}</p>
                </div>

                {selected.user_agent && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">User agent</p>
                    <p className="text-xs text-muted-foreground break-all">{selected.user_agent}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Status</p>
                  <div className="flex gap-2">
                    {(['new', 'reviewed', 'resolved'] as const).map(s => (
                      <Button
                        key={s}
                        size="sm"
                        variant={selected.status === s ? 'default' : 'outline'}
                        onClick={() => updateStatus(selected.id, s)}
                        className="capitalize"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedPhone && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Reply</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 text-emerald-700 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-800"
                      onClick={() => {
                        let num = selectedPhone.replace(/\D/g, '');
                        if (num.startsWith('0')) num = '27' + num.slice(1);
                        if (!num.startsWith('27')) num = '27' + num;
                        const text = encodeURIComponent(
                          `Hi, thanks for your feedback on UMCIMBI. We're following up on your ${selected.feedback_type === 'bug' ? 'bug report' : selected.feedback_type}.`
                        );
                        window.open(`https://wa.me/${num}?text=${text}`, '_blank');
                      }}
                    >
                      <Phone className="h-4 w-4" />
                      Reply on WhatsApp
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
