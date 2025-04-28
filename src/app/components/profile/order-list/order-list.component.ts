import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { Order, OrderStatus, PaymentStatus } from '../../../shared/models/order.models';
import { ButtonLoaderDirective } from '../../../shared/directives/button-loader/button-loader.directive';
import {OrderService} from "../../../shared/services/order.service";

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonLoaderDirective
  ],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss'
})
export class OrderListComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);

  protected readonly orders: WritableSignal<Order[]> = signal([]);
  protected readonly isLoading: WritableSignal<boolean> = signal(true);
  protected readonly processingOrderId: WritableSignal<number | null> = signal(null);

  readonly OrderStatus = OrderStatus;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);

    this.orderService.getUserOrders()
      .pipe(
        tap(response => {
          this.orders.set(response.data);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt pasūtījumus');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  cancelOrder(orderId: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!confirm('Vai tiešām vēlaties atcelt šo pasūtījumu?')) {
      return;
    }

    this.processingOrderId.set(orderId);

    this.orderService.cancelOrder(orderId)
      .pipe(
        tap(response => {
          this.toastr.success('Pasūtījums veiksmīgi atcelts');
          this.orders.update(orders =>
            orders.map(order => order.id === orderId ? response.data : order)
          );
        }),
        catchError(error => {
          this.toastr.error('Neizdevās atcelt pasūtījumu');
          return EMPTY;
        }),
        finalize(() => {
          this.processingOrderId.set(null);
        })
      )
      .subscribe();
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
}
