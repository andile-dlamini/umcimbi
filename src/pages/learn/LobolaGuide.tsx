import { PageHeader } from '@/components/layout/PageHeader';

export default function LobolaGuide() {
  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Lobola Overview" showBack />
      <div className="px-4 py-6 max-w-lg mx-auto prose prose-sm">
        <h2 className="text-lg font-semibold">What is Lobola?</h2>
        <p className="text-muted-foreground">Lobola is the traditional bridewealth negotiation between families, representing respect and appreciation for the bride and her family.</p>
        
        <h2 className="text-lg font-semibold mt-6">The Process</h2>
        <ul className="text-muted-foreground space-y-2">
          <li>Family representatives (amakhosi) are selected</li>
          <li>Formal negotiations take place at the bride's home</li>
          <li>Terms are discussed respectfully</li>
          <li>Agreements are documented</li>
        </ul>
        
        <p className="text-muted-foreground mt-6 text-sm italic">More detailed content coming soon.</p>
      </div>
    </div>
  );
}
