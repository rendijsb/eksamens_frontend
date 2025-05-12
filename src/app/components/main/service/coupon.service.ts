import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiUrlService } from '../../../shared/services/api.service';

export interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  uses_per_user?: number;
  total_uses?: number;
  used_count: number;
  remaining_uses?: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  is_valid: boolean;
  is_expired: boolean;
  description?: string;
  created_at: string;
  usage_stats?: {
    unique_users: number;
    total_discount_given: number;
  };
}

export interface CouponResponse {
  data: Coupon;
}

export interface CouponsResponse {
  data: Coupon[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CouponValidationResponse {
  valid: boolean;
  coupon?: Coupon;
  discount?: number;
  message?: string;
}

export interface CouponCreateRequest {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  uses_per_user?: number;
  total_uses?: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  description?: string;
}

export interface CouponUpdateRequest extends CouponCreateRequest {
  id: number;
}

export interface CouponFilters {
  search?: string;
  type?: 'percentage' | 'fixed';
  status?: boolean;
  sort_by?: 'id' | 'code' | 'type' | 'value' | 'used_count' | 'starts_at' | 'expires_at' | 'created_at';
  sort_dir?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class CouponsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  getAllCoupons(filters?: CouponFilters): Observable<CouponsResponse> {
    let params = new HttpParams();

    if (filters?.search) params = params.append('search', filters.search);
    if (filters?.type) params = params.append('type', filters.type);
    if (filters?.status !== undefined) params = params.append('status', filters.status.toString());
    if (filters?.sort_by) params = params.append('sort_by', filters.sort_by);
    if (filters?.sort_dir) params = params.append('sort_dir', filters.sort_dir);

    return this.http.get<CouponsResponse>(
      this.apiUrlService.getUrl('api/admin/coupons'),
      { params }
    );
  }

  getCouponById(id: number): Observable<CouponResponse> {
    return this.http.get<CouponResponse>(
      this.apiUrlService.getUrl(`api/admin/coupons/${id}`)
    );
  }

  createCoupon(coupon: CouponCreateRequest): Observable<CouponResponse> {
    return this.http.post<CouponResponse>(
      this.apiUrlService.getUrl('api/admin/coupons/create'),
      coupon
    );
  }

  updateCoupon(id: number, coupon: CouponUpdateRequest): Observable<CouponResponse> {
    return this.http.put<CouponResponse>(
      this.apiUrlService.getUrl(`api/admin/coupons/${id}`),
      coupon
    );
  }

  deleteCoupon(id: number): Observable<void> {
    return this.http.delete<void>(
      this.apiUrlService.getUrl(`api/admin/coupons/${id}`)
    );
  }

  validateCoupon(code: string, orderAmount: number): Observable<CouponValidationResponse> {
    return this.http.post<CouponValidationResponse>(
      this.apiUrlService.getUrl('api/coupons/validate'),
      { code, order_amount: orderAmount }
    );
  }

  getActiveCoupons(): Observable<CouponsResponse> {
    return this.http.get<CouponsResponse>(
      this.apiUrlService.getUrl('api/coupons/active')
    );
  }

  getCouponUsageStats(id: number): Observable<any> {
    return this.http.get(
      this.apiUrlService.getUrl(`api/admin/coupons/${id}/usage-stats`)
    );
  }
}
