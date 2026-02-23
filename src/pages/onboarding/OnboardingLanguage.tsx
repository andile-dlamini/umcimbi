import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Menu,
  Star,
} from 'lucide-react';
import HeroIllustration from '@/components/illustrations/HeroIllustration';
import StepIllustration from '@/components/illustrations/StepIllustration';
import CeremonyTile from '@/components/illustrations/CeremonyTile';
import FeatureIcon from '@/components/illustrations/FeatureIcon';

export default function OnboardingLanguage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = 'UMCIMBI — Plan your ceremony with confidence';
  }, []);

  const handleLangSelect = (lang: 'en' | 'zu') => {
    localStorage.setItem('umcimbi_lang', lang);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ backgroundImage: 'none' }}>
      {/* ── Sticky Nav ── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">U</span>
            </div>
            <span className="font-bold text-lg tracking-tight">UMCIMBI</span>
          </div>

          {/* Desktop anchors */}
          <nav className="hidden md:flex items-center gap-6">
            {[
              ['How it works', 'how'],
              ['For Organisers', 'organisers'],
              ['For Vendors', 'vendors'],
              ['FAQ', 'faq'],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language pill */}
            <TooltipProvider>
              <div className="hidden sm:flex rounded-full border border-border overflow-hidden text-xs">
                <button
                  onClick={() => handleLangSelect('en')}
                  className="px-3 py-1.5 bg-primary text-primary-foreground font-medium"
                >
                  English
                </button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      disabled
                      className="px-3 py-1.5 text-muted-foreground cursor-not-allowed"
                    >
                      isiZulu
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            <Link to="/auth?mode=login">
              <Button variant="ghost" size="sm" className="text-sm font-medium">
                Login
              </Button>
            </Link>
            <Link to="/auth?mode=signup" className="hidden sm:inline-flex">
              <Button size="sm" className="text-sm font-semibold">
                Register
              </Button>
            </Link>

            {/* Mobile menu */}
            <button
              className="md:hidden ml-1 p-2 rounded-lg hover:bg-muted"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-2">
            {[
              ['How it works', 'how'],
              ['For Organisers', 'organisers'],
              ['For Vendors', 'vendors'],
              ['FAQ', 'faq'],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left text-sm py-2 text-muted-foreground hover:text-foreground"
              >
                {label}
              </button>
            ))}
            <Link to="/auth?mode=signup" className="block">
              <Button size="sm" className="w-full mt-1">Register</Button>
            </Link>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ═══ 1. HERO ═══ */}
        <section className="py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Plan your ceremony with less stress — and more{' '}
              <span className="text-primary">meaning.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">
              UMCIMBI helps you find trusted vendors, compare quotes, and keep everything organised.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="w-full sm:w-auto h-13 text-base font-semibold px-8 shadow-lg shadow-primary/20">
                  Register
                </Button>
              </Link>
              <Link to="/auth?mode=login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-13 text-base font-semibold px-8">
                  Login
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              English now · isiZulu coming soon
            </p>

            {/* Ceremony badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
              <Badge className="bg-secondary text-secondary-foreground">Umembeso</Badge>
              <Badge className="bg-accent text-accent-foreground">Umabo</Badge>
              <Badge variant="outline">Umbondo</Badge>
              <Badge variant="outline">Umemulo</Badge>
            </div>
          </div>

          <div className="flex justify-center">
            <HeroIllustration />
          </div>
        </section>

        {/* ═══ 2. THREE PILLARS ═══ */}
        <section className="pb-20">
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: 'Trusted vendors',
                body: 'Verified profiles and clearer accountability.',
                variant: 'primary' as const,
              },
              {
                icon: BarChart3,
                title: 'Comparable quotes',
                body: 'Structured offers you can review side-by-side.',
                variant: 'secondary' as const,
              },
              {
                icon: Inbox,
                title: 'One organised plan',
                body: 'Tasks, messages, and confirmations in one place.',
                variant: 'accent' as const,
              },
            ].map(({ icon, title, body, variant }) => (
              <Card key={title} className="border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <CardContent className="p-6 space-y-3">
                  <FeatureIcon icon={icon} variant={variant} />
                  <h3 className="font-bold text-base">{title}</h3>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══ 3. PROBLEM ═══ */}
        <section className="pb-20 grid md:grid-cols-2 gap-12 items-center">
          {/* Illustration side */}
          <div className="flex justify-center order-2 md:order-1">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 rounded-3xl bg-muted/50" />
              <div className="absolute top-6 left-6 right-6 bottom-6 rounded-2xl bg-card border border-border shadow-sm p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="h-2 w-20 rounded bg-muted-foreground/20" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="h-2 w-24 rounded bg-muted-foreground/20" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="h-2 w-16 rounded bg-muted-foreground/20" />
                </div>
                <div className="text-3xl text-center pt-3">😩</div>
              </div>
            </div>
          </div>

          <div className="space-y-5 order-1 md:order-2">
            <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
              Planning a ceremony shouldn't feel like a second full-time job.
            </h2>
            <ul className="space-y-4">
              {[
                'Finding reliable vendors takes time — and recommendations can be inconsistent.',
                'Quotes come in different formats, prices vary, and comparing options is hard.',
                'Coordinating deliveries, tasks, and family expectations gets stressful fast.',
              ].map((text) => (
                <li key={text} className="flex gap-3 items-start text-sm text-muted-foreground">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ═══ 4. HOW IT WORKS ═══ */}
        <section id="how" className="pb-20 scroll-mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">How it works</h2>
            <p className="text-muted-foreground mt-2">Three simple steps to your ceremony.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {([
              {
                step: 1 as const,
                title: 'Tell us your ceremony',
                body: 'Type, date, location, and what you need.',
              },
              {
                step: 2 as const,
                title: 'Receive & compare quotes',
                body: 'Vendors respond with structured quotes.',
              },
              {
                step: 3 as const,
                title: 'Book & manage delivery',
                body: 'Track tasks, confirmations, and delivery proof.',
              },
            ]).map(({ step, title, body }) => (
              <Card key={step} className="border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                  <StepIllustration step={step} />
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {step}
                  </div>
                  <h3 className="font-bold text-base">{title}</h3>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══ 5. FOR ORGANISERS ═══ */}
        <section id="organisers" className="pb-20 scroll-mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">For Organisers</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Everything you need to plan with confidence and peace of mind.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
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
            ]).map(({ icon, title, body }) => (
              <Card key={title} className="border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <CardContent className="p-6 space-y-3">
                  <FeatureIcon icon={icon} />
                  <h3 className="font-semibold text-sm">{title}</h3>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="h-12 text-base font-semibold px-8">
                Start planning
              </Button>
            </Link>
          </div>
        </section>

        {/* ═══ 6. FOR VENDORS (override styling) ═══ */}
        <section
          id="vendors"
          className="pb-20 scroll-mt-20"
          style={{
            '--primary': '20 75% 40%',
            '--accent': '20 65% 50%',
          } as React.CSSProperties}
        >
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">For Vendors</h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                Grow your business with qualified leads tied to real ceremonies.
              </p>
              <div className="space-y-4">
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
                ]).map(({ icon, title, body }) => (
                  <Card key={title} className="border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <CardContent className="flex gap-4 items-start p-5">
                      <FeatureIcon icon={icon} />
                      <div>
                        <h3 className="font-semibold text-sm">{title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="h-12 text-base font-semibold px-8">
                    I'm a vendor — Register
                  </Button>
                </Link>
              </div>
            </div>

            {/* Vendor illustration */}
            <div className="hidden md:flex justify-center items-center">
              <div className="relative w-72 h-72">
                <div className="absolute inset-4 rounded-3xl bg-primary/5 border border-primary/10" />
                <div className="absolute top-12 left-12 right-12 bottom-12 rounded-2xl bg-card border border-border shadow p-4 space-y-3">
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 rounded-lg bg-primary/15" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2 w-20 rounded bg-foreground/15" />
                      <div className="h-1.5 w-14 rounded bg-muted-foreground/15" />
                    </div>
                  </div>
                  <div className="h-6 rounded bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-primary">New Request</span>
                  </div>
                  <div className="h-6 rounded bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-primary">Send Quote</span>
                  </div>
                  <div className="text-center text-xl mt-1">📈</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 7. CEREMONY TILES ═══ */}
        <section className="pb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Ceremonies we support</h2>
            <p className="text-muted-foreground mt-2">Built for the moments that matter most.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <CeremonyTile
              name="Umembeso"
              description="The bride's family presents gifts to the groom's family."
              categories={['Catering', 'Tents', 'Decor']}
              accentClass="bg-secondary"
              icon="🎁"
            />
            <CeremonyTile
              name="Umabo"
              description="The bride is formally welcomed into the groom's family."
              categories={['Attire', 'Catering', 'Livestock']}
              accentClass="bg-accent"
              icon="👰"
            />
            <CeremonyTile
              name="Umbondo"
              description="The bride's family delivers groceries and essentials."
              categories={['Transport', 'Groceries', 'Planning']}
              accentClass="bg-muted"
              icon="🧺"
            />
            <CeremonyTile
              name="Umemulo"
              description="A coming-of-age celebration for a young woman."
              categories={['Catering', 'Attire', 'Music']}
              accentClass="bg-muted"
              icon="🌸"
            />
          </div>
        </section>

        {/* ═══ 8. SOCIAL PROOF ═══ */}
        <section className="pb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Loved by families and vendors</h2>
            <p className="text-xs text-muted-foreground mt-2">
              Pilot testimonials will appear here after launch.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { name: 'Nomsa M.', role: 'Organiser, KZN', quote: '"Made planning our Umembeso so much easier. Finally, one place for everything."' },
              { name: 'Thabo K.', role: 'Catering vendor', quote: '"I get real ceremony requests with dates and details — no more guessing."' },
              { name: 'Zanele D.', role: 'Organiser, Gauteng', quote: '"Comparing quotes side-by-side saved us time and money."' },
            ].map((t) => (
              <Card key={t.name} className="border border-border">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic">{t.quote}</p>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══ 9. FAQ ═══ */}
        <section id="faq" className="pb-20 scroll-mt-20 max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Frequently asked questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              { q: 'What is UMCIMBI?', a: 'UMCIMBI is a platform that helps you plan traditional South African ceremonies by connecting you with trusted, verified vendors. You can request quotes, compare options, and manage your entire ceremony plan in one place.' },
              { q: 'Is it free?', a: 'Creating an account and browsing vendors is free for organisers. Vendors can join the platform and respond to requests at no cost during our launch period.' },
              { q: 'How do quotes work?', a: 'You submit a service request describing what you need for your ceremony. Vendors respond with structured quotes that include scope, pricing, and terms — making it easy to compare.' },
              { q: 'How do vendors get verified?', a: 'Vendors can submit verification documents including business registration, proof of address, and bank confirmation. Our team reviews submissions to ensure accountability.' },
              { q: 'When will isiZulu be available?', a: 'We\'re actively working on full isiZulu language support. It\'s coming soon — you\'ll be able to switch languages in your settings.' },
              { q: 'Can organisers and vendors use the same account?', a: 'Yes! You can register as an organiser and later add a vendor profile to the same account.' },
            ].map(({ q, a }, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-4">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* ═══ 10. FINAL CTA ═══ */}
        <section className="pb-20">
          <div className="rounded-3xl bg-primary/5 border border-primary/10 p-10 sm:p-16 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold">Start planning with confidence.</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Join families and vendors already using UMCIMBI to bring their ceremonies together.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="w-full sm:w-auto h-13 text-base font-semibold px-10 shadow-lg shadow-primary/20">
                  Register
                </Button>
              </Link>
              <Link to="/auth?mode=login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-13 text-base font-semibold px-10">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ 11. FOOTER ═══ */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">U</span>
            </div>
            <span className="font-bold text-sm">UMCIMBI</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Privacy · Terms · Contact
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} UMCIMBI
          </p>
        </div>
      </footer>
    </div>
  );
}
