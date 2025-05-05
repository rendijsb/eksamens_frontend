import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { catchError, EMPTY, finalize, tap, Subject, debounceTime, distinctUntilChanged } from "rxjs";
import { OrderDetailsAdminComponent } from '../order-details-admin/order-details-admin.component';
import { OrderService } from '../../../../shared/services/order.service';
import { OrderStatus, PaymentStatus, Order } from '../../../../shared/models/order.models';
import { PaginationMeta } from '../../../../shared/models/pagination.models';

@Component({
  selector: 'app-orders-admin',
  standalone: true,
  imports: [
    CommonModule,
    OrderDetailsAdminComponent
  ],
  templateUrl: './orders-admin.component.html',
  styleUrl: '../../styles/data-table-styles.scss'
})
export class OrdersAdminComponent implements OnInit {
  private readonly router: Router = inject(Router);
  private readonly orderService: OrderService = inject(OrderService);
  private readonly toastr: ToastrService = inject(ToastrService);

  protected readonly orders: WritableSignal<Order[]> = signal<Order[]>([]);
  protected readonly searchTerm: WritableSignal<string> = signal<string>('');
  protected readonly sortBy: WritableSignal<string> = signal<string>('created_at');
  protected readonly sortDir: WritableSignal<string> = signal<string>('desc');
  protected readonly selectedStatus: WritableSignal<string | null> = signal<string | null>(null);
  protected readonly selectedPaymentStatus: WritableSignal<string | null> = signal<string | null>(null);
  protected readonly isLoading: WritableSignal<boolean> = signal<boolean>(false);
  protected readonly pagination = signal<PaginationMeta | null>(null);
  protected readonly currentPage = signal<number>(1);

  protected readonly showOrderDetails = signal<boolean>(false);
  protected readonly selectedOrderId = signal<number | null>(null);

  private searchSubject = new Subject<string>();
  private readonly debounceTime: number = 300;

  readonly OrderStatus = OrderStatus;
  readonly PaymentStatus = PaymentStatus;

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged(),
      tap((value: string) => {
        this.searchTerm.set(value);
        this.getOrders();
      })
    ).subscribe();

    this.getOrders();
  }

  getOrders(): void {
    this.isLoading.set(true);

    this.orderService.getAllOrders({
      page: this.currentPage(),
      search: this.searchTerm(),
      sort_by: this.sortBy(),
      sort_dir: this.sortDir(),
      status: this.selectedStatus(),
      payment_status: this.selectedPaymentStatus()
    })
      .pipe(
        tap((response): void => {
          this.orders.set(response.data);
          this.pagination.set(response.meta);
        }),
        catchError(() => {
          this.toastr.error('Nevarēja ielādēt pasūtījumus');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatus.set(select.value || null);
    this.getOrders();
  }

  onPaymentStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedPaymentStatus.set(select.value || null);
    this.getOrders();
  }

  onSort(field: string): void {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }
    this.getOrders();
  }

  viewOrderDetails(orderId: number): void {
    this.selectedOrderId.set(orderId);
    this.showOrderDetails.set(true);
  }

  closeOrderDetails(): void {
    this.showOrderDetails.set(false);
    this.getOrders();
  }

  getStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'status-pending';
      case OrderStatus.PROCESSING:
        return 'status-processing';
      case OrderStatus.COMPLETED:
        return 'status-completed';
      case OrderStatus.CANCELLED:
        return 'status-cancelled';
      case OrderStatus.FAILED:
        return 'status-failed';
      default:
        return '';
    }
  }

  getPaymentStatusClass(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PENDING:
        return 'payment-pending';
      case PaymentStatus.PAID:
        return 'payment-paid';
      case PaymentStatus.FAILED:
        return 'payment-failed';
      case PaymentStatus.REFUNDED:
        return 'payment-refunded';
      default:
        return '';
    }
  }

  getStatusLabel(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Gaida apstiprinājumu';
      case OrderStatus.PROCESSING:
        return 'Tiek apstrādāts';
      case OrderStatus.COMPLETED:
        return 'Pabeigts';
      case OrderStatus.CANCELLED:
        return 'Atcelts';
      case OrderStatus.FAILED:
        return 'Neizdevās';
      default:
        return status;
    }
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PENDING:
        return 'Gaida maksājumu';
      case PaymentStatus.PAID:
        return 'Apmaksāts';
      case PaymentStatus.FAILED:
        return 'Maksājums neizdevās';
      case PaymentStatus.REFUNDED:
        return 'Atmaksāts';
      default:
        return status;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('lv-LV', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  getDisplayRange(): { start: number, end: number, total: number } {
    if (!this.pagination()) {
      return { start: 0, end: 0, total: 0 };
    }

    const paginationData = this.pagination()!;
    const start = (this.currentPage() - 1) * paginationData.per_page + 1;
    const end = Math.min(this.currentPage() * paginationData.per_page, paginationData.total);

    return { start, end, total: paginationData.total };
  }

  getPageNumbers(): number[] {
    if (!this.pagination()) return [];

    const totalPages = this.pagination()!.last_page;
    const currentPage = this.currentPage();

    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    return Array.from({length: endPage - startPage + 1}, (_, i) => startPage + i);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.getOrders();
  }
}
