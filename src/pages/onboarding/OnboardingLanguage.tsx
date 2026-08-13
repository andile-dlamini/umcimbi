import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';
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
  Menu,
  ArrowRight,
  Download,
  Instagram,
  Facebook,
  Music2,
  PartyPopper,
  Store,
  Search,
  Shirt,
  UtensilsCrossed,
  Snowflake,
  Sparkles,
  CalendarCheck,
  Droplets,
  Camera,
  Tent,
  MoreHorizontal } from
'lucide-react';
import HeroSereneIllustration from '@/components/illustrations/HeroSereneIllustration';
import HowItWorks from '@/components/onboarding/HowItWorks';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { trackPixel } from '@/lib/metaPixel';
import {
  LIVE_VENDOR_CATEGORIES,
  LIVE_VENDOR_CATEGORY_FILTER_OPTIONS,
  VendorCategory } from
'@/lib/vendorCategories';

const CATEGORY_ICONS: Partial<Record<VendorCategory, typeof Camera>> = {
  attire_tailoring: Shirt,
  catering: UtensilsCrossed,
  cold_room_hire: Snowflake,
  decor: Sparkles,
  dj_sound_audio: Music2,
  event_planning: CalendarCheck,
  mobile_toilets: Droplets,
  photographer: Camera,
  tents: Tent
};


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

  const handleVendorSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchCategory !== 'all') params.set('category', searchCategory);
    if (searchLocation.trim()) params.set('location', searchLocation.trim());
    const qs = params.toString();
    navigate(qs ? `/vendors?${qs}` : '/vendors');
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

        {/* Mobile utility strip — pinned inside the fixed header */}
        <div className="md:hidden bg-[hsl(20_75%_45%)] text-white text-[12px] py-1.5 px-4 text-center">
          Are you a vendor?{' '}
          <Link to="/join/vendor" className="underline font-semibold inline-flex items-center gap-0.5">
            Become a Vendor <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 sm:px-8 h-16">
          <div className="flex items-center gap-2.5">
            <img src="/images/umcimbi-logo.png" alt="UMCIMBI" width="180" height="96" className="h-20 sm:h-24 w-auto brightness-0 invert" />
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('how')} className="text-[15px] font-semibold text-white/90 hover:text-white transition-colors">
              How it Works
            </button>
            <Link to="/vendors" className="text-[15px] font-semibold text-white/90 hover:text-white transition-colors">
              Organisers
            </Link>
            <Link to="/join/vendor" className="text-[15px] font-semibold text-white/90 hover:text-white transition-colors">
              Vendors
            </Link>
            <button onClick={() => scrollTo('faq')} className="text-[15px] font-semibold text-white/90 hover:text-white transition-colors">
              FAQ
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link to="/join/vendor" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm" className="text-[13px] rounded-full border-white/30 !text-white bg-white/5 hover:bg-white/15">
                Become a Vendor
              </Button>
            </Link>
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
            <button onClick={() => scrollTo('how')} className="block w-full text-left text-sm py-2.5 text-white/80 hover:text-white">How it Works</button>
            <Link to="/vendors" onClick={() => setMobileMenuOpen(false)} className="block w-full text-left text-sm py-2.5 text-white/80 hover:text-white">Organisers</Link>
            <Link to="/join/vendor" onClick={() => setMobileMenuOpen(false)} className="block w-full text-left text-sm py-2.5 text-white/80 hover:text-white">Vendors</Link>
            <button onClick={() => scrollTo('faq')} className="block w-full text-left text-sm py-2.5 text-white/80 hover:text-white">FAQ</button>
            <Link onClick={() => { trackPixel('cta_get_started_clicked'); setMobileMenuOpen(false); }} to="/auth?mode=signup" className="block pt-1">
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
                onClick={() => navigate('/join/vendor')}
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
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">For Organisers</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg mb-4">Your traditional ceremony planning starts here</h2>
            <p className="text-[15px] text-white/75 max-w-2xl mx-auto">
              Find vetted vendors, ask for quotations, compare quotations, book and pay online.
            </p>
          </div>

          <form
            onSubmit={handleVendorSearch}
            className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
            <Select value={searchCategory} onValueChange={(v) => setSearchCategory(v as VendorCategory | 'all')}>
              <SelectTrigger className="sm:flex-1">
                <SelectValue placeholder="Categories" />
              </SelectTrigger>
              <SelectContent>
                {LIVE_VENDOR_CATEGORY_FILTER_OPTIONS.map((opt) =>
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Input
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Durban"
              className="sm:flex-1" />

            <Button type="submit" className="rounded-full px-8 font-semibold">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          <div className="mt-14">
            <h3 className="text-center text-xl sm:text-2xl font-bold text-white mb-8">Explore vendors by category</h3>
            <div className="grid grid-cols-3 lg:grid-cols-9 gap-5">
              {LIVE_VENDOR_CATEGORIES.filter((c) => c.value !== 'other').map((cat) => {
                const Icon = CATEGORY_ICONS[cat.value] ?? MoreHorizontal;
                return (
                  <button
                    key={cat.value}
                    onClick={() => navigate(`/vendors?category=${cat.value}`)}
                    className="group flex flex-col items-center gap-2 text-center">
                    <span className="w-16 h-16 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/25 transition-colors">
                      <Icon className="h-7 w-7 text-secondary" />
                    </span>
                    <span className="text-[12px] leading-tight text-white/85">{cat.label}</span>
                  </button>);

              })}
            </div>
          </div>

          <p className="text-sm text-white/50 mt-12 text-center">Free to join. Takes less than a minute.</p>
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
