import { inject, Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {ApiUrlService} from "../../../shared/services/api.service";
import {CategoriesResponse} from "../../admin/categories-page/models/categories.models";
import {ProductsResponse} from "../../admin/products-page/models/products.models";
import {BannersResponse} from "../../admin/banners-page/models/banner.models";

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
}
