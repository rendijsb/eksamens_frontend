import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject, Observable, catchError, tap, of, map, switchMap, EMPTY} from 'rxjs';
import { ApiUrlService } from '../../../shared/services/api.service';
import { ToastrService } from 'ngx-toastr';

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
  user_id: number | null;
  session_id: string | null;
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

  private cartSubject = new BehaviorSubject<Cart | null>(null);
  private cartItemCountSubject = new BehaviorSubject<number>(0);

  readonly cartItemCount$ = this.cartItemCountSubject.asObservable();

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(
      this.apiUrlService.getUrl('api/cart'),
      { withCredentials: true }
    ).pipe(
      tap(response => {
        this.cartSubject.next(response.data);
        this.cartItemCountSubject.next(response.data.total_items);
      }),
      catchError(error => {
        return EMPTY;
      }),
      tap(response => response.data)
    );
  }

  addToCart(productId: number, quantity: number = 1): Observable<CartResponse> {
    return this.http.post<CartResponse>(
      this.apiUrlService.getUrl('api/cart/add'),
      { product_id: productId, quantity },
      { withCredentials: true, observe: 'response' }
    ).pipe(
      tap(response => {
        this.cartSubject.next(response.body?.data || null);
        this.cartItemCountSubject.next(response.body?.data.total_items || 0);
      }),
      map(response => response.body as CartResponse),
      catchError(error => {
        this.toastr.error('Neizdevās pievienot preci grozam');
        return EMPTY;
      })
    );
  }

  updateCartItem(itemId: number, quantity: number): Observable<CartResponse> {
    return this.ensureCartExists().pipe(
      switchMap(() => {
        return this.http.patch<CartResponse>(
          this.apiUrlService.getUrl(`api/cart/update/${itemId}`),
          { quantity },
          { withCredentials: true }
        );
      }),
      tap(response => {
        this.cartSubject.next(response.data);
        this.cartItemCountSubject.next(response.data.total_items);
      }),
      catchError(error => {
        this.toastr.error('Neizdevās atjaunināt grozu');
        return EMPTY;
      })
    );
  }

  removeFromCart(itemId: number): Observable<CartResponse> {
    return this.http.delete<CartResponse>(
      this.apiUrlService.getUrl(`api/cart/remove/${itemId}`),
      { withCredentials: true }
    ).pipe(
      tap(response => {
        this.cartSubject.next(response.data);
        this.cartItemCountSubject.next(response.data?.total_items || 0);
      }),
      catchError(error => {
        this.toastr.error('Neizdevās noņemt preci no groza');
        return EMPTY;
      })
    );
  }

  clearCart(): Observable<any> {
    return this.http.delete(
      this.apiUrlService.getUrl('api/cart/clear'),
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.cartSubject.next(null);
        this.cartItemCountSubject.next(0);
      }),
      catchError(error => {
        this.cartSubject.next(null);
        this.cartItemCountSubject.next(0);
        return EMPTY;
      })
    );
  }

  migrateCart(): Observable<CartResponse> {
    return this.http.post<CartResponse>(
      this.apiUrlService.getUrl('api/cart/migrate'),
      {}
    ).pipe(
      tap(response => {
        this.cartSubject.next(response.data);
        this.cartItemCountSubject.next(response.data.total_items);
      }),
      catchError(error => {
        return EMPTY;
      }),
      tap(response => response.data)
    );
  }

  private ensureCartExists(): Observable<Cart> {
    const currentCart = this.cartSubject.getValue();
    if (currentCart) {
      return of(currentCart);
    } else {
      return this.http.post<CartResponse>(
        this.apiUrlService.getUrl('api/cart/add'),
        { product_id: null, quantity: 0 },
        { withCredentials: true }
      ).pipe(
        map(response => response.data),
        tap(cart => {
          this.cartSubject.next(cart);
          this.cartItemCountSubject.next(cart.total_items || 0);
        })
      );
    }
  }

  getCurrentCart(): Cart | null {
    return this.cartSubject.getValue();
  }

  getCartItemCount(): number {
    return this.cartItemCountSubject.getValue();
  }
}
