export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  description: string;
  created_at: string;
  products_count: number;
}

export interface SingleCategoriesResponse {
  data: Category;
}

export interface CategoriesResponse {
  data: Category[];
}

export interface CreateCategoriesRequest {
  name: string;
  description: string;
}
