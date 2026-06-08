import { useState, useEffect, useCallback } from 'react';
import {
  BadgeCheck,
  XCircle,
  ExternalLink,
  Instagram,
  Facebook,
  Music2,
  Globe,
  Phone,
  MapPin,
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';

interface PendingVendor {
  id: string;
  name: string;
  category: string | null;
  about: string | null;
  location: string | null;
  phone_number: string | null;
  business_verification_status: string | null;
  vendor_business_type: string | null;
  registration_number: string | null;
  vat_number: string | null;
  registered_business_name: string | null;
  bank_name: string | null;
  bank_account_holder_name: string | null;
  bank_account_number: string | null;
  bank_account_type: string | null;
  bank_branch_code: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  image_urls: string[] | null;
  logo_url: string | null;
  admin_approval_notes: string | null;
  selfie_photo_url: string | null;
  selfie_request_sent_at: string | null;
  created_at: string;
}

interface VerificationDoc {
  id: string;
  vendor_id: string;
  doc_type: string;
  file_url: string;
  status: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  cipc_registration: 'CIPC Registration',
  proof_of_address: 'Proof of Address',
  bank_confirmation: 'Bank Confirmation',
  vat_certificate: 'VAT Certificate',
  other: 'Other Document',
};

const CHECKLIST_ITEMS = [
  'Identity confirmed',
  'CIPC/registration doc reviewed',
  'Social media checked',
  'Bank details present and plausible',
];

const VENDOR_SELECT = `
  id, name, category, about, location, phone_number,
  business_verification_status, vendor_business_type,
  registration_number, vat_number, registered_business_name,
  bank_name, bank_account_holder_name, bank_account_number,
  bank_account_type, bank_branch_code,
  instagram_url, tiktok_url, facebook_url, website_url,
  image_urls, logo_url, admin_approval_notes,
  selfie_photo_url, selfie_request_sent_at, created_at
`;

function maskAccount(num: string | null): string {
  if (!num) return '—';
  const digits = num.replace(/\D/g, '');
  if (digits.length <= 4) return '••••' + digits;
  return '••••' + digits.slice(-4);
}

export default function VendorVerificationQueue() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<PendingVendor[]>([]);
  const [docs, setDocs] = useState<Record<string, VerificationDoc[]>>({});
  const [signedSelfies, setSignedSelfies] = useState<Record<string, string>>({});
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [checklist, setChecklist] = useState<Record<string, boolean[]>>({});
  const [confirmReject, setConfirmReject] = useState<string | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data: vendorData, error } = await supabase
      .from('vendors')
      .select(VENDOR_SELECT)
      .eq('is_active', false)
      .eq('is_demo', false)
      .eq('is_banned', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error);
      toast.error('Failed to load approval queue');
      setIsLoading(false);
      return;
    }

    const list = (vendorData ?? []) as unknown as PendingVendor[];
    setVendors(list);

    // Seed notes drafts + checklist defaults
    const notes: Record<string, string> = {};
    const cl: Record<string, boolean[]> = {};
    list.forEach((v) => {
      notes[v.id] = v.admin_approval_notes ?? '';
      cl[v.id] = [false, false, false, false];
    });
    setNotesDraft(notes);
    setChecklist(cl);

    // Fetch docs
    const ids = list.map((v) => v.id);
    if (ids.length > 0) {
      const { data: docData } = await supabase
        .from('vendor_verification_documents')
        .select('id, vendor_id, doc_type, file_url, status')
        .in('vendor_id', ids);
      const grouped: Record<string, VerificationDoc[]> = {};
      (docData ?? []).forEach((d: any) => {
        (grouped[d.vendor_id] ??= []).push(d as VerificationDoc);
      });
      setDocs(grouped);
    } else {
      setDocs({});
    }

    // Sign selfies
    const signed: Record<string, string> = {};
    await Promise.all(
      list
        .filter((v) => v.selfie_photo_url)
        .map(async (v) => {
          const { data } = await supabase.storage
            .from('vendor-selfies')
            .createSignedUrl(v.selfie_photo_url!, 300);
          if (data?.signedUrl) signed[v.id] = data.signedUrl;
        })
    );
    setSignedSelfies(signed);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setVendorBusy = (id: string, value: boolean) =>
    setBusy((b) => ({ ...b, [id]: value }));

  const removeFromList = (id: string) =>
    setVendors((prev) => prev.filter((v) => v.id !== id));

  const handleNotesBlur = async (vendor: PendingVendor) => {
    const draft = notesDraft[vendor.id] ?? '';
    if (draft === (vendor.admin_approval_notes ?? '')) return;
    const { error } = await supabase
      .from('vendors')
      .update({ admin_approval_notes: draft || null })
      .eq('id', vendor.id);
    if (error) {
      toast.error('Failed to save notes');
      return;
    }
    setVendors((prev) =>
      prev.map((v) => (v.id === vendor.id ? { ...v, admin_approval_notes: draft } : v))
    );
    toast.success('Notes saved');
  };

  const handleRequestSelfie = async (vendor: PendingVendor) => {
    setVendorBusy(vendor.id, true);
    try {
      const token = crypto.randomUUID();
      const { error } = await supabase
        .from('vendors')
        .update({
          selfie_request_token: token,
          selfie_request_sent_at: new Date().toISOString(),
        })
        .eq('id', vendor.id);
      if (error) throw error;

      await supabase.functions.invoke('send-vendor-status-sms', {
        body: { vendor_id: vendor.id, sms_type: 'request_selfie' },
      });
      const link = `${window.location.origin}/verify/selfie?token=${token}`;
      await supabase.functions.invoke('send-vendor-status-sms', {
        body: { vendor_id: vendor.id, sms_type: 'selfie_link', notes: link },
      });

      toast.success('Selfie link sent via SMS');
      await fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to request selfie');
    } finally {
      setVendorBusy(vendor.id, false);
    }
  };

  const handleApprove = async (vendor: PendingVendor) => {
    setVendorBusy(vendor.id, true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ is_active: true })
        .eq('id', vendor.id);
      if (error) throw error;

      supabase.functions
        .invoke('send-vendor-status-sms', {
          body: { vendor_id: vendor.id, sms_type: 'approved' },
        })
        .catch((e) => console.error('Approve SMS failed:', e));

      supabase
        .rpc('calculate_vendor_trust_score', { p_vendor_id: vendor.id })
        .then(({ error: rpcErr }) => {
          if (rpcErr) console.error('Trust score recalc failed:', rpcErr);
        });

      toast.success(`${vendor.name} approved & activated`);
      removeFromList(vendor.id);
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve vendor');
    } finally {
      setVendorBusy(vendor.id, false);
    }
  };

  const handleVerifyBusiness = async (vendor: PendingVendor) => {
    setVendorBusy(vendor.id, true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          business_verification_status: 'verified',
          verification_reviewed_at: new Date().toISOString(),
          verification_reviewed_by: user?.id ?? null,
        })
        .eq('id', vendor.id);
      if (error) throw error;
      toast.success('Business verified');
      setVendors((prev) =>
        prev.map((v) =>
          v.id === vendor.id
            ? { ...v, business_verification_status: 'verified' }
            : v
        )
      );
    } catch (e) {
      console.error(e);
      toast.error('Failed to verify business');
    } finally {
      setVendorBusy(vendor.id, false);
    }
  };

  const handleRequestInfo = async (vendor: PendingVendor) => {
    const notes = (notesDraft[vendor.id] ?? '').trim();
    if (!notes) {
      toast.error('Please add notes describing what is needed');
      return;
    }
    setVendorBusy(vendor.id, true);
    try {
      // Persist notes first
      await supabase
        .from('vendors')
        .update({ admin_approval_notes: notes })
        .eq('id', vendor.id);

      const { error } = await supabase.functions.invoke('send-vendor-status-sms', {
        body: { vendor_id: vendor.id, sms_type: 'request_info', notes },
      });
      if (error) throw error;
      toast.success('More-info SMS sent');
    } catch (e) {
      console.error(e);
      toast.error('Failed to send SMS');
    } finally {
      setVendorBusy(vendor.id, false);
    }
  };

  const handleReject = async (vendor: PendingVendor, permanent: boolean) => {
    setVendorBusy(vendor.id, true);
    try {
      const updates: Record<string, unknown> = {
        business_verification_status: 'rejected',
      };
      if (permanent) updates.is_banned = true;

      const { error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', vendor.id);
      if (error) throw error;

      const notes = (notesDraft[vendor.id] ?? '').trim() || undefined;
      await supabase.functions.invoke('send-vendor-status-sms', {
        body: {
          vendor_id: vendor.id,
          sms_type: permanent ? 'banned' : 'rejected',
          notes: permanent ? undefined : notes,
        },
      });

      toast.success(permanent ? 'Vendor permanently banned' : 'Vendor rejected');
      removeFromList(vendor.id);
      setConfirmReject(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject vendor');
    } finally {
      setVendorBusy(vendor.id, false);
    }
  };

  const toggleChecklist = (vendorId: string, idx: number) => {
    setChecklist((prev) => {
      const cur = prev[vendorId] ?? [false, false, false, false];
      const next = [...cur];
      next[idx] = !next[idx];
      return { ...prev, [vendorId]: next };
    });
  };

  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader
        title="Vendor Approval Queue"
        rightAction={
          <Badge variant="secondary" className="text-sm">
            {vendors.length} pending
          </Badge>
        }
      />

      <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading queue…
          </div>
        ) : vendors.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-600 mb-3" />
              <p className="text-lg font-medium">All vendors reviewed — queue is clear 🎉</p>
            </CardContent>
          </Card>
        ) : (
          vendors.map((vendor) => {
            const vDocs = docs[vendor.id] ?? [];
            const cl = checklist[vendor.id] ?? [false, false, false, false];
            const selfieUrl = signedSelfies[vendor.id];
            const isRegistered = vendor.vendor_business_type === 'registered_business';
            const isVerified = vendor.business_verification_status === 'verified';
            const isBusy = !!busy[vendor.id];
            const images = vendor.image_urls ?? [];
            const logo = vendor.logo_url || images[0];
            const galleryThumbs = images.slice(1, 5);
            const hasBank =
              vendor.bank_name ||
              vendor.bank_account_holder_name ||
              vendor.bank_account_number ||
              vendor.bank_branch_code ||
              vendor.bank_account_type;

            return (
              <Card key={vendor.id} className="overflow-hidden">
                {/* A — IDENTITY */}
                <CardHeader className="border-b">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-bold leading-tight truncate">
                        {vendor.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {vendor.category && (
                          <Badge variant="outline">{vendor.category.replace(/_/g, ' ')}</Badge>
                        )}
                        <Badge variant={isRegistered ? 'default' : 'secondary'}>
                          {isRegistered ? 'Registered Business' : 'Informal Trader'}
                        </Badge>
                        {isVerified && (
                          <Badge className="bg-blue-600 hover:bg-blue-600">
                            <BadgeCheck className="h-3 w-3 mr-1" /> Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                        {vendor.phone_number && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {vendor.phone_number}
                          </span>
                        )}
                        <span>
                          Registered{' '}
                          {formatDistanceToNow(new Date(vendor.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {isRegistered && (
                        <div className="text-xs text-muted-foreground mt-1 space-x-3">
                          {vendor.registered_business_name && (
                            <span>Trading name: {vendor.registered_business_name}</span>
                          )}
                          {vendor.registration_number && (
                            <span>Reg #: {vendor.registration_number}</span>
                          )}
                          {vendor.vat_number && <span>VAT #: {vendor.vat_number}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                  {/* B — PROFILE PREVIEW */}
                  <section>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                      Profile Preview
                    </h3>
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                        {logo ? (
                          <img src={logo} alt="logo" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            No logo
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {vendor.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <MapPin className="h-3.5 w-3.5" /> {vendor.location}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">
                          {vendor.about || (
                            <span className="text-muted-foreground italic">
                              No description provided
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {galleryThumbs.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {galleryThumbs.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="aspect-square rounded-lg bg-muted overflow-hidden block"
                          >
                            <img
                              src={url}
                              alt={`showcase ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {vendor.instagram_url && (
                        <a
                          href={vendor.instagram_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-pink-600 hover:underline inline-flex items-center gap-1 text-sm"
                        >
                          <Instagram className="h-4 w-4" /> Instagram
                        </a>
                      )}
                      {vendor.tiktok_url && (
                        <a
                          href={vendor.tiktok_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-foreground hover:underline inline-flex items-center gap-1 text-sm"
                        >
                          <Music2 className="h-4 w-4" /> TikTok
                        </a>
                      )}
                      {vendor.facebook_url && (
                        <a
                          href={vendor.facebook_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm"
                        >
                          <Facebook className="h-4 w-4" /> Facebook
                        </a>
                      )}
                      {vendor.website_url && (
                        <a
                          href={vendor.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                        >
                          <Globe className="h-4 w-4" /> Website
                        </a>
                      )}
                    </div>
                  </section>

                  {/* C — BANK DETAILS */}
                  <section className="rounded-lg border bg-muted/30 p-4">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                      Bank Details (Admin Only)
                    </h3>
                    {!hasBank ? (
                      <p className="text-sm text-muted-foreground italic">
                        No bank details submitted
                      </p>
                    ) : (
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <dt className="text-muted-foreground">Bank</dt>
                        <dd>{vendor.bank_name || '—'}</dd>
                        <dt className="text-muted-foreground">Account holder</dt>
                        <dd>{vendor.bank_account_holder_name || '—'}</dd>
                        <dt className="text-muted-foreground">Account #</dt>
                        <dd className="font-mono">{maskAccount(vendor.bank_account_number)}</dd>
                        <dt className="text-muted-foreground">Branch code</dt>
                        <dd className="font-mono">{vendor.bank_branch_code || '—'}</dd>
                        <dt className="text-muted-foreground">Account type</dt>
                        <dd>{vendor.bank_account_type || '—'}</dd>
                      </dl>
                    )}
                  </section>

                  {/* D — DOCUMENTS */}
                  <section>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                      Verification Documents
                    </h3>
                    {vDocs.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No documents submitted
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {vDocs.map((d) => (
                          <li
                            key={d.id}
                            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              {DOC_TYPE_LABELS[d.doc_type] ?? d.doc_type}
                            </span>
                            <a
                              href={d.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              View Document <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  {/* E — SELFIE */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Identity Selfie
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestSelfie(vendor)}
                        disabled={isBusy}
                      >
                        <Camera className="h-4 w-4 mr-1" /> Request Selfie
                      </Button>
                    </div>
                    {selfieUrl ? (
                      <a href={selfieUrl} target="_blank" rel="noreferrer">
                        <img
                          src={selfieUrl}
                          alt="vendor selfie"
                          className="max-h-64 rounded-lg border"
                        />
                      </a>
                    ) : vendor.selfie_request_sent_at ? (
                      <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Selfie requested{' '}
                        {formatDistanceToNow(new Date(vendor.selfie_request_sent_at), {
                          addSuffix: true,
                        })}{' '}
                        — awaiting submission
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No selfie submitted
                      </p>
                    )}
                  </section>

                  {/* F — CHECKLIST */}
                  <section className="rounded-lg border p-4">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                      Admin Checklist
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {CHECKLIST_ITEMS.map((label, i) => (
                        <label
                          key={i}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={cl[i]}
                            onCheckedChange={() => toggleChecklist(vendor.id, i)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </section>

                  {/* G — NOTES */}
                  <section>
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                      Admin Notes
                    </h3>
                    <Textarea
                      value={notesDraft[vendor.id] ?? ''}
                      onChange={(e) =>
                        setNotesDraft((p) => ({ ...p, [vendor.id]: e.target.value }))
                      }
                      onBlur={() => handleNotesBlur(vendor)}
                      placeholder="Internal notes / reason for rejection / what's missing…"
                      rows={3}
                    />
                  </section>

                  {/* H — ACTIONS */}
                  <section className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleApprove(vendor)}
                      disabled={isBusy}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Approve & Activate
                    </Button>
                    {!isVerified && (
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleVerifyBusiness(vendor)}
                        disabled={isBusy}
                      >
                        <BadgeCheck className="h-4 w-4 mr-1" /> Verify Business
                      </Button>
                    )}
                    <Button
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={() => handleRequestInfo(vendor)}
                      disabled={isBusy}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" /> Request More Info
                    </Button>
                    <Button
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmReject(vendor.id)}
                      disabled={isBusy}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </section>
                </CardContent>

                <AlertDialog
                  open={confirmReject === vendor.id}
                  onOpenChange={(o) => !o && setConfirmReject(null)}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject {vendor.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Choose how to reject this vendor. A "soft" rejection lets them edit
                        and resubmit. A permanent ban prevents them from being reviewed again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleReject(vendor, false)}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Reject — can resubmit
                      </AlertDialogAction>
                      <AlertDialogAction
                        onClick={() => handleReject(vendor, true)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Permanent ban
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
