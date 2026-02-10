import { useState, useEffect } from 'react';
import { BadgeCheck, XCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';

interface PendingVendor {
  id: string;
  name: string;
  registered_business_name: string | null;
  registration_number: string | null;
  vat_number: string | null;
  created_at: string;
}

interface VerificationDoc {
  id: string;
  vendor_id: string;
  doc_type: string;
  file_url: string;
  status: string;
}

export default function VendorVerificationQueue() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<PendingVendor[]>([]);
  const [docs, setDocs] = useState<Record<string, VerificationDoc[]>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    const { data: vendorData } = await supabase
      .from('vendors')
      .select('id, name, registered_business_name, registration_number, vat_number, created_at')
      .eq('business_verification_status', 'pending')
      .order('created_at', { ascending: true });

    setVendors((vendorData || []) as PendingVendor[]);

    if (vendorData && vendorData.length > 0) {
      const vendorIds = vendorData.map(v => v.id);
      const { data: docData } = await supabase
        .from('vendor_verification_documents')
        .select('*')
        .in('vendor_id', vendorIds);

      const grouped: Record<string, VerificationDoc[]> = {};
      (docData || []).forEach((d: any) => {
        if (!grouped[d.vendor_id]) grouped[d.vendor_id] = [];
        grouped[d.vendor_id].push(d as VerificationDoc);
      });
      setDocs(grouped);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (vendorId: string) => {
    const { error } = await supabase
      .from('vendors')
      .update({
        business_verification_status: 'verified',
        verification_reviewed_at: new Date().toISOString(),
        verification_reviewed_by: user?.id,
      } as any)
      .eq('id', vendorId);

    if (error) {
      toast.error('Failed to approve');
    } else {
      toast.success('Vendor approved');
      setVendors(prev => prev.filter(v => v.id !== vendorId));
    }
  };

  const handleReject = async (vendorId: string) => {
    const notes = rejectNotes[vendorId] || '';
    if (!notes.trim()) {
      toast.error('Please provide rejection notes');
      return;
    }
    const { error } = await supabase
      .from('vendors')
      .update({
        business_verification_status: 'rejected',
        verification_reviewed_at: new Date().toISOString(),
        verification_reviewed_by: user?.id,
      } as any)
      .eq('id', vendorId);

    if (error) {
      toast.error('Failed to reject');
    } else {
      toast.success('Vendor rejected');
      setVendors(prev => prev.filter(v => v.id !== vendorId));
    }
  };

  const docTypeLabels: Record<string, string> = {
    cipc_registration: 'CIPC Registration',
    proof_of_address: 'Proof of Address',
    bank_confirmation: 'Bank Confirmation',
    vat_certificate: 'VAT Certificate',
    other: 'Other',
  };

  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader title="Verification Queue" showBack />
      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12">
            <BadgeCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pending verifications</p>
          </div>
        ) : (
          vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardHeader>
                <CardTitle className="text-base">{vendor.name}</CardTitle>
                {vendor.registered_business_name && (
                  <p className="text-sm text-muted-foreground">
                    Reg: {vendor.registered_business_name} • {vendor.registration_number}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Documents */}
                {docs[vendor.id]?.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs">
                      {docTypeLabels[doc.doc_type] || doc.doc_type}
                    </Badge>
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
                {(!docs[vendor.id] || docs[vendor.id].length === 0) && (
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                )}

                {/* Rejection notes */}
                <Textarea
                  placeholder="Rejection notes (required to reject)..."
                  value={rejectNotes[vendor.id] || ''}
                  onChange={(e) => setRejectNotes(prev => ({ ...prev, [vendor.id]: e.target.value }))}
                  rows={2}
                />

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleApprove(vendor.id)}>
                    <BadgeCheck className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleReject(vendor.id)}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
