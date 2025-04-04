import { inject, Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";
import {CategoriesResponse, SingleCategoriesResponse} from "../models/categories.models";
import {ApiUrlService} from "../../../../shared/services/api.service";

interface EmptyResponse {}

@Injectable({
  providedIn: 'root'
})
export class AdminCategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  createCategory(data: FormData): Observable<SingleCategoriesResponse> {
    return this.http.post(this.apiUrlService.getUrl('api/categories/create'), data) as Observable<SingleCategoriesResponse>;
  }

  getCategories(params?: {
    page?: number,
    search?: string,
    sort_by?: string,
    sort_dir?: string
  }
  ): Observable<CategoriesResponse> {
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

    return this.http.get(this.apiUrlService.getUrl('api/categories/getAll'), { params: queryParams }) as Observable<CategoriesResponse>;
  }

  getCategory(categoryId: number): Observable<SingleCategoriesResponse> {
    return this.http.get(this.apiUrlService.getUrl(`api/categories/${categoryId}`)) as Observable<SingleCategoriesResponse>;
  }

  editCategory(categoryId: number, data: FormData): Observable<SingleCategoriesResponse> {
    return this.http.post(this.apiUrlService.getUrl(`api/categories/edit/${categoryId}`), data) as Observable<SingleCategoriesResponse>;
  }

  deleteCategory(categoryId: number): Observable<EmptyResponse> {
    return this.http.delete(this.apiUrlService.getUrl(`api/categories/delete/${categoryId}`)) as Observable<EmptyResponse>
  }
}
