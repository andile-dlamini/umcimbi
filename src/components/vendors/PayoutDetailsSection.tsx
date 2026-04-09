import { useState } from 'react';
import { Banknote, Edit2, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const SOUTH_AFRICAN_BANKS = [
  { name: 'ABSA', branchCode: '632005' },
  { name: 'African Bank', branchCode: '430000' },
  { name: 'Capitec Bank', branchCode: '470010' },
  { name: 'Discovery Bank', branchCode: '679000' },
  { name: 'FNB / First National Bank', branchCode: '250655' },
  { name: 'Investec', branchCode: '580105' },
  { name: 'Nedbank', branchCode: '198765' },
  { name: 'Standard Bank', branchCode: '051001' },
  { name: 'TymeBank', branchCode: '678910' },
];

const ACCOUNT_TYPES = ['Current / Cheque', 'Savings', 'Transmission'];

interface PayoutDetailsSectionProps {
  vendor: any;
  onUpdate: (data: Record<string, any>) => Promise<boolean>;
}

export function PayoutDetailsSection({ vendor, onUpdate }: PayoutDetailsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: vendor?.bank_name || '',
    bank_account_holder_name: vendor?.bank_account_holder_name || '',
    bank_account_number: vendor?.bank_account_number || '',
    bank_account_type: vendor?.bank_account_type || '',
    bank_branch_code: vendor?.bank_branch_code || '',
  });

  const hasBankDetails = !!vendor?.bank_name && !!vendor?.bank_account_number && !!vendor?.bank_account_type;

  const maskedAccountNumber = vendor?.bank_account_number
    ? '****' + vendor.bank_account_number.slice(-4)
    : '—';

  const handleBankChange = (bankName: string) => {
    if (bankName === 'Other') {
      setFormData(prev => ({ ...prev, bank_name: '', bank_branch_code: '' }));
    } else {
      const bank = SOUTH_AFRICAN_BANKS.find(b => b.name === bankName);
      setFormData(prev => ({
        ...prev,
        bank_name: bankName,
        bank_branch_code: bank?.branchCode || '',
      }));
    }
  };

  const startEditing = () => {
    setFormData({
      bank_name: vendor?.bank_name || '',
      bank_account_holder_name: vendor?.bank_account_holder_name || '',
      bank_account_number: vendor?.bank_account_number || '',
      bank_account_type: vendor?.bank_account_type || '',
      bank_branch_code: vendor?.bank_branch_code || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.bank_name || !formData.bank_account_number || !formData.bank_account_type) {
      toast.error('Please fill in all required bank details');
      return;
    }
    setIsSaving(true);
    const success = await onUpdate({
      bank_name: formData.bank_name,
      bank_account_holder_name: formData.bank_account_holder_name || null,
      bank_account_number: formData.bank_account_number,
      bank_account_type: formData.bank_account_type,
      bank_branch_code: formData.bank_branch_code,
      payout_method: 'bank_eft',
    });
    setIsSaving(false);
    if (success) setIsEditing(false);
  };

  const selectedBankValue = SOUTH_AFRICAN_BANKS.find(b => b.name === formData.bank_name)
    ? formData.bank_name
    : formData.bank_name
      ? 'Other'
      : undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Payout Details</CardTitle>
            {hasBankDetails && !isEditing && (
              <Badge variant="outline" className="ml-1 text-green-600 border-green-300 bg-green-50">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Payout ready
              </Badge>
            )}
          </div>
          {hasBankDetails && !isEditing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bank name *</Label>
              <Select value={selectedBankValue} onValueChange={handleBankChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  {SOUTH_AFRICAN_BANKS.map(b => (
                    <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                  ))}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {selectedBankValue === 'Other' && (
                <Input
                  placeholder="Enter bank name"
                  value={formData.bank_name}
                  onChange={e => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Account holder name</Label>
              <Input
                placeholder="Name as it appears on account"
                value={formData.bank_account_holder_name}
                onChange={e => setFormData(prev => ({ ...prev, bank_account_holder_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Account number *</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 1234567890"
                value={formData.bank_account_number}
                onChange={e => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Account type *</Label>
              <Select value={formData.bank_account_type} onValueChange={v => setFormData(prev => ({ ...prev, bank_account_type: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Branch code (auto-filled)</Label>
              <Input
                placeholder="e.g. 250655"
                value={formData.bank_branch_code}
                onChange={e => setFormData(prev => ({ ...prev, bank_branch_code: e.target.value }))}
              />
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                Your bank details are used only for EFT payouts via Ozow after service delivery is confirmed. Details are stored securely and never shared with clients.
              </p>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save bank details'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : hasBankDetails ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium">{vendor.bank_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account holder</span>
              <span className="font-medium">{vendor.bank_account_holder_name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account number</span>
              <span className="font-medium">{maskedAccountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account type</span>
              <span className="font-medium">{vendor.bank_account_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Branch code</span>
              <span className="font-medium">{vendor.bank_branch_code || '—'}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              No payout details added yet. Add your bank account to receive payments after service delivery.
            </p>
            <Button variant="outline" onClick={startEditing}>
              Add bank details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
