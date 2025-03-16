export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  sale_price: number | string | null;
  sale_ends_at: string | null;
  stock: number;
  specifications: string | null;
  additional_info: string | null;
  status: 'active' | 'inactive';
  sold: number;
  category: string;
  primary_image: string;
  is_sale_active: boolean;
  category_id: number;
  created_at: string;
}

export interface SingleProductResponse {
  data: Product;
}

export interface ProductsResponse {
  data: Product[];
}

export interface CreateProductRequest {
  category_id: number;
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  sale_ends_at?: string;
  stock: number;
  specifications?: string;
  additional_info?: string;
  status: 'active' | 'inactive';
}
