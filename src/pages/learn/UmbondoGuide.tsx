import { PageHeader } from '@/components/layout/PageHeader';

export default function UmbondoGuide() {
  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Umbondo Guide" showBack />
      <div className="px-4 py-6 max-w-lg mx-auto prose prose-sm">
        <h2 className="text-lg font-semibold">What is Umbondo?</h2>
        <p className="text-muted-foreground">Umbondo is the ceremony where the bride's family presents gifts, primarily groceries, to the groom's family as a gesture of appreciation.</p>
        
        <h2 className="text-lg font-semibold mt-6">Key Elements</h2>
        <ul className="text-muted-foreground space-y-2">
          <li>Groceries are purchased in bulk</li>
          <li>Items are transported to the groom's home</li>
          <li>The bride's family presents the gifts formally</li>
        </ul>
        
        <p className="text-muted-foreground mt-6 text-sm italic">More detailed content coming soon.</p>
      </div>
    </div>
  );
}
