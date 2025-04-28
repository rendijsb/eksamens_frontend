import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderResponse, OrdersResponse } from '../models/order.models';
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
}
