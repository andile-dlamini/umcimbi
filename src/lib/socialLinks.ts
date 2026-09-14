export function toSocialUrl(platform: 'instagram' | 'tiktok' | 'facebook', handle: string): string | null {
  const cleaned = handle.trim().replace(/^@/, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;
  const bases = {
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/@',
    facebook: 'https://facebook.com/',
  };
  return bases[platform] + cleaned;
}

export function extractSocialHandle(url: string | null | undefined): string {
  if (!url) return '';
  return url.replace(/^https?:\/\/(www\.)?(instagram\.com\/|tiktok\.com\/@?|facebook\.com\/)/, '');
}
