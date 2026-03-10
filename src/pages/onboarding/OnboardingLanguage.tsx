import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
'@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger } from
'@/components/ui/tooltip';
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
  Play } from
'lucide-react';
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
    document.body.style.backgroundColor = 'transparent';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  const handleLangSelect = (lang: 'en' | 'zu') => {
    localStorage.setItem('umcimbi_lang', lang);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundImage: 'none' }}>

      {/* ── NAV ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ?
        'bg-[hsl(220_25%_12%/0.95)] backdrop-blur-md border-b border-[hsl(0_0%_100%/0.08)] shadow-lg' :
        'bg-transparent'}`
        }>

        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 sm:px-8 h-16">
          <div className="flex items-center gap-2.5">
            <img src="/images/umcimbi-logo.png" alt="UMCIMBI" className="h-16 brightness-0 invert" />
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {[['How', 'how'], ['Organisers', 'organisers'], ['Vendors', 'vendors'], ['FAQ', 'faq']].map(([label, id]) =>
            <button key={id} onClick={() => scrollTo(id)} className="text-[13px] text-white/60 hover:text-white transition-colors">
                {label}
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2.5">
            
            <Link to="/auth?mode=login">
              <Button variant="ghost" size="sm" className="text-[13px] text-white/80 hover:text-white hover:bg-white/10">Login</Button>
            </Link>
            <Link to="/auth?mode=signup" className="hidden sm:inline-flex">
              <Button size="sm" className="text-[13px] font-semibold rounded-full px-5 shadow-md shadow-primary/15">Register</Button>
            </Link>
            <button className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {mobileMenuOpen &&
        <div className="md:hidden border-t border-white/10 bg-[hsl(220_25%_12%/0.97)] backdrop-blur-md px-5 py-3 space-y-1">
            {[['How it works', 'how'], ['Organisers', 'organisers'], ['Vendors', 'vendors'], ['FAQ', 'faq']].map(([label, id]) =>
          <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-sm py-2.5 text-white/60 hover:text-white">{label}</button>
          )}
            <Link to="/auth?mode=signup" className="block pt-1">
              <Button size="sm" className="w-full rounded-full">Register</Button>
            </Link>
          </div>
        }
      </header>

      {/* ═══ HERO — Full-viewport with background image ═══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }} />

        {/* Dark overlay for contrast — stronger to keep text crisp */}
        <div className="absolute inset-0 bg-[hsl(220_25%_6%/0.62)]" />
        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[hsl(220_25%_8%/0.7)] to-transparent" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-24 pb-16 grid md:grid-cols-2 gap-12 md:gap-20 items-center w-full">
          <div className="space-y-8 text-center md:text-left" style={{ textShadow: '0 2px 20px hsl(220 25% 6% / 0.5)' }}>

            <h1 className="text-[2.75rem] sm:text-[3.25rem] lg:text-6xl font-extrabold tracking-tight leading-[1.06] text-white drop-shadow-lg">
              Planning UMCIMBI has<br className="hidden sm:block" /> never felt so{' '}
              <span className="text-secondary">light.</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/75 leading-relaxed max-w-lg mx-auto md:mx-0 drop-shadow-md">Find trusted vendors, compare quotes, and keep everything organised. All in one place.

            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start" style={{ textShadow: 'none' }}>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="w-full sm:w-auto h-14 text-base font-semibold px-10 rounded-full shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all">
                  Get started — it's free
                </Button>
              </Link>
              <Link to="/auth?mode=login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 text-base font-semibold px-10 rounded-full border-white/30 !text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm">
                  Login
                </Button>
              </Link>
            </div>

          </div>

          <div className="flex justify-center">
            <HeroSereneIllustration />
          </div>
        </div>
      </section>

      {/* ═══ 3 PILLARS — Light cream band ═══ */}
      <section className="relative py-28 bg-background">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Why UMCIMBI</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Everything you need in one place</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
            { icon: ShieldCheck, title: 'Trusted vendors', body: 'Verified profiles and clearer accountability so you book with confidence.', gradient: 'from-primary/[0.08] to-primary/[0.02]', iconBg: 'bg-primary/15', iconColor: 'text-primary' },
            { icon: BarChart3, title: 'Comparable quotes', body: 'Structured offers you can review side-by-side i.e. scope, price, terms.', gradient: 'from-secondary/[0.08] to-secondary/[0.02]', iconBg: 'bg-secondary/15', iconColor: 'text-secondary' },
            { icon: Inbox, title: 'One organised plan', body: 'Tasks, messages, and confirmations in one flow.', gradient: 'from-accent/[0.08] to-accent/[0.02]', iconBg: 'bg-accent/15', iconColor: 'text-accent' }].
            map(({ icon: Icon, title, body, gradient, iconBg, iconColor }) =>
            <div key={title} className={`group rounded-3xl bg-gradient-to-b ${gradient} border border-border/40 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mb-5`}>
                  <Icon className={`h-7 w-7 ${iconColor}`} />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{title}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">{body}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ PROBLEM — Dark cinematic band with background image ═══ */}
      <section className="relative py-28 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/problem-bg.jpg)' }} />

        <div className="absolute inset-0 bg-[hsl(220_25%_6%/0.65)]" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 grid md:grid-cols-2 gap-16 items-center">
          {/* Illustration — WhatsApp chaos vs Umcimbi organised */}
          <div className="order-2 md:order-1 flex justify-center">
            <div className="relative w-80 h-80">
              {/* Before: WhatsApp-style chaos */}
              <div
                className="absolute top-2 left-0 w-[46%] h-[92%] rounded-2xl bg-[hsl(140_40%_12%)] border border-white/8 shadow-lg overflow-hidden"
                style={{ transform: 'rotate(-3deg)' }}>

                <div className="h-6 bg-[hsl(140_40%_20%)] flex items-center px-2 gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-white/20" />
                  <span className="text-[7px] font-semibold text-white/70">Family Group</span>
                </div>
                <div className="p-2 space-y-1.5">
                  {/* Chat bubbles — messy planning */}
                  <div className="ml-auto w-[80%] rounded-lg rounded-tr-sm bg-[hsl(140_50%_25%)] p-1.5">
                    <span className="text-[6px] text-white/80">Does anyone have a tent guy? Need one urgently 😩</span>
                  </div>
                  <div className="w-[75%] rounded-lg rounded-tl-sm bg-white/10 p-1.5">
                    <span className="text-[6px] text-white/60">My cousin knows someone but he's expensive</span>
                  </div>
                  <div className="ml-auto w-[70%] rounded-lg rounded-tr-sm bg-[hsl(140_50%_25%)] p-1.5">
                    <span className="text-[6px] text-white/80">How much is the catering?? No one sent me the quote</span>
                  </div>
                  <div className="w-[65%] rounded-lg rounded-tl-sm bg-white/10 p-1.5">
                    <span className="text-[6px] text-white/60">Check the other group</span>
                  </div>
                  <div className="ml-auto w-[85%] rounded-lg rounded-tr-sm bg-[hsl(140_50%_25%)] p-1.5">
                    <span className="text-[6px] text-white/80">What's the budget again? I'm lost 😭</span>
                  </div>
                  <div className="w-[60%] rounded-lg rounded-tl-sm bg-white/10 p-1.5">
                    <span className="text-[6px] text-white/60">Ask MaZulu she has the list</span>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <span className="text-[7px] font-semibold text-destructive/80 bg-destructive/10 px-2 py-0.5 rounded">Before</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="absolute top-1/2 left-[46%] -translate-y-1/2 z-10">
                <ArrowRight className="h-6 w-6 text-white/25" />
              </div>

              {/* After: Umcimbi organised view (LIGHT) */}
              <div
                className="absolute top-2 right-0 w-[46%] h-[92%] rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden"
                style={{ transform: 'rotate(2deg)' }}>

                <div className="h-6 bg-primary flex items-center px-2 gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                    <span className="text-[5px] font-bold text-primary-foreground">U</span>
                  </div>
                  <span className="text-[7px] font-semibold text-primary-foreground/80">Umembeso Plan</span>
                </div>
                <div className="p-2.5 space-y-2">
                  <div className="text-[6px] text-gray-400 font-medium">Tasks</div>
                  {[
                  { done: true, label: 'Book catering vendor', tag: 'R 12,000' },
                  { done: true, label: 'Confirm tent hire', tag: 'R 8,000' },
                  { done: false, label: 'Send guest invites', tag: '86 guests' },
                  { done: false, label: 'Finalise decor quotation', tag: 'Pending' }].
                  map((task, i) =>
                  <div key={i} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded border ${task.done ? 'bg-primary border-primary' : 'border-gray-300'} flex items-center justify-center shrink-0`}>
                        {task.done && <span className="text-[6px] text-primary-foreground">✓</span>}
                      </div>
                      <span className={`text-[6.5px] flex-1 ${task.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task.label}</span>
                      <span className={`text-[5.5px] px-1 py-0.5 rounded ${task.done ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>{task.tag}</span>
                    </div>
                  )}

                  <div className="mt-1 pt-2 border-t border-gray-100">
                    <div className="flex justify-between text-[6px] text-gray-400 mb-1">
                      <span>Budget</span>
                      <span className="text-primary font-semibold">R 28,500 / R 45,000</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div className="h-1.5 rounded-full bg-primary w-[63%]" />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <span className="text-[7px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">After</span>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold leading-snug text-white drop-shadow-lg">
              Planning shouldn't become chaos.
            </h2>
            <ul className="space-y-5">
              {[
              'Finding reliable vendors takes time as personal recommendations can be inconsistent.',
              'Quotes come in different formats, and comparing options is hard.',
              'Coordinating deliveries, tasks, and family expectations gets stressful fast.'].
              map((text) =>
              <li key={text} className="flex gap-3.5 items-start text-[15px] text-white/65 leading-relaxed">
                  <span className="mt-2 w-2 h-2 rounded-full bg-secondary shrink-0" />
                  {text}
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — Light band ═══ */}
      <section id="how" className="py-28 bg-background scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Simple process</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">How UMCIMBI works</h2>
            <p className="text-muted-foreground mt-3 text-lg">Three simple steps to your ceremony.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
            { step: 1 as const, title: 'Share your ceremony needs', body: 'The type, date, location, and what you need.' },
            { step: 2 as const, title: 'Receive & compare quotations', body: 'Vendors respond with structured quotations you can review.' },
            { step: 3 as const, title: 'Confirm & manage delivery', body: 'Track tasks, confirmations, and delivery proof.' }].
            map(({ step, title, body }) =>
            <div key={step} className="group text-center space-y-5">
                <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/[0.08] flex items-center justify-center group-hover:bg-primary/[0.12] transition-colors">
                  <StepIllustration step={step} />
                </div>
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mx-auto shadow-lg shadow-primary/20">
                  {step}
                </div>
                <h3 className="font-bold text-[17px] text-foreground">{title}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xs mx-auto">{body}</p>
              </div>
            )}
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

      {/* ═══ FOR ORGANISERS — Immersive dark band with background image ═══ */}
      <section id="organisers" className="relative py-28 scroll-mt-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/organisers-bg.jpg)' }} />

        <div className="absolute inset-0 bg-[hsl(220_30%_8%/0.62)]" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">For Organisers</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">Use you time to plan UMCIMBI. Lose the stress.</h2>
            <p className="text-lg text-white/60 mt-3">Plan your UMCIMBI with tools that actually help.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
            { icon: ShieldCheck, title: 'Trusted vendors you can rely on', body: 'Verified profiles, real reviews, and clearer accountability.' },
            { icon: BarChart3, title: 'Quotes you can actually compare', body: 'Clear scope and pricing so you can choose what fits your budget.' },
            { icon: Inbox, title: 'Everything organised in one place', body: 'Checklist, timelines, and messages — less chaos, more meaning.' }].
            map(({ icon: Icon, title, body }) =>
            <div key={title} className="group rounded-2xl bg-white/[0.07] backdrop-blur-sm border border-white/10 p-7 hover:bg-white/[0.12] hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/25 flex items-center justify-center mb-5">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-[15px] text-white">{title}</h3>
                <p className="text-sm text-white/55 leading-relaxed mt-2">{body}</p>
              </div>
            )}
          </div>
          <div className="text-center mt-10">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="h-13 text-[15px] font-semibold px-10 rounded-full shadow-lg shadow-primary/25">
                Register to start planning
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOR VENDORS — Clean light section ═══ */}
      <section
        id="vendors"
        className="relative py-28 scroll-mt-20 overflow-hidden bg-background"
        style={{
          '--primary': '20 75% 40%',
          '--accent': '20 65% 50%'
        } as React.CSSProperties}>

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">For Vendors</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-foreground">Win better. Work with less back-and-forth.</h2>
              <p className="text-lg text-muted-foreground mb-10">Grow your ceremony business with qualified leads.</p>
              <div className="space-y-5">
                {[
                { icon: Users, title: 'More qualified leads', body: 'Requests tied to real ceremonies, dates, and locations.' },
                { icon: Zap, title: 'Faster, more professional quoting', body: 'Send structured quotes, set terms, and track acceptance.' },
                { icon: HandshakeIcon, title: 'Less dispute stress', body: 'Clear confirmation steps and delivery proof reduce misunderstandings.' }].
                map(({ icon: Icon, title, body }) =>
                <div key={title} className="group rounded-2xl bg-muted/50 border border-border p-6 hover:bg-muted hover:-translate-y-1 transition-all duration-300">
                    <div className="flex gap-5 items-start">
                      <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px] text-foreground">{title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{body}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-10">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="h-13 text-[15px] font-semibold px-10 rounded-full shadow-lg shadow-primary/25">
                    I'm a vendor — Register
                  </Button>
                </Link>
              </div>
            </div>

            {/* Vendor illustration — Vendor Dashboard + Bookings */}
            <div className="hidden md:flex flex-col justify-center items-center gap-5">
              {/* Vendor Dashboard mockup — matches actual VendorDashboard layout */}
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 rounded-[2rem] bg-muted/50 border border-border" />
                <div className="absolute top-6 left-6 right-6 bottom-6 rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
                  {/* Page header */}
                  <div className="h-8 bg-primary flex items-center justify-between px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                        <span className="text-[6px] font-bold text-primary-foreground">U</span>
                      </div>
                      <span className="text-[8px] font-semibold text-primary-foreground/80">Dashboard</span>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-primary-foreground/15 flex items-center justify-center">
                      <span className="text-[7px] text-primary-foreground/60">🔔</span>
                    </div>
                  </div>

                  {/* KPI heading */}
                  <div className="px-3 pt-2.5 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[7px] text-gray-400">📈</span>
                      <span className="text-[7px] font-medium text-gray-400">Last 30 days</span>
                    </div>
                  </div>

                  {/* KPI 2×2 grid — matches actual dashboard */}
                  <div className="px-3 grid grid-cols-2 gap-2 mb-2.5">
                    <div className="rounded-xl border border-gray-100 p-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[7px]">👁</span>
                      </div>
                      <div>
                        <div className="text-[12px] font-bold text-gray-900">48</div>
                        <div className="text-[5.5px] text-gray-400">Profile views</div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <span className="text-[7px]">📄</span>
                      </div>
                      <div>
                        <div className="text-[12px] font-bold text-gray-900">12</div>
                        <div className="text-[5.5px] text-gray-400">Quotations sent</div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <span className="text-[7px]">✓</span>
                      </div>
                      <div>
                        <div className="text-[12px] font-bold text-gray-900">8</div>
                        <div className="text-[5.5px] text-gray-400">Orders completed</div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                        <span className="text-[7px]">💵</span>
                      </div>
                      <div>
                        <div className="text-[12px] font-bold text-gray-900">R 94k</div>
                        <div className="text-[5.5px] text-gray-400">Total payout</div>
                      </div>
                    </div>
                  </div>

                  {/* Incoming request card */}
                  <div className="px-3 pb-1">
                    <div className="text-[7px] text-gray-400 font-medium mb-2">Incoming Requests</div>
                    <div className="rounded-xl border border-primary/15 p-2.5 bg-primary/[0.04] mb-2">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                            <span className="text-[7px] font-bold text-primary">N</span>
                          </div>
                          <div>
                            <div className="text-[7px] font-semibold text-gray-800">Nomsa M.</div>
                            <div className="text-[5.5px] text-gray-400">Umembeso · 15 Mar · 100 guests</div>
                          </div>
                        </div>
                        <div className="px-1.5 py-0.5 rounded-full bg-primary/15">
                          <span className="text-[6px] font-bold text-primary">New</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="flex-1 h-5 rounded-lg bg-primary flex items-center justify-center">
                          <span className="text-[6px] font-semibold text-primary-foreground">Send Quotation</span>
                        </div>
                        <div className="h-5 px-2 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-[6px] text-gray-400">Decline</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders mockup */}
              <div className="relative w-80 h-64">
                <div className="absolute inset-0 rounded-[2rem] bg-white/[0.06] border border-white/10" />
                <div className="absolute top-4 left-4 right-4 bottom-4 rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
                  {/* Header */}
                  <div className="h-7 bg-primary flex items-center justify-between px-3">
                    <span className="text-[8px] font-semibold text-primary-foreground/80">Orders</span>
                    <div className="px-1.5 py-0.5 rounded-full bg-primary-foreground/15">
                      <span className="text-[6px] font-bold text-primary-foreground/70">3 Active</span>
                    </div>
                  </div>

                  {/* 3-tab bar — Active / Completed / Other */}
                  <div className="flex border-b border-gray-100">
                    <div className="flex-1 text-center py-1.5 border-b-2 border-primary">
                      <span className="text-[6px] font-semibold text-primary">Active</span>
                    </div>
                    <div className="flex-1 text-center py-1.5">
                      <span className="text-[6px] text-gray-400">Completed</span>
                    </div>
                    <div className="flex-1 text-center py-1.5">
                      <span className="text-[6px] text-gray-400">Other</span>
                    </div>
                  </div>

                  <div className="px-3 py-2 space-y-2">
                    {/* Order 1 — confirmed */}
                    <div className="rounded-xl border border-green-200 p-2 bg-green-50/60">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-[7px]">✓</span>
                          </div>
                          <div>
                            <div className="text-[7px] font-semibold text-gray-800">Thandi K. — Umabo</div>
                            <div className="text-[5.5px] text-gray-400">22 Mar · Durban</div>
                          </div>
                        </div>
                        <div className="px-1.5 py-0.5 rounded-full bg-green-100">
                          <span className="text-[6px] font-bold text-green-700">Confirmed</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[6px] text-gray-500">R 12,500</span>
                        <span className="text-[6px] text-green-600 font-medium">Deposit paid</span>
                      </div>
                    </div>

                    {/* Order 2 — pending deposit */}
                    <div className="rounded-xl border border-amber-200 p-2 bg-amber-50/60">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                            <span className="text-[7px]">⏳</span>
                          </div>
                          <div>
                            <div className="text-[7px] font-semibold text-gray-800">Sipho N. — Lobola</div>
                            <div className="text-[5.5px] text-gray-400">5 Apr · Pretoria</div>
                          </div>
                        </div>
                        <div className="px-1.5 py-0.5 rounded-full bg-amber-100">
                          <span className="text-[6px] font-bold text-amber-700">Pending</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[6px] text-gray-500">R 8,200</span>
                        <span className="text-[6px] text-amber-600 font-medium">Awaiting deposit</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CEREMONY TILES — Light band with subtle background ═══ */}
      <section className="relative py-28 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/ceremony-bg.jpg)' }} />

        <div className="absolute inset-0 bg-[hsl(220_30%_8%/0.55)]" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Ceremonies</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">Built for the moments that matter most</h2>
            <p className="text-lg text-white/60 mt-3">Supporting the ceremonies your family treasures.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <CeremonyTile name="Umembeso" description="The bride's family presents gifts to the groom's family." categories={['Catering', 'Tents', 'Decor']} accentClass="bg-secondary" icon="🎁" />
            <CeremonyTile name="Umabo" description="The bride is formally welcomed into the groom's family." categories={['Attire', 'Catering', 'Livestock']} accentClass="bg-accent" icon="👰" />
            <CeremonyTile name="Umbondo" description="The bride's family delivers groceries and essentials." categories={['Transport', 'Groceries', 'Planning']} accentClass="bg-muted" icon="🧺" />
            <CeremonyTile name="Umemulo" description="A coming-of-age celebration for a young woman." categories={['Catering', 'Attire', 'Music']} accentClass="bg-muted" icon="🌸" />
          </div>

          {/* Additional ceremony types */}
          <div className="mt-8 text-center">
            <p className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Also supporting</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
              { icon: '🤝', name: 'Lobola' },
              { icon: '👶', name: 'Imbeleko' },
              { icon: '👨‍👩‍👦', name: 'Family Introduction' },
              { icon: '🕯️', name: 'Funeral' },
              { icon: '🙏', name: 'Ancestral Ritual' }].
              map((c) =>
              <span key={c.name} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground shadow-sm">
                  <span>{c.icon}</span> {c.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF — Dark cinematic band ═══ */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[hsl(220_25%_8%)]" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Loved by families and vendors</h2>
            <p className="text-xs text-white/40 mt-3">Pilot testimonials will appear here after launch.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
            { name: 'Nomsa M.', role: 'Organiser, KZN', quote: '"Made planning our Umembeso so much easier. Finally, one place for everything."' },
            { name: 'Thabo K.', role: 'Catering vendor', quote: '"I get real ceremony requests with dates and details — no more guessing."' },
            { name: 'Zanele D.', role: 'Organiser, Gauteng', quote: '"Comparing quotes side-by-side saved us time and money."' }].
            map((t) =>
            <div key={t.name} className="rounded-2xl bg-white/[0.05] backdrop-blur-sm border border-white/10 p-7 hover:bg-white/[0.08] transition-all duration-300">
                <div className="flex gap-0.5 mb-5">
                  {[1, 2, 3, 4, 5].map((s) =>
                <Star key={s} className="h-4 w-4 fill-warning text-warning" />
                )}
                </div>
                <p className="text-[15px] text-white/70 italic leading-relaxed mb-6">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ FAQ — Light band ═══ */}
      <section id="faq" className="py-28 bg-background scroll-mt-20">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Frequently asked questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {[
            { q: 'What is UMCIMBI?', a: 'UMCIMBI is a platform that helps you plan traditional South African ceremonies by connecting you with trusted, verified vendors. You can request quotes, compare options, and manage your entire ceremony plan in one place.' },
            { q: 'Is it free?', a: 'Creating an account and browsing vendors is free for organisers. Vendors can join and respond to requests at no cost during our launch period.' },
            { q: 'How do quotes work?', a: 'You submit a service request describing what you need. Vendors respond with structured quotes including scope, pricing, and terms — making it easy to compare.' },
            { q: 'How do vendors get verified?', a: 'Vendors can submit verification documents including business registration, proof of address, and bank confirmation. Our team reviews submissions to ensure accountability.' },
            { q: 'When will isiZulu be available?', a: 'We\'re actively working on full isiZulu language support. It\'s coming soon — you\'ll be able to switch languages in your settings.' },
            { q: 'Can organisers and vendors use the same account?', a: 'Yes! You can register as an organiser and later add a vendor profile to the same account.' }].
            map(({ q, a }, i) =>
            <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-2xl px-6 bg-card">
                <AccordionTrigger className="text-[15px] font-medium hover:no-underline py-5">{q}</AccordionTrigger>
                <AccordionContent className="text-[15px] text-muted-foreground leading-relaxed pb-5">{a}</AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </section>

      {/* ═══ FINAL CTA — Cinematic background image band ═══ */}
      <section className="relative py-28 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/cta-bg.jpg)' }} />

        <div className="absolute inset-0 bg-[hsl(220_30%_6%/0.60)]" />

        <div className="relative mx-auto max-w-3xl px-5 sm:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">Start planning with confidence.</h2>
          <p className="text-white/60 text-lg max-w-md mx-auto leading-relaxed">
            Join families and vendors already using UMCIMBI to bring their ceremonies together.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="w-full sm:w-auto h-14 text-base font-semibold px-10 rounded-full shadow-xl shadow-primary/30">
                Get started — it's free
              </Button>
            </Link>
            <Link to="/auth?mode=login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 text-base font-semibold px-10 rounded-full border-white/30 !text-white bg-white/10 hover:bg-white/15">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[hsl(220_25%_8%)] border-t border-white/5">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-[9px] font-bold text-primary-foreground">U</span>
            </div>
            <span className="font-semibold text-sm text-white">UMCIMBI</span>
          </div>
          <p className="text-xs text-white/30">Privacy · Terms · Contact</p>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} UMCIMBI</p>
        </div>
      </footer>
    </div>);

}
