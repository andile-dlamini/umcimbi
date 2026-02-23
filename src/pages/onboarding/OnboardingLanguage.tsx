import { useEffect, useState, useRef } from 'react';
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
  ShieldCheck,
  BarChart3,
  Inbox,
  Users,
  Zap,
  HandshakeIcon,
  Menu,
  Star,
  ArrowRight,
} from 'lucide-react';
import HeroSereneIllustration from '@/components/illustrations/HeroSereneIllustration';
import PillarIllustration from '@/components/illustrations/PillarIllustration';
import ProblemIllustration from '@/components/illustrations/ProblemIllustration';
import StepIllustration from '@/components/illustrations/StepIllustration';
import VendorSereneIllustration from '@/components/illustrations/VendorSereneIllustration';
import CeremonyTile from '@/components/illustrations/CeremonyTile';
import FeatureIcon from '@/components/illustrations/FeatureIcon';

export default function OnboardingLanguage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = 'UMCIMBI — Plan your ceremony with confidence';
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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

      {/* ── NAV ── */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-background/95 backdrop-blur border-b border-border shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-5xl flex items-center justify-between px-5 sm:px-8 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">U</span>
            </div>
            <span className="font-bold text-lg tracking-tight">UMCIMBI</span>
          </div>

          {/* Desktop anchors */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              ['How', 'how'],
              ['Organisers', 'organisers'],
              ['Vendors', 'vendors'],
              ['FAQ', 'faq'],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <div className="hidden sm:flex rounded-full border border-border overflow-hidden text-xs">
                <button
                  onClick={() => handleLangSelect('en')}
                  className="px-3 py-1.5 bg-primary text-primary-foreground font-medium"
                >
                  EN
                </button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button disabled className="px-3 py-1.5 text-muted-foreground cursor-not-allowed">
                      ZU
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            <Link to="/auth?mode=login">
              <Button variant="ghost" size="sm" className="text-[13px]">Login</Button>
            </Link>
            <Link to="/auth?mode=signup" className="hidden sm:inline-flex">
              <Button size="sm" className="text-[13px] font-semibold rounded-full px-5">Register</Button>
            </Link>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-5 py-3 space-y-1">
            {[
              ['How it works', 'how'],
              ['Organisers', 'organisers'],
              ['Vendors', 'vendors'],
              ['FAQ', 'faq'],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left text-sm py-2.5 text-muted-foreground hover:text-foreground"
              >
                {label}
              </button>
            ))}
            <Link to="/auth?mode=signup" className="block pt-1">
              <Button size="sm" className="w-full rounded-full">Register</Button>
            </Link>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-5 sm:px-8">

        {/* ═══ HERO ═══ */}
        <section className="pt-12 pb-20 md:pt-20 md:pb-28 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-7 text-center md:text-left">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Traditional ceremonies, made simpler
            </p>
            <h1 className="text-[2.5rem] sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.08]">
              Make ceremony planning feel{' '}
              <span className="text-primary">lighter.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto md:mx-0">
              Find trusted vendors, compare quotes, and keep everything organised — in UMCIMBI.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="w-full sm:w-auto h-12 text-[15px] font-semibold px-8 rounded-full shadow-lg shadow-primary/15">
                  Register
                </Button>
              </Link>
              <Link to="/auth?mode=login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 text-[15px] font-semibold px-8 rounded-full">
                  Login
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <Badge className="bg-secondary text-secondary-foreground text-[11px]">Umembeso</Badge>
              <Badge className="bg-accent text-accent-foreground text-[11px]">Umabo</Badge>
              <Badge variant="outline" className="text-[11px]">Umbondo</Badge>
              <Badge variant="outline" className="text-[11px]">Umemulo</Badge>
            </div>
          </div>

          <div className="flex justify-center">
            <HeroSereneIllustration />
          </div>
        </section>

        {/* ═══ 3 PILLARS ═══ */}
        <section className="pb-24">
          <div className="space-y-5">
            {([
              {
                variant: 'trusted' as const,
                title: 'Trusted vendors',
                body: 'Verified profiles and clearer accountability so you book with confidence.',
              },
              {
                variant: 'quotes' as const,
                title: 'Comparable quotes',
                body: 'Structured offers you can review side-by-side — scope, price, terms.',
              },
              {
                variant: 'organised' as const,
                title: 'One organised plan',
                body: 'Tasks, messages, and confirmations in one flow.',
              },
            ]).map(({ variant, title, body }) => (
              <Card key={variant} className="border border-border/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="flex items-center gap-6 p-6 sm:p-8">
                  <PillarIllustration variant={variant} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{body}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 hidden sm:block shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══ PROBLEM ═══ */}
        <section className="pb-24 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="order-2 md:order-1">
            <ProblemIllustration />
          </div>
          <div className="order-1 md:order-2 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
              Planning shouldn't become chaos.
            </h2>
            <ul className="space-y-4">
              {[
                'Finding reliable vendors takes time — recommendations can be inconsistent.',
                'Quotes come in different formats, and comparing options is hard.',
                'Coordinating deliveries, tasks, and family expectations gets stressful fast.',
              ].map((text) => (
                <li key={text} className="flex gap-3 items-start text-[15px] text-muted-foreground leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how" className="pb-24 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">How UMCIMBI works</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {([
              { step: 1 as const, title: 'Share your ceremony needs', body: 'Type, date, location, and what you need.' },
              { step: 2 as const, title: 'Receive & compare quotes', body: 'Vendors respond with structured quotes you can review.' },
              { step: 3 as const, title: 'Book & manage delivery', body: 'Track tasks, confirmations, and delivery proof.' },
            ]).map(({ step, title, body }) => (
              <Card key={step} className="border border-border/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="p-7 flex flex-col items-center text-center space-y-4">
                  <StepIllustration step={step} />
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {step}
                  </div>
                  <h3 className="font-bold text-[15px]">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="h-12 text-[15px] font-semibold px-8 rounded-full">Register</Button>
            </Link>
          </div>
        </section>

        {/* ═══ FOR ORGANISERS ═══ */}
        <section id="organisers" className="pb-24 scroll-mt-20">
          <div className="rounded-3xl bg-muted/30 p-8 sm:p-12">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold">For Organisers</h2>
              <p className="text-muted-foreground mt-2">Keep the meaning. Lose the stress.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {([
                { icon: ShieldCheck, title: 'Trusted vendors you can rely on', body: 'Verified profiles, real reviews, and clearer accountability.' },
                { icon: BarChart3, title: 'Quotes you can actually compare', body: 'Clear scope and pricing so you can choose what fits your budget.' },
                { icon: Inbox, title: 'Everything organised in one place', body: 'Checklist, timelines, and messages — less chaos, more meaning.' },
              ]).map(({ icon, title, body }) => (
                <Card key={title} className="border border-border/60 bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <CardContent className="p-6 space-y-3">
                    <FeatureIcon icon={icon} />
                    <h3 className="font-semibold text-sm">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="h-12 text-[15px] font-semibold px-8 rounded-full">
                  Register to start planning
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ FOR VENDORS ═══ */}
        <section
          id="vendors"
          className="pb-24 scroll-mt-20"
          style={{
            '--primary': '20 75% 40%',
            '--accent': '20 65% 50%',
          } as React.CSSProperties}
        >
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">For Vendors</h2>
              <p className="text-muted-foreground mb-8">Win better work with less back-and-forth.</p>
              <div className="space-y-4">
                {([
                  { icon: Users, title: 'More qualified leads', body: 'Requests tied to real ceremonies, dates, and locations.' },
                  { icon: Zap, title: 'Faster, more professional quoting', body: 'Send structured quotes, set terms, and track acceptance.' },
                  { icon: HandshakeIcon, title: 'Less dispute stress', body: 'Clear confirmation steps and delivery proof reduce misunderstandings.' },
                ]).map(({ icon, title, body }) => (
                  <Card key={title} className="border border-border/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <CardContent className="flex gap-4 items-start p-5">
                      <FeatureIcon icon={icon} />
                      <div>
                        <h3 className="font-semibold text-sm">{title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="h-12 text-[15px] font-semibold px-8 rounded-full">
                    I'm a vendor — Register
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <VendorSereneIllustration />
            </div>
          </div>
        </section>

        {/* ═══ CEREMONY TILES ═══ */}
        <section className="pb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">Ceremonies we support</h2>
            <p className="text-muted-foreground mt-2">Built for the moments that matter most.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <CeremonyTile name="Umembeso" description="The bride's family presents gifts to the groom's family." categories={['Catering', 'Tents', 'Decor']} accentClass="bg-secondary" icon="🎁" />
            <CeremonyTile name="Umabo" description="The bride is formally welcomed into the groom's family." categories={['Attire', 'Catering', 'Livestock']} accentClass="bg-accent" icon="👰" />
            <CeremonyTile name="Umbondo" description="The bride's family delivers groceries and essentials." categories={['Transport', 'Groceries', 'Planning']} accentClass="bg-muted" icon="🧺" />
            <CeremonyTile name="Umemulo" description="A coming-of-age celebration for a young woman." categories={['Catering', 'Attire', 'Music']} accentClass="bg-muted" icon="🌸" />
          </div>
        </section>

        {/* ═══ SOCIAL PROOF ═══ */}
        <section className="pb-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Loved by families and vendors</h2>
            <p className="text-xs text-muted-foreground mt-2">Pilot testimonials will appear here after launch.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { name: 'Nomsa M.', role: 'Organiser, KZN', quote: '"Made planning our Umembeso so much easier. Finally, one place for everything."' },
              { name: 'Thabo K.', role: 'Catering vendor', quote: '"I get real ceremony requests with dates and details — no more guessing."' },
              { name: 'Zanele D.', role: 'Organiser, Gauteng', quote: '"Comparing quotes side-by-side saved us time and money."' },
            ].map((t) => (
              <Card key={t.name} className="border border-border/60">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">{t.quote}</p>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section id="faq" className="pb-24 scroll-mt-20 max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Frequently asked questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              { q: 'What is UMCIMBI?', a: 'UMCIMBI is a platform that helps you plan traditional South African ceremonies by connecting you with trusted, verified vendors. You can request quotes, compare options, and manage your entire ceremony plan in one place.' },
              { q: 'Is it free?', a: 'Creating an account and browsing vendors is free for organisers. Vendors can join and respond to requests at no cost during our launch period.' },
              { q: 'How do quotes work?', a: 'You submit a service request describing what you need. Vendors respond with structured quotes including scope, pricing, and terms — making it easy to compare.' },
              { q: 'How do vendors get verified?', a: 'Vendors can submit verification documents including business registration, proof of address, and bank confirmation. Our team reviews submissions to ensure accountability.' },
              { q: 'When will isiZulu be available?', a: 'We\'re actively working on full isiZulu language support. It\'s coming soon — you\'ll be able to switch languages in your settings.' },
              { q: 'Can organisers and vendors use the same account?', a: 'Yes! You can register as an organiser and later add a vendor profile to the same account.' },
            ].map(({ q, a }, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/60 rounded-xl px-5">
                <AccordionTrigger className="text-sm font-medium hover:no-underline py-5">{q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section className="pb-24">
          <div className="rounded-3xl bg-primary/[0.04] border border-primary/[0.08] p-10 sm:p-16 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold">Start planning with confidence.</h2>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Join families and vendors already using UMCIMBI to bring their ceremonies together.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="w-full sm:w-auto h-12 text-[15px] font-semibold px-10 rounded-full shadow-lg shadow-primary/15">
                  Register
                </Button>
              </Link>
              <Link to="/auth?mode=login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 text-[15px] font-semibold px-10 rounded-full">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-[9px] font-bold text-primary-foreground">U</span>
            </div>
            <span className="font-semibold text-sm">UMCIMBI</span>
          </div>
          <p className="text-xs text-muted-foreground">Privacy · Terms · Contact</p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} UMCIMBI</p>
        </div>
      </footer>
    </div>
  );
}
