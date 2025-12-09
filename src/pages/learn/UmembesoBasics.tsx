import { Share2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function UmembesoBasics() {
  const navigate = useNavigate();

  const shareUrl = `https://wa.me/?text=${encodeURIComponent(
    'Learn about Umembeso - the Zulu gift-giving ceremony! Check out this guide on Isiko Planner.'
  )}`;

  return (
    <div className="min-h-screen pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/learn')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Umembeso Basics</h1>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </a>
        </div>
      </div>

      {/* Content */}
      <article className="px-4 py-6 max-w-lg mx-auto prose prose-slate">
        <div className="bg-secondary/10 rounded-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-foreground mt-0">What is Umembeso?</h2>
          <p className="text-muted-foreground mb-0">
            Umembeso is a significant Zulu ceremony where the groom's family presents gifts to the 
            bride's family. It represents the groom's appreciation and gratitude towards the bride's 
            family for raising his future wife.
          </p>
        </div>

        <h3 className="text-lg font-semibold text-foreground">When does it happen?</h3>
        <p className="text-muted-foreground">
          Umembeso typically takes place after lobola negotiations have been completed. It's one of 
          the final steps before the traditional wedding (Umabo) can proceed. Some families choose 
          to hold it a few weeks or months before the wedding.
        </p>

        <h3 className="text-lg font-semibold text-foreground">The Gift List</h3>
        <p className="text-muted-foreground">
          The gifts presented during Umembeso are carefully selected and carry deep meaning. 
          Common gifts include:
        </p>
        <ul className="text-muted-foreground space-y-2">
          <li><strong>Izingubo (Blankets)</strong> – For the bride's mother, aunts, and female elders</li>
          <li><strong>Izimpahla (Clothing)</strong> – Fabric, dresses, and traditional attire</li>
          <li><strong>Izicathulo (Shoes)</strong> – For various family members</li>
          <li><strong>Imali (Money)</strong> – Cash gifts for specific family members</li>
          <li><strong>Groceries</strong> – Food items for the celebration</li>
        </ul>

        <h3 className="text-lg font-semibold text-foreground">The Ceremony Flow</h3>
        <ol className="text-muted-foreground space-y-2">
          <li><strong>Arrival</strong> – The groom's family arrives at the bride's homestead</li>
          <li><strong>Formal greeting</strong> – A spokesperson announces their arrival and purpose</li>
          <li><strong>Gift presentation</strong> – Gifts are presented one by one, often with singing</li>
          <li><strong>Acceptance</strong> – The bride's family accepts and acknowledges the gifts</li>
          <li><strong>Celebration</strong> – Food, singing, and dancing follow</li>
        </ol>

        <h3 className="text-lg font-semibold text-foreground">Planning Tips</h3>
        <ul className="text-muted-foreground space-y-2">
          <li>Start gift shopping 2-3 months in advance</li>
          <li>Consult with elders on both sides about expectations</li>
          <li>Keep a detailed list of recipients and gifts</li>
          <li>Arrange transport for gifts and the delegation</li>
          <li>Coordinate catering for the celebration meal</li>
        </ul>

        <div className="bg-accent/10 rounded-2xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-foreground mt-0">Cultural Significance</h3>
          <p className="text-muted-foreground mb-0">
            Umembeso strengthens the bond between two families. It shows the groom's family's 
            commitment and their ability to care for their new daughter-in-law. The ceremony 
            also allows both families to celebrate together before the wedding day.
          </p>
        </div>
      </article>
    </div>
  );
}
