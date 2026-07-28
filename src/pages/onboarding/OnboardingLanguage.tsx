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
  Popover,
  PopoverContent,
  PopoverTrigger } from
'@/components/ui/popover';
import {
  ShieldCheck,
  BarChart3,
  Lock as LockIcon,
  Users,
  Zap,
  Menu,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Play,
  Download,
  Instagram,
  Facebook,
  Music2,
  PartyPopper,
  Store } from
'lucide-react';
import HeroSereneIllustration from '@/components/illustrations/HeroSereneIllustration';
import HowItWorks from '@/components/onboarding/HowItWorks';
import FeatureIcon from '@/components/illustrations/FeatureIcon';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { trackPixel } from '@/lib/metaPixel';

export default function OnboardingLanguage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isInstallable, isIOS, isStandalone, triggerInstall } = usePWAInstall();

  useEffect(() => {
    document.title = 'UMCIMBI — Plan your ceremony with confidence';
  }, []);

  // Inject FAQPage JSON-LD for SEO
  useEffect(() => {
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is a traditional ceremony in South Africa?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Traditional ceremonies in South Africa vary by culture and include lobola negotiations, umembeso, umemulo, umabo, imbeleko, Xhosa ulwaluko, Venda tshikanda, Sotho lebollo and many more. Each ceremony marks an important life event and brings families together.'
          }
        },
        {
          '@type': 'Question',
          name: 'How do I find vendors for a traditional ceremony in South Africa?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "UMCIMBI is South Africa's first digital marketplace connecting families planning traditional ceremonies with vetted vendors for catering, decor, photography, transport and more — across all cultures and provinces."
          }
        },
        {
          '@type': 'Question',
          name: 'What is lobola?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Lobola is a traditional Southern African custom practised across many cultures including Zulu, Xhosa, Ndebele, Sotho and Venda, where the groom's family negotiates and pays bride wealth to the bride's family, formally joining two families."
          }
        },
        {
          '@type': 'Question',
          name: 'How much do traditional ceremony vendors cost in South Africa?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Costs vary depending on the type of ceremony, vendor category, location and number of guests. UMCIMBI lets you request quotes from multiple vetted vendors so you can compare and choose what works for your budget.'
          }
        },
        {
          '@type': 'Question',
          name: 'Can I book vendors for any South African traditional ceremony on UMCIMBI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. UMCIMBI supports all South African traditional ceremonies regardless of culture or province. Vendors are vetted and you can pay safely through our escrow payment system.'
          }
        }
      ]
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'umcimbi-faq-jsonld';
    script.text = JSON.stringify(faq);
    document.head.appendChild(script);
    return () => {
      document.getElementById('umcimbi-faq-jsonld')?.remove();
    };
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
            <img src="/images/umcimbi-logo.png" alt="UMCIMBI" width="180" height="64" className="h-16 w-auto brightness-0 invert" />
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
            <Link onClick={() => trackPixel('cta_get_started_clicked')} to="/auth?mode=signup" className="hidden sm:inline-flex">
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
            <Link onClick={() => trackPixel('cta_get_started_clicked')} to="/auth?mode=signup" className="block pt-1">
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

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm font-medium text-white/70 backdrop-blur-sm mx-auto md:mx-0 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Now live only in KwaZulu-Natal
            </div>

            <h1 className="text-[2.25rem] sm:text-[2.75rem] lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-white drop-shadow-lg">
              What brings you to UMCIMBI?
            </h1>

            <div className="flex flex-col gap-4 max-w-lg mx-auto md:mx-0 w-full" style={{ textShadow: 'none' }}>
              <button
                onClick={() => scrollTo('organisers')}
                className="group flex items-center gap-4 w-full text-left px-6 py-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm hover:bg-white/15 hover:border-white/30 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <PartyPopper className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary mb-1">For families</p>
                  <p className="text-lg font-semibold text-white">Are you organising a traditional ceremony?</p>
                </div>
                <ArrowRight className="h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              <button
                onClick={() => scrollTo('vendors')}
                className="group flex items-center gap-4 w-full text-left px-6 py-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm hover:bg-white/15 hover:border-white/30 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <Store className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary mb-1">For businesses</p>
                  <p className="text-lg font-semibold text-white">Are you providing vendor services?</p>
                </div>
                <ArrowRight className="h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start" style={{ textShadow: 'none' }}>

              {isInstallable && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={triggerInstall}
                  className="w-full sm:w-auto h-14 text-base font-semibold px-10 rounded-full border-white/30 !text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Add to Home Screen
                </Button>
              )}

              {!isInstallable && isIOS && !isStandalone && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto h-14 text-base font-semibold px-10 rounded-full border-white/30 !text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Add to Home Screen
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="text-sm w-72">
                    Tap the <strong>Share</strong> button (□↑) in Safari, then select <strong>"Add to Home Screen"</strong>
                  </PopoverContent>
                </Popover>
              )}

              {/* TODO: QR code placeholder for desktop users */}
            </div>

          </div>

          <div className="flex justify-center">
            <HeroSereneIllustration />
          </div>
        </div>
      </section>


      {/* ═══ HOW IT WORKS — Light band ═══ */}
      <section id="how" className="py-28 bg-background scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <HowItWorks />
          <div className="text-center mt-12">
            <Link onClick={() => trackPixel('cta_get_started_clicked')} to="/auth?mode=signup">
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
            <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg mb-6">Use your time to plan UMCIMBI. Lose the stress.</h2>
            <Link onClick={() => trackPixel('cta_get_started_clicked')} to="/auth?mode=signup&role=planner">
              <Button size="lg" className="h-13 text-[15px] font-semibold px-10 rounded-full shadow-lg shadow-primary/25">
                Register to start planning
              </Button>
            </Link>
            <p className="text-sm text-white/50 mt-3">Free to join. Takes less than a minute.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
            { icon: ShieldCheck, title: 'Trusted vendors', body: 'Verified profiles and clearer accountability so you book with confidence.' },
            { icon: BarChart3, title: 'Comparable quotes', body: 'Structured offers you can review side-by-side i.e. scope, price, terms.' },
            { icon: LockIcon, title: 'Pay safely online', body: 'Your money is safely held until your ceremony is complete and you confirm delivery. No more cash risk.' }].
            map(({ icon: Icon, title, body }) =>
            <div key={title} className="group rounded-2xl bg-white/[0.07] backdrop-blur-sm border border-white/10 p-7 hover:bg-white/[0.12] hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-5">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-[15px] text-white">{title}</h3>
                <p className="text-sm text-white/55 leading-relaxed mt-2">{body}</p>
              </div>
            )}
          </div>
          <div className="text-center mt-10">
            <Link onClick={() => trackPixel('cta_get_started_clicked')} to="/auth?mode=signup&role=planner">
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
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-foreground">Win better. Work with less back-and-forth.</h2>
              <Link onClick={() => trackPixel('cta_im_a_vendor_clicked')} to="/auth?mode=signup&role=vendor">
                <Button size="lg" className="h-13 text-[15px] font-semibold px-10 rounded-full shadow-lg shadow-primary/25">
                  I'm a vendor — Register
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground/80 mt-3 mb-10">Free to list your business. Approved within 48 hours.</p>
              <div className="space-y-5">
                {[
                { icon: Users, title: 'Get discovered by families', body: 'Show up when families in your category and area are actively searching.' },
                { icon: Zap, title: 'Send quotations easily', body: 'Structured quotes with scope, pricing and terms, sent from your phone in minutes.' },
                { icon: ShieldCheck, title: 'Be verified and trusted', body: 'A verified badge and a real profile build the trust that wins bookings.' },
                { icon: LockIcon, title: 'Stop chasing money', body: 'Escrow protection means you get paid once the ceremony is delivered, not once you\'ve chased an invoice.' }].
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
                <Link onClick={() => trackPixel('cta_im_a_vendor_clicked')} to="/auth?mode=signup&role=vendor">
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


      {/* ═══ FAQ — Dark band ═══ */}
      <section id="faq" className="py-28 bg-[hsl(220_25%_8%)] scroll-mt-20">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Frequently asked questions</h2>
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
            <AccordionItem key={i} value={`faq-${i}`} className="border border-white/10 rounded-2xl px-6 bg-white/5">
                <AccordionTrigger className="text-[15px] font-medium text-white hover:no-underline py-5">{q}</AccordionTrigger>
                <AccordionContent className="text-[15px] text-white/70 leading-relaxed pb-5">{a}</AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </section>


      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[hsl(220_25%_8%)] border-t border-white/5">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <img src="/images/umcimbi-logo.png" alt="UMCIMBI" className="h-7" />
          <div className="flex items-center gap-4">
            <a href="https://instagram.com/umcimbi.official" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
              <Instagram size={18} />
            </a>
            <a href="https://facebook.com/umcimbi.official" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
              <Facebook size={18} />
            </a>
            <a href="https://tiktok.com/@umcimbi.official" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
              <Music2 size={18} />
            </a>
          </div>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} UMCIMBI · <Link to="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link> · <Link to="/terms" className="hover:text-white/60 transition-colors">Terms</Link> · <Link to="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
          </p>
        </div>
        <div className="mx-auto max-w-6xl px-5 sm:px-8 pb-6 text-center sm:text-right">
          <p className="text-[11px] text-white/30">
            Currently live in KwaZulu-Natal · expanding province by province.
          </p>
        </div>
      </footer>
    </div>);

}
