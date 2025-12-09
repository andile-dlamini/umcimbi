import { PageHeader } from '@/components/layout/PageHeader';

export default function ImbelekoGuide() {
  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Imbeleko Basics" showBack />
      <div className="px-4 py-6 max-w-lg mx-auto prose prose-sm">
        <h2 className="text-lg font-semibold">What is Imbeleko?</h2>
        <p className="text-muted-foreground">Imbeleko is a traditional Zulu ceremony that introduces a child to the ancestors and formally welcomes them into the family lineage.</p>
        
        <h2 className="text-lg font-semibold mt-6">Purpose</h2>
        <p className="text-muted-foreground">The ceremony establishes a spiritual connection between the child and their ancestors, ensuring protection and guidance throughout their life.</p>
        
        <h2 className="text-lg font-semibold mt-6">Key Elements</h2>
        <ul className="text-muted-foreground space-y-2">
          <li>A goat or sheep is typically slaughtered as an offering</li>
          <li>An elder or traditional healer leads the ceremony</li>
          <li>Close family members gather at the homestead</li>
          <li>The child is presented to the ancestors with prayers</li>
        </ul>
        
        <p className="text-muted-foreground mt-6 text-sm italic">More detailed content coming soon.</p>
      </div>
    </div>
  );
}
