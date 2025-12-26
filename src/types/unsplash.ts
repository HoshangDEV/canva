export interface AlternativeSlugs {
  en: string;
  es: string;
  ja: string;
  fr: string;
  it: string;
  ko: string;
  de: string;
  pt: string;
  id: string;
}

export interface UnsplashUrls {
  raw: string;
  full: string;
  regular: string;
  small: string;
  thumb: string;
  small_s3: string;
}

export interface UnsplashLinks {
  self: string;
  html: string;
  download: string;
  download_location: string;
}

export interface UnsplashUserLinks {
  self: string;
  html: string;
  photos: string;
  likes: string;
  portfolio: string;
}

export interface UnsplashProfileImage {
  small: string;
  medium: string;
  large: string;
}

export interface UnsplashSocial {
  instagram_username: string | null;
  portfolio_url: string | null;
  twitter_username: string | null;
  paypal_email: string | null;
}

export interface UnsplashUser {
  id: string;
  updated_at: string;
  username: string;
  name: string;
  first_name: string;
  last_name: string;
  twitter_username: string | null;
  portfolio_url: string | null;
  bio: string | null;
  location: string | null;
  links: UnsplashUserLinks;
  profile_image: UnsplashProfileImage;
  instagram_username: string | null;
  total_collections: number;
  total_likes: number;
  total_photos: number;
  total_free_photos: number;
  total_promoted_photos: number;
  total_illustrations: number;
  total_free_illustrations: number;
  total_promoted_illustrations: number;
  accepted_tos: boolean;
  for_hire: boolean;
  social: UnsplashSocial;
}

export interface UnsplashExif {
  make: string | null;
  model: string | null;
  name: string | null;
  exposure_time: string | null;
  aperture: string | null;
  focal_length: string | null;
  iso: number | null;
}

export interface UnsplashLocationPosition {
  latitude: number | null;
  longitude: number | null;
}

export interface UnsplashLocation {
  name: string | null;
  city: string | null;
  country: string | null;
  position: UnsplashLocationPosition;
}

export interface UnsplashMeta {
  index: boolean;
}

export interface UnsplashTag {
  type: string;
  title: string;
}

export interface UnsplashPhoto {
  id: string;
  slug: string;
  alternative_slugs: AlternativeSlugs;
  created_at: string;
  updated_at: string;
  promoted_at: string | null;
  width: number;
  height: number;
  color: string;
  blur_hash: string | null;
  description: string | null;
  alt_description: string | null;
  breadcrumbs: unknown[];
  urls: UnsplashUrls;
  links: UnsplashLinks;
  likes: number;
  liked_by_user: boolean;
  bookmarked: boolean;
  current_user_collections: unknown[];
  sponsorship: unknown | null;
  topic_submissions: Record<string, unknown>;
  asset_type: string;
  user: UnsplashUser;
  exif: UnsplashExif;
  location: UnsplashLocation;
  meta: UnsplashMeta;
  public_domain: boolean;
  tags: UnsplashTag[];
  views: number;
  downloads: number;
  topics: unknown[];
}

