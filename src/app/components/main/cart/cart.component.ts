import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Cart, CartItem, CartService } from '../service/cart.service';
import { EMPTY, catchError, finalize, tap } from 'rxjs';
import { ButtonLoaderDirective } from '../../../shared/directives/button-loader/button-loader.directive';
import { FormsModule } from '@angular/forms';
import { ToastrService } from "ngx-toastr";
import { AuthService } from '../../auth/services/auth.service';

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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly cart = signal<Cart | null>(null);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly processingItemIds = signal<number[]>([]);
  protected readonly isAuthenticated = signal<boolean>(false);

  ngOnInit(): void {
    this.isAuthenticated.set(this.authService.isAuthenticated());

    if (this.isAuthenticated()) {
      this.loadCart();
    } else {
      this.isLoading.set(false);
    }
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
    if (!this.isAuthenticated()) {
      this.toastr.info('Lūdzu, ielogojietes, lai atjauninātu grozu');
      this.navigateToLogin();
      return;
    }

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
    if (!this.isAuthenticated()) {
      this.toastr.info('Lūdzu, ielogojietes, lai izmantotu grozu');
      this.navigateToLogin();
      return;
    }

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
    if (!this.isAuthenticated()) {
      this.toastr.info('Lūdzu, ielogojietes, lai izmantotu grozu');
      this.navigateToLogin();
      return;
    }

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

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
