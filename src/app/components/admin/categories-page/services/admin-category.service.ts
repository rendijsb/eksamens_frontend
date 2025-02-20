import { inject, Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Observable} from "rxjs";
import {CategoriesResponse, CreateCategoriesRequest, SingleCategoriesResponse} from "../models/categories.models";

interface EmptyResponse {}

@Injectable({
  providedIn: 'root'
})
export class AdminCategoryService {
  private readonly http = inject(HttpClient);

  createCategory(data: CreateCategoriesRequest): Observable<SingleCategoriesResponse> {
    return this.http.post('http://localhost:8000/api/categories/create', data) as Observable<SingleCategoriesResponse>;
  }

  getCategories(): Observable<CategoriesResponse> {
    return this.http.get('http://localhost:8000/api/categories/getAll') as Observable<CategoriesResponse>;
  }

  getCategory(categoryId: number): Observable<SingleCategoriesResponse> {
    return this.http.get(`http://localhost:8000/api/categories/${categoryId}`) as Observable<SingleCategoriesResponse>;
  }

  editCategory(categoryId: number, data: CreateCategoriesRequest): Observable<SingleCategoriesResponse> {
    return this.http.patch(`http://localhost:8000/api/categories/edit/${categoryId}`, data) as Observable<SingleCategoriesResponse>;
  }

  deleteCategory(categoryId: number): Observable<EmptyResponse> {
    return this.http.delete(`http://localhost:8000/api/categories/delete/${categoryId}`) as Observable<EmptyResponse>
  }
}
