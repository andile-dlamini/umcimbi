import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Mail, Instagram, Facebook, Music2 } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = `Name: ${name}%0AEmail: ${email}%0A%0A${encodeURIComponent(message)}`;
    window.location.href = `mailto:andile@umcimbi.co.za?subject=${encodeURIComponent(subject)}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-[hsl(220_25%_7%)] text-white">
      {/* Header */}
      <header className="mx-auto max-w-3xl px-5 sm:px-8 pt-8 flex items-center justify-between">
        <img src="/images/umcimbi-logo.png" alt="UMCIMBI" className="h-7" />
        <Link to="/onboarding">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
        </Link>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-lg px-5 sm:px-8 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 mb-4">
            <Mail size={28} className="text-accent" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Get in Touch</h1>
          <p className="text-white/50 mt-2 text-sm">We'd love to hear from you</p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-white/70 text-xs">Your Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30" placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-white/70 text-xs">Your Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30" placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-white/70 text-xs">Subject</Label>
                <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30" placeholder="How can we help?" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-white/70 text-xs">Message</Label>
                <Textarea id="message" value={message} onChange={e => setMessage(e.target.value)} required rows={5}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none" placeholder="Tell us more..." />
              </div>
              <Button type="submit" className="w-full h-12 rounded-full text-sm font-semibold bg-accent text-accent-foreground hover:bg-accent/90">
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Direct email */}
        <div className="text-center mt-8">
          <p className="text-white/40 text-xs mb-1">Or email us directly</p>
          <a href="mailto:andile@umcimbi.co.za" className="text-accent hover:underline text-sm font-medium">
            andile@umcimbi.co.za
          </a>
        </div>
      </main>

      {/* Mini footer */}
      <footer className="border-t border-white/5 mt-8">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 py-8 flex flex-col items-center gap-4">
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
          <p className="text-xs text-white/30">© {new Date().getFullYear()} UMCIMBI</p>
        </div>
      </footer>
    </div>
  );
}
