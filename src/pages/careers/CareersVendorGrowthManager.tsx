// PHASE 3: form submits via the submit-job-application edge function,
// which inserts into job_applications and sends an acknowledgment email.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, Clock, Coins, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const WORD_LIMIT = 100;
const normalisePhone = (value: string) => {
  const compact = value.trim().replace(/[\s()-]/g, '');
  return compact.startsWith('0') ? `+27${compact.slice(1)}` : compact;
};
const applicationSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(200, 'Your name is too long.'),
  email: z.string().trim().email('Please enter a valid email address.').max(255),
  phone: z.string().trim().transform(normalisePhone).refine(
    value => /^\+27[6-8]\d{8}$/.test(value),
    'Please enter a valid South African mobile number.',
  ),
  story: z.string().trim().min(1, 'Please share your story.').max(5000).refine(
    value => value.split(/\s+/).length <= WORD_LIMIT,
    `Your story must be ${WORD_LIMIT} words or fewer.`,
  ),
  socials: z.string().trim().min(1, 'Please add at least one social media handle.').max(500),
});

export default function CareersVendorGrowthManager() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [story, setStory] = useState('');
  const [socials, setSocials] = useState('');

  const wordCount = story.trim() ? story.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > WORD_LIMIT;

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Vendor Growth Manager (Commission-Based) | Careers at UMCIMBI';

    // JobPosting structured data for Google for Jobs
    const jobPosting = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: 'Vendor Growth Manager (Commission-Based)',
      description:
        "UMCIMBI is a digital marketplace connecting South African families planning traditional ceremonies with vetted vendors. We're looking for a driven, commission-based Vendor Growth Manager to identify, contact and onboard event and ceremony vendors in and around eThekwini and PMB, from first contact through to a completed, active profile. This is a flexible, 100% commission-based role tied to real outcomes rather than hours worked. It is ideal for a student or early-career professional who wants real sales and business development experience with an early-stage startup. No CV required to apply.",
      datePosted: '2026-09-17',
      validThrough: '2026-12-31T00:00:00+02:00',
      employmentType: 'CONTRACTOR',
      hiringOrganization: {
        '@type': 'Organization',
        name: 'UMCIMBI',
        sameAs: 'https://umcimbi.co.za',
        logo: 'https://umcimbi.co.za/images/umcimbi-logo.png',
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'eThekwini',
          addressRegion: 'KwaZulu-Natal',
          addressCountry: 'ZA',
        },
      },
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'umcimbi-careers-jobposting-jsonld';
    script.text = JSON.stringify(jobPosting);
    document.head.appendChild(script);
    return () => {
      document.getElementById('umcimbi-careers-jobposting-jsonld')?.remove();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = applicationSchema.safeParse({ name, email, phone, story, socials });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your application details.');
      return;
    }
    setSubmitting(true);
    try {
      const { error: fnError } = await supabase.functions.invoke('submit-job-application', {
        body: { role_slug: 'vendor-growth-manager', ...parsed.data },
      });
      if (fnError) throw fnError;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError('Something went wrong sending your application. Please try again, or email andile@umcimbi.co.za directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(220_25%_7%)] text-white">
      {/* Header */}
      <header className="mx-auto max-w-3xl px-5 sm:px-8 pt-8 flex items-center justify-between">
        <img src="/images/umcimbi-logo.png" alt="UMCIMBI" className="h-7" />
        <Link to="/onboarding#careers">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
        </Link>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-lg px-5 sm:px-8 py-16">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
            Careers · Commission-Based
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Growth Manager</h1>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3 text-sm text-white/50">
            <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> eThekwini &amp; PMB</span>
            <span className="inline-flex items-center gap-1.5"><Clock size={14} /> Flexible</span>
            <span className="inline-flex items-center gap-1.5"><Coins size={14} /> Uncapped commission</span>
          </div>
        </div>

        {/* Role description */}
        <div className="space-y-4 text-[15px] text-white/70 leading-relaxed mb-10">
          <p>
            UMCIMBI is a digital marketplace connecting South African families planning traditional
            ceremonies, including Lobola, Umembeso, Umbondo, Umabo and more, with vetted vendors: caterers,
            tent and decor hire, photographers, cold rooms, mobile toilets and more. Launched in May
            2026, UMCIMBI is live in KwaZulu-Natal ahead of national rollout in the near future.
          </p>
          <p>
            We're looking for a driven, people's person to grow UMCIMBI's vendor base starting in and
            around eThekwini and PMB. You'll identify, contact and onboard event and ceremony vendors,
            from first contact through to a completed, active profile on the platform. This is a
            flexible, commission-based role, ideal for a student or early-career professional who wants
            real sales and business development experience with an early-stage startup.
          </p>
        </div>

        {/* What you'll do */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">What you'll do</h2>
          <ul className="space-y-2.5 text-[15px] text-white/70 leading-relaxed">
            <li><strong className="text-white">Recruit.</strong> Reach out by phone, WhatsApp, Facebook or TikTok DM. Visit vendors in person where it helps.</li>
            <li><strong className="text-white">Educate.</strong> Walk vendors through setting up their free profile and using the platform.</li>
            <li><strong className="text-white">Retain.</strong> Follow up until the profile goes live, and be the go-to contact for that vendor.</li>
          </ul>
        </section>

        {/* How you'll be paid */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">How you'll be paid</h2>
          <p className="text-[15px] text-white/70 leading-relaxed">
            This is a 100% commission-based role, tied to real outcomes rather than hours worked.
          </p>
        </section>

        {/* What we're looking for */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">What we're looking for</h2>
          <ul className="space-y-2.5 text-[15px] text-white/70 leading-relaxed list-disc list-inside">
            <li>Based in or near eThekwini (Durban/KZN)</li>
            <li>Confident reaching out to small business owners cold, by phone, WhatsApp and social media</li>
            <li>A self-starter who can work independently between weekly check-ins</li>
            <li>University student or recent graduate welcome</li>
            <li>Prior sales, marketing, community outreach or entrepreneurship experience is a plus, not a requirement</li>
          </ul>
        </section>

        {/* Why work with UMCIMBI */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-3">Why work with UMCIMBI</h2>
          <ul className="space-y-2.5 text-[15px] text-white/70 leading-relaxed list-disc list-inside">
            <li>Real startup experience with an early-stage tech company</li>
            <li>Direct access to the founder for real feedback on your outreach and pitch</li>
            <li>Flexible, so you can work around your studies and set your own hours</li>
            <li>Uncapped earning potential, no ceiling</li>
            <li>Build your own network of business relationships</li>
            <li>Room to grow into bigger, paid roles as UMCIMBI scales nationally</li>
          </ul>
        </section>

        {/* Application form */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardContent className="p-6">
            {submitted ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="mx-auto text-emerald-400" size={40} />
              <h2 className="text-xl font-bold text-white">Thanks, we've got your application.</h2>
              <p className="text-sm text-white/60">We'll be in touch by email either way.</p>
            </div>
            ) : (
            <>
            <h2 className="text-xl font-bold text-white mb-1">Apply</h2>
            <p className="text-sm text-white/50 mb-5">No CV needed. Just answer the one question below.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-white/70 text-xs">Your Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30" placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-white/70 text-xs">Your Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                   maxLength={255} autoComplete="email"
                   className="bg-white/5 border-white/10 text-white placeholder:text-white/30" placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-white/70 text-xs">Your Phone Number</Label>
                <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                  maxLength={20} autoComplete="tel" inputMode="tel"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30" placeholder="e.g. 071 234 5678" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="story" className="text-white/70 text-xs">
                  Tell us about a time you convinced someone to do, buy, or support something.
                  What was stopping them, what did you do, and what happened?
                </Label>
                <p className="text-xs text-white/40 leading-relaxed">
                  Maximum 100 words. Examples from campus, your community, a side hustle, or
                  everyday life all count. Write naturally, we care about what you did, not
                  perfect grammar.
                </p>
                <Textarea id="story" value={story} onChange={e => setStory(e.target.value)} required rows={6}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                <p className={`text-xs text-right ${overLimit ? 'text-red-400' : 'text-white/40'}`}>
                  {wordCount}/{WORD_LIMIT} words
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="socials" className="text-white/70 text-xs">
                  Your social handles
                </Label>
                <p className="text-xs text-white/40 leading-relaxed">
                  Add Instagram, TikTok and Facebook together in this field. Include every account you use.
                </p>
                <Input id="socials" value={socials} onChange={e => setSocials(e.target.value)} required
                  maxLength={500}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30" placeholder="Instagram: @name, TikTok: @name, Facebook: Name" />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <Button type="submit" disabled={overLimit || submitting} className="w-full h-12 rounded-full text-sm font-semibold bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? 'Sending…' : 'Submit Application'}
              </Button>
            </form>
            </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
