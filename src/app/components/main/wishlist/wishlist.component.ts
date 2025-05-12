import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../service/wishlist.service';
import { Product } from '../../admin/products-page/models/products.models';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, tap, finalize } from 'rxjs';
import { CartService } from '../service/cart.service';
import { StarRatingComponent } from '../../reviews/star-rating/star-rating.component';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StarRatingComponent
  ],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss'
})
export class WishlistComponent implements OnInit {
  private readonly wishlistService = inject(WishlistService);
  private readonly toastr = inject(ToastrService);
  private readonly cartService = inject(CartService);

  isLoading = signal(true);
  wishlistItems = signal<Product[]>([]);
  processingProductIds = signal<number[]>([]);

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    this.isLoading.set(true);

    this.wishlistService.getWishlist()
      .pipe(
        tap(response => {
          this.wishlistItems.set(response.data);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt vēlmju sarakstu');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  removeFromWishlist(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.setProcessingProduct(product.id, true);

    this.wishlistService.removeFromWishlist(product.id)
      .pipe(
        tap(() => {
          this.toastr.success(`${product.name} noņemts no vēlmju saraksta`);
          this.wishlistItems.update(items => items.filter(item => item.id !== product.id));
        }),
        catchError(error => {
          this.toastr.error('Neizdevās noņemt no vēlmju saraksta');
          return EMPTY;
        }),
        finalize(() => {
          this.setProcessingProduct(product.id, false);
        })
      )
      .subscribe();
  }

  addToCart(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (product.stock <= 0) {
      this.toastr.error('Produkts nav pieejams');
      return;
    }

    this.setProcessingProduct(product.id, true);

    this.cartService.addToCart(product.id)
      .pipe(
        tap(() => {
          this.toastr.success(`${product.name} pievienots grozam`);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās pievienot grozam');
          return EMPTY;
        }),
        finalize(() => {
          this.setProcessingProduct(product.id, false);
        })
      )
      .subscribe();
  }

  clearWishlist(): void {
    if (this.wishlistItems().length === 0) {
      return;
    }

    if (!confirm('Vai tiešām vēlies notīrīt vēlmju sarakstu?')) {
      return;
    }

    this.wishlistService.clearWishlist()
      .pipe(
        tap(() => {
          this.toastr.success('Vēlmju saraksts notīrīts');
          this.wishlistItems.set([]);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās notīrīt vēlmju sarakstu');
          return EMPTY;
        })
      )
      .subscribe();
  }

  isProductProcessing(productId: number): boolean {
    return this.processingProductIds().includes(productId);
  }

  private setProcessingProduct(productId: number, isProcessing: boolean): void {
    this.processingProductIds.update(ids => {
      if (isProcessing) {
        if (!ids.includes(productId)) {
          return [...ids, productId];
        }
        return ids;
      } else {
        return ids.filter(id => id !== productId);
      }
    });
  }

  getFormattedPrice(price: number | string | null): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice?.toFixed(2) || '';
  }

  getFormattedRating(rating: any): string {
    if (!rating) return '0.0';
    return Number(rating).toFixed(1);
  }
}
