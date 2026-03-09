import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';

const SA_DIAL = '+27';
const SA_PHONE_LENGTH = 9; // digits after country code

// Validate SA phone number (9 digits, optionally with leading 0)
const validateSAPhone = (phone: string) => {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const digits = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  return /^\d+$/.test(digits) && digits.length === SA_PHONE_LENGTH;
};

// Convert local number to E.164
const toE164 = (phone: string) => {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const digits = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  return SA_DIAL + digits;
};

// Convert phone to the internal email used for auth
const phoneToEmail = (phone: string) => {
  const e164 = toE164(phone);
  return `${e164.replace(/^\+/, '')}@phone.isiko.app`;
};

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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type Step = 'details' | 'otp' | 'password' | 'success' | 'login';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();

  const initialStep: Step = searchParams.get('mode') === 'signup' ? 'details' : 'login';
  const [step, setStep] = useState<Step>(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Login state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form state
  const [form, setForm] = useState({
    first_name: '',
    surname: '',
    phone_number: '',
    terms_accepted: false as any,
  });

  // Password state (separate step)
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirm_password: '',
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

  const updateForm = useCallback((field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // Handle Login with phone + password
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
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid phone number or password');
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

  // Step 1: Send OTP
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
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ phone_number: toE164(form.phone_number) }),
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
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ phone_number: toE164(form.phone_number) }),
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

  // Step 2: Verify OTP only → go to password step
  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }
    // OTP will be verified when creating the account in the password step
    // We move to password step, keeping the OTP value for the final call
    setStep('password');
  };

  // Step 3: Set password → create account via verify-otp edge function
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = passwordSchema.safeParse(passwordForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0]?.toString();
        if (field) fieldErrors[field] = err.message;
      });
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.expired) {
          toast.error('Code expired. Please start over.');
          setStep('details');
        } else if (data.locked) {
          toast.error('Too many attempts. Please start over.');
          setStep('details');
        } else {
          toast.error(data.error || 'Registration failed');
        }
        return;
      }

      // Auto sign-in
      const email = phoneToEmail(form.phone_number);
      const { error: signInError } = await signIn(email, passwordForm.password);
      if (signInError) {
        console.error('Auto sign-in failed:', signInError);
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
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginPhone">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center h-12 px-3 rounded-md border border-input bg-muted text-sm font-medium text-muted-foreground shrink-0">
                      🇿🇦 +27
                    </div>
                    <Input
                      id="loginPhone"
                      type="tel"
                      placeholder="0821234567"
                      value={loginPhone}
                      onChange={e => { setLoginPhone(e.target.value); setErrors(prev => { const n = {...prev}; delete n.loginPhone; return n; }); }}
                      className={`h-12 ${errors.loginPhone ? 'border-destructive' : ''}`}
                      autoComplete="tel"
                    />
                  </div>
                  {errors.loginPhone && <p className="text-sm text-destructive">{errors.loginPhone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Password</Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => { setLoginPassword(e.target.value); setErrors(prev => { const n = {...prev}; delete n.loginPassword; return n; }); }}
                    className={`h-12 ${errors.loginPassword ? 'border-destructive' : ''}`}
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

  // ─── SUCCESS ───
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-success/10 to-background flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
              <p className="text-muted-foreground">
                Welcome to UMCIMBI, {form.first_name}! Your account is ready.
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

  // ─── PASSWORD STEP ───
  if (step === 'password') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
        <div className="px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => setStep('otp')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Create your password</CardTitle>
              <CardDescription>
                You'll use this password with your phone number to sign in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={passwordForm.password}
                    onChange={e => { setPasswordForm(prev => ({ ...prev, password: e.target.value })); setErrors(prev => { const n = {...prev}; delete n.password; return n; }); }}
                    className={`h-12 ${errors.password ? 'border-destructive' : ''}`}
                    autoComplete="new-password"
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password *</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Re-enter password"
                    value={passwordForm.confirm_password}
                    onChange={e => { setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value })); setErrors(prev => { const n = {...prev}; delete n.confirm_password; return n; }); }}
                    className={`h-12 ${errors.confirm_password ? 'border-destructive' : ''}`}
                    autoComplete="new-password"
                  />
                  {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password}</p>}
                </div>
                <Button type="submit" className="w-full h-12 mt-2" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  {isLoading ? 'Creating account...' : 'Complete Registration'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── OTP VERIFICATION ───
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
                Enter the 6-digit code sent to <span className="font-semibold text-foreground">+27 {form.phone_number}</span>
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
              {otpExpiry === 0 && (
                <p className="text-center text-sm text-destructive">Code expired. Please request a new one.</p>
              )}

              <Button
                className="w-full h-12"
                onClick={handleVerifyOtp}
                disabled={otpValue.length !== 6}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue
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

  // ─── STEP 1: DETAILS ───
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
                <Label htmlFor="phone_number">Cellphone Number *</Label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center h-12 px-3 rounded-md border border-input bg-muted text-sm font-medium text-muted-foreground shrink-0">
                    🇿🇦 +27
                  </div>
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="0821234567"
                    value={form.phone_number}
                    onChange={e => updateForm('phone_number', e.target.value)}
                    className={`h-12 ${errors.phone_number ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.phone_number && <p className="text-xs text-destructive">{errors.phone_number}</p>}
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
