import {PaginationMeta} from "../../../../shared/models/pagination.models";

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
  created_at: string;
  image_link: string;
}

export interface SingleBannerResponse {
  data: Banner;
}

export interface BannersResponse {
  data: Banner[];
  meta: PaginationMeta;
}
