import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, Mail, Globe, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { useMyVendorProfile } from '@/hooks/useVendors';
import { VendorCategory } from '@/types/database';
import { toast } from 'sonner';

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

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const { createVendorProfile } = useMyVendorProfile();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '' as VendorCategory | '',
    location: '',
    about: '',
    price_range_text: '',
    phone_number: '',
    whatsapp_number: '',
    email: '',
    website_url: '',
    languages: ['English'],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter your business name');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    setIsLoading(true);

    const result = await createVendorProfile({
      name: formData.name.trim(),
      category: formData.category as VendorCategory,
      location: formData.location.trim() || null,
      about: formData.about.trim() || null,
      price_range_text: formData.price_range_text.trim() || null,
      phone_number: formData.phone_number.trim() || null,
      whatsapp_number: formData.whatsapp_number.trim() || null,
      email: formData.email.trim() || null,
      website_url: formData.website_url.trim() || null,
      languages: formData.languages,
      image_urls: [],
    });

    setIsLoading(false);

    if (result) {
      navigate('/profile/vendor');
    }
  };

  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader title="Become a Vendor" showBack />

      <div className="px-4 py-6 max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-2">
              <Store className="h-6 w-6 text-secondary" />
            </div>
            <CardTitle>Register your business</CardTitle>
            <CardDescription>
              Join our marketplace and connect with families planning traditional ceremonies
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Zulu Traditions Decor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as VendorCategory })}
                >
                  <SelectTrigger className="h-12">
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
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g., Durban, KwaZulu-Natal"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About your business</Label>
                <Textarea
                  id="about"
                  placeholder="Describe your services, experience, and what makes you special..."
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price range</Label>
                <Input
                  id="price"
                  placeholder="e.g., From R5,000 or R150/head"
                  value={formData.price_range_text}
                  onChange={(e) => setFormData({ ...formData, price_range_text: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+27..."
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="+27..."
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Business email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="business@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website (optional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://..."
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 mt-6" disabled={isLoading}>
                {isLoading ? 'Creating profile...' : 'Create vendor profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
