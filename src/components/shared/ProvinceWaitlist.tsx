import { useState } from 'react';
import { MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { SA_PROVINCES } from '@/components/shared/AddressFields';
import { EVENT_TYPES } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

interface ProvinceWaitlistProps {
  role: 'organiser' | 'vendor';
  defaults?: {
    full_name?: string;
    phone_number?: string;
    province?: string;
    city?: string;
    event_type?: string;
    business_name?: string;
  };
  onDone?: () => void;
}

const schema = z.object({
  full_name: z.string().trim().min(2, 'Please enter your name').max(100),
  phone_number: z.string().trim().min(6, 'Please enter a valid phone number').max(30),
  province: z.string().trim().min(1, 'Please select a province'),
  city: z.string().trim().min(1, 'Please enter your city or town').max(100),
  event_type: z.string().trim().max(50).optional().or(z.literal('')),
  business_name: z.string().trim().max(120).optional().or(z.literal('')),
});

export function ProvinceWaitlist({ role, defaults, onDone }: ProvinceWaitlistProps) {
  const [form, setForm] = useState({
    full_name: defaults?.full_name || '',
    phone_number: defaults?.phone_number || '',
    province: defaults?.province || '',
    city: defaults?.city || '',
    event_type: defaults?.event_type || '',
    business_name: defaults?.business_name || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErrors({});
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('waitlist_signups').insert({
      full_name: form.full_name.trim(),
      phone_number: form.phone_number.trim() || null,
      province: form.province,
      city: form.city.trim(),
      event_type: role === 'organiser' ? form.event_type || null : null,
      business_name: role === 'vendor' ? form.business_name.trim() || null : null,
      role,
      source: role === 'organiser' ? 'event_creation_gate' : 'vendor_onboarding_gate',
    } as any);
    setSubmitting(false);

    if (error) {
      console.error('Waitlist insert error:', error);
      toast.error('Something went wrong. Please try again.');
      return;
    }
    setDone(true);
    onDone?.();
  };

  if (done) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">You're on the waitlist</h2>
          <p className="text-sm text-muted-foreground">
            We'll notify you as soon as UMCIMBI launches in {form.province}.
          </p>
        </CardContent>
      </Card>
    );
  }

  const copy =
    role === 'organiser'
      ? "UMCIMBI is currently live in KwaZulu-Natal only. We are expanding province by province to make sure every vendor is properly verified and every booking is supported. Join the waitlist and we'll notify you when we launch in your area."
      : "UMCIMBI is currently live in KwaZulu-Natal only. We are expanding province by province to make sure every vendor is properly verified and every booking is supported. Join the vendor waitlist and we'll notify you when we launch in your area.";

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Not live in your province yet</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{copy}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Your name *</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              maxLength={100}
              className={`h-12 ${errors.full_name ? 'border-destructive' : ''}`}
            />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
          </div>

          <div className="space-y-2">
            <Label>Phone number *</Label>
            <Input
              type="tel"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              maxLength={30}
              className={`h-12 ${errors.phone_number ? 'border-destructive' : ''}`}
            />
            {errors.phone_number && <p className="text-xs text-destructive">{errors.phone_number}</p>}
          </div>

          <div className="space-y-2">
            <Label>Province *</Label>
            <Select value={form.province} onValueChange={(v) => setForm({ ...form, province: v })}>
              <SelectTrigger className={`h-12 ${errors.province ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Select your province" />
              </SelectTrigger>
              <SelectContent>
                {SA_PROVINCES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.province && <p className="text-xs text-destructive">{errors.province}</p>}
          </div>

          <div className="space-y-2">
            <Label>City or town *</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              maxLength={100}
              className={`h-12 ${errors.city ? 'border-destructive' : ''}`}
            />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>

          {role === 'organiser' && (
            <div className="space-y-2">
              <Label>Ceremony type</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select ceremony type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.shortLabel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {role === 'vendor' && (
            <div className="space-y-2">
              <Label>Business name</Label>
              <Input
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                maxLength={120}
                className="h-12"
              />
            </div>
          )}
        </div>

        <Button className="w-full h-12" onClick={submit} disabled={submitting}>
          {submitting ? 'Joining waitlist...' : 'Join the waitlist'}
        </Button>
      </CardContent>
    </Card>
  );
}
