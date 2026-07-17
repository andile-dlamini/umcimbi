import { useState, useMemo } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { VENDOR_CATEGORIES } from '@/lib/vendorCategories';
import { toast } from 'sonner';

// ---------- CSV parser (handles quoted commas + "" escapes) ----------
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cur);
        cur = '';
      } else if (ch === '\n' || ch === '\r') {
        if (cur !== '' || row.length > 0) {
          row.push(cur);
          rows.push(row);
          row = [];
          cur = '';
        }
        if (ch === '\r' && text[i + 1] === '\n') i++;
      } else {
        cur += ch;
      }
    }
  }
  if (cur !== '' || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.length && r.some((c) => c.trim() !== ''));
}

// ---------- Row shape ----------
const EXPECTED_COLUMNS = [
  'name',
  'category',
  'whatsapp_number',
  'phone_number',
  'address_line_1',
  'address_line_2',
  'city',
  'location',
  'about',
  'price_range_text',
  'languages',
  'instagram_url',
  'tiktok_url',
  'facebook_url',
  'website_url',
  'is_registered_business',
  'registered_business_name',
  'registration_number',
  'vat_number',
  'bank_name',
  'bank_account_holder_name',
  'bank_account_number',
  'bank_branch_code',
  'bank_account_type',
] as const;

type ColumnName = (typeof EXPECTED_COLUMNS)[number];

interface Row {
  name: string;
  category: string;
  whatsapp_number: string;
  phone_number: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  location: string;
  about: string;
  price_range_text: string;
  languages: string;
  instagram_url: string;
  tiktok_url: string;
  facebook_url: string;
  website_url: string;
  is_registered_business: boolean;
  registered_business_name: string;
  registration_number: string;
  vat_number: string;
  bank_name: string;
  bank_account_holder_name: string;
  bank_account_number: string;
  bank_branch_code: string;
  bank_account_type: string;
}

function emptyRow(): Row {
  return {
    name: '',
    category: '',
    whatsapp_number: '',
    phone_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    location: '',
    about: '',
    price_range_text: '',
    languages: '',
    instagram_url: '',
    tiktok_url: '',
    facebook_url: '',
    website_url: '',
    is_registered_business: false,
    registered_business_name: '',
    registration_number: '',
    vat_number: '',
    bank_name: '',
    bank_account_holder_name: '',
    bank_account_number: '',
    bank_branch_code: '',
    bank_account_type: '',
  };
}

function parseBool(v: string): boolean {
  const s = (v || '').trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y';
}

function rowsFromCsv(text: string): Row[] {
  const grid = parseCsv(text);
  if (grid.length === 0) return [];
  const header = grid[0].map((h) => h.trim().toLowerCase());
  const idx: Partial<Record<ColumnName, number>> = {};
  for (const col of EXPECTED_COLUMNS) {
    const i = header.indexOf(col);
    if (i >= 0) idx[col] = i;
  }
  const out: Row[] = [];
  for (let r = 1; r < grid.length; r++) {
    const raw = grid[r];
    const get = (c: ColumnName) => (idx[c] != null ? (raw[idx[c]!] ?? '').trim() : '');
    const row: Row = {
      name: get('name'),
      category: get('category'),
      whatsapp_number: get('whatsapp_number'),
      phone_number: get('phone_number'),
      address_line_1: get('address_line_1'),
      address_line_2: get('address_line_2'),
      city: get('city'),
      location: get('location'),
      about: get('about'),
      price_range_text: get('price_range_text'),
      languages: get('languages'),
      instagram_url: get('instagram_url'),
      tiktok_url: get('tiktok_url'),
      facebook_url: get('facebook_url'),
      website_url: get('website_url'),
      is_registered_business: parseBool(get('is_registered_business')),
      registered_business_name: get('registered_business_name'),
      registration_number: get('registration_number'),
      vat_number: get('vat_number'),
      bank_name: get('bank_name'),
      bank_account_holder_name: get('bank_account_holder_name'),
      bank_account_number: get('bank_account_number'),
      bank_branch_code: get('bank_branch_code'),
      bank_account_type: get('bank_account_type'),
    };
    out.push(row);
  }
  return out;
}

// ---------- Result types from edge function ----------
interface CreateResult {
  row: number;
  status: 'created' | 'skipped' | 'failed';
  reason?: string;
  vendor_id?: string;
  user_id?: string;
  is_registered_business?: boolean;
  name?: string;
}

interface AttachResult {
  vendor_id: string;
  status: 'updated' | 'failed';
  reason?: string;
}

// ---------- Media staging state ----------
interface MediaState {
  logo: File | null;
  gallery: File[];
  docs: { file: File; doc_type: string }[];
}

