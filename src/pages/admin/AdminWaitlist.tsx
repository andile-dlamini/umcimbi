import { useState, useEffect } from 'react';
import { Download, Users, Store, Calendar, Handshake, Mail, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface WaitlistEntry {
  id: string;
  full_name: string;
  business_name: string | null;
  email: string | null;
  phone_number: string | null;
  role: string | null;
  source: string | null;
  created_at: string | null;
  launch_email_sent_at?: string | null;
}

export default function AdminWaitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [ndabeVendors, setNdabeVendors] = useState<number>(0);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);

  const loadEntries = async () => {
    const { data, error } = await supabase
      .from('waitlist_signups' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const waitlist = data as unknown as WaitlistEntry[];

      const emails = waitlist.map(e => e.email).filter(Boolean) as string[];
      const phones = waitlist.map(e => e.phone_number).filter(Boolean) as string[];

      if (emails.length || phones.length) {
        const filters: string[] = [];
        if (emails.length) filters.push(`email.in.(${emails.map(e => `"${e}"`).join(',')})`);
        if (phones.length) filters.push(`phone_number.in.(${phones.map(p => `"${p}"`).join(',')})`);

        const { data: vendors } = await supabase
          .from('vendors')
          .select('name, email, phone_number')
          .or(filters.join(','));

        if (vendors) {
          const byEmail = new Map(vendors.filter(v => v.email).map(v => [v.email!.toLowerCase(), v.name]));
          const byPhone = new Map(vendors.filter(v => v.phone_number).map(v => [v.phone_number!, v.name]));

          waitlist.forEach(entry => {
            if (entry.role !== 'vendor') return;
            const matched =
              (entry.email && byEmail.get(entry.email.toLowerCase())) ||
              (entry.phone_number && byPhone.get(entry.phone_number));
            if (matched) entry.business_name = matched;
          });
        }
      }

      setEntries(waitlist);
    }

    const { count } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('signup_source', 'ndabe');
    if (count !== null) setNdabeVendors(count);

    setIsLoading(false);
  };

  useEffect(() => { loadEntries(); }, []);

  const filtered = entries.filter(e => {
    const matchesSearch =
      !search ||
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.phone_number?.includes(search);
    const matchesRole = !roleFilter || e.role === roleFilter;
    const matchesSource = !sourceFilter || e.source === sourceFilter;
    return matchesSearch && matchesRole && matchesSource;
  });

  const organisersCount = entries.filter(e => e.role === 'organiser').length;
  const vendorsCount = entries.filter(e => e.role === 'vendor').length;
  const ndabeCount = entries.filter(e => e.source === 'ndabe').length;
  const pendingLaunchCount = entries.filter(e => e.email && !e.launch_email_sent_at).length;
  const sentLaunchCount = entries.filter(e => e.launch_email_sent_at).length;

  const sendOne = async (entry: WaitlistEntry) => {
    if (!entry.email) {
      toast.error('No email on file for this signup');
      return;
    }
    setSendingId(entry.id);
    try {
      const { data, error } = await supabase.functions.invoke(
        'send-waitlist-launch-emails',
        { body: { signupId: entry.id } }
      );
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      if (sent > 0) {
        toast.success(`Launch email sent to ${entry.email}`);
        await loadEntries();
      } else {
        toast.error('Could not send. Check logs for details.');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send');
    } finally {
      setSendingId(null);
    }
  };

  const sendBulk = async () => {
    setBulkSending(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'send-waitlist-launch-emails',
        { body: {} }
      );
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      const failed = (data as any)?.failed ?? 0;
      toast.success(`Sent ${sent} launch email${sent === 1 ? '' : 's'}${failed ? ` · ${failed} failed` : ''}`);
      await loadEntries();
    } catch (e: any) {
      toast.error(e?.message || 'Bulk send failed');
    } finally {
      setBulkSending(false);
      setBulkConfirmOpen(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Name', 'Business / Service', 'Email', 'Phone', 'Role', 'Source', 'Signed Up', 'Launch Email Sent'];
    const rows = filtered.map(e => [
      e.full_name,
      e.business_name || '',
      e.email || '',
      e.phone_number || '',
      e.role || '',
      e.source || '',
      e.created_at ? format(new Date(e.created_at), 'yyyy-MM-dd HH:mm') : '',
      e.launch_email_sent_at ? format(new Date(e.launch_email_sent_at), 'yyyy-MM-dd HH:mm') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waitlist-signups-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Waitlist Signups</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All pre-launch signups with contact details
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="cursor-pointer" onClick={() => { setRoleFilter(null); setSourceFilter(null); }}>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{entries.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer ${roleFilter === 'organiser' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setRoleFilter(roleFilter === 'organiser' ? null : 'organiser')}
        >
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-secondary" />
            <p className="text-2xl font-bold">{organisersCount}</p>
            <p className="text-xs text-muted-foreground">Organisers</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer ${roleFilter === 'vendor' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setRoleFilter(roleFilter === 'vendor' ? null : 'vendor')}
        >
          <CardContent className="p-4 text-center">
            <Store className="h-5 w-5 mx-auto mb-1 text-accent-foreground" />
            <p className="text-2xl font-bold">{vendorsCount}</p>
            <p className="text-xs text-muted-foreground">Vendors</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer ${sourceFilter === 'ndabe' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setSourceFilter(sourceFilter === 'ndabe' ? null : 'ndabe')}
        >
          <CardContent className="p-4 text-center">
            <Handshake className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
            <p className="text-2xl font-bold">{ndabeCount}</p>
            <p className="text-xs text-muted-foreground">Via Ndabe</p>
          </CardContent>
        </Card>
      </div>

      {/* Launch email bulk action */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-semibold text-foreground">Launch announcement email</p>
            <p className="text-xs text-muted-foreground">
              {sentLaunchCount} sent · {pendingLaunchCount} pending (with email on file)
            </p>
          </div>
          <Button
            onClick={() => setBulkConfirmOpen(true)}
            disabled={pendingLaunchCount === 0 || bulkSending}
            size="sm"
          >
            {bulkSending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
            ) : (
              <><Mail className="h-4 w-4 mr-2" /> Send to {pendingLaunchCount} pending</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Search and export */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-1" />
          CSV
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {search || roleFilter ? 'No matching signups found' : 'No waitlist signups yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Business / Service</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Launch email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.full_name}</TableCell>
                      <TableCell className="text-sm">
                        {entry.business_name
                          ? <span>{entry.business_name} <span className="text-[10px] text-muted-foreground">(registered)</span></span>
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.email || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.phone_number || '—'}
                      </TableCell>
                      <TableCell>
                        {entry.role ? (
                          <Badge variant={entry.role === 'vendor' ? 'secondary' : 'outline'} className="capitalize text-xs">
                            {entry.role}
                          </Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {entry.source === 'ndabe' ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-yellow-600/40 text-yellow-600 bg-yellow-600/5 px-1.5 py-0"
                          >
                            Ndabe
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground capitalize">
                            {entry.source?.replace(/_/g, ' ') || '—'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {entry.created_at
                          ? format(new Date(entry.created_at), 'dd MMM yyyy, HH:mm')
                          : '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {entry.launch_email_sent_at ? (
                          <span className="inline-flex items-center text-[11px] text-green-700">
                            <Check className="h-3 w-3 mr-1" />
                            {format(new Date(entry.launch_email_sent_at), 'dd MMM HH:mm')}
                          </span>
                        ) : entry.email ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={sendingId === entry.id}
                            onClick={() => sendOne(entry)}
                          >
                            {sendingId === entry.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Mail className="h-3 w-3 mr-1" />
                            )}
                            Send
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">No email</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Vendor Registrations via Ndabe
          </CardTitle>
          <CardDescription>
            Vendors who registered directly via the Ndabe referral link
            (/join/vendor?ref=ndabe) — these go straight to account creation
            rather than the waitlist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{ndabeVendors}</p>
          <p className="text-xs text-muted-foreground mt-1">
            registered vendors attributed to Ndabe
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send launch email to {pendingLaunchCount} signups?</AlertDialogTitle>
            <AlertDialogDescription>
              Each person will receive the "UMCIMBI is now live" announcement once.
              Already-notified signups will be skipped automatically. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={sendBulk} disabled={bulkSending}>
              {bulkSending ? 'Sending…' : 'Send now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
