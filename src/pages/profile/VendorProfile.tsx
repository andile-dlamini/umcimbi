import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, Mail, Globe, MessageCircle, Eye, Users, Edit2, Save, Trash2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { VendorImageGallery } from '@/components/vendors/VendorImageGallery';
import { VendorBadges } from '@/components/vendors/VendorBadges';
import { useMyVendorProfile } from '@/hooks/useVendors';
import { getVendorCategoryLabel } from '@/lib/vendorCategories';

export default function VendorProfile() {
  const navigate = useNavigate();
  const { vendor, isLoading, updateVendorProfile, deleteVendorProfile } = useMyVendorProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState({
    about: '',
    price_range_text: '',
    phone_number: '',
    whatsapp_number: '',
    email: '',
    location: '',
    image_urls: [] as string[],
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
      about: vendor.about || '',
      price_range_text: vendor.price_range_text || '',
      phone_number: vendor.phone_number || '',
      whatsapp_number: vendor.whatsapp_number || '',
      email: vendor.email || '',
      location: vendor.location || '',
      image_urls: vendor.image_urls || [],
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateVendorProfile({
      about: editData.about || null,
      price_range_text: editData.price_range_text || null,
      phone_number: editData.phone_number || null,
      whatsapp_number: editData.whatsapp_number || null,
      email: editData.email || null,
      location: editData.location || null,
      image_urls: editData.image_urls,
    });
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteVendorProfile();
    setIsDeleting(false);
    if (success) {
      navigate('/profile');
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

        {/* Image Gallery (Edit mode) */}
        {isEditing && (
          <VendorImageGallery
            vendorId={vendor.id}
            imageUrls={editData.image_urls}
            isEditing={true}
            onImagesChange={(images) => setEditData({ ...editData, image_urls: images })}
          />
        )}

        {/* Image Gallery (View mode) */}
        {!isEditing && vendor.image_urls && vendor.image_urls.length > 0 && (
          <VendorImageGallery
            vendorId={vendor.id}
            imageUrls={vendor.image_urls}
            isEditing={false}
            onImagesChange={() => {}}
          />
        )}

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
              <Badge variant="outline" className="mb-2">
                  {getVendorCategoryLabel(vendor.category)}
                </Badge>
                <div className="flex items-center gap-1.5">
                  <CardTitle>{vendor.name}</CardTitle>
                  <VendorBadges 
                    businessVerificationStatus={(vendor as any).business_verification_status}
                    isSuperVendor={(vendor as any).is_super_vendor}
                    size="md"
                  />
                </div>
                {/* Business verification status (private) */}
                {(vendor as any).business_verification_status === 'pending' && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs text-amber-600">Business verification under review</span>
                  </div>
                )}
                {(vendor as any).business_verification_status === 'rejected' && (
                  <div className="flex items-center gap-1 mt-1">
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs text-destructive">Verification rejected</span>
                  </div>
                )}
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
                  <Label>Address</Label>
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

        {/* Delete Profile */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete vendor profile
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete vendor profile?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your vendor profile and remove you from the marketplace. 
                Your user account will remain active. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete profile'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
