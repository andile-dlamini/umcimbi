import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileText,
  ClipboardCheck,
  ShieldCheck,
  BarChart3,
  Inbox,
  Users,
  Zap,
  HandshakeIcon,
} from 'lucide-react';

export default function OnboardingLanguage() {
  useEffect(() => {
    document.title = 'UMCIMBI';
  }, []);

  const handleLangSelect = (lang: 'en' | 'zu') => {
    localStorage.setItem('umcimbi_lang', lang);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">U</span>
            </div>
            <span className="font-bold text-base tracking-tight">UMCIMBI</span>
          </div>

          {/* Right: lang + login */}
          <div className="flex items-center gap-3">
            {/* Language pill */}
            <div className="flex rounded-full border border-border overflow-hidden text-xs">
              <button
                onClick={() => handleLangSelect('en')}
                className="px-3 py-1.5 bg-primary text-primary-foreground font-medium"
              >
                English
              </button>
              <button
                disabled
                className="px-3 py-1.5 text-muted-foreground cursor-not-allowed"
                title="Coming soon"
              >
                isiZulu
              </button>
            </div>
            <Link to="/auth?mode=login">
              <Button variant="ghost" size="sm" className="text-sm font-medium">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16">
        {/* ── Hero ── */}
        <section className="pt-12 pb-10 text-center space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight">UMCIMBI</h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
            Less stress, more meaning — plan your traditional ceremony with trusted local vendors.
          </p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Request quotes, compare options, and manage your ceremony plan in one place.
          </p>

          {/* Ceremony badges */}
          <div className="flex flex-wrap justify-center gap-2">
            <Badge className="bg-secondary text-secondary-foreground">Umembeso</Badge>
            <Badge className="bg-accent text-accent-foreground">Umabo</Badge>
            <Badge variant="outline">Lobola</Badge>
            <Badge variant="outline">Imbeleko</Badge>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="w-full sm:w-auto h-12 text-base font-semibold px-8">
                Register
              </Button>
            </Link>
            <Link to="/auth?mode=login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 text-base font-semibold px-8">
                Login
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            You can change language later in Settings.
          </p>
        </section>

        <hr className="border-border" />

        {/* ── Problem ── */}
        <section className="py-10 space-y-5">
          <h2 className="text-xl font-bold leading-snug">
            Planning a ceremony shouldn't feel like a second full-time job.
          </h2>
          <ul className="space-y-3">
            {[
              'Finding reliable vendors takes time — and recommendations can be inconsistent.',
              'Quotes come in different formats, prices vary, and comparing options is hard.',
              'Coordinating deliveries, tasks, and family expectations gets stressful fast.',
            ].map((text) => (
              <li key={text} className="flex gap-3 items-start text-sm text-muted-foreground">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </section>

        <hr className="border-border" />

        {/* ── How it works ── */}
        <section className="py-10 space-y-6">
          <h2 className="text-xl font-bold">How it works</h2>
          <div className="grid gap-4">
            {([
              {
                icon: Search,
                title: 'Create your ceremony plan',
                body: 'Choose ceremony type, date, location, and what you need.',
              },
              {
                icon: FileText,
                title: 'Request & compare quotes',
                body: 'Vendors respond with structured quotes you can review side-by-side.',
              },
              {
                icon: ClipboardCheck,
                title: 'Book & manage delivery',
                body: 'Track tasks, confirmations, and delivery proof in one flow.',
              },
            ] as const).map(({ icon: Icon, title, body }) => (
              <Card key={title} className="border border-border">
                <CardContent className="flex gap-4 items-start p-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <hr className="border-border" />

        {/* ── Organiser value props ── */}
        <section className="py-10 space-y-6">
          <h2 className="text-xl font-bold">For Organisers</h2>
          <div className="grid gap-4">
            {([
              {
                icon: ShieldCheck,
                title: 'Trusted vendors you can rely on',
                body: 'Verified profiles, real reviews, and clearer accountability — book with confidence.',
              },
              {
                icon: BarChart3,
                title: 'Quotes you can actually compare',
                body: 'Clear scope and pricing so you can choose what fits your budget.',
              },
              {
                icon: Inbox,
                title: 'Everything organised in one place',
                body: 'Checklist, timelines, and messages — less chaos, more meaning.',
              },
            ] as const).map(({ icon: Icon, title, body }) => (
              <Card key={title} className="border border-border">
                <CardContent className="flex gap-4 items-start p-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <hr className="border-border" />

        {/* ── Vendor value props (vendor-mode override) ── */}
        <section
          className="py-10 space-y-6"
          style={{
            '--primary': '20 75% 40%',
            '--accent': '20 65% 50%',
          } as React.CSSProperties}
        >
          <h2 className="text-xl font-bold">For Vendors</h2>
          <div className="grid gap-4">
            {([
              {
                icon: Users,
                title: 'More qualified leads',
                body: 'Requests tied to real ceremonies, dates, and locations — less back-and-forth.',
              },
              {
                icon: Zap,
                title: 'Faster, more professional quoting',
                body: 'Send structured quotes, set terms, and track acceptance.',
              },
              {
                icon: HandshakeIcon,
                title: 'Less dispute stress',
                body: 'Clear confirmation steps and delivery proof reduce misunderstandings.',
              },
            ] as const).map(({ icon: Icon, title, body }) => (
              <Card key={title} className="border border-border">
                <CardContent className="flex gap-4 items-start p-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <hr className="border-border" />

        {/* ── Footer ── */}
        <footer className="py-10 text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="w-full sm:w-auto h-12 text-base font-semibold px-8">
                Register
              </Button>
            </Link>
            <Link to="/auth?mode=login">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto h-12 text-base font-semibold px-8">
                Login
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Privacy · Terms · Contact
          </p>
        </footer>
      </main>
    </div>
  );
}
