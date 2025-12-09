import { PageHeader } from '@/components/layout/PageHeader';

export default function UmemuloGuide() {
  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Umemulo Guide" showBack />
      <div className="px-4 py-6 max-w-lg mx-auto prose prose-sm">
        <h2 className="text-lg font-semibold">What is Umemulo?</h2>
        <p className="text-muted-foreground">Umemulo is a coming-of-age ceremony celebrating a young woman's transition to adulthood, honoring her virtue and readiness for marriage.</p>
        
        <h2 className="text-lg font-semibold mt-6">Key Elements</h2>
        <ul className="text-muted-foreground space-y-2">
          <li>A cow is slaughtered for the celebration</li>
          <li>Traditional attire is worn by the celebrant</li>
          <li>Dancing, singing, and feasting take place</li>
          <li>Gifts are given to the young woman</li>
        </ul>
        
        <p className="text-muted-foreground mt-6 text-sm italic">More detailed content coming soon.</p>
      </div>
    </div>
  );
}
