import { Injectable, inject } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import {OrderResponse, OrdersResponse, OrderStatus} from '../models/order.models';
import {ApiUrlService} from "./api.service";

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  getUserOrders(): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>(
      this.apiUrlService.getUrl('api/orders')
    );
  }

  getOrderById(orderId: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(
      this.apiUrlService.getUrl(`api/orders/${orderId}`)
    );
  }

  getOrderByNumber(orderNumber: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(
      this.apiUrlService.getUrl(`api/orders/number/${orderNumber}`)
    );
  }

  cancelOrder(orderId: number): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(
      this.apiUrlService.getUrl(`api/orders/${orderId}/cancel`),
      {}
    );
  }

  getAllOrders(params?: {
    page?: number,
    search?: string;
    sort_by?: string;
    sort_dir?: string;
    status?: string | null;
    payment_status?: string | null;
  }): Observable<OrdersResponse> {
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

    if (params?.status) {
      queryParams = queryParams.append('status', params.status);
    }

    if (params?.payment_status) {
      queryParams = queryParams.append('payment_status', params.payment_status);
    }

    return this.http.get<OrdersResponse>(
      this.apiUrlService.getUrl('api/admin/orders'), { params: queryParams }
    );
  }

  updateOrderStatus(orderId: number, status: OrderStatus): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(
      this.apiUrlService.getUrl(`api/admin/orders/${orderId}/status`),
      { status }
    );
  }
}
