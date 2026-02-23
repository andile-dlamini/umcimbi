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
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import HeroSereneIllustration from '@/components/illustrations/HeroSereneIllustration';
import StepIllustration from '@/components/illustrations/StepIllustration';
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

  // Remove shweshwe background on this page
  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    return () => { document.body.style.backgroundImage = ''; };
  }, []);

  const handleLangSelect = (lang: 'en' | 'zu') => {
    localStorage.setItem('umcimbi_lang', lang);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen text-foreground" style={{ backgroundImage: 'none' }}>

      {/* ── NAV ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 sm:px-8 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <span className="text-sm font-bold text-primary-foreground">U</span>
            </div>
            <span className="font-bold text-lg tracking-tight">UMCIMBI</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {[['How', 'how'], ['Organisers', 'organisers'], ['Vendors', 'vendors'], ['FAQ', 'faq']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <TooltipProvider>
              <div className="hidden sm:flex rounded-full border border-border overflow-hidden text-xs">
                <button onClick={() => handleLangSelect('en')} className="px-3 py-1.5 bg-primary text-primary-foreground font-medium">EN</button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button disabled className="px-3 py-1.5 text-muted-foreground cursor-not-allowed">ZU</button>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            <Link to="/auth?mode=login">
              <Button variant="ghost" size="sm" className="text-[13px]">Login</Button>
            </Link>
            <Link to="/auth?mode=signup" className="hidden sm:inline-flex">
              <Button size="sm" className="text-[13px] font-semibold rounded-full px-5 shadow-md shadow-primary/15">Register</Button>
            </Link>
            <button className="md:hidden p-2 rounded-lg hover:bg-muted" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-5 py-3 space-y-1">
            {[['How it works', 'how'], ['Organisers', 'organisers'], ['Vendors', 'vendors'], ['FAQ', 'faq']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-sm py-2.5 text-muted-foreground hover:text-foreground">{label}</button>
            ))}
            <Link to="/auth?mode=signup" className="block pt-1">
              <Button size="sm" className="w-full rounded-full">Register</Button>
            </Link>
          </div>
        )}
      </header>

      {/* ═══ HERO — Full-viewport immersive ═══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-primary/[0.06] via-background to-background">
        {/* Decorative background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-primary/[0.04]" />
          <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-secondary/[0.03]" />
          <div className="absolute bottom-10 right-1/4 w-[200px] h-[200px] rounded-full bg-accent/[0.03]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-24 pb-16 grid md:grid-cols-2 gap-12 md:gap-20 items-center w-full">
          <div className="space-y-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/[0.08] border border-primary/[0.12]">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Traditional ceremonies, made simpler</span>
            </div>

            <h1 className="text-[2.75rem] sm:text-[3.25rem] lg:text-6xl font-extrabold tracking-tight leading-[1.06]">
              Make ceremony<br className="hidden sm:block" /> planning feel{' '}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">lighter.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto md:mx-0">
              Find trusted vendors, compare quotes, and keep everything organised — in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="w-full sm:w-auto h-14 text-base font-semibold px-10 rounded-full shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/25 transition-all">
                  Get started — it's free
                </Button>
              </Link>
              <Link to="/auth?mode=login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 text-base font-semibold px-10 rounded-full hover:bg-primary/[0.04]">
                  Login
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              <Badge className="bg-secondary/15 text-secondary border-secondary/20 text-[11px] font-medium">Umembeso</Badge>
              <Badge className="bg-accent/15 text-accent border-accent/20 text-[11px] font-medium">Umabo</Badge>
              <Badge variant="outline" className="text-[11px]">Umbondo</Badge>
              <Badge variant="outline" className="text-[11px]">Umemulo</Badge>
            </div>
          </div>

          <div className="flex justify-center">
            <HeroSereneIllustration />
          </div>
        </div>
      </section>

      {/* ═══ 3 PILLARS — Bold color-backed cards ═══ */}
      <section className="relative py-24 bg-background">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid sm:grid-cols-3 gap-6">
            {([
              { icon: ShieldCheck, title: 'Trusted vendors', body: 'Verified profiles and clearer accountability so you book with confidence.', gradient: 'from-primary/[0.08] to-primary/[0.02]', iconBg: 'bg-primary/15', iconColor: 'text-primary' },
              { icon: BarChart3, title: 'Comparable quotes', body: 'Structured offers you can review side-by-side — scope, price, terms.', gradient: 'from-secondary/[0.08] to-secondary/[0.02]', iconBg: 'bg-secondary/15', iconColor: 'text-secondary' },
              { icon: Inbox, title: 'One organised plan', body: 'Tasks, messages, and confirmations in one flow.', gradient: 'from-accent/[0.08] to-accent/[0.02]', iconBg: 'bg-accent/15', iconColor: 'text-accent' },
            ]).map(({ icon: Icon, title, body, gradient, iconBg, iconColor }) => (
              <div key={title} className={`group rounded-3xl bg-gradient-to-b ${gradient} border border-border/40 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mb-5`}>
                  <Icon className={`h-7 w-7 ${iconColor}`} />
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROBLEM — Rich colored band ═══ */}
      <section className="relative py-24 bg-primary/[0.04]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 grid md:grid-cols-2 gap-16 items-center">
          {/* Illustration */}
          <div className="order-2 md:order-1 flex justify-center">
            <div className="relative w-72 h-72">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-destructive/[0.06] to-primary/[0.06]" />
              {/* Messy side */}
              <div className="absolute top-6 left-4 w-[44%] h-[80%] space-y-2.5">
                <div className="h-7 rounded-lg bg-destructive/12 border border-destructive/15 rotate-[-3deg] shadow-sm" />
                <div className="h-6 rounded-lg bg-warning/12 border border-warning/15 rotate-[2deg] ml-3 shadow-sm" />
                <div className="h-8 rounded-lg bg-destructive/10 border border-destructive/12 rotate-[-1deg] shadow-sm" />
                <div className="h-5 rounded-lg bg-warning/10 border border-warning/12 rotate-[3deg] ml-1 shadow-sm" />
                <div className="text-center text-2xl mt-2">😩</div>
              </div>
              {/* Arrow */}
              <div className="absolute top-1/2 left-[48%] -translate-y-1/2">
                <ArrowRight className="h-6 w-6 text-primary/30" />
              </div>
              {/* Organised side */}
              <div className="absolute top-8 right-3 w-[42%] h-[72%] rounded-2xl bg-card border border-border shadow-lg p-3 space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary/40" />
                    <div className={`h-1.5 rounded bg-primary/${15 - i * 3}`} style={{ width: `${60 + i * 8}%` }} />
                  </div>
                ))}
                <div className="text-center text-2xl mt-3">😌</div>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold leading-snug">
              Planning shouldn't become chaos.
            </h2>
            <ul className="space-y-5">
              {[
                'Finding reliable vendors takes time — recommendations can be inconsistent.',
                'Quotes come in different formats, and comparing options is hard.',
                'Coordinating deliveries, tasks, and family expectations gets stressful fast.',
              ].map((text) => (
                <li key={text} className="flex gap-3.5 items-start text-[15px] text-muted-foreground leading-relaxed">
                  <span className="mt-2 w-2 h-2 rounded-full bg-accent shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="py-24 bg-background scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">How UMCIMBI works</h2>
            <p className="text-muted-foreground mt-3 text-lg">Three simple steps to your ceremony.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {([
              { step: 1 as const, title: 'Share your ceremony needs', body: 'Type, date, location, and what you need.' },
              { step: 2 as const, title: 'Receive & compare quotes', body: 'Vendors respond with structured quotes you can review.' },
              { step: 3 as const, title: 'Book & manage delivery', body: 'Track tasks, confirmations, and delivery proof.' },
            ]).map(({ step, title, body }) => (
              <div key={step} className="group text-center space-y-5">
                <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/[0.08] flex items-center justify-center group-hover:bg-primary/[0.12] transition-colors">
                  <StepIllustration step={step} />
                </div>
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mx-auto shadow-lg shadow-primary/20">
                  {step}
                </div>
                <h3 className="font-bold text-[17px]">{title}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xs mx-auto">{body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="h-13 text-[15px] font-semibold px-10 rounded-full shadow-lg shadow-primary/15">
                Get started free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOR ORGANISERS — Rich warm band ═══ */}
      <section id="organisers" className="py-24 bg-gradient-to-b from-primary/[0.05] to-primary/[0.02] scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">For Organisers</h2>
            <p className="text-lg text-muted-foreground mt-3">Keep the meaning. Lose the stress.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {([
              { icon: ShieldCheck, title: 'Trusted vendors you can rely on', body: 'Verified profiles, real reviews, and clearer accountability.' },
              { icon: BarChart3, title: 'Quotes you can actually compare', body: 'Clear scope and pricing so you can choose what fits your budget.' },
              { icon: Inbox, title: 'Everything organised in one place', body: 'Checklist, timelines, and messages — less chaos, more meaning.' },
            ]).map(({ icon, title, body }) => (
              <Card key={title} className="border border-border/50 bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                <CardContent className="p-7 space-y-4">
                  <FeatureIcon icon={icon} />
                  <h3 className="font-semibold text-[15px]">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="h-13 text-[15px] font-semibold px-10 rounded-full shadow-lg shadow-primary/15">
                Register to start planning
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOR VENDORS — Warm override band ═══ */}
      <section
        id="vendors"
        className="py-24 scroll-mt-20"
        style={{
          '--primary': '20 75% 40%',
          '--accent': '20 65% 50%',
          background: 'linear-gradient(to bottom, hsl(20 75% 40% / 0.06), hsl(20 75% 40% / 0.02))',
        } as React.CSSProperties}
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">For Vendors</h2>
              <p className="text-lg text-muted-foreground mb-10">Win better work with less back-and-forth.</p>
              <div className="space-y-5">
                {([
                  { icon: Users, title: 'More qualified leads', body: 'Requests tied to real ceremonies, dates, and locations.' },
                  { icon: Zap, title: 'Faster, more professional quoting', body: 'Send structured quotes, set terms, and track acceptance.' },
                  { icon: HandshakeIcon, title: 'Less dispute stress', body: 'Clear confirmation steps and delivery proof reduce misunderstandings.' },
                ]).map(({ icon, title, body }) => (
                  <Card key={title} className="border border-border/50 bg-card/80 backdrop-blur hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                    <CardContent className="flex gap-5 items-start p-6">
                      <FeatureIcon icon={icon} />
                      <div>
                        <h3 className="font-semibold text-[15px]">{title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{body}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-10">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="h-13 text-[15px] font-semibold px-10 rounded-full shadow-lg shadow-primary/15">
                    I'm a vendor — Register
                  </Button>
                </Link>
              </div>
            </div>

            {/* Vendor illustration */}
            <div className="hidden md:flex justify-center items-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/[0.08] to-accent/[0.04]" />
                <div className="absolute top-10 left-10 right-10 bottom-10 rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
                  <div className="h-7 bg-primary flex items-center px-3">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground/30" />
                    <div className="ml-2 h-1.5 w-12 rounded bg-primary-foreground/20" />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="rounded-xl border border-primary/15 p-3 bg-primary/[0.04] space-y-1.5">
                      <div className="flex justify-between items-center">
                        <div className="h-2 w-20 rounded bg-primary/15" />
                        <div className="px-2 py-0.5 rounded-full bg-primary/15 text-[7px] font-bold text-primary">New</div>
                      </div>
                      <div className="h-1.5 w-24 rounded bg-muted-foreground/10" />
                    </div>
                    <div className="rounded-xl border border-border p-3 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <div className="h-2 w-16 rounded bg-foreground/10" />
                        <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[7px] font-bold text-primary">Sent</div>
                      </div>
                      <div className="h-1.5 w-20 rounded bg-muted-foreground/8" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <div className="flex-1 rounded-xl bg-primary/[0.08] p-2.5 text-center">
                        <div className="text-sm font-bold text-primary">12</div>
                        <div className="text-[8px] text-muted-foreground mt-0.5">Leads</div>
                      </div>
                      <div className="flex-1 rounded-xl bg-primary/[0.08] p-2.5 text-center">
                        <div className="text-sm font-bold text-primary">8</div>
                        <div className="text-[8px] text-muted-foreground mt-0.5">Booked</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CEREMONY TILES ═══ */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">Ceremonies we support</h2>
            <p className="text-lg text-muted-foreground mt-3">Built for the moments that matter most.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <CeremonyTile name="Umembeso" description="The bride's family presents gifts to the groom's family." categories={['Catering', 'Tents', 'Decor']} accentClass="bg-secondary" icon="🎁" />
            <CeremonyTile name="Umabo" description="The bride is formally welcomed into the groom's family." categories={['Attire', 'Catering', 'Livestock']} accentClass="bg-accent" icon="👰" />
            <CeremonyTile name="Umbondo" description="The bride's family delivers groceries and essentials." categories={['Transport', 'Groceries', 'Planning']} accentClass="bg-muted" icon="🧺" />
            <CeremonyTile name="Umemulo" description="A coming-of-age celebration for a young woman." categories={['Catering', 'Attire', 'Music']} accentClass="bg-muted" icon="🌸" />
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section className="py-24 bg-primary/[0.03]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Loved by families and vendors</h2>
            <p className="text-xs text-muted-foreground mt-3">Pilot testimonials will appear here after launch.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: 'Nomsa M.', role: 'Organiser, KZN', quote: '"Made planning our Umembeso so much easier. Finally, one place for everything."' },
              { name: 'Thabo K.', role: 'Catering vendor', quote: '"I get real ceremony requests with dates and details — no more guessing."' },
              { name: 'Zanele D.', role: 'Organiser, Gauteng', quote: '"Comparing quotes side-by-side saved us time and money."' },
            ].map((t) => (
              <Card key={t.name} className="border border-border/40 bg-card rounded-2xl hover:shadow-lg transition-all duration-300">
                <CardContent className="p-7 space-y-5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-[15px] text-muted-foreground italic leading-relaxed">{t.quote}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{t.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="py-24 bg-background scroll-mt-20">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Frequently asked questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: 'What is UMCIMBI?', a: 'UMCIMBI is a platform that helps you plan traditional South African ceremonies by connecting you with trusted, verified vendors. You can request quotes, compare options, and manage your entire ceremony plan in one place.' },
              { q: 'Is it free?', a: 'Creating an account and browsing vendors is free for organisers. Vendors can join and respond to requests at no cost during our launch period.' },
              { q: 'How do quotes work?', a: 'You submit a service request describing what you need. Vendors respond with structured quotes including scope, pricing, and terms — making it easy to compare.' },
              { q: 'How do vendors get verified?', a: 'Vendors can submit verification documents including business registration, proof of address, and bank confirmation. Our team reviews submissions to ensure accountability.' },
              { q: 'When will isiZulu be available?', a: 'We\'re actively working on full isiZulu language support. It\'s coming soon — you\'ll be able to switch languages in your settings.' },
              { q: 'Can organisers and vendors use the same account?', a: 'Yes! You can register as an organiser and later add a vendor profile to the same account.' },
            ].map(({ q, a }, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-2xl px-6 bg-card">
                <AccordionTrigger className="text-[15px] font-medium hover:no-underline py-5">{q}</AccordionTrigger>
                <AccordionContent className="text-[15px] text-muted-foreground leading-relaxed pb-5">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ═══ FINAL CTA — Bold band ═══ */}
      <section className="py-24 bg-primary">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground">Start planning with confidence.</h2>
          <p className="text-primary-foreground/70 text-lg max-w-md mx-auto leading-relaxed">
            Join families and vendors already using UMCIMBI to bring their ceremonies together.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth?mode=signup">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto h-14 text-base font-semibold px-10 rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl">
                Get started — it's free
              </Button>
            </Link>
            <Link to="/auth?mode=login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 text-base font-semibold px-10 rounded-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border/40 bg-background">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
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
