import { Share2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function CombiningCeremonies() {
  const navigate = useNavigate();

  const shareUrl = `https://wa.me/?text=${encodeURIComponent(
    'How to respectfully combine church and traditional Zulu ceremonies! Check out this guide on Isiko Planner.'
  )}`;

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/learn')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Combining Ceremonies</h1>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </a>
        </div>
      </div>

      {/* Content */}
      <article className="px-4 py-6 max-w-lg mx-auto prose prose-slate">
        <div className="bg-primary/10 rounded-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-foreground mt-0">Honouring Both Traditions</h2>
          <p className="text-muted-foreground mb-0">
            Many couples today celebrate both traditional Zulu ceremonies and church/white weddings. 
            This guide helps you plan respectfully, honouring your culture while embracing modern 
            celebrations.
          </p>
        </div>

        <h3 className="text-lg font-semibold text-foreground">Common Approaches</h3>

        <h4 className="font-medium text-foreground">1. Traditional First, Then Church</h4>
        <p className="text-muted-foreground">
          This is the most common approach. You complete all traditional requirements 
          (lobola, umembeso, umabo) before having a church ceremony.
        </p>
        <ul className="text-muted-foreground space-y-1">
          <li>✓ Respects traditional order of events</li>
          <li>✓ Elders are satisfied before church wedding</li>
          <li>✓ Can spread costs over time</li>
        </ul>

        <h4 className="font-medium text-foreground">2. Same Weekend</h4>
        <p className="text-muted-foreground">
          Some families hold traditional ceremonies on Saturday and the church 
          wedding on Sunday, or vice versa.
        </p>
        <ul className="text-muted-foreground space-y-1">
          <li>✓ Convenient for traveling guests</li>
          <li>✓ One celebration period</li>
          <li>✗ Exhausting for the couple</li>
          <li>✗ Higher logistical complexity</li>
        </ul>

        <h4 className="font-medium text-foreground">3. Blended Ceremony</h4>
        <p className="text-muted-foreground">
          A single day incorporating elements from both traditions. Requires careful 
          planning and agreement from both families.
        </p>
        <ul className="text-muted-foreground space-y-1">
          <li>✓ One event to plan</li>
          <li>✓ Unique and personal</li>
          <li>✗ May not satisfy traditional requirements fully</li>
          <li>✗ Requires family flexibility</li>
        </ul>

        <h3 className="text-lg font-semibold text-foreground">Key Considerations</h3>

        <h4 className="font-medium text-foreground">Family Expectations</h4>
        <p className="text-muted-foreground">
          Have open conversations with elders from both families early in the planning process. 
          Understanding what is non-negotiable for each side helps avoid conflicts.
        </p>

        <h4 className="font-medium text-foreground">Religious Requirements</h4>
        <p className="text-muted-foreground">
          Some churches have specific requirements about traditional ceremonies. Speak with your 
          pastor or priest about their policies and any pre-marriage counseling requirements.
        </p>

        <h4 className="font-medium text-foreground">Budget Allocation</h4>
        <p className="text-muted-foreground">
          Plan your budget to accommodate both ceremonies. Consider:
        </p>
        <ul className="text-muted-foreground space-y-1">
          <li>Lobola (negotiated amount)</li>
          <li>Umembeso gifts</li>
          <li>Umabo costs (venue, catering, attire)</li>
          <li>Church ceremony costs</li>
          <li>White wedding reception</li>
        </ul>

        <h4 className="font-medium text-foreground">Attire</h4>
        <p className="text-muted-foreground">
          You'll likely need different outfits for each ceremony:
        </p>
        <ul className="text-muted-foreground space-y-1">
          <li>Traditional Zulu attire for umabo</li>
          <li>Western wedding dress/suit for church</li>
          <li>Multiple outfit changes if same day</li>
        </ul>

        <h3 className="text-lg font-semibold text-foreground">Sample Timeline</h3>
        <p className="text-muted-foreground">
          For a traditional-first approach spread over several months:
        </p>
        <ol className="text-muted-foreground space-y-2">
          <li><strong>Month 1-2:</strong> Lobola negotiations</li>
          <li><strong>Month 3:</strong> Umembeso ceremony</li>
          <li><strong>Month 4:</strong> Umbondo (bride's family to groom's)</li>
          <li><strong>Month 5:</strong> Umabo (traditional wedding)</li>
          <li><strong>Month 6-12:</strong> Church wedding & reception</li>
        </ol>

        <div className="bg-secondary/10 rounded-2xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-foreground mt-0">Tips for Success</h3>
          <ul className="text-muted-foreground mb-0 space-y-2">
            <li>✓ Start planning early – 12+ months for both ceremonies</li>
            <li>✓ Appoint trusted family liaisons on both sides</li>
            <li>✓ Keep detailed records of all agreements and expenses</li>
            <li>✓ Be flexible and willing to compromise</li>
            <li>✓ Remember: it's about uniting families, not just two people</li>
          </ul>
        </div>
      </article>
    </div>
  );
}
