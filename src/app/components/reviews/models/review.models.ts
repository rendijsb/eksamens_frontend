export interface Review {
  id: number;
  product_id: number;
  product?: {
    id: number;
    name: string;
    slug: string;
  };
  user_id: number;
  user: {
    id: number;
    name: string;
    profile_image: string | null;
  };
  rating: number;
  review_text: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}
