import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { BannersResponse, SingleBannerResponse } from "../models/banner.models";
import { ApiUrlService } from "../../../../shared/services/api.service";

interface EmptyResponse {}

@Injectable({
  providedIn: 'root'
})
export class AdminBannerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  createBanner(data: FormData): Observable<SingleBannerResponse> {
    return this.http.post(this.apiUrlService.getUrl('api/banners/create'), data) as Observable<SingleBannerResponse>;
  }

  getBanners(params?: { search?: string, sort_by?: string, sort_dir?: string, status?: boolean|string }): Observable<BannersResponse> {
    let queryParams = new HttpParams();

    if (params?.search) {
      queryParams = queryParams.append('search', params.search);
    }

    if (params?.sort_by) {
      queryParams = queryParams.append('sort_by', params.sort_by);
      queryParams = queryParams.append('sort_dir', params.sort_dir || 'asc');
    }

    if (params?.status !== undefined) {
      const status = params.status ? '1' : '0';

      queryParams = queryParams.append('status', status);
    }

    return this.http.get(this.apiUrlService.getUrl('api/banners/getAll'), { params: queryParams }) as Observable<BannersResponse>;
  }

  getBanner(bannerId: number): Observable<SingleBannerResponse> {
    return this.http.get(this.apiUrlService.getUrl(`api/banners/${bannerId}`)) as Observable<SingleBannerResponse>;
  }

  editBanner(bannerId: number, data: FormData): Observable<SingleBannerResponse> {
    return this.http.post(this.apiUrlService.getUrl(`api/banners/edit/${bannerId}`), data) as Observable<SingleBannerResponse>;
  }

  deleteBanner(bannerId: number): Observable<EmptyResponse> {
    return this.http.delete(this.apiUrlService.getUrl(`api/banners/delete/${bannerId}`)) as Observable<EmptyResponse>
  }
}
