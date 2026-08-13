import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ShieldCheck,
  Lock as LockIcon,
  Users,
  Zap,
  Menu,
  Instagram,
  Facebook,
  Music2,
} from 'lucide-react';
import HowItWorks from '@/components/onboarding/HowItWorks';
import { supabase } from '@/integrations/supabase/client';
import { getVendorCategoryLabel } from '@/lib/vendorCategories';
import { trackPixel } from '@/lib/metaPixel';

interface DirectoryVendor {
  id: string;
  name: string;
  category: string;
  location: string | null;
  logo_url: string | null;
  image_urls: string[] | null;
}

const VENDOR_BENEFITS = [
  { icon: Users, title: 'Get discovered by families', body: 'Show up when families in your category and area are actively searching.' },
  { icon: Zap, title: 'Send quotations easily', body: 'Structured quotes with scope, pricing and terms, sent from your phone in minutes.' },
  { icon: ShieldCheck, title: 'Be verified and trusted', body: 'A verified badge and a real profile build the trust that wins bookings.' },
  { icon: LockIcon, title: 'Stop chasing money', body: 'Escrow protection means you get paid once the ceremony is delivered, not once you\'ve chased an invoice.' },
];

const FAQ_ITEMS = [
  { q: 'What is UMCIMBI?', a: 'UMCIMBI is a platform that helps you plan traditional South African ceremonies by connecting you with trusted, verified vendors. You can request quotes, compare options, and manage your entire ceremony plan in one place.' },
  { q: 'Is it free?', a: 'Creating an account and browsing vendors is free for organisers. Vendors can join and respond to requests at no cost during our launch period.' },
  { q: 'How do quotes work?', a: 'You submit a service request describing what you need. Vendors respond with structured quotes including scope, pricing, and terms — making it easy to compare.' },
  { q: 'How do vendors get verified?', a: 'Vendors can submit verification documents including business registration, proof of address, and bank confirmation. Our team reviews submissions to ensure accountability.' },
  { q: 'Can organisers and vendors use the same account?', a: 'Yes! You can register as an organiser and later add a vendor profile to the same account.' },
];

