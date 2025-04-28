import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { Order, OrderStatus, PaymentStatus } from '../../../shared/models/order.models';
import { ButtonLoaderDirective } from '../../../shared/directives/button-loader/button-loader.directive';
import {OrderService} from "../../../shared/services/order.service";

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonLoaderDirective
  ],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss'
})
export class OrderDetailComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly order: WritableSignal<Order | null> = signal(null);
  protected readonly isLoading: WritableSignal<boolean> = signal(true);
  protected readonly isCancelling: WritableSignal<boolean> = signal(false);

  readonly OrderStatus = OrderStatus;
  readonly PaymentStatus = PaymentStatus;

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');

    if (!orderId) {
      this.router.navigate(['/profile/orders']);
      return;
    }

    this.loadOrder(parseInt(orderId, 10));
  }

  loadOrder(orderId: number): void {
    this.isLoading.set(true);

    this.orderService.getOrderById(orderId)
      .pipe(
        tap(response => {
          this.order.set(response.data);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt pasūtījuma informāciju');
          this.router.navigate(['/profile/orders']);
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  cancelOrder(): void {
    if (!this.order() || this.isCancelling()) {
      return;
    }

    if (!confirm('Vai tiešām vēlaties atcelt šo pasūtījumu?')) {
      return;
    }

    this.isCancelling.set(true);

    this.orderService.cancelOrder(this.order()!.id)
      .pipe(
        tap(response => {
          this.order.set(response.data);
          this.toastr.success('Pasūtījums veiksmīgi atcelts');
        }),
        catchError(error => {
          this.toastr.error('Neizdevās atcelt pasūtījumu');
          return EMPTY;
        }),
        finalize(() => {
          this.isCancelling.set(false);
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

  goBack(): void {
    this.location.back();
  }
}
