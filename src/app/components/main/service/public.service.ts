import { inject, Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";
import {ApiUrlService} from "../../../shared/services/api.service";
import {CategoriesResponse} from "../../admin/categories-page/models/categories.models";
import {ProductsResponse} from "../../admin/products-page/models/products.models";

@Injectable({
  providedIn: 'root'
})
export class PublicService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  getAllCategories(params?: { search?: string, sort_by?: string, sort_dir?: string }): Observable<CategoriesResponse> {
    let queryParams = new HttpParams();

    if (params?.search) {
      queryParams = queryParams.append('search', params.search);
    }

    if (params?.sort_by) {
      queryParams = queryParams.append('sort_by', params.sort_by);
      queryParams = queryParams.append('sort_dir', params.sort_dir || 'asc');
    }

    return this.http.get(this.apiUrlService.getUrl('api/public/categories/getAll'), { params: queryParams }) as Observable<CategoriesResponse>;
  }

  getProducts(params?: {
    search: string;
    sort_by: string;
    sort_dir: string;
    category_id: number | null;
    status: "active" | "inactive" | null
  }): Observable<ProductsResponse> {
    let queryParams = new HttpParams();

    if (params?.search) {
      queryParams = queryParams.append('search', params.search);
    }

    if (params?.sort_by) {
      queryParams = queryParams.append('sort_by', params.sort_by);
      queryParams = queryParams.append('sort_dir', params.sort_dir || 'asc');
    }

    if (params?.category_id) {
      queryParams = queryParams.append('category_id', params.category_id.toString());
    }

    if (params?.status) {
      queryParams = queryParams.append('status', 'active');
    }

    return this.http.get(this.apiUrlService.getUrl('api/public/products/getAll'), { params: queryParams }) as Observable<ProductsResponse>;
  }
}
