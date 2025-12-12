import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, Mail, Globe, MessageCircle } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { useMyVendorProfile } from '@/hooks/useVendors';
import { VENDOR_CATEGORIES, VENDOR_CATEGORY_VALUES, VendorCategory } from '@/lib/vendorCategories';
import { toast } from 'sonner';

const phoneRegex = /^(\+27|0)[0-9]{9,10}$/;

const vendorSchema = z.object({
  name: z.string().trim().min(2, 'Business name must be at least 2 characters').max(100, 'Business name must be less than 100 characters'),
  category: z.enum(VENDOR_CATEGORY_VALUES, {
    required_error: 'Please select a category',
  }),
  location: z.string().trim().max(100, 'Location must be less than 100 characters').optional().or(z.literal('')),
  about: z.string().trim().max(2000, 'Description must be less than 2000 characters').optional().or(z.literal('')),
  price_range_text: z.string().trim().max(100, 'Price range must be less than 100 characters').optional().or(z.literal('')),
  phone_number: z.string().trim().refine(val => !val || phoneRegex.test(val.replace(/\s/g, '')), {
    message: 'Please enter a valid SA phone number (e.g., +27821234567)',
  }).optional().or(z.literal('')),
  whatsapp_number: z.string().trim().refine(val => !val || phoneRegex.test(val.replace(/\s/g, '')), {
    message: 'Please enter a valid SA phone number (e.g., +27821234567)',
  }).optional().or(z.literal('')),
  email: z.string().trim().email('Please enter a valid email address').max(255, 'Email must be less than 255 characters').optional().or(z.literal('')),
  website_url: z.string().trim().url('Please enter a valid URL (e.g., https://...)').max(500, 'URL must be less than 500 characters').optional().or(z.literal('')),
  languages: z.array(z.string()),
});

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const { createVendorProfile } = useMyVendorProfile();
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    setErrors({});

    const validation = vendorSchema.safeParse(formData);
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      const firstError = validation.error.errors[0]?.message;
      if (firstError) toast.error(firstError);
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
                  className={`h-12 ${errors.name ? 'border-destructive' : ''}`}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as VendorCategory })}
                >
                  <SelectTrigger className={`h-12 ${errors.category ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select your service category" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
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
                    className={`pl-10 h-12 ${errors.location ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About your business</Label>
                <Textarea
                  id="about"
                  placeholder="Describe your services, experience, and what makes you special..."
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  rows={4}
                  className={errors.about ? 'border-destructive' : ''}
                />
                {errors.about && <p className="text-sm text-destructive">{errors.about}</p>}
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
                      className={`pl-10 h-12 ${errors.phone_number ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number}</p>}
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
                      className={`pl-10 h-12 ${errors.whatsapp_number ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.whatsapp_number && <p className="text-sm text-destructive">{errors.whatsapp_number}</p>}
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
                    className={`pl-10 h-12 ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
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
                    className={`pl-10 h-12 ${errors.website_url ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.website_url && <p className="text-sm text-destructive">{errors.website_url}</p>}
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
