import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Store, ImagePlus, Camera, ChevronsUpDown, Check, Upload, Info, AlertTriangle, ChevronRight } from 'lucide-react';
import { PricingInput } from '@/components/vendors/PricingInput';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { PageHeader } from '@/components/layout/PageHeader';
import { AddressFields, AddressData } from '@/components/shared/AddressFields';
import { useMyVendorProfile } from '@/hooks/useVendors';
import { useAuth } from '@/context/AuthContext';
import { VENDOR_CATEGORIES, VENDOR_CATEGORY_VALUES, VendorCategory } from '@/lib/vendorCategories';
import { COUNTRIES, getCountryByCode } from '@/data/countries';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

const vendorSchema = z.object({
  name: z.string().trim().min(2, 'Business name must be at least 2 characters').max(100),
  category: z.enum(VENDOR_CATEGORY_VALUES, { required_error: 'Please select a category' }),
  about: z.string().trim().min(10, 'Please describe your business (at least 10 characters)').max(2000),
  price_range_text: z.string().trim().min(1, 'Please add your pricing'),
  address_line_1: z.string().trim().min(1, 'Address Line 1 is required').max(200),
  address_line_2: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().min(1, 'City / Suburb is required').max(100),
  state_province: z.string().trim().max(100).optional().or(z.literal('')),
  country: z.string().trim().min(1, 'Country is required'),
  postal_code: z.string().trim().min(1, 'Postal / Zip Code is required').max(20),
  instagram_url: z.string().trim().max(500).optional().or(z.literal('')),
  tiktok_url: z.string().trim().max(500).optional().or(z.literal('')),
  facebook_url: z.string().trim().max(500).optional().or(z.literal('')),
});

const quickVendorSchema = z.object({
  name: z.string().trim().min(2, 'Business name must be at least 2 characters').max(100),
  category: z.enum(VENDOR_CATEGORY_VALUES, { required_error: 'Please select a category' }),
  city: z.string().trim().min(1, 'City / Suburb is required').max(100),
});

