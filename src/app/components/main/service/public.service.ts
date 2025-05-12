import { inject, Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";
import {ApiUrlService} from "../../../shared/services/api.service";
import {CategoriesResponse} from "../../admin/categories-page/models/categories.models";
import {ProductsResponse, SingleProductResponse} from "../../admin/products-page/models/products.models";
import {BannersResponse} from "../../admin/banners-page/models/banner.models";
import {Image} from "../../admin/shared/services/image.service";

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: any[];
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface ProductFilters {
  page?: number;
  per_page?: number;
  category_id?: number | null;
  sort_by?: string;
  sort_dir?: string;
  min_price?: number;
  max_price?: number | undefined;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  getAllCategories(): Observable<CategoriesResponse> {
    return this.http.get(this.apiUrlService.getUrl('api/public/categories/getAllActiveCategories')) as Observable<CategoriesResponse>;
  }

  getProducts(): Observable<ProductsResponse> {
    return this.http.get(this.apiUrlService.getUrl('api/public/products/getAllPopularActiveProducts')) as Observable<ProductsResponse>;
  }

  getBanners(): Observable<BannersResponse> {
    return this.http.get(this.apiUrlService.getUrl('api/public/banners/getAllActiveBanners')) as Observable<BannersResponse>;
  }

  getProductsWithFilters(filters: ProductFilters): Observable<PaginatedResponse<any>> {
    let params = new HttpParams();

    if (filters.page) {
      params = params.append('page', filters.page.toString());
    }

    if (filters.per_page) {
      params = params.append('per_page', filters.per_page.toString());
    }

    if (filters.category_id) {
      params = params.append('category_id', filters.category_id.toString());
    }

    if (filters.sort_by) {
      params = params.append('sort_by', filters.sort_by);
      params = params.append('sort_dir', filters.sort_dir || 'desc');
    }

    if (filters.min_price !== undefined) {
      params = params.append('min_price', filters.min_price.toString());
    }

    if (filters.max_price !== undefined) {
      params = params.append('max_price', filters.max_price.toString());
    }

    if (filters.search) {
      params = params.append('search', filters.search);
    }

    return this.http.get(
      this.apiUrlService.getUrl('api/public/products/getAllSearchableProducts'),
      { params }
    ) as Observable<PaginatedResponse<any>>;
  }

  getProductBySlug(slug: string): Observable<SingleProductResponse> {
    return this.http.get(
      this.apiUrlService.getUrl(`api/public/products/${slug}`)
    ) as Observable<SingleProductResponse>;
  }

  getProductImages(productId: number): Observable<{ data: Image[] }> {
    return this.http.get(
      this.apiUrlService.getUrl(`api/public/images/${productId}?type=product`)
    ) as Observable<{ data: Image[] }>;
  }

  getRelatedProducts(categoryId: number, currentProductId?: number): Observable<ProductsResponse> {
    let params = new HttpParams()
      .append('category_id', categoryId.toString())
      .append('limit', '4');

    if (currentProductId) {
      params = params.append('exclude_id', currentProductId.toString());
    }

    return this.http.get(
      this.apiUrlService.getUrl('api/public/products/getRelatedProducts'),
      { params }
    ) as Observable<ProductsResponse>;
  }

  getSaleProducts(page: number = 1, perPage: number = 12): Observable<ProductsResponse> {
    let params = new HttpParams()
      .append('page', page.toString())
      .append('per_page', perPage.toString());

    return this.http.get(
      this.apiUrlService.getUrl('api/public/products/getSaleProducts'),
      { params }
    ) as Observable<ProductsResponse>;
  }

  getProductSuggestions(query: string): Observable<any> {
    let params = new HttpParams()
      .append('search', query)
      .append('per_page', '5');

    return this.http.get(
      this.apiUrlService.getUrl('api/public/products/suggestions'),
      { params }
    );
  }
}
