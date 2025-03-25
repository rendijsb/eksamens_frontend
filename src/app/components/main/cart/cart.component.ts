import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Cart, CartItem, CartService } from '../service/cart.service';
import { EMPTY, catchError, finalize, tap } from 'rxjs';
import { ButtonLoaderDirective } from '../../../shared/directives/button-loader/button-loader.directive';
import { FormsModule } from '@angular/forms';
import {ToastrService} from "ngx-toastr";

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonLoaderDirective,
    FormsModule
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly toastr = inject(ToastrService);

  protected readonly cart = signal<Cart | null>(null);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly processingItemIds = signal<number[]>([]);

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.isLoading.set(true);

    this.cartService.getCart()
      .pipe(
        tap(response => {
          this.cart.set(response.data);
        }),
        catchError(error => {
          this.cart.set(null);
          if (error.status !== 404) {
            this.toastr.error('Neizdevās ielādēt grozu');
          }
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  updateItemQuantity(item: CartItem, newQuantityValue: string | number): void {
    const newQuantity = typeof newQuantityValue === 'string'
      ? parseInt(newQuantityValue, 10)
      : newQuantityValue;

    if (isNaN(newQuantity) || newQuantity === item.quantity) {
      return;
    }

    this.setProcessingItem(item.id, true);

    this.cartService.updateCartItem(item.id, newQuantity)
      .pipe(
        tap(response => {
          this.cart.set(response.data);
        }),
        catchError(() => {
          return EMPTY;
        }),
        finalize(() => {
          this.setProcessingItem(item.id, false);
        })
      )
      .subscribe();
  }

  removeItem(item: CartItem): void {
    this.setProcessingItem(item.id, true);

    this.cartService.removeFromCart(item.id)
      .pipe(
        tap(response => {
          this.cart.set(response.data);
        }),
        catchError(() => {
          return EMPTY;
        }),
        finalize(() => {
          this.setProcessingItem(item.id, false);
        })
      )
      .subscribe();
  }

  clearCart(): void {
    if (!confirm('Vai tiešām vēlies notīrīt grozu?')) {
      return;
    }

    this.isLoading.set(true);

    this.cartService.clearCart()
      .pipe(
        tap(() => {
          this.cart.set(null);
        }),
        catchError(() => {
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  incrementQuantity(item: CartItem): void {
    if (item.quantity < item.product.stock) {
      this.updateItemQuantity(item, item.quantity + 1);
    }
  }

  decrementQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.updateItemQuantity(item, item.quantity - 1);
    }
  }

  isItemProcessing(itemId: number): boolean {
    return this.processingItemIds().includes(itemId);
  }

  private setProcessingItem(itemId: number, isProcessing: boolean): void {
    this.processingItemIds.update(ids => {
      if (isProcessing) {
        if (!ids.includes(itemId)) {
          return [...ids, itemId];
        }
        return ids;
      } else {
        return ids.filter(id => id !== itemId);
      }
    });
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }
}
