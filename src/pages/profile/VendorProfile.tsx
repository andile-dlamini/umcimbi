import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { VendorServiceRegions } from '@/components/vendors/VendorServiceRegions';
import { Store, MapPin, Phone, Mail, Globe, MessageCircle, Eye, Users, Edit2, Save, Trash2, Clock, XCircle, Briefcase } from 'lucide-react';
import { PricingInput } from '@/components/vendors/PricingInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { VendorImageGallery } from '@/components/vendors/VendorImageGallery';
import { VendorBadges } from '@/components/vendors/VendorBadges';
import { useMyVendorProfile } from '@/hooks/useVendors';
import { getVendorCategoryLabel } from '@/lib/vendorCategories';
import { LIVE_VENDOR_CATEGORIES } from '@/lib/vendorCategories';
import { BrandingSection } from '@/components/vendors/BrandingSection';
import { PayoutDetailsSection } from '@/components/vendors/PayoutDetailsSection';

function toSocialUrl(platform: 'instagram' | 'tiktok' | 'facebook', handle: string): string | null {
  const cleaned = handle.trim().replace(/^@/, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;
  const bases = { instagram: 'https://instagram.com/', tiktok: 'https://tiktok.com/@', facebook: 'https://facebook.com/' };
  return bases[platform] + cleaned;
}

function toHandle(url: string): string {
  if (!url) return '';
  return url
    .replace(/^https?:\/\/(www\.)?(instagram\.com|tiktok\.com|facebook\.com)\/@?/, '')
    .replace(/\/$/, '');
}

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
    additional_categories: [] as string[],
    instagram_url: '',
    tiktok_url: '',
    facebook_url: '',
  });
  const [serviceRegionIds, setServiceRegionIds] = useState<string[]>([]);
  const [serviceRegionNames, setServiceRegionNames] = useState<string[]>([]);

  const vendorId = vendor?.id;
  useEffect(() => {
    if (!vendorId) return;
    supabase
      .from('vendor_service_regions')
      .select('region_id, service_regions(name)')
      .eq('vendor_id', vendorId)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading vendor service regions:', error);
          return;
        }
        const rows = (data ?? []) as any[];
        setServiceRegionIds(rows.map((r) => r.region_id));
        setServiceRegionNames(rows.map((r) => r.service_regions?.name).filter(Boolean));
      });
  }, [vendorId]);

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
      additional_categories: (vendor.additional_categories as string[]) || [],
      instagram_url: toHandle((vendor as any).instagram_url || ''),
      tiktok_url: toHandle((vendor as any).tiktok_url || ''),
      facebook_url: toHandle((vendor as any).facebook_url || ''),
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
      additional_categories: editData.additional_categories,
      instagram_url: toSocialUrl('instagram', editData.instagram_url),
      tiktok_url: toSocialUrl('tiktok', editData.tiktok_url),
      facebook_url: toSocialUrl('facebook', editData.facebook_url),
    } as any);
    setIsSaving(false);
    if (success) {
      // Sync service regions (non-blocking on failure)
      const { error: delErr } = await supabase
        .from('vendor_service_regions')
        .delete()
        .eq('vendor_id', vendor.id);
      let regionsFailed = false;
      if (delErr) {
        console.error('Error clearing vendor service regions:', delErr);
        regionsFailed = true;
      } else if (serviceRegionIds.length > 0) {
        const { error: insErr } = await supabase
          .from('vendor_service_regions')
          .insert(serviceRegionIds.map((regionId) => ({ vendor_id: vendor.id, region_id: regionId })) as any);
        if (insErr) {
          console.error('Error saving vendor service regions:', insErr);
          regionsFailed = true;
        }
      }
      if (regionsFailed) {
        toast.error('Profile saved, but service areas could not be updated');
      } else if (serviceRegionIds.length > 0) {
        const { data: regionRows } = await supabase
          .from('service_regions')
          .select('id, name')
          .in('id', serviceRegionIds);
        setServiceRegionNames((regionRows ?? []).map((r) => r.name));
      } else {
        setServiceRegionNames([]);
      }
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
        {!vendor.is_active && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Awaiting admin approval</p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Your profile is hidden from planners while our team reviews your details. You can keep editing your photos, pricing, and info in the meantime. We'll notify you once you're live.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendor.view_count}</p>
                <p className="text-xs text-muted-foreground">Views</p>
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
                <p className="text-xs text-muted-foreground">Events</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendor.jobs_completed}</p>
                <p className="text-xs text-muted-foreground">Jobs done</p>
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
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline">
                    {getVendorCategoryLabel(vendor.category)}
                  </Badge>
                  {(vendor.additional_categories as string[] || []).map((cat) => (
                    <Badge key={cat} variant="secondary" className="text-xs">
                      {getVendorCategoryLabel(cat)}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <CardTitle>{vendor.name}</CardTitle>
                  <VendorBadges 
                    businessVerificationStatus={vendor.business_verification_status}
                    isSuperVendor={vendor.is_super_vendor}
                    size="md"
                  />
                </div>
                {/* Business verification status (private) */}
                {vendor.business_verification_status === 'pending' && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs text-amber-600">Business verification under review</span>
                  </div>
                )}
                {vendor.business_verification_status === 'rejected' && (
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
                <VendorServiceRegions
                  vendorId={vendor.id}
                  value={serviceRegionIds}
                  onChange={setServiceRegionIds}
                />
                <div className="space-y-2">
                  <Label>About</Label>
                  <Textarea
                    value={editData.about}
                    onChange={(e) => setEditData({ ...editData, about: e.target.value })}
                    rows={4}
                  />
                </div>
                <PricingInput
                  category={vendor.category}
                  value={editData.price_range_text}
                  onChange={(formatted) => setEditData({ ...editData, price_range_text: formatted })}
                />
                <div className="space-y-2">
                  <Label>Additional services</Label>
                  <p className="text-xs text-muted-foreground">Choose other categories you can deliver. Pricing stays tied to your primary category.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {LIVE_VENDOR_CATEGORIES.filter((cat) => cat.value !== 'other' && cat.value !== vendor.category).map((cat) => (
                      <label key={cat.value} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                        <Checkbox
                          checked={editData.additional_categories.includes(cat.value)}
                          onCheckedChange={(checked) => {
                            setEditData(prev => ({
                              ...prev,
                              additional_categories: checked
                                ? [...prev.additional_categories, cat.value]
                                : prev.additional_categories.filter(c => c !== cat.value),
                            }));
                          }}
                        />
                        <span className="text-sm">{cat.label}</span>
                      </label>
                    ))}
                  </div>
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
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-sm font-medium">Social links (optional)</Label>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Instagram username</Label>
                    <Input
                      value={editData.instagram_url}
                      onChange={(e) => setEditData({ ...editData, instagram_url: e.target.value })}
                      placeholder="e.g. maswazicatering"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">TikTok username</Label>
                    <Input
                      value={editData.tiktok_url}
                      onChange={(e) => setEditData({ ...editData, tiktok_url: e.target.value })}
                      placeholder="e.g. maswazicatering"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Facebook username or page name</Label>
                    <Input
                      value={editData.facebook_url}
                      onChange={(e) => setEditData({ ...editData, facebook_url: e.target.value })}
                      placeholder="e.g. maswazicatering"
                    />
                  </div>
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
                  {((vendor as any).instagram_url || (vendor as any).tiktok_url || (vendor as any).facebook_url) && (
                    <div className="pt-2 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Social</p>
                      {(vendor as any).instagram_url && (
                        <a href={(vendor as any).instagram_url} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">
                          Instagram
                        </a>
                      )}
                      {(vendor as any).tiktok_url && (
                        <a href={(vendor as any).tiktok_url} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">
                          TikTok
                        </a>
                      )}
                      {(vendor as any).facebook_url && (
                        <a href={(vendor as any).facebook_url} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">
                          Facebook
                        </a>
                      )}
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

        {/* Branding / Letterhead Section */}
        <BrandingSection vendor={vendor} onUpdate={updateVendorProfile} />

        <PayoutDetailsSection vendor={vendor} onUpdate={updateVendorProfile} />

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