export default function VendorLandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');
  const signupHref = `/auth?mode=signup&role=vendor${ref ? `&ref=${ref}` : ''}`;

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vendors, setVendors] = useState<DirectoryVendor[]>([]);

  useEffect(() => {
    document.title = 'UMCIMBI — Join as a vendor';
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

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from('vendors_directory_public')
        .select('id,name,category,location,logo_url,image_urls')
        .order('is_super_vendor', { ascending: false, nullsFirst: false })
        .order('review_count', { ascending: false, nullsFirst: false })
        .limit(4);
      if (!error && data) setVendors(data as DirectoryVendor[]);
    })();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundImage: 'none' }}>
      {/* ── MOBILE UTILITY STRIP ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-[hsl(20_75%_40%)] text-white text-[12px] py-1.5 text-center">
        Are you a vendor?{' '}
        <Link to="/onboarding" className="underline font-semibold">Planning a ceremony?</Link>
      </div>

      {/* ── NAV ── */}
      <header
        className={`fixed top-7 md:top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[hsl(220_25%_12%/0.95)] backdrop-blur-md border-b border-[hsl(0_0%_100%/0.08)] shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between px-5 sm:px-8 h-16">
          <Link to="/onboarding" className="flex items-center gap-2.5">
            <img src="/images/umcimbi-logo.png" alt="UMCIMBI" width="180" height="64" className="h-16 w-auto brightness-0 invert" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('how')} className="text-[13px] text-white/60 hover:text-white transition-colors">How it Works</button>
            <button onClick={() => scrollTo('faq')} className="text-[13px] text-white/60 hover:text-white transition-colors">FAQ</button>
            <Link to="/onboarding" className="text-[13px] text-white/60 hover:text-white transition-colors">Planning a ceremony?</Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link to="/auth?mode=login">
              <Button variant="ghost" size="sm" className="text-[13px] text-white/80 hover:text-white hover:bg-white/10">Login</Button>
            </Link>
            <Link onClick={() => trackPixel('cta_get_started_clicked')} to={signupHref} className="hidden sm:inline-flex">
              <Button size="sm" className="text-[13px] font-semibold rounded-full px-5 shadow-md shadow-primary/15">Register</Button>
            </Link>
            <button className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[hsl(220_25%_12%/0.97)] backdrop-blur-md px-5 py-3 space-y-1">
            <button onClick={() => scrollTo('how')} className="block w-full text-left text-sm py-2.5 text-white/60 hover:text-white">How it Works</button>
            <button onClick={() => scrollTo('faq')} className="block w-full text-left text-sm py-2.5 text-white/60 hover:text-white">FAQ</button>
            <Link to="/onboarding" className="block text-sm py-2.5 text-white/60 hover:text-white">Planning a ceremony?</Link>
            <Link onClick={() => trackPixel('cta_get_started_clicked')} to={signupHref} className="block pt-1">
              <Button size="sm" className="w-full rounded-full">Register</Button>
            </Link>
          </div>
        )}
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/vendors-bg2.jpg)' }}
        />
        <div className="absolute inset-0 bg-[hsl(220_25%_6%/0.66)]" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[hsl(220_25%_8%/0.7)] to-transparent" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-28 pb-16 w-full">
          <div className="max-w-2xl space-y-7 text-center md:text-left" style={{ textShadow: '0 2px 20px hsl(220 25% 6% / 0.5)' }}>
            <p className="text-sm font-semibold text-secondary uppercase tracking-wider">For Vendors</p>
            <h1 className="text-[2.25rem] sm:text-[2.75rem] lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-white drop-shadow-lg">
              Join the fastest-growing traditional ceremony platform
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              UMCIMBI lets you get discovered by families planning their traditional ceremonies, you create professional quotes in minutes and you get paid directly in your bank account.
            </p>
            <div style={{ textShadow: 'none' }}>
              <Link onClick={() => trackPixel('cta_im_a_vendor_clicked')} to={signupHref}>
                <Button size="lg" className="h-14 text-base font-semibold px-10 rounded-full shadow-lg shadow-primary/25">
                  Create your free profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ALREADY LISTED ═══ */}
      {vendors.length > 0 && (
        <section className="py-24 bg-background">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">See who is already listed</h2>
            <p className="text-muted-foreground mt-3">
              Vendors across KwaZulu-Natal are already taking bookings on UMCIMBI.
            </p>

            <div className="mt-10 flex gap-5 overflow-x-auto pb-4 -mx-5 px-5 sm:mx-0 sm:px-0">
              {vendors.map((v) => {
                const image = v.image_urls?.[0] || v.logo_url;
                return (
                  <button
                    key={v.id}
                    onClick={() => navigate('/vendors')}
                    className="group text-left shrink-0 w-60 rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all"
                  >
                    <div className="h-40 w-full bg-muted overflow-hidden">
                      {image ? (
                        <img src={image} alt={v.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <span className="text-2xl font-bold text-muted-foreground">
                            {v.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground truncate">{v.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {getVendorCategoryLabel(v.category as never)}{v.location ? ` · ${v.location}` : ''}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <Link to="/vendors">
                <Button variant="outline" size="lg" className="rounded-full px-8">See the full directory</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ BENEFITS ═══ */}
      <section
        className="relative py-28 overflow-hidden bg-background"
        style={{
          '--primary': '20 75% 40%',
          '--accent': '20 65% 50%',
        } as React.CSSProperties}
      >
        <div className="relative mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">For Vendors</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-foreground">Win better. Work with less back-and-forth.</h2>

          <div className="space-y-5">
            {VENDOR_BENEFITS.map(({ icon: Icon, title, body }) => (
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
            ))}
          </div>

          <div className="mt-10">
            <Link onClick={() => trackPixel('cta_im_a_vendor_clicked')} to={signupHref}>
              <Button size="lg" className="h-13 text-[15px] font-semibold px-10 rounded-full shadow-lg shadow-primary/25">
                I'm a vendor — Register
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground/80 mt-3">Free to list your business. Approved within 48 hours.</p>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="scroll-mt-20">
        <HowItWorks />
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="py-28 bg-[hsl(220_25%_8%)] scroll-mt-20">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Frequently asked questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ_ITEMS.map(({ q, a }, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-white/10 rounded-2xl px-6 bg-white/5">
                <AccordionTrigger className="text-[15px] font-medium text-white hover:no-underline py-5">{q}</AccordionTrigger>
                <AccordionContent className="text-[15px] text-white/70 leading-relaxed pb-5">{a}</AccordionContent>
              </AccordionItem>
            ))}
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
    </div>
  );
}
