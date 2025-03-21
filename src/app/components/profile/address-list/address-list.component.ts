import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { AddressService } from '../../../shared/services/address.service';
import { Address } from '../../../shared/models/address.models';
import {ButtonLoaderDirective} from "../../../shared/directives/button-loader/button-loader.directive";

@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonLoaderDirective
  ],
  templateUrl: './address-list.component.html',
  styleUrl: './address-list.component.scss'
})
export class AddressListComponent implements OnInit {
  private readonly addressService = inject(AddressService);
  private readonly toastr = inject(ToastrService);

  protected readonly addresses: WritableSignal<Address[]> = signal([]);
  protected readonly isLoading: WritableSignal<boolean> = signal(true);
  protected readonly processingAddressId: WritableSignal<number | null> = signal(null);

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.isLoading.set(true);

    this.addressService.getUserAddresses()
      .pipe(
        tap(response => {
          this.addresses.set(response.data);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt adreses');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  getAddressTypeLabel(type: string): string {
    switch (type) {
      case 'shipping':
        return 'Piegādes adrese';
      case 'billing':
        return 'Norēķinu adrese';
      case 'both':
        return 'Piegādes un norēķinu adrese';
      default:
        return 'Adrese';
    }
  }

  deleteAddress(addressId: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!confirm('Vai tiešām vēlaties dzēst šo adresi?')) {
      return;
    }

    this.processingAddressId.set(addressId);

    this.addressService.deleteAddress(addressId)
      .pipe(
        tap(() => {
          this.toastr.success('Adrese veiksmīgi dzēsta');
          this.addresses.update(addresses =>
            addresses.filter(address => address.id !== addressId)
          );
        }),
        catchError(error => {
          this.toastr.error('Neizdevās dzēst adresi');
          return EMPTY;
        }),
        finalize(() => {
          this.processingAddressId.set(null);
        })
      )
      .subscribe();
  }

  setAsDefault(addressId: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.processingAddressId.set(addressId);

    this.addressService.setDefaultAddress(addressId)
      .pipe(
        tap(response => {
          const updatedAddress = response.data;
          this.toastr.success('Adrese iestatīta kā noklusējuma');

          this.addresses.update(addresses =>
            addresses.map(address => {
              if (address.id === addressId) {
                return { ...address, is_default: true };
              }

              if (address.type === updatedAddress.type ||
                address.type === 'both' ||
                updatedAddress.type === 'both') {
                return { ...address, is_default: false };
              }

              return address;
            })
          );
        }),
        catchError(error => {
          this.toastr.error('Neizdevās iestatīt adresi kā noklusējuma');
          return EMPTY;
        }),
        finalize(() => {
          this.processingAddressId.set(null);
        })
      )
      .subscribe();
  }
}
