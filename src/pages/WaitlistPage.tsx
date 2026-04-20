import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LAUNCH_DATE = new Date('2026-05-25T00:00:00+02:00');

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, target.getTime() - Date.now()));
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(Math.max(0, target.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(timer);
  }, [target, timeLeft]);

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);
  return { days, hours, minutes, seconds, isLive: timeLeft <= 0 };
}

type WaitlistRole = 'organiser' | 'vendor';

export default function WaitlistPage() {
  const navigate = useNavigate();
  const countdown = useCountdown(LAUNCH_DATE);
  const [searchParams] = useSearchParams();
  const refSource = searchParams.get('ref');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: null as WaitlistRole | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (countdown.isLive) navigate('/onboarding', { replace: true });
  }, [countdown.isLive, navigate]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.fullName.trim()) e.fullName = 'Name is required';
    if (!formData.email.trim() && !formData.phone.trim()) e.contact = 'Email or phone is required';
    if (!formData.role) e.role = 'Please select a role';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); toast.error(Object.values(e)[0]); return; }
    setIsSubmitting(true);
    const { error } = await supabase.from('waitlist_signups' as any).insert({
      full_name: formData.fullName.trim(),
      email: formData.email.trim() || null,
      phone_number: formData.phone.trim() || null,
      role: formData.role,
      source: refSource || 'waitlist_page',
    } as any);
    setIsSubmitting(false);
    if (error) { toast.error('Something went wrong. Please try again.'); return; }
    setSubmitted(true);
  };

  const handleShare = async () => {
    const text = 'Check out Umcimbi — a platform for planning traditional ceremonies. Launching soon: www.umcimbi.co.za';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Failed to copy'); }
  };

  const countdownUnits = [
    { label: 'Days', value: countdown.days },
    { label: 'Hours', value: countdown.hours },
    { label: 'Minutes', value: countdown.minutes },
    { label: 'Seconds', value: countdown.seconds },
  ];

  if (submitted) {
    const contactMethod = formData.email ? 'email' : 'SMS/WhatsApp';
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-bold text-foreground">You're on the list!</h1>
          <p className="text-muted-foreground">We'll notify you on {contactMethod} the moment Umcimbi goes live.</p>
          <Button variant="outline" className="w-full h-12" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            {copied ? 'Copied!' : 'Share with someone planning a ceremony →'}
          </Button>
          <Link to="/auth?mode=login" className="block text-sm text-primary hover:underline">
            Already registered? Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
      <div className="px-4 py-4">
        <Link to="/onboarding">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pb-12 max-w-md mx-auto w-full space-y-8">
        {/* Context */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground"><h1 className="text-2xl font-bold text-foreground">You're early and that's a good thing</h1></h1>
          <p className="text-muted-foreground text-sm">
            Umcimbi is launching soon. Be among the first families and vendors on the platform.
          </p>
        </div>

        {/* Countdown */}
        <div className="grid grid-cols-4 gap-3 w-full">
          {countdownUnits.map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Form */}
        <div className="w-full space-y-5">
          <h2 className="text-lg font-semibold text-foreground">Reserve your spot</h2>

          <div className="space-y-2">
            <Label>Full name *</Label>
            <Input placeholder="Your full name" value={formData.fullName}
              onChange={e => { setFormData(p => ({ ...p, fullName: e.target.value })); setErrors(p => { const n = { ...p }; delete n.fullName; return n; }); }}
              className={`h-12 ${errors.fullName ? 'border-destructive' : ''}`} />
          </div>

          <div className="space-y-2">
            <Label>Email address</Label>
            <Input type="email" placeholder="Email address" value={formData.email}
              onChange={e => { setFormData(p => ({ ...p, email: e.target.value })); setErrors(p => { const n = { ...p }; delete n.contact; return n; }); }}
              className="h-12" />
          </div>

          <div className="space-y-2">
            <Label>Cellphone number</Label>
            <Input type="tel" placeholder="e.g. 0821234567" value={formData.phone}
              onChange={e => { setFormData(p => ({ ...p, phone: e.target.value })); setErrors(p => { const n = { ...p }; delete n.contact; return n; }); }}
              className="h-12" />
            <p className="text-xs text-muted-foreground">We'll send you a WhatsApp or SMS when we go live — no spam, ever.</p>
            {errors.contact && <p className="text-xs text-destructive">{errors.contact}</p>}
          </div>

          {/* Role selector */}
          <div className="space-y-2">
            <Label>I am… *</Label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'organiser' as const, label: "I'm planning a ceremony" },
                { value: 'vendor' as const, label: "I'm a service provider" },
              ]).map(({ value, label }) => (
                <button key={value}
                  onClick={() => { setFormData(p => ({ ...p, role: value })); setErrors(p => { const n = { ...p }; delete n.role; return n; }); }}
                  className={cn(
                    'p-4 rounded-xl border-2 text-sm font-medium text-left transition-all',
                    formData.role === value
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                  )}>
                  {label}
                </button>
              ))}
            </div>
            {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
          </div>

          {formData.role === 'vendor' && (
            <div className="space-y-2">
              <Label>Business or service name *</Label>
              <Input placeholder="e.g. Sibanda Catering" value={formData.businessName}
                onChange={e => { setFormData(p => ({ ...p, businessName: e.target.value })); setErrors(p => { const n = { ...p }; delete n.businessName; return n; }); }}
                className={`h-12 ${errors.businessName ? 'border-destructive' : ''}`} />
              {errors.businessName && <p className="text-xs text-destructive">{errors.businessName}</p>}
            </div>
          )}

          <Button className="w-full h-12" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Notify Me When We Launch'}
          </Button>
        </div>
      </div>
    </div>
  );
}
