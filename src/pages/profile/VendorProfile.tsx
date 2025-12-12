import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, Mail, Globe, MessageCircle, Eye, Users, Edit2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { useMyVendorProfile } from '@/hooks/useVendors';
import { VendorCategory } from '@/types/database';

const vendorCategories: { value: VendorCategory; label: string }[] = [
  { value: 'decor', label: 'Decor & Design' },
  { value: 'catering', label: 'Catering' },
  { value: 'livestock', label: 'Livestock' },
  { value: 'tents', label: 'Tents & Marquees' },
  { value: 'transport', label: 'Transport' },
  { value: 'attire', label: 'Traditional Attire' },
  { value: 'photographer', label: 'Photography & Video' },
  { value: 'other', label: 'Other Services' },
];

export default function VendorProfile() {
  const navigate = useNavigate();
  const { vendor, isLoading, updateVendorProfile } = useMyVendorProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    category: '' as VendorCategory,
    about: '',
    price_range_text: '',
    phone_number: '',
    whatsapp_number: '',
    email: '',
    location: '',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pb-safe">
        <PageHeader title="My Vendor Profile" showBack />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen pb-safe">
        <PageHeader title="My Vendor Profile" showBack />
        <div className="px-4 py-12 text-center">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No vendor profile yet</h2>
          <p className="text-muted-foreground mb-6">
            Register as a vendor to appear in our marketplace
          </p>
          <Button onClick={() => navigate('/vendors/onboarding')}>
            Become a vendor
          </Button>
        </div>
      </div>
    );
  }

  const startEditing = () => {
    setEditData({
      category: vendor.category,
      about: vendor.about || '',
      price_range_text: vendor.price_range_text || '',
      phone_number: vendor.phone_number || '',
      whatsapp_number: vendor.whatsapp_number || '',
      email: vendor.email || '',
      location: vendor.location || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateVendorProfile({
      category: editData.category,
      about: editData.about || null,
      price_range_text: editData.price_range_text || null,
      phone_number: editData.phone_number || null,
      whatsapp_number: editData.whatsapp_number || null,
      email: editData.email || null,
      location: editData.location || null,
    });
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader title="My Vendor Profile" showBack />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendor.view_count}</p>
                <p className="text-xs text-muted-foreground">Profile views</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendor.added_to_events_count}</p>
                <p className="text-xs text-muted-foreground">Added to events</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="outline" className="mb-2 capitalize">
                  {vendor.category}
                </Badge>
                <CardTitle>{vendor.name}</CardTitle>
                {vendor.location && (
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {vendor.location}
                  </CardDescription>
                )}
              </div>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Service Category</Label>
                  <Select
                    value={editData.category}
                    onValueChange={(v) => setEditData({ ...editData, category: v as VendorCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your service category" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    placeholder="City, Province"
                  />
                </div>
                <div className="space-y-2">
                  <Label>About</Label>
                  <Textarea
                    value={editData.about}
                    onChange={(e) => setEditData({ ...editData, about: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price range</Label>
                  <Input
                    value={editData.price_range_text}
                    onChange={(e) => setEditData({ ...editData, price_range_text: e.target.value })}
                    placeholder="From R5,000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={editData.phone_number}
                      onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input
                      value={editData.whatsapp_number}
                      onChange={(e) => setEditData({ ...editData, whatsapp_number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                </div>
                <Button variant="outline" className="w-full" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {vendor.about && (
                  <div>
                    <p className="text-sm font-medium mb-1">About</p>
                    <p className="text-sm text-muted-foreground">{vendor.about}</p>
                  </div>
                )}

                {vendor.price_range_text && (
                  <div>
                    <p className="text-sm font-medium mb-1">Price range</p>
                    <p className="text-sm text-primary font-medium">{vendor.price_range_text}</p>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  {vendor.phone_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{vendor.phone_number}</span>
                    </div>
                  )}
                  {vendor.whatsapp_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span>{vendor.whatsapp_number}</span>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{vendor.email}</span>
                    </div>
                  )}
                  {vendor.website_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={vendor.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {vendor.website_url}
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Preview Link */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/vendors/${vendor.id}`)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview public profile
        </Button>
      </div>
    </div>
  );
}
