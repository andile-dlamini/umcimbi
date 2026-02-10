import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddressFields, AddressData } from '@/components/shared/AddressFields';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const profileSchema = z.object({
  first_name: z.string().trim().min(1, 'Please enter your name').max(50, 'Name must be less than 50 characters'),
  surname: z.string().trim().min(1, 'Please enter your surname').max(50, 'Surname must be less than 50 characters'),
  phone_number: z.string().trim().optional().or(z.literal('')),
  address_line_1: z.string().trim().min(1, 'Address Line 1 is required').max(200),
  address_line_2: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().min(1, 'City / Suburb is required').max(100),
  state_province: z.string().trim().max(100).optional().or(z.literal('')),
  country: z.string().trim().min(1, 'Country is required'),
  postal_code: z.string().trim().min(1, 'Postal / Zip Code is required').max(20),
});

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { profile, updateProfile, user } = useAuth();
  
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [surname, setSurname] = useState(profile?.surname || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState<AddressData>({
    address_line_1: '',
    address_line_2: '',
    city: '',
    state_province: '',
    country: 'ZA',
    postal_code: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = profileSchema.safeParse({
      first_name: firstName,
      surname: surname,
      phone_number: phoneNumber,
      ...address,
    });

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

    setIsLoading(true);

    const addressStr = [address.address_line_1, address.city, address.state_province].filter(Boolean).join(', ');

    const { error } = await updateProfile({
      first_name: firstName.trim(),
      surname: surname.trim(),
      full_name: `${firstName.trim()} ${surname.trim()}`.trim(),
      phone_number: phoneNumber.trim() || null,
      address: addressStr || null,
      address_line_1: address.address_line_1.trim(),
      address_line_2: address.address_line_2.trim() || null,
      city: address.city.trim(),
      state_province: address.state_province.trim() || null,
      country: address.country,
      postal_code: address.postal_code.trim(),
      is_profile_complete: true,
    });

    setIsLoading(false);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile completed!');
      navigate('/');
    }
  };

  const handleSkip = async () => {
    await updateProfile({ is_profile_complete: true });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-secondary/10 flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-secondary" />
          </div>
          <CardTitle className="text-2xl">Complete your profile</CardTitle>
          <CardDescription>
            Help us personalize your experience
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`pl-10 h-12 ${errors.first_name ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.first_name && <p className="text-sm text-destructive">{errors.first_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="surname">Surname *</Label>
                <Input
                  id="surname"
                  placeholder="Surname"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className={`h-12 ${errors.surname ? 'border-destructive' : ''}`}
                />
                {errors.surname && <p className="text-sm text-destructive">{errors.surname}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+27 XX XXX XXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll use this to send you reminders about your ceremonies
              </p>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={user?.email || ''}
                  disabled
                  className="pl-10 h-12 bg-muted"
                />
              </div>
            </div>

            {/* Address Section */}
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-3">Address</h3>
              <AddressFields data={address} onChange={setAddress} errors={errors} />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12"
                onClick={handleSkip}
              >
                Skip for now
              </Button>
              <Button type="submit" className="flex-1 h-12" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Continue'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
