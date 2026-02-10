import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const phoneRegex = /^(\+27|0)[0-9]{9,10}$/;

const detailsSchema = z.object({
  first_name: z.string().trim().min(2, 'First name must be at least 2 characters').max(50),
  surname: z.string().trim().min(2, 'Surname must be at least 2 characters').max(50),
  address: z.string().trim().min(10, 'Address must be at least 10 characters').max(200),
  phone_number: z.string().trim().refine(
    val => phoneRegex.test(val.replace(/\s/g, '')),
    { message: 'Please enter a valid SA phone number (e.g., 0821234567 or +27821234567)' }
  ),
  email: z.string().trim().email('Please enter a valid email').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms & POPIA consent' }),
  }),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type DetailsForm = z.infer<typeof detailsSchema>;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [step, setStep] = useState<'details' | 'otp' | 'success' | 'login'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration form state
  const [form, setForm] = useState<DetailsForm>({
    first_name: '',
    surname: '',
    address: '',
    phone_number: '',
    email: '',
    password: '',
    confirm_password: '',
    terms_accepted: false as any,
  });

  // OTP state
  const [otpValue, setOtpValue] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // OTP expiry timer
  useEffect(() => {
    if (otpExpiry <= 0) return;
    const timer = setInterval(() => setOtpExpiry(e => Math.max(0, e - 1)), 1000);
    return () => clearInterval(timer);
  }, [otpExpiry]);

  const updateForm = useCallback((field: keyof DetailsForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!loginEmail.trim()) { setErrors({ loginEmail: 'Email or phone is required' }); return; }
    if (!loginPassword) { setErrors({ loginPassword: 'Password is required' }); return; }

    setIsLoading(true);
    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email/phone or password');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Welcome back!');
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step A: Details submission → send OTP
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = detailsSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0]?.toString();
        if (field) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      const first = result.error.errors[0]?.message;
      if (first) toast.error(first);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({ phone_number: form.phone_number }),
      });

      const data = await res.json();

      if (res.status === 429) {
        toast.error('Please wait before requesting a new code');
        setCooldown(30);
      } else if (!res.ok) {
        toast.error(data.error || 'Failed to send verification code');
      } else {
        toast.success('Verification code sent!');
        setStep('otp');
        setCooldown(30);
        setOtpExpiry(300);
        setOtpValue('');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({ phone_number: form.phone_number }),
      });
      const data = await res.json();
      if (res.status === 429) {
        toast.error(data.error || 'Too many requests');
      } else {
        toast.success('New code sent!');
        setCooldown(30);
        setOtpExpiry(300);
        setOtpValue('');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step B: Verify OTP + Create Account
  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({
          phone_number: form.phone_number,
          otp: otpValue,
          first_name: form.first_name,
          surname: form.surname,
          address: form.address,
          email: form.email || undefined,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.expired) {
          toast.error('Code expired. Please request a new one.');
          setOtpExpiry(0);
        } else if (data.locked) {
          toast.error('Too many attempts. Request a new code.');
        } else {
          toast.error(data.error || 'Verification failed');
        }
        if (data.attempts_remaining !== undefined) {
          // Keep user on OTP screen
        }
        return;
      }

      // Success! Sign in the user
      const loginEmail = form.email?.trim()
        ? form.email.trim()
        : `${form.phone_number.replace(/\s/g, '').replace(/^0/, '+27').replace(/^\+/, '')}@phone.isiko.app`;

      const { error: signInError } = await signIn(loginEmail, form.password);
      if (signInError) {
        console.error('Auto sign-in failed:', signInError);
        // Still show success, user can log in manually
      }

      setStep('success');
      toast.success('Account created successfully!');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatExpiryTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // LOGIN VIEW
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
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginEmail">Email or Phone</Label>
                  <Input
                    id="loginEmail"
                    type="text"
                    placeholder="you@example.com or 0821234567"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="h-12"
                    autoComplete="email"
                  />
                  {errors.loginEmail && <p className="text-sm text-destructive">{errors.loginEmail}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Password</Label>
                  <Input
                    id="loginPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="h-12"
                    autoComplete="current-password"
                  />
                  {errors.loginPassword && <p className="text-sm text-destructive">{errors.loginPassword}</p>}
                </div>
                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?
                  <Button variant="link" className="px-1" onClick={() => setStep('details')}>
                    Sign up
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // STEP C: SUCCESS
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-success/10 to-background flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Phone Verified!</h2>
              <p className="text-muted-foreground">
                Your account has been created successfully. Welcome to Isiko Planner, {form.first_name}!
              </p>
            </div>
            <Button className="w-full h-12" onClick={() => navigate('/')}>
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STEP B: OTP VERIFICATION
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
        <div className="px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => setStep('details')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Verify your phone</CardTitle>
              <CardDescription>
                Enter the 6-digit code sent to <span className="font-semibold text-foreground">{form.phone_number}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {otpExpiry > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Code expires in <span className="font-mono font-semibold text-foreground">{formatExpiryTime(otpExpiry)}</span>
                </p>
              )}
              {otpExpiry === 0 && step === 'otp' && (
                <p className="text-center text-sm text-destructive">Code expired. Please request a new one.</p>
              )}

              <Button
                className="w-full h-12"
                onClick={handleVerifyOtp}
                disabled={isLoading || otpValue.length !== 6}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isLoading ? 'Verifying...' : 'Verify & Create Account'}
              </Button>

              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isLoading}
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // STEP A: REGISTRATION DETAILS
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
      <div className="px-4 py-4">
        <Button variant="ghost" size="icon" onClick={() => setStep('login')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-2xl">🎊</span>
            </div>
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Start planning your traditional ceremonies</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    placeholder="e.g., Sipho"
                    value={form.first_name}
                    onChange={e => updateForm('first_name', e.target.value)}
                    className={`h-12 ${errors.first_name ? 'border-destructive' : ''}`}
                  />
                  {errors.first_name && <p className="text-xs text-destructive">{errors.first_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Surname *</Label>
                  <Input
                    id="surname"
                    placeholder="e.g., Dlamini"
                    value={form.surname}
                    onChange={e => updateForm('surname', e.target.value)}
                    className={`h-12 ${errors.surname ? 'border-destructive' : ''}`}
                  />
                  {errors.surname && <p className="text-xs text-destructive">{errors.surname}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  placeholder="e.g., 123 Main Rd, Durban, KZN"
                  value={form.address}
                  onChange={e => updateForm('address', e.target.value)}
                  className={`h-12 ${errors.address ? 'border-destructive' : ''}`}
                />
                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Cellphone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="0821234567"
                    value={form.phone_number}
                    onChange={e => updateForm('phone_number', e.target.value)}
                    className={`pl-10 h-12 ${errors.phone_number ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.phone_number && <p className="text-xs text-destructive">{errors.phone_number}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => updateForm('email', e.target.value)}
                  className={`h-12 ${errors.email ? 'border-destructive' : ''}`}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 6 chars"
                    value={form.password}
                    onChange={e => updateForm('password', e.target.value)}
                    className={`h-12 ${errors.password ? 'border-destructive' : ''}`}
                    autoComplete="new-password"
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm *</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Re-enter"
                    value={form.confirm_password}
                    onChange={e => updateForm('confirm_password', e.target.value)}
                    className={`h-12 ${errors.confirm_password ? 'border-destructive' : ''}`}
                    autoComplete="new-password"
                  />
                  {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password}</p>}
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="terms"
                  checked={form.terms_accepted}
                  onCheckedChange={checked => updateForm('terms_accepted', !!checked)}
                  className={errors.terms_accepted ? 'border-destructive' : ''}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I accept the <span className="text-primary font-medium underline">Terms of Service</span> and consent to the processing of my personal information as per <span className="text-primary font-medium underline">POPIA</span>.
                </Label>
              </div>
              {errors.terms_accepted && <p className="text-xs text-destructive">{errors.terms_accepted}</p>}

              <Button type="submit" className="w-full h-12 mt-2" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                {isLoading ? 'Sending code...' : 'Send Verification Code'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?
                <Button variant="link" className="px-1" onClick={() => setStep('login')}>
                  Sign in
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
