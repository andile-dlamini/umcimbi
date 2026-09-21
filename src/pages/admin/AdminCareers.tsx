import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Briefcase } from 'lucide-react';
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

interface JobApplicationRow {
  id: string;
  role_slug: string;
  name: string;
  email: string;
  story: string;
  socials: string | null;
  status: 'received' | 'shortlisted' | 'declined' | 'hired';
  created_at: string;
}

const STATUS_VARIANT: Record<JobApplicationRow['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  received: 'default',
  shortlisted: 'secondary',
  declined: 'destructive',
  hired: 'outline',
};

const ALL_STATUSES = ['received', 'shortlisted', 'declined', 'hired'] as const;

export default function AdminCareers() {
  const { toast } = useToast();
  const [rows, setRows] = useState<JobApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<JobApplicationRow | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_applications' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setRows(data as unknown as JobApplicationRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = rows.filter(r => statusFilter === 'all' || r.status === statusFilter);

  const updateStatus = async (id: string, status: JobApplicationRow['status']) => {
    setUpdating(true);
    if (status === 'declined') {
      const { error } = await supabase.functions.invoke('update-job-application-status', {
        body: { id, status },
      });
      setUpdating(false);
      if (error) {
        toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase
        .from('job_applications' as any)
        .update({ status })
        .eq('id', id);
      setUpdating(false);
      if (error) {
        toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
        return;
      }
    }
    setRows(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
    setSelected(prev => (prev && prev.id === id ? { ...prev, status } : prev));
    toast({
      title: 'Updated',
      description: status === 'declined'
        ? 'Marked as declined — decline email sent.'
        : `Marked as ${status}.`,
    });
  };

  const counts = {
    received: rows.filter(r => r.status === 'received').length,
    shortlisted: rows.filter(r => r.status === 'shortlisted').length,
    declined: rows.filter(r => r.status === 'declined').length,
    hired: rows.filter(r => r.status === 'hired').length,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          Careers
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Applications submitted through the Careers page.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{counts.received}</p>
          <p className="text-xs text-muted-foreground">Received</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{counts.shortlisted}</p>
          <p className="text-xs text-muted-foreground">Shortlisted</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{counts.declined}</p>
          <p className="text-xs text-muted-foreground">Declined</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{counts.hired}</p>
          <p className="text-xs text-muted-foreground">Hired</p>
        </CardContent></Card>
      </div>

      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No applications yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Story</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r)}>
                      <TableCell>
                        <p className="text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{r.email}</p>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm truncate">{r.story}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[r.status]} className="capitalize text-xs">
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>{selected.email}</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 mt-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Story</p>
                  <div className="p-3 rounded-md bg-muted/50 whitespace-pre-line text-sm">
                    {selected.story}
                  </div>
                </div>

                {selected.socials && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Socials</p>
                    <p className="text-sm break-all">{selected.socials}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                  <p className="text-sm">{format(new Date(selected.created_at), 'dd MMM yyyy, HH:mm')}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_STATUSES.map(s => (
                      <Button
                        key={s}
                        size="sm"
                        variant={selected.status === s ? 'default' : 'outline'}
                        disabled={updating}
                        onClick={() => updateStatus(selected.id, s)}
                        className="capitalize"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Marking "declined" automatically emails the applicant.
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
