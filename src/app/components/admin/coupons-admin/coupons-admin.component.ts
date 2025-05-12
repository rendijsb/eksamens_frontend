import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, finalize, tap, of } from 'rxjs';
import { ButtonLoaderDirective } from '../../../shared/directives/button-loader/button-loader.directive';
import {Coupon, CouponFilters, CouponsService} from "../../main/service/coupon.service";

@Component({
  selector: 'app-coupons-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ButtonLoaderDirective
  ],
  templateUrl: './coupons-admin.component.html',
  styleUrls: ['../styles/admin-page-styles.scss', '../styles/data-table-styles.scss']
})
export class CouponsAdminComponent implements OnInit {
  private readonly couponsService = inject(CouponsService);
  private readonly toastr = inject(ToastrService);

  protected readonly coupons = signal<Coupon[]>([]);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly currentPage = signal<number>(1);
  protected readonly totalPages = signal<number>(1);
  protected readonly totalItems = signal<number>(0);
  protected readonly processingIds = signal<number[]>([]);

  protected readonly searchTerm = signal<string>('');
  protected readonly typeFilter = signal<string>('');
  protected readonly statusFilter = signal<string>('');
  protected readonly sortBy = signal<string>('created_at');
  protected readonly sortDir = signal<string>('desc');

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.isLoading.set(true);

    const filters: CouponFilters = {
      search: this.searchTerm() || undefined,
      type: this.typeFilter() as any || undefined,
      status: this.statusFilter() ? this.statusFilter() === 'true' : undefined,
      sort_by: this.sortBy() as any,
      sort_dir: this.sortDir() as any
    };

    this.couponsService.getAllCoupons(filters)
      .pipe(
        tap(response => {
          this.coupons.set(response.data);
          if (response.meta) {
            this.currentPage.set(response.meta.current_page);
            this.totalPages.set(response.meta.last_page);
            this.totalItems.set(response.meta.total);
          }
        }),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt kuponus');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadCoupons();
  }

  onSort(column: string): void {
    if (this.sortBy() === column) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortDir.set('asc');
    }
    this.loadCoupons();
  }

  deleteCoupon(coupon: Coupon): void {
    if (!confirm('Vai tiešām vēlaties dzēst šo kuponu?')) {
      return;
    }

    this.processingIds.update(ids => [...ids, coupon.id]);

    this.couponsService.deleteCoupon(coupon.id)
      .pipe(
        tap(() => {
          this.toastr.success('Kupons veiksmīgi izdzēsts');
          this.loadCoupons();
        }),
        catchError(error => {
          this.toastr.error(error.error?.message || 'Neizdevās dzēst kuponu');
          return EMPTY;
        }),
        finalize(() => {
          this.processingIds.update(ids => ids.filter(id => id !== coupon.id));
        })
      )
      .subscribe();
  }

  isProcessing(id: number): boolean {
    return this.processingIds().includes(id);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('lv-LV');
  }

  formatCurrency(amount: number|undefined): string {
    return amount ? `€${amount.toFixed(2)}` : '';
  }

  formatPercentage(percentage: number): string {
    return `${percentage}%`;
  }

  getDiscountDisplay(coupon: Coupon): string {
    if (coupon.type === 'percentage') {
      return this.formatPercentage(coupon.value);
    }
    return this.formatCurrency(coupon.value);
  }

  getSortIcon(column: string): string {
    if (this.sortBy() !== column) return 'fa-sort';
    return this.sortDir() === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  getStatusClass(coupon: Coupon): string {
    if (!coupon.is_active) return 'inactive';
    if (coupon.is_expired) return 'expired';
    if (!coupon.is_valid) return 'invalid';
    return 'active';
  }

  getStatusLabel(coupon: Coupon): string {
    if (!coupon.is_active) return 'Neaktīvs';
    if (coupon.is_expired) return 'Beidzies';
    if (!coupon.is_valid) return 'Nevalīds';
    return 'Aktīvs';
  }
}
