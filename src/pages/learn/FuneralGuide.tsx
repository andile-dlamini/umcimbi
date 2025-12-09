import { PageHeader } from '@/components/layout/PageHeader';

export default function FuneralGuide() {
  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Funeral Planning" showBack />
      <div className="px-4 py-6 max-w-lg mx-auto prose prose-sm">
        <h2 className="text-lg font-semibold">Umngcwabo Traditions</h2>
        <p className="text-muted-foreground">Traditional Zulu funerals combine cultural customs with respectful mourning practices to honor the deceased and support the family.</p>
        
        <h2 className="text-lg font-semibold mt-6">Planning Considerations</h2>
        <ul className="text-muted-foreground space-y-2">
          <li>Working with funeral parlours</li>
          <li>Coordinating with spiritual leaders</li>
          <li>Arranging tents and catering</li>
          <li>Preparing the funeral program</li>
        </ul>
        
        <p className="text-muted-foreground mt-6 text-sm italic">More detailed content coming soon.</p>
      </div>
    </div>
  );
}
