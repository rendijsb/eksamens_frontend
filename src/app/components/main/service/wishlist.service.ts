import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, of } from 'rxjs';
import { ApiUrlService } from '../../../shared/services/api.service';
import { Product } from '../../admin/products-page/models/products.models';

export interface WishlistResponse {
  data: Product[];
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  private wishlistItemsSubject = new BehaviorSubject<Product[]>([]);
  private wishlistCountSubject = new BehaviorSubject<number>(0);

  readonly wishlistItems$ = this.wishlistItemsSubject.asObservable();
  readonly wishlistCount$ = this.wishlistCountSubject.asObservable();

  getWishlist(): Observable<WishlistResponse> {
    return this.http.get<WishlistResponse>(
      this.apiUrlService.getUrl('api/wishlist')
    ).pipe(
      tap(response => {
        this.wishlistItemsSubject.next(response.data);
        this.wishlistCountSubject.next(response.data.length);
      }),
      catchError(error => {
        return of({ data: [] });
      })
    );
  }

  addToWishlist(productId: number): Observable<any> {
    return this.http.post(
      this.apiUrlService.getUrl('api/wishlist/add'),
      { product_id: productId }
    ).pipe(
      tap(() => {
        this.getWishlist().subscribe();
      })
    );
  }

  removeFromWishlist(productId: number): Observable<any> {
    return this.http.delete(
      this.apiUrlService.getUrl(`api/wishlist/remove/${productId}`)
    ).pipe(
      tap(() => {
        this.getWishlist().subscribe();
      })
    );
  }

  checkInWishlist(productId: number): Observable<{ in_wishlist: boolean }> {
    return this.http.get<{ in_wishlist: boolean }>(
      this.apiUrlService.getUrl(`api/wishlist/check/${productId}`)
    );
  }

  clearWishlist(): Observable<any> {
    return this.http.delete(
      this.apiUrlService.getUrl('api/wishlist/clear')
    ).pipe(
      tap(() => {
        this.wishlistItemsSubject.next([]);
        this.wishlistCountSubject.next(0);
      })
    );
  }

  toggleWishlist(productId: number): Observable<any> {
    const currentItems = this.wishlistItemsSubject.value;
    const isInWishlist = currentItems.some(item => item.id === productId);

    if (isInWishlist) {
      return this.removeFromWishlist(productId);
    } else {
      return this.addToWishlist(productId);
    }
  }

  isInWishlist(productId: number): boolean {
    const currentItems = this.wishlistItemsSubject.value;
    return currentItems.some(item => item.id === productId);
  }

  getWishlistCount(): number {
    return this.wishlistCountSubject.value;
  }
}
