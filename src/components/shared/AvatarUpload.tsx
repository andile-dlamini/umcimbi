import { useState, useRef } from 'react';
import { Camera, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  avatarUrl: string | null;
  onAvatarChange: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

export function AvatarUpload({ 
  avatarUrl, 
  onAvatarChange, 
  size = 'md',
  editable = true 
}: AvatarUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      await supabase.storage.from('avatars').remove([fileName]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add timestamp to bust cache
      const avatarUrlWithCache = `${urlData.publicUrl}?t=${Date.now()}`;
      onAvatarChange(avatarUrlWithCache);
      toast.success('Avatar updated');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative">
      <div 
        className={cn(
          sizeClasses[size],
          'rounded-full bg-muted flex items-center justify-center overflow-hidden',
          editable && 'cursor-pointer',
          isUploading && 'opacity-50'
        )}
        onClick={() => editable && fileInputRef.current?.click()}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className={cn(iconSizes[size], 'text-muted-foreground')} />
        )}
      </div>
      
      {editable && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              'absolute -bottom-1 -right-1 p-1.5 rounded-full',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 transition-colors',
              'shadow-sm'
            )}
          >
            <Camera className="h-3 w-3" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  );
}
