import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, Shield, Lock,
  PartyPopper, Store, Phone, Mail, Globe, ImagePlus, Camera,
  ChevronsUpDown, Check, Upload, Info
} from 'lucide-react';
import { PricingInput } from '@/components/vendors/PricingInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AddressFields, AddressData } from '@/components/shared/AddressFields';
import { VENDOR_CATEGORIES, VENDOR_CATEGORY_VALUES, VendorCategory } from '@/lib/vendorCategories';
import { COUNTRIES, getCountryByCode } from '@/data/countries';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/lib/utils';

// ─── CONSTANTS ───
const SA_DIAL = '+27';
const SA_PHONE_LENGTH = 9;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ─── HELPERS ───
const validateSAPhone = (phone: string) => {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const digits = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  return /^\d+$/.test(digits) && digits.length === SA_PHONE_LENGTH;
};
const toE164 = (phone: string) => {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const digits = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  return SA_DIAL + digits;
};
const phoneToEmail = (phone: string) => {
  const e164 = toE164(phone);
  return `${e164.replace(/^\+/, '')}@phone.isiko.app`;
};

const validateLocalPhone = (phone: string, countryCode: string) => {
  const country = getCountryByCode(countryCode);
  if (!country) return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const digits = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  return /^\d+$/.test(digits) && digits.length === country.phoneLength;
};
const toE164WithCountry = (phone: string, countryCode: string) => {
  const country = getCountryByCode(countryCode);
  if (!country) return phone;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const digits = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  return country.dial + digits;
};

// ─── SCHEMAS ───
const detailsSchema = z.object({
  first_name: z.string().trim().min(2, 'First name must be at least 2 characters').max(50),
  surname: z.string().trim().min(2, 'Surname must be at least 2 characters').max(50),
  phone_number: z.string().trim().min(1, 'Phone number is required'),
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms & POPIA consent' }),
  }),
}).refine(data => validateSAPhone(data.phone_number), {
  message: 'Please enter a valid SA phone number',
  path: ['phone_number'],
});

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

const vendorSchema = z.object({
  name: z.string().trim().min(2, 'Business name must be at least 2 characters').max(100),
  category: z.enum(VENDOR_CATEGORY_VALUES, { required_error: 'Please select a category' }),
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
  email: z.string().trim().email('Please enter a valid email').max(255).optional().or(z.literal('')),
  website_url: z.string().trim().max(500).optional().or(z.literal('')),
});

// ─── TYPES ───
type UserRole = 'planner' | 'vendor';
type Step = 'role' | 'auth_method' | 'details' | 'otp' | 'password' | 'business' | 'showcase' | 'success'
  | 'login' | 'forgot_phone' | 'forgot_otp' | 'forgot_password';

function getSteps(role: UserRole | null): Step[] {
  if (!role) return ['role'];
  if (role === 'planner') return ['role', 'auth_method', 'details', 'otp', 'password', 'success'];
  return ['role', 'auth_method', 'details', 'otp', 'password', 'business', 'showcase', 'success'];
}

