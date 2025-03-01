import { inject, Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Observable} from "rxjs";
import {CategoriesResponse, CreateCategoriesRequest, SingleCategoriesResponse} from "../models/categories.models";
import {ApiUrlService} from "../../../../shared/services/api.service";

interface EmptyResponse {}

@Injectable({
  providedIn: 'root'
})
export class AdminCategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  createCategory(data: CreateCategoriesRequest): Observable<SingleCategoriesResponse> {
    return this.http.post(this.apiUrlService.getUrl('api/categories/create'), data) as Observable<SingleCategoriesResponse>;
  }

  getCategories(): Observable<CategoriesResponse> {
    return this.http.get(this.apiUrlService.getUrl('api/categories/getAll')) as Observable<CategoriesResponse>;
  }

  getCategory(categoryId: number): Observable<SingleCategoriesResponse> {
    return this.http.get(this.apiUrlService.getUrl(`api/categories/${categoryId}`)) as Observable<SingleCategoriesResponse>;
  }

  editCategory(categoryId: number, data: CreateCategoriesRequest): Observable<SingleCategoriesResponse> {
    return this.http.patch(this.apiUrlService.getUrl(`api/categories/edit/${categoryId}`), data) as Observable<SingleCategoriesResponse>;
  }

  deleteCategory(categoryId: number): Observable<EmptyResponse> {
    return this.http.delete(this.apiUrlService.getUrl(`api/categories/delete/${categoryId}`)) as Observable<EmptyResponse>
  }
}
