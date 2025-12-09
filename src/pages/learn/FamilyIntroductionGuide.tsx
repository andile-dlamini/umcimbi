import { PageHeader } from '@/components/layout/PageHeader';

export default function FamilyIntroductionGuide() {
  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Family Introduction" showBack />
      <div className="px-4 py-6 max-w-lg mx-auto prose prose-sm">
        <h2 className="text-lg font-semibold">Ukucela / Ukumisa isizwe</h2>
        <p className="text-muted-foreground">The family introduction is a formal meeting between two families, typically the first step in the traditional marriage process.</p>
        
        <h2 className="text-lg font-semibold mt-6">Purpose</h2>
        <p className="text-muted-foreground">This ceremony allows both families to meet, discuss intentions, and establish a relationship before proceeding with further ceremonies.</p>
        
        <h2 className="text-lg font-semibold mt-6">What to Expect</h2>
        <ul className="text-muted-foreground space-y-2">
          <li>Delegations from both families meet formally</li>
          <li>Elders lead the discussions</li>
          <li>Small gifts or tokens may be exchanged</li>
          <li>Key expectations are discussed</li>
        </ul>
        
        <p className="text-muted-foreground mt-6 text-sm italic">More detailed content coming soon.</p>
      </div>
    </div>
  );
}
