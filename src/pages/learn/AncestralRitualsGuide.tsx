import { PageHeader } from '@/components/layout/PageHeader';

export default function AncestralRitualsGuide() {
  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Ancestral Rituals" showBack />
      <div className="px-4 py-6 max-w-lg mx-auto prose prose-sm">
        <h2 className="text-lg font-semibold">Understanding Ancestral Rituals</h2>
        <p className="text-muted-foreground">Ancestral rituals, cleansings, and consultations are spiritual practices that maintain the connection between the living and ancestors.</p>
        
        <h2 className="text-lg font-semibold mt-6">Types of Rituals</h2>
        <ul className="text-muted-foreground space-y-2">
          <li>Cleansing ceremonies</li>
          <li>Consultations with traditional healers</li>
          <li>Thanksgiving rituals</li>
          <li>Protective ceremonies</li>
        </ul>
        
        <p className="text-muted-foreground mt-6 text-sm italic">More detailed content coming soon.</p>
      </div>
    </div>
  );
}