const DOC_TYPES = [
  { value: 'cipc_registration', label: 'CIPC registration' },
  { value: 'proof_of_address', label: 'Proof of address' },
  { value: 'bank_confirmation', label: 'Bank confirmation letter' },
  { value: 'vat_certificate', label: 'VAT certificate' },
  { value: 'other', label: 'Other' },
];

const MAX_GALLERY = 6;

function statusBadge(status: string) {
  if (status === 'created' || status === 'updated') {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {status === 'created' ? 'Created' : 'Uploaded'}
      </Badge>
    );
  }
  if (status === 'skipped') {
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
        <AlertCircle className="h-3 w-3 mr-1" />
        Skipped
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
      <X className="h-3 w-3 mr-1" />
      Failed
    </Badge>
  );
}

export default function VendorBulkImport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<CreateResult[] | null>(null);
  const [media, setMedia] = useState<Record<string, MediaState>>({});
  const [attaching, setAttaching] = useState<Record<string, boolean>>({});
  const [attachStatus, setAttachStatus] = useState<Record<string, AttachResult | undefined>>({});

  const validRows = useMemo(
    () =>
      rows.map((r, i) => ({
        index: i,
        row: r,
        valid: !!r.name && !!r.category && !!r.phone_number,
      })),
    [rows]
  );

  const validForSubmit = validRows.filter((v) => v.valid);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const parsed = rowsFromCsv(text);
    if (parsed.length === 0) {
      toast.error('No rows found in CSV');
      return;
    }
    setRows(parsed);
    setResults(null);
    setMedia({});
    setAttachStatus({});
  };

  const updateRow = (i: number, patch: Partial<Row>) => {
    setRows((cur) => cur.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const handleImport = async () => {
    if (validForSubmit.length === 0) {
      toast.error('No valid rows to import');
      return;
    }
    setImporting(true);
    try {
      const payloadRows = validForSubmit.map((v) => {
        const r = v.row;
        const languages = r.languages
          ? r.languages
              .split('|')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;
        return {
          __row: v.index,
          name: r.name,
          category: r.category,
          whatsapp_number: r.whatsapp_number || null,
          phone_number: r.phone_number,
          address_line_1: r.address_line_1 || null,
          address_line_2: r.address_line_2 || null,
          city: r.city || null,
          location: r.location || null,
          about: r.about || null,
          price_range_text: r.price_range_text || null,
          languages,
          instagram_url: r.instagram_url || null,
          tiktok_url: r.tiktok_url || null,
          facebook_url: r.facebook_url || null,
          website_url: r.website_url || null,
          is_registered_business: r.is_registered_business,
          registered_business_name: r.registered_business_name || null,
          registration_number: r.registration_number || null,
          vat_number: r.vat_number || null,
          bank_name: r.bank_name || null,
          bank_account_holder_name: r.bank_account_holder_name || null,
          bank_account_number: r.bank_account_number || null,
          bank_branch_code: r.bank_branch_code || null,
          bank_account_type: r.bank_account_type || null,
        };
      });

      const { data, error } = await supabase.functions.invoke('bulk-vendor-import', {
        body: { action: 'create_vendors', rows: payloadRows },
      });
      if (error) throw error;
      const raw = (data?.results ?? []) as CreateResult[];
      // Map __row back to grid index
      const mapped = raw.map((res) => {
        const original = payloadRows[res.row] as any;
        return { ...res, row: original?.__row ?? res.row };
      });
      setResults(mapped);
      const created = mapped.filter((r) => r.status === 'created').length;
      const skipped = mapped.filter((r) => r.status === 'skipped').length;
      const failed = mapped.filter((r) => r.status === 'failed').length;
      toast.success(`Import complete: ${created} created, ${skipped} skipped, ${failed} failed`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const setMediaFor = (vendorId: string, patch: Partial<MediaState>) => {
    setMedia((cur) => ({
      ...cur,
      [vendorId]: { logo: null, gallery: [], docs: [], ...cur[vendorId], ...patch },
    }));
  };

  const uploadForVendor = async (vendorId: string, isReg: boolean): Promise<AttachResult> => {
    const state = media[vendorId];
    if (!state || (!state.logo && state.gallery.length === 0 && state.docs.length === 0)) {
      return { vendor_id: vendorId, status: 'failed', reason: 'no_files_selected' };
    }
    try {
      let logoUrl: string | null = null;
      const imageUrls: string[] = [];
      const verificationDocs: { doc_type: string; file_url: string }[] = [];

      if (state.logo) {
        const ext = state.logo.name.split('.').pop() || 'jpg';
        const path = `${vendorId}/logo.${ext}`;
        const { error } = await supabase.storage
          .from('vendor-images')
          .upload(path, state.logo, { upsert: true });
        if (error) throw new Error(`logo: ${error.message}`);
        const { data } = supabase.storage.from('vendor-images').getPublicUrl(path);
        logoUrl = data.publicUrl;
      }

      for (let i = 0; i < state.gallery.length; i++) {
        const f = state.gallery[i];
        const ext = f.name.split('.').pop() || 'jpg';
        const path = `${vendorId}/showcase-${i}.${ext}`;
        const { error } = await supabase.storage
          .from('vendor-images')
          .upload(path, f, { upsert: true });
        if (error) throw new Error(`showcase ${i}: ${error.message}`);
        const { data } = supabase.storage.from('vendor-images').getPublicUrl(path);
        imageUrls.push(data.publicUrl);
      }

      if (isReg) {
        for (let i = 0; i < state.docs.length; i++) {
          const d = state.docs[i];
          const ext = d.file.name.split('.').pop() || 'pdf';
          const path = `${vendorId}/docs/doc-${i}.${ext}`;
          const { error } = await supabase.storage
            .from('vendor-images')
            .upload(path, d.file, { upsert: true });
          if (error) throw new Error(`doc ${i}: ${error.message}`);
          const { data } = supabase.storage.from('vendor-images').getPublicUrl(path);
          verificationDocs.push({ doc_type: d.doc_type, file_url: data.publicUrl });
        }
      }

      const { data, error } = await supabase.functions.invoke('bulk-vendor-import', {
        body: {
          action: 'attach_media',
          entries: [
            {
              vendor_id: vendorId,
              logo_url: logoUrl,
              image_urls: imageUrls,
              verification_documents: verificationDocs,
            },
          ],
        },
      });
      if (error) throw error;
      const res = (data?.results?.[0] ?? { vendor_id: vendorId, status: 'failed', reason: 'no_result' }) as AttachResult;
      return res;
    } catch (err: any) {
      return { vendor_id: vendorId, status: 'failed', reason: err?.message ?? 'upload_failed' };
    }
  };

  const handleAttachAll = async () => {
    if (!results) return;
    const created = results.filter((r) => r.status === 'created' && r.vendor_id);
    for (const r of created) {
      const state = media[r.vendor_id!];
      if (!state || (!state.logo && state.gallery.length === 0 && state.docs.length === 0)) continue;
      setAttaching((cur) => ({ ...cur, [r.vendor_id!]: true }));
      const res = await uploadForVendor(r.vendor_id!, !!r.is_registered_business);
      setAttachStatus((cur) => ({ ...cur, [r.vendor_id!]: res }));
      setAttaching((cur) => ({ ...cur, [r.vendor_id!]: false }));
    }
    toast.success('Upload pass complete');
  };

  const retryAttach = async (r: CreateResult) => {
    if (!r.vendor_id) return;
    setAttaching((cur) => ({ ...cur, [r.vendor_id!]: true }));
    const res = await uploadForVendor(r.vendor_id, !!r.is_registered_business);
    setAttachStatus((cur) => ({ ...cur, [r.vendor_id!]: res }));
    setAttaching((cur) => ({ ...cur, [r.vendor_id!]: false }));
  };

  return (
    <div>
      <PageHeader title="Bulk Vendor Import" subtitle="Admin CSV onboarding" />

      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Step 1 — CSV upload */}
        {rows.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload CSV
              </CardTitle>
              <CardDescription>
                Upload a CSV where the first row is a header. Columns are matched by name — extra columns are ignored, missing columns default to empty.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="rounded-md border bg-muted/40 p-3 text-xs">
                <p className="font-medium mb-2">Expected columns</p>
                <p className="font-mono leading-relaxed break-all">
                  {EXPECTED_COLUMNS.join(', ')}
                </p>
                <p className="mt-2 text-muted-foreground">
                  <strong>languages</strong>: pipe-separated (e.g. <code>English|Zulu</code>).{' '}
                  <strong>is_registered_business</strong>: <code>true</code> / <code>false</code>.{' '}
                  <strong>category</strong> must match a vendor category value (edit inline after upload).
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {rows.length > 0 && !results && (
          <Card>
            <CardHeader>
              <CardTitle>Preview ({validForSubmit.length}/{rows.length} valid)</CardTitle>
              <CardDescription>
                Edit category and registered-business flag inline. Rows missing name, category, or phone are skipped.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Business name</TableHead>
                      <TableHead>Reg no.</TableHead>
                      <TableHead>VAT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validRows.map(({ index, row, valid }) => {
                      const regDisabled = !row.is_registered_business;
                      return (
                        <TableRow key={index} className={!valid ? 'bg-red-50/40' : ''}>
                          <TableCell>
                            {valid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell className="min-w-[160px]">{row.name || <span className="text-red-600">—</span>}</TableCell>
                          <TableCell className="min-w-[180px]">
                            <Select
                              value={row.category}
                              onValueChange={(v) => updateRow(index, { category: v })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select…" />
                              </SelectTrigger>
                              <SelectContent>
                                {VENDOR_CATEGORIES.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="min-w-[120px]">
                            {row.phone_number || <span className="text-red-600">—</span>}
                          </TableCell>
                          <TableCell>{row.city}</TableCell>
                          <TableCell>
                            <Checkbox
                              checked={row.is_registered_business}
                              onCheckedChange={(v) =>
                                updateRow(index, { is_registered_business: v === true })
                              }
                            />
                          </TableCell>
                          <TableCell
                            className={`min-w-[160px] ${regDisabled ? 'opacity-40' : ''}`}
                          >
                            {row.registered_business_name || '—'}
                          </TableCell>
                          <TableCell className={regDisabled ? 'opacity-40' : ''}>
                            {row.registration_number || '—'}
                          </TableCell>
                          <TableCell className={regDisabled ? 'opacity-40' : ''}>
                            {row.vat_number || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setRows([])} disabled={importing}>
                  Clear
                </Button>
                <Button onClick={handleImport} disabled={importing || validForSubmit.length === 0}>
                  {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirm Import ({validForSubmit.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — results + media attach */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Results & Media Attachment</CardTitle>
              <CardDescription>
                Attach a logo, up to {MAX_GALLERY} showcase images, and (for registered businesses) verification documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Reason / Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={`${r.row}-${r.vendor_id ?? 'x'}`}>
                      <TableCell>{r.row + 2}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell>{r.name ?? rows[r.row]?.name ?? '—'}</TableCell>
                      <TableCell className="text-xs">
                        {r.reason ?? (r.vendor_id ? `vendor_id: ${r.vendor_id.slice(0, 8)}…` : '—')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Media pickers per created row */}
              <div className="space-y-4">
                {results
                  .filter((r) => r.status === 'created' && r.vendor_id)
                  .map((r) => {
                    const vid = r.vendor_id!;
                    const state = media[vid] ?? { logo: null, gallery: [], docs: [] };
                    const isReg = !!r.is_registered_business;
                    const upStatus = attachStatus[vid];
                    return (
                      <Card key={vid} className="border-muted">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            <span>{r.name}</span>
                            <div className="flex items-center gap-2">
                              {upStatus && statusBadge(upStatus.status)}
                              {attaching[vid] && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              )}
                            </div>
                          </CardTitle>
                          {upStatus?.reason && (
                            <CardDescription className="text-red-600 text-xs">
                              {upStatus.reason}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Logo (1 image)</Label>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  setMediaFor(vid, { logo: e.target.files?.[0] ?? null })
                                }
                              />
                              {state.logo && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {state.logo.name}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label className="text-xs">
                                Showcase gallery (up to {MAX_GALLERY})
                              </Label>
                              <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  const files = Array.from(e.target.files ?? []).slice(
                                    0,
                                    MAX_GALLERY
                                  );
                                  setMediaFor(vid, { gallery: files });
                                }}
                              />
                              {state.gallery.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {state.gallery.length} file(s) selected
                                </p>
                              )}
                            </div>
                          </div>

                          {isReg && (
                            <div className="rounded-md border p-3 bg-muted/30 space-y-2">
                              <Label className="text-xs flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Verification documents
                              </Label>
                              <Input
                                type="file"
                                multiple
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files ?? []);
                                  const docs = files.map((f) => ({
                                    file: f,
                                    doc_type: 'other',
                                  }));
                                  setMediaFor(vid, { docs });
                                }}
                              />
                              {state.docs.length > 0 && (
                                <div className="space-y-2 mt-2">
                                  {state.docs.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <span className="text-xs flex-1 truncate">{d.file.name}</span>
                                      <Select
                                        value={d.doc_type}
                                        onValueChange={(v) => {
                                          const docs = [...state.docs];
                                          docs[i] = { ...docs[i], doc_type: v };
                                          setMediaFor(vid, { docs });
                                        }}
                                      >
                                        <SelectTrigger className="h-8 w-[220px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {DOC_TYPES.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                              {t.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={attaching[vid]}
                              onClick={() => retryAttach(r)}
                            >
                              {upStatus?.status === 'updated' ? 'Re-upload' : 'Upload this vendor'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>

              <div className="flex justify-between border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRows([]);
                    setResults(null);
                    setMedia({});
                    setAttachStatus({});
                  }}
                >
                  Start new import
                </Button>
                <Button onClick={handleAttachAll}>Upload & Finish (all created)</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
