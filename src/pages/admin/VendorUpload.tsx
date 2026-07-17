import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { VendorProfileForm } from '@/components/vendors/VendorProfileForm';
import { toast } from 'sonner';
import { CheckCircle2, Circle, MessageSquare, Eye, Pencil, AlertTriangle } from 'lucide-react';
import type { Vendor } from '@/types/database';

interface AdminVendorRow extends Vendor {}

type LoginStatus = 'unknown' | 'logged_in' | 'not_logged_in';

export default function VendorUpload() {
  const [tab, setTab] = useState<'new' | 'manage'>('new');

  // NEW VENDOR flow
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [createdVendorId, setCreatedVendorId] = useState<string | null>(null);

  const handleCreateAccount = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('Name and phone number are required');
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke('bulk-vendor-import', {
      body: { action: 'create_vendor_account', name: newName.trim(), phone_number: newPhone.trim() },
    });
    setCreating(false);
    if (error) {
      const anyErr = error as any;
      const msg = anyErr?.context?.body ? String(anyErr.context.body) : (error.message || 'Failed to create account');
      if (msg.includes('phone_already_registered')) {
        toast.error('This phone number is already registered');
      } else {
        toast.error(msg);
      }
      return;
    }
    if ((data as any)?.error) {
      toast.error((data as any).error === 'phone_already_registered' ? 'This phone number is already registered' : (data as any).error);
      return;
    }
    setCreatedUserId((data as any).user_id);
    toast.success('Account created — now fill in the vendor profile below');
  };

  const resetNewFlow = () => {
    setNewName('');
    setNewPhone('');
    setCreatedUserId(null);
    setCreatedVendorId(null);
  };

  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader title="Vendor Upload" showBack />
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="new">New Vendor</TabsTrigger>
            <TabsTrigger value="manage">Manage Vendors</TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            {!createdUserId ? (
              <Card>
                <CardHeader>
                  <CardTitle>Step 1 — Create account</CardTitle>
                  <CardDescription>Registers a shadow account for the vendor. They'll set their password using "Forgot password" later.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Vendor name *</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Sipho's Catering" className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone number *</Label>
                    <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="e.g., 0821234567" className="h-12" inputMode="tel" />
                  </div>
                  <Button onClick={handleCreateAccount} disabled={creating} className="w-full h-12">
                    {creating ? 'Creating…' : 'Create Account'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle>Account created</CardTitle>
                      <CardDescription>User ID: <code className="text-xs">{createdUserId}</code></CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={resetNewFlow}>Start over</Button>
                  </CardHeader>
                </Card>

                {!createdVendorId ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Step 2 — Vendor profile</CardTitle>
                      <CardDescription>Same form the vendor would fill in themselves.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <VendorProfileForm
                        ownerUserId={createdUserId}
                        signupSource="admin_manual"
                        mode="create"
                        stepped={false}
                        defaultPhoneNumber={newPhone.trim() ? newPhone.trim() : null}
                        onCreated={(vendorId) => { setCreatedVendorId(vendorId); toast.success('Vendor profile created'); }}
                        submitLabel="Create vendor profile"
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <VendorReleaseActions vendorId={createdVendorId} onReset={resetNewFlow} />
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="manage">
            <ManageVendorsTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function VendorReleaseActions({ vendorId, onReset }: { vendorId: string; onReset: () => void }) {
  const [status, setStatus] = useState<{ smsSent: boolean; released: boolean; loginStatus: LoginStatus }>({ smsSent: false, released: false, loginStatus: 'unknown' });
  const [busy, setBusy] = useState<string | null>(null);

  const refreshLogin = useCallback(async () => {
    const { data } = await supabase.functions.invoke('bulk-vendor-import', {
      body: { action: 'get_login_status', vendor_ids: [vendorId] },
    });
    const r = (data as any)?.results?.[0];
    if (r) setStatus(s => ({ ...s, loginStatus: r.has_logged_in ? 'logged_in' : 'not_logged_in' }));
  }, [vendorId]);

  useEffect(() => { refreshLogin(); }, [refreshLogin]);

  const sendSms = async () => {
    setBusy('sms');
    const { data, error } = await supabase.functions.invoke('bulk-vendor-import', {
      body: { action: 'send_registration_sms', vendor_ids: [vendorId] },
    });
    setBusy(null);
    if (error) return toast.error(error.message || 'Failed to send SMS');
    const r = (data as any)?.results?.[0];
    if (r?.status === 'sent') { toast.success('SMS sent to vendor'); setStatus(s => ({ ...s, smsSent: true })); }
    else toast.error(r?.reason ?? 'Failed to send SMS');
  };

  const releasePublic = async () => {
    setBusy('public');
    const { data, error } = await supabase.functions.invoke('bulk-vendor-import', {
      body: { action: 'release_to_public', vendor_ids: [vendorId] },
    });
    setBusy(null);
    if (error) return toast.error(error.message || 'Failed to release');
    const r = (data as any)?.results?.[0];
    if (r?.status === 'released') { toast.success('Vendor is now public'); setStatus(s => ({ ...s, released: true })); }
    else toast.error(r?.reason ?? 'Failed to release');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3 — Release</CardTitle>
        <CardDescription>Each release step is independent. Login status is a soft warning only.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.loginStatus === 'not_logged_in' && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <p className="text-xs text-muted-foreground">Vendor hasn't logged in yet. You can still release to public — this is a soft warning.</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={sendSms} disabled={busy === 'sms'} variant={status.smsSent ? 'outline' : 'default'}>
            <MessageSquare className="h-4 w-4 mr-1" />
            {status.smsSent ? 'Resend SMS' : 'Release to Vendor (SMS)'}
          </Button>
          <Button onClick={releasePublic} disabled={busy === 'public' || status.released} variant={status.released ? 'outline' : 'default'}>
            <Eye className="h-4 w-4 mr-1" />
            {status.released ? 'Public ✓' : 'Release to Public'}
          </Button>
          <Button variant="ghost" onClick={refreshLogin}>Refresh login status</Button>
          <Button variant="ghost" onClick={onReset}>Add another vendor</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ManageVendorsTable() {
  const [rows, setRows] = useState<AdminVendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginMap, setLoginMap] = useState<Record<string, LoginStatus>>({});
  const [smsSent, setSmsSent] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [editVendor, setEditVendor] = useState<AdminVendorRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('signup_source', 'admin_manual')
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load vendors');
    else setRows((data ?? []) as AdminVendorRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (rows.length === 0) return;
    const ids = rows.map(r => r.id);
    supabase.functions.invoke('bulk-vendor-import', {
      body: { action: 'get_login_status', vendor_ids: ids },
    }).then(({ data }) => {
      const results = (data as any)?.results ?? [];
      const map: Record<string, LoginStatus> = {};
      for (const r of results) map[r.vendor_id] = r.has_logged_in ? 'logged_in' : 'not_logged_in';
      setLoginMap(map);
    });
  }, [rows]);

  const sendSms = async (vendorId: string) => {
    setBusy(`sms-${vendorId}`);
    const { data, error } = await supabase.functions.invoke('bulk-vendor-import', {
      body: { action: 'send_registration_sms', vendor_ids: [vendorId] },
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    const r = (data as any)?.results?.[0];
    if (r?.status === 'sent') { toast.success('SMS sent'); setSmsSent(m => ({ ...m, [vendorId]: true })); }
    else toast.error(r?.reason ?? 'Failed');
  };

  const releasePublic = async (vendorId: string) => {
    setBusy(`pub-${vendorId}`);
    const { data, error } = await supabase.functions.invoke('bulk-vendor-import', {
      body: { action: 'release_to_public', vendor_ids: [vendorId] },
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    const r = (data as any)?.results?.[0];
    if (r?.status === 'released') { toast.success('Vendor released to public'); load(); }
    else toast.error(r?.reason ?? 'Failed');
  };

  const hasMedia = (v: AdminVendorRow) => !!v.logo_url || (Array.isArray(v.image_urls) && v.image_urls.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin-created vendors</CardTitle>
        <CardDescription>{rows.length} vendor{rows.length === 1 ? '' : 's'} created by admins.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No admin-created vendors yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Vendor SMS</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="font-medium">{v.name}</div>
                      <div className="text-xs text-muted-foreground">{v.phone_number ?? '—'}</div>
                    </TableCell>
                    <TableCell>{v.category}</TableCell>
                    <TableCell>
                      {hasMedia(v) ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell>
                      {smsSent[v.id] ? <Badge variant="secondary">Sent</Badge> : <Badge variant="outline">Not sent</Badge>}
                    </TableCell>
                    <TableCell>
                      {v.is_active ? <Badge>Live</Badge> : <Badge variant="outline">Draft</Badge>}
                    </TableCell>
                    <TableCell>
                      {loginMap[v.id] === 'logged_in' ? (
                        <Badge variant="secondary">Logged in</Badge>
                      ) : loginMap[v.id] === 'not_logged_in' ? (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-600">Not yet</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => sendSms(v.id)} disabled={busy === `sms-${v.id}`}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => releasePublic(v.id)} disabled={busy === `pub-${v.id}` || v.is_active}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditVendor(v)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!editVendor} onOpenChange={(o) => !o && setEditVendor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit vendor — {editVendor?.name}</DialogTitle>
          </DialogHeader>
          {editVendor && (
            <VendorProfileForm
              ownerUserId={editVendor.owner_user_id ?? ''}
              signupSource="admin_manual"
              mode="edit"
              existingVendor={editVendor}
              stepped={false}
              onCreated={() => { setEditVendor(null); load(); }}
              submitLabel="Save changes"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
