import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrandingSectionProps {
  vendor: any;
  onUpdate: (data: Record<string, any>) => Promise<boolean>;
}

export function BrandingSection({ vendor, onUpdate }: BrandingSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showRegOnPdf, setShowRegOnPdf] = useState(vendor?.show_registration_on_pdf ?? false);
  const [showVatOnPdf, setShowVatOnPdf] = useState(vendor?.show_vat_on_pdf ?? false);
  const [letterheadEnabled, setLetterheadEnabled] = useState(vendor?.letterhead_enabled ?? false);
  const logoUrl = vendor?.logo_url;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vendor) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG or JPG)');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${vendor.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-images')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('vendor-images')
        .getPublicUrl(path);

      const success = await onUpdate({ logo_url: urlData.publicUrl });
      if (success) toast.success('Logo uploaded');
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggle = async (field: 'show_registration_on_pdf' | 'show_vat_on_pdf', value: boolean) => {
    if (field === 'show_registration_on_pdf') setShowRegOnPdf(value);
    else setShowVatOnPdf(value);
    await onUpdate({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Branding / Letterhead
        </CardTitle>
        <CardDescription>
          Customise how your Final Offer documents look when sent to clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Logo */}
        <div className="space-y-2">
          <Label>Business Logo</Label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Business logo"
                className="w-16 h-16 rounded-lg object-contain border bg-background"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild disabled={isUploading}>
                  <span>
                    {isUploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </label>
              <p className="text-xs text-muted-foreground mt-1">PNG or JPG, max 2MB</p>
            </div>
          </div>
        </div>

        {/* Letterhead toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Letterhead on PDFs</Label>
            <p className="text-xs text-muted-foreground">
              Use your branding (logo + business details) on Final Offer documents
            </p>
          </div>
          <Switch
            checked={letterheadEnabled}
            onCheckedChange={async (v) => {
              setLetterheadEnabled(v);
              await onUpdate({ letterhead_enabled: v } as any);
            }}
          />
        </div>

        {/* PDF toggles */}
        {vendor?.registration_number && (
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Registration No. on PDF</Label>
              <p className="text-xs text-muted-foreground">
                Reg: {vendor.registration_number}
              </p>
            </div>
            <Switch
              checked={showRegOnPdf}
              onCheckedChange={(v) => handleToggle('show_registration_on_pdf', v)}
            />
          </div>
        )}

        {vendor?.vat_number && (
          <div className="flex items-center justify-between">
            <div>
              <Label>Show VAT No. on PDF</Label>
              <p className="text-xs text-muted-foreground">
                VAT: {vendor.vat_number}
              </p>
            </div>
            <Switch
              checked={showVatOnPdf}
              onCheckedChange={(v) => handleToggle('show_vat_on_pdf', v)}
            />
          </div>
        )}

        {/* Preview info */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
          <p>
            {letterheadEnabled || logoUrl || vendor?.registered_business_name
              ? '✓ Your Final Offer documents will use your branded letterhead.'
              : 'Letterhead is disabled — documents will use the default UMCIMBI template. Enable the toggle above to use your branding.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