function toSocialUrl(platform: 'instagram' | 'tiktok' | 'facebook', handle: string): string | null {
  const cleaned = handle.trim().replace(/^@/, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;
  const bases = {
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/@',
    facebook: 'https://facebook.com/',
  };
  return bases[platform] + cleaned;
}

const SOUTH_AFRICAN_BANKS = [
  { name: 'ABSA', branchCode: '632005' },
  { name: 'African Bank', branchCode: '430000' },
  { name: 'Capitec Bank', branchCode: '470010' },
  { name: 'Discovery Bank', branchCode: '679000' },
  { name: 'FNB / First National Bank', branchCode: '250655' },
  { name: 'Investec', branchCode: '580105' },
  { name: 'Nedbank', branchCode: '198765' },
  { name: 'Standard Bank', branchCode: '051001' },
  { name: 'TymeBank', branchCode: '678910' },
];

const ACCOUNT_TYPES = ['Current / Cheque', 'Savings', 'Transmission'];

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isQuickMode = searchParams.get('quick') === 'true';
  const fromAuth = searchParams.get('fromAuth') === 'true';
  const { createVendorProfile, vendor: existingVendor, isLoading: isLoadingVendor } = useMyVendorProfile();
  const { profile } = useAuth();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [justCreated, setJustCreated] = useState(false);

  // Redirect if user already has a vendor profile (but not if we just created one)
  useEffect(() => {
    if (!isLoadingVendor && existingVendor && !justCreated) {
      toast.info('You already have a vendor profile');
      navigate('/profile/vendor', { replace: true });
    }
  }, [existingVendor, isLoadingVendor, navigate, justCreated]);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [onboardingStep, setOnboardingStep] = useState<4 | 5>(4);

  const [formData, setFormData] = useState({
    name: '',
    category: '' as VendorCategory | '',
    about: '',
    price_range_text: '',
    instagram_url: '',
    tiktok_url: '',
    facebook_url: '',
    languages: ['English'],
    is_registered_business: false,
    registered_business_name: '',
    registration_number: '',
    vat_number: '',
    bank_name: '',
    bank_branch_code: '',
    bank_account_holder_name: '',
    bank_account_number: '',
    bank_account_type: '',
  });

  const [address, setAddress] = useState<AddressData>({
    address_line_1: '',
    address_line_2: '',
    city: '',
    state_province: '',
    country: 'ZA',
    postal_code: '',
  });

  // Quick-mode-only phone capture
  const [quickPhoneCountry, setQuickPhoneCountry] = useState('ZA');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickPhoneCountryOpen, setQuickPhoneCountryOpen] = useState(false);
  const selectedQuickPhoneCountry = COUNTRIES.find(c => c.code === quickPhoneCountry) || COUNTRIES[0];

  // Logo placeholder (not uploaded until vendor is created)
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Work showcase images placeholders
  const [showcaseFiles, setShowcaseFiles] = useState<{ file: File; preview: string }[]>([]);
  const [verificationFiles, setVerificationFiles] = useState<{ file: File; docType: string; preview: string }[]>([]);
  const showcaseInputRef = useRef<HTMLInputElement>(null);
  const verificationInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleShowcaseAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 15 - showcaseFiles.length;
    if (remaining <= 0) {
      toast.error('Maximum 15 showcase images allowed');
      return;
    }
    const toAdd = Array.from(files).slice(0, remaining);
    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each image must be less than 5MB');
        return;
      }
    }
    const newItems = toAdd.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setShowcaseFiles(prev => [...prev, ...newItems]);
    if (showcaseInputRef.current) showcaseInputRef.current.value = '';
  };

  const removeShowcase = (index: number) => {
    setShowcaseFiles(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleNextStep = () => {
    const step4Errors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      step4Errors.name = 'Business name must be at least 2 characters';
    }
    if (!formData.category) {
      step4Errors.category = 'Please select a category';
    }
    if (Object.keys(step4Errors).length > 0) {
      setErrors(step4Errors);
      toast.error('Please fill in the required fields');
      return;
    }
    setErrors({});
    setOnboardingStep(5);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const dataToValidate = isQuickMode
      ? { name: formData.name, category: formData.category, city: address.city }
      : { ...formData, ...address };
    const schema = isQuickMode ? quickVendorSchema : vendorSchema;
    const validation = schema.safeParse(dataToValidate);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      const firstError = validation.error.errors[0]?.message;
      if (firstError) toast.error(firstError);
      return;
    }

    // Quick mode: phone is captured inline, validate it here
    let quickE164: string | null = null;
    if (isQuickMode) {
      if (!validateLocalPhone(quickPhone, quickPhoneCountry)) {
        setErrors(prev => ({ ...prev, phone_number: `Please enter a valid ${selectedQuickPhoneCountry.name} phone number` }));
        toast.error(`Please enter a valid ${selectedQuickPhoneCountry.name} phone number`);
        return;
      }
      quickE164 = toE164(quickPhone, quickPhoneCountry);
    }

    setIsLoading(true);

    // Compose location from city + state for backward compatibility
    const locationParts = [address.city.trim(), address.state_province?.trim()].filter(Boolean);
    const composedLocation = locationParts.join(', ') || null;

    // Create vendor profile first (without images)
    const vendorBusinessType = formData.is_registered_business ? 'registered_business' as const : 'independent' as const;
    const verificationStatus = formData.is_registered_business ? 'pending' as const : 'not_applicable' as const;

    setJustCreated(true);
    const result = await createVendorProfile({
      name: formData.name.trim(),
      category: formData.category as VendorCategory,
      location: composedLocation,
      about: formData.about.trim() || null,
      price_range_text: formData.price_range_text.trim() || null,
      phone_number: quickE164 || profile?.phone_number || null,
      whatsapp_number: null,
      email: null,
      website_url: null,
      instagram_url: toSocialUrl('instagram', formData.instagram_url),
      tiktok_url: toSocialUrl('tiktok', formData.tiktok_url),
      facebook_url: toSocialUrl('facebook', formData.facebook_url),
      languages: formData.languages,
      image_urls: [],
      address_line_1: address.address_line_1.trim(),
      address_line_2: address.address_line_2.trim() || null,
      city: address.city.trim(),
      state_province: address.state_province.trim() || null,
      country: address.country,
      postal_code: address.postal_code.trim(),
      vendor_business_type: vendorBusinessType,
      business_verification_status: verificationStatus,
      registered_business_name: formData.is_registered_business ? formData.registered_business_name.trim() || null : null,
      registration_number: formData.is_registered_business ? formData.registration_number.trim() || null : null,
      vat_number: formData.is_registered_business ? formData.vat_number.trim() || null : null,
      bank_name: formData.bank_name.trim() || null,
      bank_branch_code: formData.bank_branch_code.trim() || null,
      bank_account_holder_name: formData.bank_account_holder_name.trim() || null,
      bank_account_number: formData.bank_account_number.trim() || null,
      bank_account_type: formData.bank_account_type.trim() || null,
    } as any);

    if (!result) {
      setIsLoading(false);
      return;
    }

    // Upload images to storage now that we have a vendor ID
    const uploadedUrls: string[] = [];

    try {
      // Upload logo as first image
      if (logoFile) {
        const ext = logoFile.name.split('.').pop() || 'jpg';
        const path = `${result.id}/logo.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('vendor-images')
          .upload(path, logoFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('vendor-images')
            .getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      // Upload showcase images
      for (let i = 0; i < showcaseFiles.length; i++) {
        const file = showcaseFiles[i].file;
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${result.id}/showcase-${i}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('vendor-images')
          .upload(path, file, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('vendor-images')
            .getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      // Upload verification documents if registered business
      if (formData.is_registered_business && verificationFiles.length > 0) {
        for (let i = 0; i < verificationFiles.length; i++) {
          const vf = verificationFiles[i];
          const ext = vf.file.name.split('.').pop() || 'pdf';
          const docPath = `${result.id}/docs/doc-${i}.${ext}`;
          const { error: docUploadErr } = await supabase.storage
            .from('vendor-images')
            .upload(docPath, vf.file, { upsert: true });
          if (!docUploadErr) {
            const { data: docUrlData } = supabase.storage
              .from('vendor-images')
              .getPublicUrl(docPath);
            await supabase.from('vendor_verification_documents').insert({
              vendor_id: result.id,
              doc_type: i === 0 ? 'cipc_registration' : 'proof_of_address',
              file_url: docUrlData.publicUrl,
              status: 'uploaded',
            } as any);
          }
        }
      }

      // Update vendor record with image URLs
      if (uploadedUrls.length > 0) {
        await supabase
          .from('vendors')
          .update({ image_urls: uploadedUrls })
          .eq('id', result.id);
      }
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Profile created but some images failed to upload. You can add them later.');
    }

    setIsLoading(false);
    // Send registration confirmation SMS non-blocking
    if (result?.id) {
      supabase.functions.invoke('send-vendor-status-sms', {
        body: { vendor_id: result.id, sms_type: 'registration' }
      }).catch((e: any) => console.error('Registration SMS failed (non-blocking):', e));
    }

    navigate(isQuickMode ? '/vendor-dashboard' : '/profile/vendor');
  };

  // ============================================================
  // QUICK MODE — original single-card form (phone retained, email/website removed)
  // ============================================================
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
              <CardDescription>
                Join our marketplace and connect with families planning traditional ceremonies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className="w-20 h-20 rounded-xl bg-muted border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
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
                    <Input
                      id="name"
                      placeholder="e.g., Zulu Traditions Decor"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`h-12 ${errors.name ? 'border-destructive' : ''}`}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v as VendorCategory })}
                  >
                    <SelectTrigger className={`h-12 ${errors.category ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select your service category" />
                    </SelectTrigger>
                    <SelectContent>
                      {VENDOR_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                </div>

                <div className="space-y-2">
                  <Label>City / Suburb *</Label>
                  <Input
                    placeholder="e.g., Durban, Umlazi"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className={`h-12 ${errors.city ? 'border-destructive' : ''}`}
                  />
                  {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Phone number *</Label>
                  <div className="flex gap-2">
                    <Popover open={quickPhoneCountryOpen} onOpenChange={setQuickPhoneCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn('w-[120px] h-12 justify-between px-2 flex-shrink-0')}
                        >
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
                                <CommandItem
                                  key={c.code}
                                  value={`${c.name} ${c.dial}`}
                                  onSelect={() => { setQuickPhoneCountry(c.code); setQuickPhoneCountryOpen(false); }}
                                >
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
                    <Input
                      type="tel"
                      placeholder="e.g., 082 123 4567"
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value)}
                      className={`flex-1 h-12 ${errors.phone_number ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number}</p>}
                </div>

                <Button type="submit" className="w-full h-12 mt-6" disabled={isLoading}>
                  {isLoading ? 'Creating profile...' : 'Create vendor profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================================
  // FULL FLOW — two-step stepper
  // ============================================================
  const stepperLabels = ['Details', 'Verify', 'Password', 'Business', 'Showcase'];

  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader title="Become a Vendor" showBack />

      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* Stepper */}
        {fromAuth && (
          <div className="mb-6">
            <div className="flex items-center justify-between relative">
              {stepperLabels.map((label, i) => {
                const stepNum = i + 1;
                const isDone = stepNum < 4 || (stepNum === 4 && onboardingStep === 5);
                const isActive = (stepNum === 4 && onboardingStep === 4) || (stepNum === 5 && onboardingStep === 5);
                return (
                  <div key={label} className="flex flex-col items-center gap-1 relative z-10 flex-1">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors',
                      isDone && 'bg-primary text-primary-foreground border-primary',
                      isActive && 'bg-background text-primary border-primary',
                      !isDone && !isActive && 'bg-background text-muted-foreground border-border'
                    )}>
                      {isDone ? '✓' : stepNum}
                    </div>
                    <span className={cn(
                      'text-[10px] text-center',
                      (isDone || isActive) ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}>
                      {label}
                    </span>
                  </div>
                );
              })}
              {/* Connector line beneath circles */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-border -z-0" style={{ marginLeft: '10%', marginRight: '10%' }}>
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: onboardingStep === 5 ? '100%' : '75%' }}
                />
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* STEP 4 — BUSINESS DETAILS */}
          {onboardingStep === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">Business details</h2>
                <p className="text-sm text-muted-foreground">Tell us about your business</p>
              </div>

              {/* Logo + Business Name */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div
                    className="w-20 h-20 rounded-xl bg-muted border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Logo</span>
                      </div>
                    )}
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  <p className="text-[10px] text-muted-foreground text-center mt-1">Optional</p>
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="name">Business name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Zulu Traditions Decor"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`h-12 ${errors.name ? 'border-destructive' : ''}`}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as VendorCategory })}
                >
                  <SelectTrigger className={`h-12 ${errors.category ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select your service category" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
              </div>

              {/* Registered Business Toggle */}
              <div className="space-y-4 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Formally registered business?</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">e.g., CIPC / Company registration</p>
                  </div>
                  <Switch
                    checked={formData.is_registered_business}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_registered_business: checked })}
                  />
                </div>

                {formData.is_registered_business ? (
                  <div className="space-y-3 pl-1 border-l-2 border-primary/30 ml-1">
                    <div className="pl-3 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="registered_business_name">Registered business name</Label>
                        <Input
                          id="registered_business_name"
                          placeholder="e.g., Zulu Traditions (Pty) Ltd"
                          value={formData.registered_business_name}
                          onChange={(e) => setFormData({ ...formData, registered_business_name: e.target.value })}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registration_number">Registration number</Label>
                        <Input
                          id="registration_number"
                          placeholder="e.g., 2024/123456/07"
                          value={formData.registration_number}
                          onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vat_number">VAT number (optional)</Label>
                        <Input
                          id="vat_number"
                          placeholder="e.g., 4123456789"
                          value={formData.vat_number}
                          onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Verification documents (optional)</Label>
                        <p className="text-xs text-muted-foreground">Upload CIPC registration and proof of address.</p>
                        <div className="space-y-2">
                          {verificationFiles.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm bg-muted rounded-lg p-2">
                              <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate flex-1">{item.file.name}</span>
                              <button
                                type="button"
                                onClick={() => setVerificationFiles(prev => prev.filter((_, i) => i !== index))}
                                className="text-destructive text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => verificationInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Add document
                          </Button>
                          <input
                            ref={verificationInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 10 * 1024 * 1024) { toast.error('Document must be less than 10MB'); return; }
                              setVerificationFiles(prev => [...prev, { file, docType: 'cipc_registration', preview: '' }]);
                              if (verificationInputRef.current) verificationInputRef.current.value = '';
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3">
                        <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          We'll review your documents. Once approved, you'll get a <strong>Verified Business</strong> badge on your profile.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 bg-muted rounded-lg p-3">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      No worries! You can still build trust through great service and verified reviews on UMCIMBI.
                    </p>
                  </div>
                )}
              </div>

              {/* Bank Details */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Your profile won't go live without banking details. You can add these now or from your profile settings.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Bank</Label>
                    <Select
                      value={formData.bank_name}
                      onValueChange={(val) => {
                        const bank = SOUTH_AFRICAN_BANKS.find(b => b.name === val);
                        setFormData(prev => ({ ...prev, bank_name: val, bank_branch_code: bank?.branchCode || '' }));
                      }}
                    >
                      <SelectTrigger className="h-12"><SelectValue placeholder="Select your bank" /></SelectTrigger>
                      <SelectContent>
                        {SOUTH_AFRICAN_BANKS.map(bank => (
                          <SelectItem key={bank.name} value={bank.name}>{bank.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Account holder name</Label>
                    <Input
                      placeholder="As it appears on your bank account"
                      value={formData.bank_account_holder_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, bank_account_holder_name: e.target.value }))}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account number</Label>
                    <Input
                      placeholder="e.g., 1234567890"
                      value={formData.bank_account_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
                      className="h-12"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account type</Label>
                    <Select
                      value={formData.bank_account_type}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, bank_account_type: val }))}
                    >
                      <SelectTrigger className="h-12"><SelectValue placeholder="Select account type" /></SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Branch code</Label>
                    <Input
                      placeholder="Auto-filled from bank"
                      value={formData.bank_branch_code}
                      readOnly
                      className="h-12 bg-muted"
                    />
                  </div>
                </div>
              </div>

              {/* Next button */}
              <Button type="button" onClick={handleNextStep} className="w-full h-12 mt-4">
                Next — Showcase your work <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* STEP 5 — SHOWCASE */}
          {onboardingStep === 5 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setOnboardingStep(4); window.scrollTo(0, 0); }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Back
                </button>
                <div>
                  <h2 className="text-xl font-semibold">Showcase your work</h2>
                  <p className="text-sm text-muted-foreground">Help families see why you're the right choice</p>
                </div>
              </div>

              {/* Info banner */}
              <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3">
                <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  A description and pricing are required before your profile goes live. You can complete photos and social links from your profile settings.
                </p>
              </div>

              {/* About */}
              <div className="space-y-2">
                <Label htmlFor="about">About your business *</Label>
                <Textarea
                  id="about"
                  placeholder="Describe your services, experience, and what makes you special..."
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  rows={4}
                  className={errors.about ? 'border-destructive' : ''}
                />
                {errors.about && <p className="text-sm text-destructive">{errors.about}</p>}
              </div>

              {/* Address */}
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-3">Business Address</h3>
                <AddressFields data={address} onChange={setAddress} errors={errors} />
              </div>

              {/* Price Range */}
              <PricingInput
                category={formData.category}
                value={formData.price_range_text}
                onChange={(formatted) => setFormData({ ...formData, price_range_text: formatted })}
              />
              {errors.price_range_text && <p className="text-sm text-destructive">{errors.price_range_text}</p>}

              {/* Gallery */}
              <div className="space-y-2">
                <Label>Showcase your work (up to 15 images)</Label>
                <div className="grid grid-cols-5 gap-2">
                  {showcaseFiles.map((item, index) => (
                    <div key={index} className="relative aspect-square overflow-hidden rounded-lg bg-muted group">
                      <img src={item.preview} alt={`Showcase ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeShowcase(index)}
                        className="absolute top-1 right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="sr-only">Remove</span>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  {showcaseFiles.length < 15 && (
                    <div
                      className="aspect-square rounded-lg bg-muted border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center"
                      onClick={() => showcaseInputRef.current?.click()}
                    >
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <input ref={showcaseInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleShowcaseAdd} />
                <p className="text-xs text-muted-foreground">Add photos of your work to attract clients. You can also add these later.</p>
              </div>

              {/* Social Links */}
              <div className="space-y-3 pt-2 border-t border-border">
                <Label className="text-sm font-medium">Social links (optional)</Label>
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-xs text-muted-foreground">Instagram username</Label>
                  <Input
                    id="instagram"
                    placeholder="e.g. maswazicatering"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok" className="text-xs text-muted-foreground">TikTok username</Label>
                  <Input
                    id="tiktok"
                    placeholder="e.g. maswazicatering"
                    value={formData.tiktok_url}
                    onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="text-xs text-muted-foreground">Facebook username or page name</Label>
                  <Input
                    id="facebook"
                    placeholder="e.g. maswazicatering"
                    value={formData.facebook_url}
                    onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full h-12 mt-4" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit for review'}
              </Button>
              <p className="text-xs text-center text-muted-foreground pb-8">
                We'll review your profile within 48 hours and notify you by SMS.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
