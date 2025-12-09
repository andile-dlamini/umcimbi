import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { profile, updateProfile, user } = useAuth();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsLoading(true);

    const { error } = await updateProfile({
      full_name: fullName.trim(),
      phone_number: phoneNumber.trim() || null,
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
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-12"
                />
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
