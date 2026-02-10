import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Phone, Mail, Globe, ImagePlus, Camera, ChevronsUpDown, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { PageHeader } from '@/components/layout/PageHeader';
import { AddressFields, AddressData } from '@/components/shared/AddressFields';
import { useMyVendorProfile } from '@/hooks/useVendors';
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
  name: z.string().trim().min(2, 'Business name must be at least 2 characters').max(100, 'Business name must be less than 100 characters'),
  category: z.enum(VENDOR_CATEGORY_VALUES, {
    required_error: 'Please select a category',
  }),
  address_line_1: z.string().trim().min(1, 'Address Line 1 is required').max(200),
  address_line_2: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().min(1, 'City / Suburb is required').max(100),
  state_province: z.string().trim().max(100).optional().or(z.literal('')),
  country: z.string().trim().min(1, 'Country is required'),
  postal_code: z.string().trim().min(1, 'Postal / Zip Code is required').max(20),
  phone_country: z.string().min(1, 'Please select a country code'),
  phone_number: z.string().trim().min(1, 'Phone number is required'),
  about: z.string().trim().max(2000).optional().or(z.literal('')),
  price_range_text: z.string().trim().max(100).optional().or(z.literal('')),
  email: z.string().trim().email('Please enter a valid email address').max(255).optional().or(z.literal('')),
  website_url: z.string().trim().max(500).optional().or(z.literal('')),
});

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const { createVendorProfile, vendor: existingVendor, isLoading: isLoadingVendor } = useMyVendorProfile();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Redirect if user already has a vendor profile
  useEffect(() => {
    if (!isLoadingVendor && existingVendor) {
      toast.info('You already have a vendor profile');
      navigate('/profile/vendor', { replace: true });
    }
  }, [existingVendor, isLoadingVendor, navigate]);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '' as VendorCategory | '',
    about: '',
    price_range_text: '',
    phone_country: 'ZA' as string,
    phone_number: '',
    email: '',
    website_url: '',
    languages: ['English'],
  });

  const [address, setAddress] = useState<AddressData>({
    address_line_1: '',
    address_line_2: '',
    city: '',
    state_province: '',
    country: 'ZA',
    postal_code: '',
  });

  // Logo placeholder (not uploaded until vendor is created)
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Work showcase images placeholders
  const [showcaseFiles, setShowcaseFiles] = useState<{ file: File; preview: string }[]>([]);
  const showcaseInputRef = useRef<HTMLInputElement>(null);

  const selectedPhoneCountry = COUNTRIES.find(c => c.code === formData.phone_country) || COUNTRIES[0];

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
    const remaining = 5 - showcaseFiles.length;
    if (remaining <= 0) {
      toast.error('Maximum 5 showcase images allowed');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const dataToValidate = {
      ...formData,
      ...address,
    };
    const validation = vendorSchema.safeParse(dataToValidate);

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

    // Validate phone with country
    if (!validateLocalPhone(formData.phone_number, formData.phone_country)) {
      setErrors(prev => ({ ...prev, phone_number: `Please enter a valid ${selectedPhoneCountry.name} phone number` }));
      toast.error(`Please enter a valid ${selectedPhoneCountry.name} phone number`);
      return;
    }

    setIsLoading(true);

    const e164Phone = toE164(formData.phone_number, formData.phone_country);

    // Normalize website URL - add https:// if no protocol specified
    let websiteUrl = formData.website_url.trim() || null;
    if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
      websiteUrl = 'https://' + websiteUrl;
    }

    // Compose location from city + state for backward compatibility
    const locationParts = [address.city.trim(), address.state_province?.trim()].filter(Boolean);
    const composedLocation = locationParts.join(', ') || null;

    // Create vendor profile first (without images)
    const result = await createVendorProfile({
      name: formData.name.trim(),
      category: formData.category as VendorCategory,
      location: composedLocation,
      about: formData.about.trim() || null,
      price_range_text: formData.price_range_text.trim() || null,
      phone_number: e164Phone,
      whatsapp_number: null,
      email: formData.email.trim() || null,
      website_url: websiteUrl,
      languages: formData.languages,
      image_urls: [],
      address_line_1: address.address_line_1.trim(),
      address_line_2: address.address_line_2.trim() || null,
      city: address.city.trim(),
      state_province: address.state_province.trim() || null,
      country: address.country,
      postal_code: address.postal_code.trim(),
    });

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
    navigate('/profile/vendor');
  };

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
              {/* Business Name + Logo */}
              <div className="flex items-start gap-4">
                {/* Logo Upload Placeholder */}
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
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>

                {/* Business Name */}
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
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
              </div>

              {/* Address Section */}
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-3">Business Address *</h3>
                <AddressFields data={address} onChange={setAddress} errors={errors} />
              </div>

              {/* About */}
              <div className="space-y-2">
                <Label htmlFor="about">About your business</Label>
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

              {/* Showcase Images */}
              <div className="space-y-2">
                <Label>Showcase your work (up to 5 images)</Label>
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
                  {showcaseFiles.length < 5 && (
                    <div
                      className="aspect-square rounded-lg bg-muted border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center"
                      onClick={() => showcaseInputRef.current?.click()}
                    >
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <input
                  ref={showcaseInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleShowcaseAdd}
                />
                <p className="text-xs text-muted-foreground">
                  Add photos of your work to attract clients. You can also add these later.
                </p>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label htmlFor="price">Price range</Label>
                <Input
                  id="price"
                  placeholder="e.g., From R5,000 or R150/head"
                  value={formData.price_range_text}
                  onChange={(e) => setFormData({ ...formData, price_range_text: e.target.value })}
                  className="h-12"
                />
              </div>

              {/* Phone with Country Code */}
              <div className="space-y-2">
                <Label>Phone number *</Label>
                <div className="flex gap-2">
                  {/* Country Code Selector */}
                  <Popover open={phoneCountryOpen} onOpenChange={setPhoneCountryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'w-[120px] h-12 justify-between px-2 flex-shrink-0',
                          errors.phone_country && 'border-destructive'
                        )}
                      >
                        <span className="flex items-center gap-1 text-sm truncate">
                          <span>{selectedPhoneCountry.flag}</span>
                          <span>{selectedPhoneCountry.dial}</span>
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
                                onSelect={() => {
                                  setFormData({ ...formData, phone_country: c.code });
                                  setPhoneCountryOpen(false);
                                }}
                              >
                                <Check className={cn('mr-2 h-4 w-4', formData.phone_country === c.code ? 'opacity-100' : 'opacity-0')} />
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

                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder={`e.g., 082 123 4567`}
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className={`pl-10 h-12 ${errors.phone_number ? 'border-destructive' : ''}`}
                    />
                  </div>
                </div>
                {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number}</p>}
                {errors.phone_country && <p className="text-sm text-destructive">{errors.phone_country}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Business email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="business@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`pl-10 h-12 ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    type="text"
                    placeholder="https://..."
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className={`pl-10 h-12 ${errors.website_url ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.website_url && <p className="text-sm text-destructive">{errors.website_url}</p>}
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
