import { Share2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function UmaboGuide() {
  const navigate = useNavigate();

  const shareUrl = `https://wa.me/?text=${encodeURIComponent(
    'Learn about Umabo - the Zulu traditional wedding! Check out this guide on Isiko Planner.'
  )}`;

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/learn')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Umabo Guide</h1>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </a>
        </div>
      </div>

      {/* Content */}
      <article className="px-4 py-6 max-w-lg mx-auto prose prose-slate">
        <div className="bg-accent/10 rounded-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-foreground mt-0">What is Umabo?</h2>
          <p className="text-muted-foreground mb-0">
            Umabo is the Zulu traditional wedding ceremony. It marks the official transition of 
            the bride into her husband's family and is celebrated with elaborate rituals, feasting, 
            and dancing that can last an entire day or more.
          </p>
        </div>

        <h3 className="text-lg font-semibold text-foreground">Prerequisites</h3>
        <p className="text-muted-foreground">
          Before Umabo can take place, the following must be completed:
        </p>
        <ul className="text-muted-foreground space-y-2">
          <li><strong>Lobola negotiations</strong> – The bride price discussions</li>
          <li><strong>Umembeso</strong> – Gift-giving ceremony by groom's family</li>
          <li><strong>Umbondo</strong> – Bride's family presents groceries to groom's family</li>
        </ul>

        <h3 className="text-lg font-semibold text-foreground">Key Elements</h3>
        
        <h4 className="font-medium text-foreground">Ukucimela (Early Morning)</h4>
        <p className="text-muted-foreground">
          The bride wakes before dawn for special rituals. She may cry as part of the ceremony, 
          symbolizing the emotional farewell to her maiden life.
        </p>

        <h4 className="font-medium text-foreground">Inkomo (Livestock)</h4>
        <p className="text-muted-foreground">
          A cow or goat is slaughtered early in the morning. The bile (inyongo) from the animal 
          is used to bless the bride, and the meat is prepared for the feast.
        </p>

        <h4 className="font-medium text-foreground">Imvunulo (Traditional Attire)</h4>
        <p className="text-muted-foreground">
          The bride wears various outfits throughout the day, including:
        </p>
        <ul className="text-muted-foreground space-y-1">
          <li>Isidwaba – Traditional leather skirt</li>
          <li>Isicwaya – Goatskin top piece</li>
          <li>Inkehli – Headpiece showing married status</li>
          <li>Beaded accessories</li>
        </ul>

        <h4 className="font-medium text-foreground">Umshado (The Main Ceremony)</h4>
        <p className="text-muted-foreground">
          The bride is formally introduced to the groom's ancestors. She is given a new name by 
          her in-laws, symbolizing her new identity as part of their family.
        </p>

        <h3 className="text-lg font-semibold text-foreground">What You'll Need</h3>
        <ul className="text-muted-foreground space-y-2">
          <li><strong>Venue</strong> – Usually the groom's family homestead</li>
          <li><strong>Tents & seating</strong> – For guests (often 100-300+ people)</li>
          <li><strong>Catering</strong> – Traditional food: meat, pap, vegetables, umqombothi</li>
          <li><strong>Livestock</strong> – For slaughter and rituals</li>
          <li><strong>Decor</strong> – Traditional and modern decorations</li>
          <li><strong>Sound system</strong> – For music and announcements</li>
          <li><strong>Traditional attire</strong> – For bride, groom, and families</li>
        </ul>

        <h3 className="text-lg font-semibold text-foreground">Timeline Example</h3>
        <ol className="text-muted-foreground space-y-2">
          <li><strong>5:00 AM</strong> – Bride's early morning rituals</li>
          <li><strong>6:00 AM</strong> – Livestock slaughter</li>
          <li><strong>8:00 AM</strong> – Bride preparation</li>
          <li><strong>10:00 AM</strong> – Main ceremony begins</li>
          <li><strong>12:30 PM</strong> – Feast served</li>
          <li><strong>2:00 PM</strong> – Gift presentations</li>
          <li><strong>3:00 PM</strong> – Dancing and celebrations</li>
          <li><strong>Evening</strong> – Celebrations continue</li>
        </ol>

        <div className="bg-primary/10 rounded-2xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-foreground mt-0">Budget Considerations</h3>
          <p className="text-muted-foreground mb-0">
            Umabo can be a significant investment. Plan for tents (R5,000-R15,000), 
            catering (R150-R300 per person), livestock (R8,000-R20,000 per cow), 
            decor, attire, and entertainment. Starting your planning 6-12 months 
            ahead gives you time to budget and save.
          </p>
        </div>
      </article>
    </div>
  );
}
