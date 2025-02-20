import { inject, Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Observable} from "rxjs";
import {CreateCategoriesRequest, SingleCategoriesResponse} from "../models/categories.models";

@Injectable({
  providedIn: 'root'
})
export class AdminCategoryService {
  private readonly http = inject(HttpClient);

  createCategory(data: CreateCategoriesRequest): Observable<SingleCategoriesResponse> {
    return this.http.post('http://localhost:8000/api/categories/create', data) as Observable<SingleCategoriesResponse>;
  }
}
