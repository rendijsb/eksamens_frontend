import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { ProductsResponse, SingleProductResponse, CreateProductRequest } from "../models/products.models";
import { ApiUrlService } from "../../../../shared/services/api.service";

interface EmptyResponse {}

@Injectable({
  providedIn: 'root'
})
export class AdminProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  createProduct(data: CreateProductRequest): Observable<SingleProductResponse> {
    return this.http.post(this.apiUrlService.getUrl('api/products/create'), data) as Observable<SingleProductResponse>;
  }

  getProducts(params?: {
    page?: number,
    search: string;
    sort_by: string;
    sort_dir: string;
    category_id: number | null;
    status: "active" | "inactive" | null
  }): Observable<ProductsResponse> {
    let queryParams = new HttpParams();

    if (params?.page) {
      queryParams = queryParams.append('page', params.page.toString());
    }

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
      queryParams = queryParams.append('status', params.status);
    }

    return this.http.get(this.apiUrlService.getUrl('api/products/getAll'), { params: queryParams }) as Observable<ProductsResponse>;
  }

  getProduct(productId: number): Observable<SingleProductResponse> {
    return this.http.get(this.apiUrlService.getUrl(`api/products/${productId}`)) as Observable<SingleProductResponse>;
  }

  editProduct(productId: number, data: CreateProductRequest): Observable<SingleProductResponse> {
    return this.http.patch(this.apiUrlService.getUrl(`api/products/edit/${productId}`), data) as Observable<SingleProductResponse>;
  }

  deleteProduct(productId: number): Observable<EmptyResponse> {
    return this.http.delete(this.apiUrlService.getUrl(`api/products/delete/${productId}`)) as Observable<EmptyResponse>
  }
}
