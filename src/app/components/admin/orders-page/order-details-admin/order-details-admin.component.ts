import { Component, inject, Input, OnChanges, output, signal, SimpleChanges, ViewChild, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { Order, OrderStatus, PaymentStatus } from '../../../../shared/models/order.models';
import { OrderService } from '../../../../shared/services/order.service';
import { ButtonLoaderDirective } from '../../../../shared/directives/button-loader/button-loader.directive';

@Component({
  selector: 'app-order-details-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonLoaderDirective
  ],
  templateUrl: './order-details-admin.component.html',
  styleUrl: './order-details-admin.component.scss'
})
export class OrderDetailsAdminComponent implements OnChanges {
  @Input() orderId!: number;
  close = output<void>();

  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);

  protected readonly order: WritableSignal<Order | null> = signal(null);
  protected readonly isLoading: WritableSignal<boolean> = signal(true);

  isEditingStatus = false;
  isStatusUpdating = false;

  readonly OrderStatus = OrderStatus;
  readonly PaymentStatus = PaymentStatus;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['orderId'] && this.orderId) {
      this.loadOrder();
    }
  }

  loadOrder(): void {
    this.isLoading.set(true);

    this.orderService.getOrderById(this.orderId)
      .pipe(
        tap(response => {
          this.order.set(response.data);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt pasūtījuma informāciju');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  startEditStatus(): void {
    if (this.order()?.status === OrderStatus.CANCELLED) {
      this.toastr.warning('Atceltos pasūtījumus nevar rediģēt');
      return;
    } else if (this.order()?.status === OrderStatus.COMPLETED) {
      this.toastr.warning('Pabeigtus pasūtījumus nevar rediģēt');
      return;
    }

    this.isEditingStatus = true;
  }

  cancelEditStatus(): void {
    this.isEditingStatus = false;
  }

  updateStatus(newStatus: string): void {
    if (!this.order() || newStatus === this.order()!.status) {
      this.isEditingStatus = false;
      return;
    }

    if (this.order()!.status === OrderStatus.CANCELLED) {
      this.toastr.warning('Atceltos pasūtījumus nevar rediģēt');
      this.isEditingStatus = false;
      return;
    } else if (this.order()!.status === OrderStatus.COMPLETED) {
      this.toastr.warning('Pabeigtus pasūtījumus nevar rediģēt');
      this.isEditingStatus = false;
      return;
    }

    if (this.order()!.status === OrderStatus.PROCESSING && newStatus === OrderStatus.PENDING) {
      this.toastr.warning('Nevar mainīt statusu no "Tiek apstrādāts" uz "Gaida apstiprinājumu"');
      this.isEditingStatus = false;
      return;
    }

    this.isStatusUpdating = true;

    this.orderService.updateOrderStatus(this.order()!.id, newStatus as OrderStatus)
      .pipe(
        tap(response => {
          this.order.set(response.data);
          this.toastr.success('Pasūtījuma statuss veiksmīgi atjaunināts');
          this.isEditingStatus = false;
        }),
        catchError(error => {
          this.toastr.error('Neizdevās atjaunināt pasūtījuma statusu');
          return EMPTY;
        }),
        finalize(() => {
          this.isStatusUpdating = false;
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
