import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function OnboardingLanguage() {
  const navigate = useNavigate();

  const handleLanguageSelect = (lang: 'en' | 'zu') => {
    // Store language preference (for future use)
    localStorage.setItem('isiko-language', lang);
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm text-center space-y-8">
        {/* Logo/Title */}
        <div className="space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-foreground">I</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Isiko Planner</h1>
          <p className="text-muted-foreground">
            Plan your Zulu ceremonies with respect
          </p>
        </div>

        {/* Language Selection */}
        <div className="space-y-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-14 text-lg font-medium"
            onClick={() => handleLanguageSelect('zu')}
            disabled
          >
            isiZulu
            <span className="ml-2 text-xs text-muted-foreground">(Coming soon)</span>
          </Button>
          
          <Button
            size="lg"
            className="w-full h-14 text-lg font-medium"
            onClick={() => handleLanguageSelect('en')}
          >
            English
          </Button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground">
          You can change this later in Settings
        </p>
      </div>
    </div>
  );
}