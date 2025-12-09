import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';

export default function OnboardingLogin() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [phone, setPhone] = useState('+27');
  const [name, setName] = useState('');

  const handleContinue = () => {
    // Simulate login success
    setUser({
      id: 'user-1',
      name: name || 'User',
      phoneNumber: phone,
      isGuest: false,
      language: 'en',
    });
    navigate('/');
  };

  const handleGuestContinue = () => {
    setUser({
      id: 'guest-1',
      name: 'Guest',
      phoneNumber: '',
      isGuest: true,
      language: 'en',
    });
    navigate('/');
  };

  const isValid = phone.length >= 10 && name.length >= 2;

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-background">
      <div className="w-full max-w-sm mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Welcome</h1>
          <p className="text-muted-foreground">
            Enter your details to get started
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Nomsa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+27 82 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              We'll use this to save your progress
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button
            size="lg"
            className="w-full h-12"
            onClick={handleContinue}
            disabled={!isValid}
          >
            Continue
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={handleGuestContinue}
          >
            Continue as guest
            <span className="ml-1 text-xs text-muted-foreground">(limited features)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}