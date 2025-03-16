export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  image_link: string;
}

export interface SingleBannerResponse {
  data: Banner;
}

export interface BannersResponse {
  data: Banner[];
}
