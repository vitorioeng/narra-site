import type { Creator } from '@/types/narra';

const CREATOR_AVATAR_URLS: Record<string, string> = {
  '5d1c0a00-0000-4000-8000-000000000001': 'https://images.pexels.com/photos/6102841/pexels-photo-6102841.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '5d1c0a00-0000-4000-8000-000000000002': 'https://images.pexels.com/photos/11579595/pexels-photo-11579595.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '5d1c0a00-0000-4000-8000-000000000003': 'https://images.pexels.com/photos/16160801/pexels-photo-16160801.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '5d1c0a00-0000-4000-8000-000000000004': 'https://images.pexels.com/photos/35490806/pexels-photo-35490806.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '5d1c0a00-0000-4000-8000-000000000005': 'https://images.pexels.com/photos/34081654/pexels-photo-34081654.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '5d1c0a00-0000-4000-8000-000000000006': 'https://images.pexels.com/photos/35490803/pexels-photo-35490803.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '5d1c0a00-0000-4000-8000-000000000007': 'https://images.pexels.com/photos/36586364/pexels-photo-36586364.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '5d1c0a00-0000-4000-8000-000000000008': 'https://images.pexels.com/photos/33970123/pexels-photo-33970123.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

const CREATOR_BANNER_URLS: Record<string, string> = {
  '5d1c0a00-0000-4000-8000-000000000001': 'https://images.pexels.com/photos/30096216/pexels-photo-30096216.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '5d1c0a00-0000-4000-8000-000000000002': 'https://images.pexels.com/photos/13174117/pexels-photo-13174117.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '5d1c0a00-0000-4000-8000-000000000003': 'https://images.pexels.com/photos/12038590/pexels-photo-12038590.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '5d1c0a00-0000-4000-8000-000000000004': 'https://images.pexels.com/photos/7816723/pexels-photo-7816723.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '5d1c0a00-0000-4000-8000-000000000005': 'https://images.pexels.com/photos/29267932/pexels-photo-29267932.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '5d1c0a00-0000-4000-8000-000000000006': 'https://images.pexels.com/photos/12198534/pexels-photo-12198534.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '5d1c0a00-0000-4000-8000-000000000007': 'https://images.pexels.com/photos/586417/pexels-photo-586417.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  '5d1c0a00-0000-4000-8000-000000000008': 'https://images.pexels.com/photos/37057931/pexels-photo-37057931.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

export function getCreatorAvatarUrl(creator: Creator): string | null {
  return creator.avatarUrl ?? CREATOR_AVATAR_URLS[creator.id] ?? null;
}

export function getCreatorBannerUrl(creator: Creator): string | null {
  return creator.bannerUrl ?? CREATOR_BANNER_URLS[creator.id] ?? null;
}
