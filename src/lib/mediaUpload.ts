import { supabase } from '@/lib/supabase';

export type MediaBucket = 'avatars' | 'banners' | 'demos';
export type MediaKind = 'avatar' | 'banner' | 'demo';

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

const UPLOAD_ERROR_MESSAGE = 'Não foi possível enviar o arquivo. Tente novamente.';

const KIND_TO_BUCKET: Record<MediaKind, MediaBucket> = {
  avatar: 'avatars',
  banner: 'banners',
  demo: 'demos',
};

function fileExtension(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';
  return extension || 'bin';
}

export function buildMediaPath(userId: string, kind: MediaKind, file: File): string {
  const baseName = kind === 'avatar' ? 'avatar' : kind === 'banner' ? 'banner' : 'demo';
  return `${userId}/${baseName}.${fileExtension(file)}`;
}

export async function uploadMedia(kind: MediaKind, userId: string, file: File): Promise<string> {
  const bucket = KIND_TO_BUCKET[kind];
  const path = buildMediaPath(userId, kind, file);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
    cacheControl: '3600',
  });
  if (error) {
    console.error(error.message);
    throw new Error(UPLOAD_ERROR_MESSAGE);
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
