import { useState, useRef } from 'react';
import { ImagePlus, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VendorImageGalleryProps {
  vendorId: string;
  imageUrls: string[];
  isEditing: boolean;
  onImagesChange: (images: string[]) => void;
}

export function VendorImageGallery({ 
  vendorId, 
  imageUrls, 
  isEditing, 
  onImagesChange 
}: VendorImageGalleryProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null);

  const mainImage = imageUrls[0] || null;
  const galleryImages = imageUrls.slice(1, 5);
  const canAddMore = imageUrls.length < 5;

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${vendorId}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('vendor-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage error:', error);
      toast.error('Failed to upload image');
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(fileName);

    return `${urlData.publicUrl}?t=${Date.now()}`;
  };

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadingIndex(0);

    try {
      const url = await uploadImage(file);
      if (url) {
        const newImages = [url, ...galleryImages];
        onImagesChange(newImages);
        toast.success('Main image updated');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      setUploadingIndex(null);
    }
  };

  const handleGalleryImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    if (!canAddMore) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setIsUploading(true);
    setUploadingIndex(imageUrls.length);

    try {
      const url = await uploadImage(file);
      if (url) {
        onImagesChange([...imageUrls, url]);
        toast.success('Image added to gallery');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      setUploadingIndex(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = imageUrls.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success('Image removed');
  };

  if (!isEditing) {
    // Display view
    return (
      <div className="space-y-4">
        {/* Main Image */}
        {mainImage ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <img 
              src={mainImage} 
              alt="Main vendor image" 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {galleryImages.map((url, index) => (
              <div 
                key={index} 
                className="aspect-square overflow-hidden rounded-lg bg-muted"
              >
                <img 
                  src={url} 
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Edit view
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Image Upload */}
        <div className="space-y-2">
          <Label>Main Image / Logo</Label>
          <div 
            className={cn(
              "relative aspect-video w-full overflow-hidden rounded-lg bg-muted border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors",
              isUploading && uploadingIndex === 0 && "opacity-50"
            )}
            onClick={() => mainImageInputRef.current?.click()}
          >
            {mainImage ? (
              <>
                <img 
                  src={mainImage} 
                  alt="Main vendor image" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm">Click to change</span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload main image</span>
              </div>
            )}
          </div>
          <input
            ref={mainImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleMainImageChange}
          />
        </div>

        {/* Gallery Images */}
        <div className="space-y-2">
          <Label>Gallery Images ({galleryImages.length}/4)</Label>
          <div className="grid grid-cols-4 gap-2">
            {galleryImages.map((url, index) => (
              <div 
                key={index} 
                className="relative aspect-square overflow-hidden rounded-lg bg-muted group"
              >
                <img 
                  src={url} 
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index + 1)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            
            {/* Add more button */}
            {canAddMore && galleryImages.length < 4 && (
              <div 
                className={cn(
                  "aspect-square overflow-hidden rounded-lg bg-muted border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center",
                  isUploading && "opacity-50 pointer-events-none"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGalleryImageAdd}
          />
          <p className="text-xs text-muted-foreground">
            Upload up to 5 images total. First image is your main image.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
