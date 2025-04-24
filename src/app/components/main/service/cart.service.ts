import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, of, EMPTY } from 'rxjs';
import { ApiUrlService } from '../../../shared/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from "../../auth/services/auth.service";
import { Router } from '@angular/router';

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  sale_price: number | null;
  total_price: number;
  product: {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    stock: number;
    category: string;
    is_sale_active: boolean;
  };
  created_at: string;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  total_price: number;
  total_items: number;
  created_at: string;
  updated_at: string;
}

export interface CartResponse {
  data: Cart;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);
  private readonly toastr = inject(ToastrService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private cartSubject = new BehaviorSubject<Cart | null>(null);
  private cartItemCountSubject = new BehaviorSubject<number>(0);

  readonly cartItemCount$ = this.cartItemCountSubject.asObservable();

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(
      this.apiUrlService.getUrl('api/cart')
    ).pipe(
      tap(response => {
        this.cartSubject.next(response.data);
        this.cartItemCountSubject.next(response.data?.total_items || 0);
      }),
      catchError(error => {
        return EMPTY;
      })
    );
  }

  addToCart(productId: number, quantity: number = 1): Observable<CartResponse> {
    return this.http.post<CartResponse>(
      this.apiUrlService.getUrl('api/cart/add'),
      { product_id: productId, quantity }
    ).pipe(
      tap(response => {
        this.cartSubject.next(response.data);
        this.cartItemCountSubject.next(response.data?.total_items || 0);
      }),
      catchError(error => {
        return EMPTY;
      })
    );
  }

  updateCartItem(itemId: number, quantity: number): Observable<CartResponse> {
    return this.http.patch<CartResponse>(
      this.apiUrlService.getUrl(`api/cart/update/${itemId}`),
      { quantity }
    ).pipe(
      tap(response => {
        this.cartSubject.next(response.data);
        this.cartItemCountSubject.next(response.data?.total_items || 0);
      }),
      catchError(error => {
        return EMPTY;
      })
    );
  }

  removeFromCart(itemId: number): Observable<CartResponse> {
    return this.http.delete<CartResponse>(
      this.apiUrlService.getUrl(`api/cart/remove/${itemId}`)
    ).pipe(
      tap(response => {
        this.cartSubject.next(response.data);
        this.cartItemCountSubject.next(response.data?.total_items || 0);
      }),
      catchError(error => {
        return EMPTY;
      })
    );
  }

  clearCart(): Observable<any> {
    return this.http.delete(
      this.apiUrlService.getUrl('api/cart/clear')
    ).pipe(
      tap(() => {
        this.cartSubject.next(null);
        this.cartItemCountSubject.next(0);
      }),
      catchError(error => {
        this.cartSubject.next(null);
        this.cartItemCountSubject.next(0);
        return of({ success: true });
      })
    );
  }

  getCurrentCart(): Cart | null {
    return this.cartSubject.getValue();
  }

  getCartItemCount(): number {
    return this.cartItemCountSubject.getValue();
  }
}
