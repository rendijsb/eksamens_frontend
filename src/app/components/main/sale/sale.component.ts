import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicService } from '../service/public.service';
import { Product } from '../../admin/products-page/models/products.models';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, tap } from 'rxjs';
import { StarRatingComponent } from '../../reviews/star-rating/star-rating.component';

@Component({
  selector: 'app-sale',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StarRatingComponent
  ],
  templateUrl: './sale.component.html',
  styleUrl: './sale.component.scss'
})
export class SaleComponent implements OnInit {
  private readonly publicService = inject(PublicService);
  private readonly toastr = inject(ToastrService);

  protected readonly products = signal<Product[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);

  ngOnInit(): void {
    this.loadSaleProducts();
  }

  loadSaleProducts(page: number = 1): void {
    this.isLoading.set(true);

    this.publicService.getSaleProducts(page)
      .pipe(
        tap(response => {
          this.products.set(response.data);
          this.currentPage.set(response.meta.current_page);
          this.totalPages.set(response.meta.last_page);
        }),
        catchError(() => {
          this.toastr.error('Failed to load sale products');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.isLoading.set(false);
      });
  }

  getDiscountPercentage(product: Product): number {
    if (!product.sale_price) return 0;
    const originalPrice = parseFloat(product.price as string);
    const salePrice = parseFloat(product.sale_price as string);
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  }

  formatPrice(price: number | string | null): string {
    if (price === null) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : (price as number);
    return numPrice.toFixed(2);
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.loadSaleProducts(newPage);
    }
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }
}
