import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Store, Camera, ChevronsUpDown, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProvinceWaitlist } from '@/components/shared/ProvinceWaitlist';
import { AddressData } from '@/components/shared/AddressFields';
import { useMyVendorProfile } from '@/hooks/useVendors';
import { useAuth } from '@/context/AuthContext';
import { LIVE_VENDOR_CATEGORIES, LIVE_VENDOR_CATEGORY_VALUES, VendorCategory } from '@/lib/vendorCategories';
import { COUNTRIES, getCountryByCode } from '@/data/countries';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { VendorProfileForm } from '@/components/vendors/VendorProfileForm';

const validateLocalPhone = (phone: string, countryCode: string) => {
  const country = getCountryByCode(countryCode);
  if (!country) return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const digits = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  return /^\d+$/.test(digits) && digits.length === country.phoneLength;
};

const toE164 = (phone: string, countryCode: string) => {
  const country = getCountryByCode(countryCode);
  if (!country) return phone;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const digits = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  return country.dial + digits;
};

const quickVendorSchema = z.object({
  name: z.string().trim().min(2, 'Business name must be at least 2 characters').max(100),
  category: z.enum(LIVE_VENDOR_CATEGORY_VALUES, { required_error: 'Please select a category' }),
  city: z.string().trim().min(1, 'City / Suburb is required').max(100),
});

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isQuickMode = searchParams.get('quick') === 'true';
  const fromAuth = searchParams.get('fromAuth') === 'true';
  const { createVendorProfile, vendor: existingVendor, isLoading: isLoadingVendor } = useMyVendorProfile();
  const { user, profile } = useAuth();
  const [justCreated, setJustCreated] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistCtx, setWaitlistCtx] = useState<{ province: string; city: string; business_name: string }>({ province: '', city: '', business_name: '' });

  useEffect(() => {
    if (!isLoadingVendor && existingVendor && !justCreated) {
      toast.info('You already have a vendor profile');
      navigate('/profile/vendor', { replace: true });
    }
  }, [existingVendor, isLoadingVendor, navigate, justCreated]);

  // Quick mode local state (unchanged from before)
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [quickForm, setQuickForm] = useState({ name: '', category: '' as VendorCategory | '', city: '' });
  const [quickErrors, setQuickErrors] = useState<Record<string, string>>({});
  const [quickPhoneCountry, setQuickPhoneCountry] = useState('ZA');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickPhoneCountryOpen, setQuickPhoneCountryOpen] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const selectedQuickPhoneCountry = COUNTRIES.find(c => c.code === quickPhoneCountry) || COUNTRIES[0];

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be less than 5MB');
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickErrors({});
    const validation = quickVendorSchema.safeParse(quickForm);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setQuickErrors(fieldErrors);
      const first = validation.error.errors[0]?.message;
      if (first) toast.error(first);
      return;
    }
    if (!validateLocalPhone(quickPhone, quickPhoneCountry)) {
      setQuickErrors(prev => ({ ...prev, phone_number: `Please enter a valid ${selectedQuickPhoneCountry.name} phone number` }));
      toast.error(`Please enter a valid ${selectedQuickPhoneCountry.name} phone number`);
      return;
    }
    const quickE164 = toE164(quickPhone, quickPhoneCountry);
    setQuickLoading(true);
    setJustCreated(true);
    const result = await createVendorProfile({
      name: quickForm.name.trim(),
      category: quickForm.category as VendorCategory,
      location: quickForm.city.trim(),
      about: null,
      price_range_text: null,
      phone_number: quickE164 || profile?.phone_number || null,
      whatsapp_number: null,
      email: null,
      website_url: null,
      instagram_url: null,
      tiktok_url: null,
      facebook_url: null,
      languages: ['English'],
      image_urls: [],
      address_line_1: '',
      address_line_2: null,
      city: quickForm.city.trim(),
      state_province: null,
      country: 'ZA',
      postal_code: '',
      vendor_business_type: 'independent',
      business_verification_status: 'not_applicable',
      registered_business_name: null,
      registration_number: null,
      vat_number: null,
      bank_name: null,
      bank_branch_code: null,
      bank_account_holder_name: null,
      bank_account_number: null,
      bank_account_type: null,
    } as any);
    if (!result) { setQuickLoading(false); return; }

    // Optional logo upload
    if (logoFile) {
      const ext = logoFile.name.split('.').pop() || 'jpg';
      const path = `${result.id}/logo.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('vendor-images').upload(path, logoFile, { upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('vendor-images').getPublicUrl(path);
        await supabase.from('vendors').update({ image_urls: [urlData.publicUrl], logo_url: urlData.publicUrl } as any).eq('id', result.id);
      }
    }

    setQuickLoading(false);
    if (result?.id) {
      supabase.functions.invoke('send-vendor-status-sms', {
        body: { vendor_id: result.id, sms_type: 'registration' }
      }).catch((e: any) => console.error('Registration SMS failed (non-blocking):', e));
    }
    navigate('/vendor-dashboard');
  };

  // Province gate for full flow
  const onBeforeSubmit = async (address: AddressData, formData: any) => {
    const provinceToCheck = address.state_province.trim();
    const { data: liveRow } = await supabase
      .from('live_provinces')
      .select('province')
      .eq('province', provinceToCheck)
      .maybeSingle();
    if (!liveRow) {
      setWaitlistCtx({ province: provinceToCheck, city: address.city.trim(), business_name: formData.name.trim() });
      setShowWaitlist(true);
      window.scrollTo(0, 0);
      return false;
    }
    return true;
  };

  const handleFullOnCreated = (vendorId: string) => {
    setJustCreated(true);
    supabase.functions.invoke('send-vendor-status-sms', {
      body: { vendor_id: vendorId, sms_type: 'registration' }
    }).catch((e: any) => console.error('Registration SMS failed (non-blocking):', e));
    navigate('/profile/vendor');
  };

  if (showWaitlist) {
    return (
      <div className="min-h-screen pb-safe bg-background">
        <PageHeader title="Become a Vendor" showBack />
        <div className="px-4 py-6 max-w-lg mx-auto">
          <ProvinceWaitlist
            role="vendor"
            defaults={{
              full_name: profile?.full_name || '',
              phone_number: profile?.phone_number || '',
              province: waitlistCtx.province,
              city: waitlistCtx.city,
              business_name: waitlistCtx.business_name,
            }}
          />
        </div>
      </div>
    );
  }

  if (isQuickMode) {
    return (
      <div className="min-h-screen pb-safe bg-background">
        <PageHeader title="Become a Vendor" showBack />
        <div className="px-4 py-6 max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-2">
                <Store className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>Register your business</CardTitle>
              <CardDescription>Join our marketplace and connect with families planning traditional ceremonies</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuickSubmit} className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-xl bg-muted border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden" onClick={() => logoInputRef.current?.click()}>
                      {logoPreview ? (<img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />) : (
                        <div className="flex flex-col items-center gap-1">
                          <Camera className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Logo</span>
                        </div>
                      )}
                    </div>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="name">Business name *</Label>
                    <Input id="name" placeholder="e.g., Zulu Traditions Decor" value={quickForm.name} onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })} className={`h-12 ${quickErrors.name ? 'border-destructive' : ''}`} />
                    {quickErrors.name && <p className="text-sm text-destructive">{quickErrors.name}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={quickForm.category} onValueChange={(v) => setQuickForm({ ...quickForm, category: v as VendorCategory })}>
                    <SelectTrigger className={`h-12 ${quickErrors.category ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select your service category" />
                    </SelectTrigger>
                    <SelectContent>
                      {LIVE_VENDOR_CATEGORIES.map((cat) => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {quickErrors.category && <p className="text-sm text-destructive">{quickErrors.category}</p>}
                </div>
                <div className="space-y-2">
                  <Label>City / Suburb *</Label>
                  <Input placeholder="e.g., Durban, Umlazi" value={quickForm.city} onChange={(e) => setQuickForm({ ...quickForm, city: e.target.value })} className={`h-12 ${quickErrors.city ? 'border-destructive' : ''}`} />
                  {quickErrors.city && <p className="text-sm text-destructive">{quickErrors.city}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone number *</Label>
                  <div className="flex gap-2">
                    <Popover open={quickPhoneCountryOpen} onOpenChange={setQuickPhoneCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className={cn('w-[120px] h-12 justify-between px-2 flex-shrink-0')}>
                          <span className="flex items-center gap-1 text-sm truncate">
                            <span>{selectedQuickPhoneCountry.flag}</span>
                            <span>{selectedQuickPhoneCountry.dial}</span>
                          </span>
                          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search country..." />
                          <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {COUNTRIES.map((c) => (
                                <CommandItem key={c.code} value={`${c.name} ${c.dial}`} onSelect={() => { setQuickPhoneCountry(c.code); setQuickPhoneCountryOpen(false); }}>
                                  <Check className={cn('mr-2 h-4 w-4', quickPhoneCountry === c.code ? 'opacity-100' : 'opacity-0')} />
                                  <span className="mr-2">{c.flag}</span>
                                  <span className="flex-1">{c.name}</span>
                                  <span className="text-muted-foreground text-sm">{c.dial}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Input type="tel" placeholder="e.g., 082 123 4567" value={quickPhone} onChange={(e) => setQuickPhone(e.target.value)} className={`flex-1 h-12 ${quickErrors.phone_number ? 'border-destructive' : ''}`} />
                  </div>
                  {quickErrors.phone_number && <p className="text-sm text-destructive">{quickErrors.phone_number}</p>}
                </div>
                <Button type="submit" className="w-full h-12 mt-6" disabled={quickLoading}>
                  {quickLoading ? 'Creating profile...' : 'Create vendor profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Full flow — extracted form component
  if (!user) return null;
  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader title="Become a Vendor" showBack />
      <div className="px-4 py-6 max-w-lg mx-auto">
        <VendorProfileForm
          ownerUserId={user.id}
          signupSource="vendor_self_signup"
          mode="create"
          stepped
          showStepperProgress={fromAuth}
          defaultPhoneNumber={profile?.phone_number ?? null}
          onBeforeSubmit={onBeforeSubmit}
          onCreated={handleFullOnCreated}
        />
      </div>
    </div>
  );
}