// ─── STEPPER COMPONENT ───
function OnboardingStepper({ steps, currentStep }: { steps: Step[]; currentStep: Step }) {
  // Only show stepper for registration steps (not role, not forgot/login)
  const regSteps: Step[] = steps.filter(s => s !== 'role' && s !== 'auth_method' && s !== 'success');
  const currentIndex = regSteps.indexOf(currentStep);
  if (currentIndex < 0) return null;

  const labels: Record<string, string> = {
    details: 'Details',
    otp: 'Verify',
    password: 'Password',
    business: 'Business',
    showcase: 'Showcase',
  };

  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-md mx-auto mb-6 px-2">
      {regSteps.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all',
                  isCompleted && 'bg-[hsl(174,82%,29%)] border-[hsl(174,82%,29%)] text-white',
                  isCurrent && 'border-[hsl(174,82%,29%)] text-[hsl(174,82%,29%)] bg-background',
                  !isCompleted && !isCurrent && 'border-muted-foreground/30 text-muted-foreground/50 bg-background',
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn(
                'text-[10px] mt-1 font-medium',
                isCurrent ? 'text-foreground' : 'text-muted-foreground/60'
              )}>
                {labels[step] || step}
              </span>
            </div>
            {i < regSteps.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-1 mt-[-12px]',
                i < currentIndex ? 'bg-[hsl(174,82%,29%)]' : 'bg-muted-foreground/20',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── COMPLETE PROFILE STEP (for Google OAuth new users) ───
function CompleteProfileStep() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Pre-fill from profile if available
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/auth', { replace: true }); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, surname, full_name, phone_number')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profile) {
        if (profile.full_name) setFullName(profile.full_name);
        else if (profile.first_name) setFullName([profile.first_name, profile.surname].filter(Boolean).join(' '));
        if (profile.phone_number) setPhoneNumber(profile.phone_number);
      }
    };
    loadProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length < 1 || !nameParts[0]) {
      setFieldErrors({ fullName: 'Please enter your full name' });
      return;
    }
    if (!phoneNumber.trim()) {
      setFieldErrors({ phoneNumber: 'Phone number is required' });
      return;
    }
    if (!validateSAPhone(phoneNumber)) {
      setFieldErrors({ phoneNumber: 'Please enter a valid SA phone number' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Session expired'); navigate('/auth'); return; }

      const firstName = nameParts[0];
      const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const { error } = await supabase.from('profiles').update({
        first_name: firstName,
        surname: surname || null,
        full_name: fullName.trim(),
        phone_number: toE164(phoneNumber),
        phone_verified: false,
        is_profile_complete: true,
      }).eq('user_id', user.id);

      if (error) {
        toast.error('Failed to save profile. Please try again.');
        console.error('Profile update error:', error);
      } else {
        toast.success('Profile complete! Welcome to UMCIMBI.');
        navigate('/', { replace: true });
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete your profile</CardTitle>
          <CardDescription>Just a few more details to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpFullName">Full Name *</Label>
              <Input
                id="cpFullName"
                placeholder="e.g. Thandi Nkosi"
                value={fullName}
                onChange={e => { setFullName(e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.fullName; return n; }); }}
                className={`h-12 ${fieldErrors.fullName ? 'border-destructive' : ''}`}
                autoComplete="name"
              />
              {fieldErrors.fullName && <p className="text-sm text-destructive">{fieldErrors.fullName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpPhone">Phone Number *</Label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center h-12 px-3 rounded-md border border-input bg-muted text-sm font-medium text-muted-foreground shrink-0">🇿🇦 +27</div>
                <Input
                  id="cpPhone"
                  type="tel"
                  placeholder="0821234567"
                  value={phoneNumber}
                  onChange={e => { setPhoneNumber(e.target.value); setFieldErrors(prev => { const n = { ...prev }; delete n.phoneNumber; return n; }); }}
                  className={`h-12 ${fieldErrors.phoneNumber ? 'border-destructive' : ''}`}
                  autoComplete="tel"
                />
              </div>
              {fieldErrors.phoneNumber && <p className="text-sm text-destructive">{fieldErrors.phoneNumber}</p>}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                We need your number to connect you with vendors
              </p>
            </div>
            <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              {isSubmitting ? 'Saving...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MAIN COMPONENT ───
export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();

  const refSource = searchParams.get('ref');
  const initialRole: UserRole | null = searchParams.get('role') === 'vendor' ? 'vendor' : null;
  const initialStep: Step = searchParams.get('mode') === 'signup'
    ? (initialRole ? 'auth_method' : 'role')
    : 'login';
  const [step, setStep] = useState<Step>(initialStep);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(initialRole);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  // Login state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot password state
  const [forgotPhone, setForgotPhone] = useState('');

  // Registration form state
  const [form, setForm] = useState({
    first_name: '',
    surname: '',
    phone_number: '',
    terms_accepted: false as any,
  });

  const [passwordForm, setPasswordForm] = useState({ password: '', confirm_password: '' });
  const [otpValue, setOtpValue] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);

  // Vendor form state
  const [vendorForm, setVendorForm] = useState({
    name: '',
    category: '' as VendorCategory | '',
    about: '',
    price_range_text: '',
    phone_country: 'ZA' as string,
    phone_number: '',
    email: '',
    website_url: '',
    languages: ['English'],
    is_registered_business: false,
    registered_business_name: '',
    registration_number: '',
    vat_number: '',
  });
  const [vendorAddress, setVendorAddress] = useState<AddressData>({
    address_line_1: '', address_line_2: '', city: '', state_province: '', country: 'ZA', postal_code: '',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showcaseFiles, setShowcaseFiles] = useState<{ file: File; preview: string }[]>([]);
  const [verificationFiles, setVerificationFiles] = useState<{ file: File; docType: string; preview: string }[]>([]);
  const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const showcaseInputRef = useRef<HTMLInputElement>(null);
  const verificationInputRef = useRef<HTMLInputElement>(null);

  const selectedPhoneCountry = COUNTRIES.find(c => c.code === vendorForm.phone_country) || COUNTRIES[0];

  // Timers
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (otpExpiry <= 0) return;
    const timer = setInterval(() => setOtpExpiry(e => Math.max(0, e - 1)), 1000);
    return () => clearInterval(timer);
  }, [otpExpiry]);

  const updateForm = useCallback((field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const formatExpiryTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const allSteps = getSteps(selectedRole);

  // ─── HANDLERS ───

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!loginPhone.trim()) { setErrors({ loginPhone: 'Phone number is required' }); return; }
    if (!loginPassword) { setErrors({ loginPassword: 'Password is required' }); return; }
    if (!validateSAPhone(loginPhone)) { setErrors({ loginPhone: 'Please enter a valid SA phone number' }); return; }
    setIsLoading(true);
    try {
      const email = phoneToEmail(loginPhone);
      const { error } = await signIn(email, loginPassword);
      if (error) {
        toast.error(error.message.includes('Invalid login credentials') ? 'Invalid phone number or password' : error.message);
      } else {
        toast.success('Welcome back!');
        navigate('/');
      }
    } finally { setIsLoading(false); }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = detailsSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => { const f = err.path[0]?.toString(); if (f) fieldErrors[f] = err.message; });
      setErrors(fieldErrors);
      const first = result.error.errors[0]?.message;
      if (first) toast.error(first);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ phone_number: toE164(form.phone_number) }),
      });
      const data = await res.json();
      if (res.status === 429) { toast.error('Please wait before requesting a new code'); setCooldown(30); }
      else if (!res.ok) { toast.error(data.error || 'Failed to send verification code'); }
      else { toast.success('Verification code sent!'); setStep('otp'); setCooldown(30); setOtpExpiry(300); setOtpValue(''); }
    } catch { toast.error('Network error. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ phone_number: toE164(form.phone_number) }),
      });
      const data = await res.json();
      if (res.status === 429) toast.error(data.error || 'Too many requests');
      else { toast.success('New code sent!'); setCooldown(30); setOtpExpiry(300); setOtpValue(''); }
    } catch { toast.error('Network error'); }
    finally { setIsLoading(false); }
  };

  const handleVerifyOtp = () => {
    if (otpValue.length !== 6) { toast.error('Please enter the full 6-digit code'); return; }
    setStep('password');
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = passwordSchema.safeParse(passwordForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => { const f = err.path[0]?.toString(); if (f) fieldErrors[f] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({
          phone_number: toE164(form.phone_number),
          otp: otpValue,
          first_name: form.first_name,
          surname: form.surname,
          address: 'Not provided',
          password: passwordForm.password,
          role: selectedRole === 'vendor' ? 'vendor' : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.expired) { toast.error('Code expired. Please start over.'); setStep('details'); }
        else if (data.locked) { toast.error('Too many attempts. Please start over.'); setStep('details'); }
        else { toast.error(data.error || 'Registration failed'); }
        return;
      }

      // Auto sign-in
      const email = phoneToEmail(form.phone_number);
      const { error: signInError } = await signIn(email, passwordForm.password);
      if (signInError) console.error('Auto sign-in failed:', signInError);

      setCreatedUserId(data.user_id);

      if (selectedRole === 'vendor') {
        toast.success('Account created! Now set up your business.');
        setStep('business');
      } else {
        setStep('success');
        toast.success('Account created successfully!');
      }
    } catch { toast.error('Network error. Please try again.'); }
    finally { setIsLoading(false); }
  };

  // ─── VENDOR HANDLERS ───

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleShowcaseAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 5 - showcaseFiles.length;
    if (remaining <= 0) { toast.error('Maximum 5 showcase images'); return; }
    const toAdd = Array.from(files).slice(0, remaining);
    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) { toast.error('Please select only image files'); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error('Each image must be less than 5MB'); return; }
    }
    setShowcaseFiles(prev => [...prev, ...toAdd.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]);
    if (showcaseInputRef.current) showcaseInputRef.current.value = '';
  };

  const removeShowcase = (index: number) => {
    setShowcaseFiles(prev => { const c = [...prev]; URL.revokeObjectURL(c[index].preview); c.splice(index, 1); return c; });
  };

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const dataToValidate = { ...vendorForm, ...vendorAddress };
    const validation = vendorSchema.safeParse(dataToValidate);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => { if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message; });
      setErrors(fieldErrors);
      toast.error(validation.error.errors[0]?.message);
      return;
    }
    if (!validateLocalPhone(vendorForm.phone_number, vendorForm.phone_country)) {
      setErrors(prev => ({ ...prev, phone_number: `Please enter a valid ${selectedPhoneCountry.name} phone number` }));
      toast.error(`Please enter a valid ${selectedPhoneCountry.name} phone number`);
      return;
    }
    setStep('showcase');
  };

  const handleFinalVendorSubmit = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Session expired. Please sign in again.'); setIsLoading(false); return; }

    const e164Phone = toE164WithCountry(vendorForm.phone_number, vendorForm.phone_country);
    let websiteUrl = vendorForm.website_url.trim() || null;
    if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) websiteUrl = 'https://' + websiteUrl;

    const locationParts = [vendorAddress.city.trim(), vendorAddress.state_province?.trim()].filter(Boolean);
    const composedLocation = locationParts.join(', ') || null;
    const vendorBusinessType = vendorForm.is_registered_business ? 'registered_business' as const : 'independent' as const;
    const verificationStatus = vendorForm.is_registered_business ? 'pending' as const : 'not_applicable' as const;

    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        owner_user_id: user.id,
        name: vendorForm.name.trim(),
        category: vendorForm.category as VendorCategory,
        location: composedLocation,
        about: vendorForm.about.trim() || null,
        price_range_text: vendorForm.price_range_text.trim() || null,
        phone_number: e164Phone,
        whatsapp_number: null,
        email: vendorForm.email.trim() || null,
        website_url: websiteUrl,
        languages: vendorForm.languages,
        image_urls: [],
        address_line_1: vendorAddress.address_line_1.trim(),
        address_line_2: vendorAddress.address_line_2.trim() || null,
        city: vendorAddress.city.trim(),
        state_province: vendorAddress.state_province.trim() || null,
        country: vendorAddress.country,
        postal_code: vendorAddress.postal_code.trim(),
        vendor_business_type: vendorBusinessType,
        business_verification_status: verificationStatus,
        registered_business_name: vendorForm.is_registered_business ? vendorForm.registered_business_name.trim() || null : null,
        registration_number: vendorForm.is_registered_business ? vendorForm.registration_number.trim() || null : null,
        vat_number: vendorForm.is_registered_business ? vendorForm.vat_number.trim() || null : null,
      })
      .select()
      .single();

    if (vendorError) {
      console.error('Vendor creation error:', vendorError);
      toast.error('Failed to create vendor profile. Please try again.');
      setIsLoading(false);
      return;
    }

    // Upload images
    const uploadedUrls: string[] = [];
    try {
      if (logoFile) {
        const ext = logoFile.name.split('.').pop() || 'jpg';
        const path = `${vendorData.id}/logo.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('vendor-images').upload(path, logoFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('vendor-images').getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }
      for (let i = 0; i < showcaseFiles.length; i++) {
        const file = showcaseFiles[i].file;
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${vendorData.id}/showcase-${i}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('vendor-images').upload(path, file, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('vendor-images').getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }
      if (vendorForm.is_registered_business && verificationFiles.length > 0) {
        for (let i = 0; i < verificationFiles.length; i++) {
          const vf = verificationFiles[i];
          const ext = vf.file.name.split('.').pop() || 'pdf';
          const docPath = `${vendorData.id}/docs/doc-${i}.${ext}`;
          const { error: docErr } = await supabase.storage.from('vendor-images').upload(docPath, vf.file, { upsert: true });
          if (!docErr) {
            const { data: docUrlData } = supabase.storage.from('vendor-images').getPublicUrl(docPath);
            await supabase.from('vendor_verification_documents').insert({
              vendor_id: vendorData.id,
              doc_type: i === 0 ? 'cipc_registration' : 'proof_of_address',
              file_url: docUrlData.publicUrl,
              status: 'uploaded',
            } as any);
          }
        }
      }
      if (uploadedUrls.length > 0) {
        await supabase.from('vendors').update({ image_urls: uploadedUrls }).eq('id', vendorData.id);
      }
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Profile created but some images failed to upload.');
    }

    // Save signup_source if ref param present
    if (refSource) {
      await supabase.from('vendors').update({ signup_source: refSource } as any).eq('id', vendorData.id);
    }

    setIsLoading(false);
    setStep('success');
    toast.success('Your business profile is live!');
  };

  // ─── FORGOT PASSWORD HANDLERS ───
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!forgotPhone.trim()) { setErrors({ forgotPhone: 'Phone number is required' }); return; }
    if (!validateSAPhone(forgotPhone)) { setErrors({ forgotPhone: 'Please enter a valid SA phone number' }); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ phone_number: toE164(forgotPhone) }),
      });
      const data = await res.json();
      if (res.status === 429) { toast.error('Please wait before requesting a new code'); setCooldown(30); }
      else if (!res.ok) { toast.error(data.error || 'Failed to send verification code'); }
      else { toast.success('Verification code sent!'); setStep('forgot_otp'); setCooldown(30); setOtpExpiry(300); setOtpValue(''); }
    } catch { toast.error('Network error. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleForgotResend = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ phone_number: toE164(forgotPhone) }),
      });
      const data = await res.json();
      if (res.status === 429) toast.error(data.error || 'Too many requests');
      else { toast.success('New code sent!'); setCooldown(30); setOtpExpiry(300); setOtpValue(''); }
    } catch { toast.error('Network error'); }
    finally { setIsLoading(false); }
  };

  const handleForgotVerifyOtp = () => {
    if (otpValue.length !== 6) { toast.error('Please enter the full 6-digit code'); return; }
    setPasswordForm({ password: '', confirm_password: '' });
    setStep('forgot_password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = passwordSchema.safeParse(passwordForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => { const f = err.path[0]?.toString(); if (f) fieldErrors[f] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ phone_number: toE164(forgotPhone), otp: otpValue, new_password: passwordForm.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.expired) { toast.error('Code expired. Please start over.'); setStep('forgot_phone'); }
        else if (data.locked) { toast.error('Too many attempts. Please start over.'); setStep('forgot_phone'); }
        else toast.error(data.error || 'Password reset failed');
        return;
      }
      toast.success('Password reset successfully! Please sign in.');
      setStep('login');
      setLoginPhone(forgotPhone);
      setLoginPassword('');
    } catch { toast.error('Network error. Please try again.'); }
    finally { setIsLoading(false); }
  };

  // ═══════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════

  // ─── LOGIN ───
  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
        <div className="px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/onboarding')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🎊</span>
              </div>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to access your ceremonies</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Google OAuth - requires Google provider enabled in Lovable Cloud Auth Settings */}
              <Button
                variant="outline"
                className="w-full h-12 mb-4"
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const result = await lovable.auth.signInWithOAuth("google", {
                      redirect_uri: window.location.origin + '/auth/callback',
                    });
                    if (result?.error) {
                      toast.error('Google sign-in failed. Please try again.');
                    }
                  } catch {
                    toast.error('Google sign-in failed. Please try again.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginPhone">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center h-12 px-3 rounded-md border border-input bg-muted text-sm font-medium text-muted-foreground shrink-0">🇿🇦 +27</div>
                    <Input id="loginPhone" type="tel" placeholder="0821234567" value={loginPhone}
                      onChange={e => { setLoginPhone(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.loginPhone; return n; }); }}
                      className={`h-12 ${errors.loginPhone ? 'border-destructive' : ''}`} autoComplete="tel" />
                  </div>
                  {errors.loginPhone && <p className="text-sm text-destructive">{errors.loginPhone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Password</Label>
                  <Input id="loginPassword" type="password" placeholder="••••••••" value={loginPassword}
                    onChange={e => { setLoginPassword(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.loginPassword; return n; }); }}
                    className={`h-12 ${errors.loginPassword ? 'border-destructive' : ''}`} autoComplete="current-password" />
                  {errors.loginPassword && <p className="text-sm text-destructive">{errors.loginPassword}</p>}
                  <div className="text-right">
                    <Button variant="link" className="px-0 h-auto text-xs" onClick={() => { setForgotPhone(loginPhone); setStep('forgot_phone'); }}>Forgot password?</Button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?
                  <Button variant="link" className="px-1" onClick={() => { setSelectedRole(null); setStep('role'); }}>Sign up</Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── FORGOT PASSWORD SCREENS ───
  if (step === 'forgot_phone') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
        <div className="px-4 py-4"><Button variant="ghost" size="icon" onClick={() => setStep('login')}><ArrowLeft className="h-5 w-5" /></Button></div>
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4"><Lock className="h-8 w-8 text-primary" /></div>
              <CardTitle className="text-2xl">Reset your password</CardTitle>
              <CardDescription>Enter your phone number and we'll send a verification code</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgotPhone">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center h-12 px-3 rounded-md border border-input bg-muted text-sm font-medium text-muted-foreground shrink-0">🇿🇦 +27</div>
                    <Input id="forgotPhone" type="tel" placeholder="0821234567" value={forgotPhone}
                      onChange={e => { setForgotPhone(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.forgotPhone; return n; }); }}
                      className={`h-12 ${errors.forgotPhone ? 'border-destructive' : ''}`} autoComplete="tel" autoFocus />
                  </div>
                  {errors.forgotPhone && <p className="text-sm text-destructive">{errors.forgotPhone}</p>}
                </div>
                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  {isLoading ? 'Sending code...' : 'Send Verification Code'}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">Remember your password?<Button variant="link" className="px-1" onClick={() => setStep('login')}>Sign in</Button></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'forgot_otp') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
        <div className="px-4 py-4"><Button variant="ghost" size="icon" onClick={() => setStep('forgot_phone')}><ArrowLeft className="h-5 w-5" /></Button></div>
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4"><Shield className="h-8 w-8 text-primary" /></div>
              <CardTitle className="text-2xl">Verify your phone</CardTitle>
              <CardDescription>Enter the 6-digit code sent to <span className="font-semibold text-foreground">+27 {forgotPhone}</span></CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                  <InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup>
                </InputOTP>
              </div>
              {otpExpiry > 0 && <p className="text-center text-sm text-muted-foreground">Code expires in <span className="font-mono font-semibold text-foreground">{formatExpiryTime(otpExpiry)}</span></p>}
              {otpExpiry === 0 && <p className="text-center text-sm text-destructive">Code expired. Please request a new one.</p>}
              <Button className="w-full h-12" onClick={handleForgotVerifyOtp} disabled={otpValue.length !== 6}><ArrowRight className="h-4 w-4 mr-2" />Continue</Button>
              <div className="text-center"><Button variant="ghost" size="sm" onClick={handleForgotResend} disabled={cooldown > 0 || isLoading}>{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}</Button></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'forgot_password') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
        <div className="px-4 py-4"><Button variant="ghost" size="icon" onClick={() => setStep('forgot_otp')}><ArrowLeft className="h-5 w-5" /></Button></div>
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4"><Lock className="h-8 w-8 text-primary" /></div>
              <CardTitle className="text-2xl">Set new password</CardTitle>
              <CardDescription>Choose a new password for your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password *</Label>
                  <Input id="newPassword" type="password" placeholder="Min 6 characters" value={passwordForm.password}
                    onChange={e => { setPasswordForm(prev => ({ ...prev, password: e.target.value })); setErrors(prev => { const n = { ...prev }; delete n.password; return n; }); }}
                    className={`h-12 ${errors.password ? 'border-destructive' : ''}`} autoComplete="new-password" />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password *</Label>
                  <Input id="confirmNewPassword" type="password" placeholder="Re-enter password" value={passwordForm.confirm_password}
                    onChange={e => { setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value })); setErrors(prev => { const n = { ...prev }; delete n.confirm_password; return n; }); }}
                    className={`h-12 ${errors.confirm_password ? 'border-destructive' : ''}`} autoComplete="new-password" />
                  {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password}</p>}
                </div>
                <Button type="submit" className="w-full h-12 mt-2" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  {isLoading ? 'Resetting password...' : 'Reset Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── COMPLETE PROFILE (Google OAuth new users) ───
  if (searchParams.get('step') === 'complete-profile') {
    return <CompleteProfileStep />;
  }

  // ─── STEP 1: ROLE CHOICE ───
  if (step === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
        <div className="px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => setStep('login')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">How will you use UMCIMBI?</h1>
              <p className="text-muted-foreground text-sm">Choose your path to get started</p>
            </div>

            <div className="grid gap-4">
              {/* Planner Card */}
              <button
                onClick={() => { setSelectedRole('planner'); setStep('auth_method'); }}
                className={cn(
                  'relative p-6 rounded-2xl border-2 text-left transition-all group',
                  'bg-card/70 backdrop-blur-md hover:shadow-lg hover:border-accent',
                  'border-border/50'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <PartyPopper className="h-7 w-7 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">I'm planning a ceremony</h3>
                    <p className="text-sm text-muted-foreground">
                      Organise traditional ceremonies, manage guests, budgets, and find trusted vendors.
                    </p>
                  </div>
                </div>
                <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-hover:text-accent transition-colors" />
              </button>

              {/* Vendor Card */}
              <button
                onClick={() => { setSelectedRole('vendor'); setStep('auth_method'); }}
                className={cn(
                  'relative p-6 rounded-2xl border-2 text-left transition-all group',
                  'bg-card/70 backdrop-blur-md hover:shadow-lg hover:border-[hsl(174,82%,29%)]',
                  'border-border/50'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[hsl(174,82%,29%)]/10 flex items-center justify-center shrink-0">
                    <Store className="h-7 w-7 text-[hsl(174,82%,29%)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">I'm a service provider</h3>
                    <p className="text-sm text-muted-foreground">
                      List your business, receive requests, send quotes, and grow your customer base.
                    </p>
                  </div>
                </div>
                <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-hover:text-[hsl(174,82%,29%)] transition-colors" />
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?
                <Button variant="link" className="px-1" onClick={() => setStep('login')}>Sign in</Button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Role must always be selected before auth method to ensure correct post-registration routing
  if (step === 'auth_method') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
        <div className="px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => setStep('role')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <span className="inline-block text-xs font-medium uppercase tracking-wide text-muted-foreground bg-muted px-3 py-1 rounded-full">
                Registering as: {selectedRole === 'vendor' ? 'Service Provider' : 'Ceremony Planner'}
              </span>
              <h1 className="text-2xl font-bold text-foreground">How would you like to sign up?</h1>
            </div>

            {/* Referral welcome banner */}
            {refSource === 'ndabe' && selectedRole === 'vendor' && (
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-center space-y-1">
                <p className="text-sm font-semibold text-foreground">Welcome — Ndabe has partnered with Umcimbi to help your business grow</p>
              </div>
            )}

            {/* Google OAuth */}
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const result = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin + '/auth/callback?role=' + selectedRole,
                  });
                  if (result?.error) {
                    toast.error('Google sign-up failed. Please try again.');
                  }
                } catch {
                  toast.error('Google sign-up failed. Please try again.');
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or continue with phone</span>
              </div>
            </div>

            <Button
              className="w-full h-12"
              variant="outline"
              onClick={() => setStep('details')}
            >
              <Phone className="h-5 w-5 mr-2" />
              Continue with Phone
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── SUCCESS ───
  if (step === 'success') {
    const isVendor = selectedRole === 'vendor';
    return (
      <div className="min-h-screen bg-gradient-to-b from-success/10 to-background flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">{isVendor ? 'Your business is live!' : "You're all set!"}</h2>
              <p className="text-muted-foreground">
                {isVendor
                  ? `Welcome to UMCIMBI, ${form.first_name}! Your vendor profile is ready to receive requests.`
                  : `Welcome to UMCIMBI, ${form.first_name}! Your account is ready.`
                }
              </p>
            </div>
            <Button className="w-full h-12" onClick={() => navigate(isVendor ? '/vendor-dashboard' : '/')}>
              {isVendor ? 'Go to Dashboard' : 'Get Started'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── REGISTRATION STEPS (with stepper) ───
  const backMap: Partial<Record<Step, Step>> = {
    details: 'auth_method',
    otp: 'details',
    password: 'otp',
    business: 'password',
    showcase: 'business',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
      <div className="px-4 py-4">
        <Button variant="ghost" size="icon" onClick={() => {
          const back = backMap[step];
          if (back) setStep(back);
        }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 pb-8">
        <OnboardingStepper steps={allSteps} currentStep={step} />

        <div className="w-full max-w-md">
          {/* ─── DETAILS ─── */}
          {step === 'details' && (
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl">🎊</span>
                </div>
                <CardTitle className="text-2xl">Your details</CardTitle>
                <CardDescription>Tell us a bit about yourself</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDetailsSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input id="first_name" placeholder="e.g., Sipho" value={form.first_name}
                        onChange={e => updateForm('first_name', e.target.value)}
                        className={`h-12 ${errors.first_name ? 'border-destructive' : ''}`} />
                      {errors.first_name && <p className="text-xs text-destructive">{errors.first_name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="surname">Surname *</Label>
                      <Input id="surname" placeholder="e.g., Dlamini" value={form.surname}
                        onChange={e => updateForm('surname', e.target.value)}
                        className={`h-12 ${errors.surname ? 'border-destructive' : ''}`} />
                      {errors.surname && <p className="text-xs text-destructive">{errors.surname}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Cellphone Number *</Label>
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center h-12 px-3 rounded-md border border-input bg-muted text-sm font-medium text-muted-foreground shrink-0">🇿🇦 +27</div>
                      <Input id="phone_number" type="tel" placeholder="0821234567" value={form.phone_number}
                        onChange={e => updateForm('phone_number', e.target.value)}
                        className={`h-12 ${errors.phone_number ? 'border-destructive' : ''}`} />
                    </div>
                    {errors.phone_number && <p className="text-xs text-destructive">{errors.phone_number}</p>}
                  </div>
                  <div className="flex items-start space-x-3 pt-2">
                    <Checkbox id="terms" checked={form.terms_accepted}
                      onCheckedChange={checked => updateForm('terms_accepted', !!checked)}
                      className={errors.terms_accepted ? 'border-destructive' : ''} />
                    <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      I have read and agree to the <Link to="/terms" className="text-primary font-medium underline" target="_blank" rel="noopener noreferrer">Terms of Service</Link> and <Link to="/privacy" className="text-primary font-medium underline" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
                    </Label>
                  </div>
                  {errors.terms_accepted && <p className="text-xs text-destructive">{errors.terms_accepted}</p>}
                  <Button type="submit" className="w-full h-12 mt-2" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                    {isLoading ? 'Sending code...' : 'Send Verification Code'}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">Already have an account?<Button variant="link" className="px-1" onClick={() => setStep('login')}>Sign in</Button></p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── OTP ─── */}
          {step === 'otp' && (
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4"><Shield className="h-8 w-8 text-primary" /></div>
                <CardTitle className="text-2xl">Verify your phone</CardTitle>
                <CardDescription>Enter the 6-digit code sent to <span className="font-semibold text-foreground">+27 {form.phone_number}</span></CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                    <InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup>
                  </InputOTP>
                </div>
                {otpExpiry > 0 && <p className="text-center text-sm text-muted-foreground">Code expires in <span className="font-mono font-semibold text-foreground">{formatExpiryTime(otpExpiry)}</span></p>}
                {otpExpiry === 0 && <p className="text-center text-sm text-destructive">Code expired. Please request a new one.</p>}
                <Button className="w-full h-12" onClick={handleVerifyOtp} disabled={otpValue.length !== 6}><ArrowRight className="h-4 w-4 mr-2" />Continue</Button>
                <div className="text-center"><Button variant="ghost" size="sm" onClick={handleResend} disabled={cooldown > 0 || isLoading}>{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}</Button></div>
              </CardContent>
            </Card>
          )}

          {/* ─── PASSWORD ─── */}
          {step === 'password' && (
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4"><Lock className="h-8 w-8 text-primary" /></div>
                <CardTitle className="text-2xl">Create your password</CardTitle>
                <CardDescription>You'll use this password with your phone number to sign in</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input id="password" type="password" placeholder="Min 6 characters" value={passwordForm.password}
                      onChange={e => { setPasswordForm(prev => ({ ...prev, password: e.target.value })); setErrors(prev => { const n = { ...prev }; delete n.password; return n; }); }}
                      className={`h-12 ${errors.password ? 'border-destructive' : ''}`} autoComplete="new-password" />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password *</Label>
                    <Input id="confirm_password" type="password" placeholder="Re-enter password" value={passwordForm.confirm_password}
                      onChange={e => { setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value })); setErrors(prev => { const n = { ...prev }; delete n.confirm_password; return n; }); }}
                      className={`h-12 ${errors.confirm_password ? 'border-destructive' : ''}`} autoComplete="new-password" />
                    {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password}</p>}
                  </div>
                  <Button type="submit" className="w-full h-12 mt-2" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    {isLoading ? 'Creating account...' : selectedRole === 'vendor' ? 'Create Account & Continue' : 'Complete Registration'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ─── BUSINESS DETAILS (Vendor Step 5) ─── */}
          {step === 'business' && (
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-[hsl(174,82%,29%)]/10 flex items-center justify-center mb-2"><Store className="h-6 w-6 text-[hsl(174,82%,29%)]" /></div>
                <CardTitle>Set up your business</CardTitle>
                <CardDescription>Tell clients about your services</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBusinessSubmit} className="space-y-5">
                  {/* Logo + Name */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-xl bg-muted border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden"
                        onClick={() => logoInputRef.current?.click()}>
                        {logoPreview ? <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" /> :
                          <div className="flex flex-col items-center gap-1"><Camera className="h-5 w-5 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Logo</span></div>}
                      </div>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="biz_name">Business name *</Label>
                      <Input id="biz_name" placeholder="e.g., Zulu Traditions Decor" value={vendorForm.name}
                        onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })}
                        className={`h-12 ${errors.name ? 'border-destructive' : ''}`} />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={vendorForm.category} onValueChange={v => setVendorForm({ ...vendorForm, category: v as VendorCategory })}>
                      <SelectTrigger className={`h-12 ${errors.category ? 'border-destructive' : ''}`}><SelectValue placeholder="Select your service category" /></SelectTrigger>
                      <SelectContent>{VENDOR_CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                  </div>

                  {/* Business Type */}
                  <div className="space-y-4 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div><Label>Formally registered business?</Label><p className="text-xs text-muted-foreground mt-0.5">e.g., CIPC / Company registration</p></div>
                      <Switch checked={vendorForm.is_registered_business} onCheckedChange={checked => setVendorForm({ ...vendorForm, is_registered_business: checked })} />
                    </div>
                    {vendorForm.is_registered_business ? (
                      <div className="space-y-3 pl-1 border-l-2 border-primary/30 ml-1">
                        <div className="pl-3 space-y-3">
                          <div className="space-y-2"><Label>Registered business name *</Label><Input placeholder="e.g., Zulu Traditions (Pty) Ltd" value={vendorForm.registered_business_name} onChange={e => setVendorForm({ ...vendorForm, registered_business_name: e.target.value })} className="h-12" /></div>
                          <div className="space-y-2"><Label>Registration number *</Label><Input placeholder="e.g., 2024/123456/07" value={vendorForm.registration_number} onChange={e => setVendorForm({ ...vendorForm, registration_number: e.target.value })} className="h-12" /></div>
                          <div className="space-y-2"><Label>VAT number (optional)</Label><Input placeholder="e.g., 4123456789" value={vendorForm.vat_number} onChange={e => setVendorForm({ ...vendorForm, vat_number: e.target.value })} className="h-12" /></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 bg-muted rounded-lg p-3">
                        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">No worries! You can still earn a <strong>Super Vendor</strong> badge through great service and reviews.</p>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="pt-2"><h3 className="text-sm font-medium mb-3">Business Address *</h3><AddressFields data={vendorAddress} onChange={setVendorAddress} errors={errors} /></div>

                  {/* About */}
                  <div className="space-y-2">
                    <Label>About your business</Label>
                    <Textarea placeholder="Describe your services..." value={vendorForm.about} onChange={e => setVendorForm({ ...vendorForm, about: e.target.value })} rows={3} />
                  </div>

                  {/* Price Range */}
                  <PricingInput
                    category={vendorForm.category}
                    value={vendorForm.price_range_text}
                    onChange={(formatted) => setVendorForm({ ...vendorForm, price_range_text: formatted })}
                  />

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label>Business phone *</Label>
                    <div className="flex gap-2">
                      <Popover open={phoneCountryOpen} onOpenChange={setPhoneCountryOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="w-[120px] h-12 justify-between px-2 flex-shrink-0">
                            <span className="flex items-center gap-1 text-sm truncate"><span>{selectedPhoneCountry.flag}</span><span>{selectedPhoneCountry.dial}</span></span>
                            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0" align="start">
                          <Command><CommandInput placeholder="Search country..." /><CommandList><CommandEmpty>No country found.</CommandEmpty><CommandGroup>
                            {COUNTRIES.map(c => (
                              <CommandItem key={c.code} value={`${c.name} ${c.dial}`} onSelect={() => { setVendorForm({ ...vendorForm, phone_country: c.code }); setPhoneCountryOpen(false); }}>
                                <Check className={cn('mr-2 h-4 w-4', vendorForm.phone_country === c.code ? 'opacity-100' : 'opacity-0')} />
                                <span className="mr-2">{c.flag}</span><span className="flex-1">{c.name}</span><span className="text-muted-foreground text-sm">{c.dial}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup></CommandList></Command>
                        </PopoverContent>
                      </Popover>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="tel" placeholder="082 123 4567" value={vendorForm.phone_number}
                          onChange={e => setVendorForm({ ...vendorForm, phone_number: e.target.value })}
                          className={`pl-10 h-12 ${errors.phone_number ? 'border-destructive' : ''}`} />
                      </div>
                    </div>
                    {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label>Business email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="business@example.com" value={vendorForm.email}
                        onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })}
                        className={`pl-10 h-12 ${errors.email ? 'border-destructive' : ''}`} />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="text" placeholder="https://..." value={vendorForm.website_url}
                        onChange={e => setVendorForm({ ...vendorForm, website_url: e.target.value })}
                        className={`pl-10 h-12`} />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 mt-4">
                    <ArrowRight className="h-4 w-4 mr-2" />Continue to Showcase
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ─── SHOWCASE & PHOTOS (Vendor Step 6) ─── */}
          {step === 'showcase' && (
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2"><ImagePlus className="h-6 w-6 text-accent" /></div>
                <CardTitle>Showcase your work</CardTitle>
                <CardDescription>Add photos to attract clients. You can also add these later.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Work photos (up to 5 images)</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {showcaseFiles.map((item, index) => (
                      <div key={index} className="relative aspect-square overflow-hidden rounded-lg bg-muted group">
                        <img src={item.preview} alt={`Showcase ${index + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeShowcase(index)}
                          className="absolute top-1 right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="sr-only">Remove</span>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                    {showcaseFiles.length < 5 && (
                      <div className="aspect-square rounded-lg bg-muted border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center"
                        onClick={() => showcaseInputRef.current?.click()}>
                        <ImagePlus className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <input ref={showcaseInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleShowcaseAdd} />
                </div>

                {/* Verification Docs (if registered business) */}
                {vendorForm.is_registered_business && (
                  <div className="space-y-2">
                    <Label>Verification documents</Label>
                    <p className="text-xs text-muted-foreground">Upload CIPC registration and proof of address for verification.</p>
                    <div className="space-y-2">
                      {verificationFiles.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm bg-muted rounded-lg p-2">
                          <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate flex-1">{item.file.name}</span>
                          <button type="button" onClick={() => setVerificationFiles(prev => prev.filter((_, i) => i !== index))} className="text-destructive text-xs">Remove</button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => verificationInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-1" />Add document
                      </Button>
                      <input ref={verificationInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 10 * 1024 * 1024) { toast.error('Document must be less than 10MB'); return; }
                          setVerificationFiles(prev => [...prev, { file, docType: 'cipc_registration', preview: '' }]);
                          if (verificationInputRef.current) verificationInputRef.current.value = '';
                        }} />
                    </div>
                    <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3">
                      <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">We'll review your documents. Once approved, you'll get a <strong>Verified Business</strong> badge.</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-12" onClick={() => handleFinalVendorSubmit()} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {showcaseFiles.length === 0 ? 'Skip & Finish' : 'Finish Setup'}
                  </Button>
                  {showcaseFiles.length > 0 && (
                    <Button className="flex-1 h-12" onClick={() => handleFinalVendorSubmit()} disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
