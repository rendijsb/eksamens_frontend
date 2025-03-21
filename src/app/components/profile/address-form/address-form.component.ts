import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { AddressService } from '../../../shared/services/address.service';
import { Address } from '../../../shared/models/address.models';
import {ButtonLoaderDirective} from "../../../shared/directives/button-loader/button-loader.directive";
import {ValidationErrorDirective} from "../../../shared/directives/validation-error/validation-error.directive";

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonLoaderDirective,
    ValidationErrorDirective
  ],
  templateUrl: './address-form.component.html',
  styleUrl: './address-form.component.scss'
})
export class AddressFormComponent implements OnInit {
  private readonly addressService = inject(AddressService);
  private readonly toastr = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly isLoading: WritableSignal<boolean> = signal(false);
  protected readonly isSubmitting: WritableSignal<boolean> = signal(false);
  protected readonly isSubmitted: WritableSignal<boolean> = signal(false);
  protected readonly isEditMode: WritableSignal<boolean> = signal(false);
  protected readonly address: WritableSignal<Address | null> = signal(null);

  addressForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    street_address: ['', [Validators.required]],
    apartment: [''],
    city: ['', [Validators.required]],
    state: [''],
    postal_code: ['', [Validators.required]],
    country: ['', [Validators.required]],
    is_default: [false],
    type: ['both', [Validators.required]]
  });

  ngOnInit(): void {
    const addressId = this.route.snapshot.paramMap.get('id');

    if (addressId && addressId !== 'new') {
      this.isEditMode.set(true);
      this.loadAddress(Number(addressId));
    }
  }

  loadAddress(addressId: number): void {
    this.isLoading.set(true);

    this.addressService.getAddressById(addressId)
      .pipe(
        tap(response => {
          const address = response.data;
          this.address.set(address);
          this.updateFormValues(address);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt adreses informāciju');
          this.router.navigate(['/profile/addresses']);
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  updateFormValues(address: Address): void {
    this.addressForm.patchValue({
      name: address.name,
      phone: address.phone,
      street_address: address.street_address,
      apartment: address.apartment || '',
      city: address.city,
      state: address.state || '',
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
      type: address.type
    });
  }

  goBack(): void {
    this.location.back();
  }

  onSubmit(): void {
    this.isSubmitted.set(true);

    if (this.addressForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditMode()) {
      this.updateAddress();
    } else {
      this.createAddress();
    }
  }

  createAddress(): void {
    this.addressService.createAddress(this.addressForm.value)
      .pipe(
        tap(response => {
          this.toastr.success('Adrese veiksmīgi pievienota');
          this.router.navigate(['/profile/addresses']);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās pievienot adresi');
          return EMPTY;
        }),
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe();
  }

  updateAddress(): void {
    if (!this.address()) {
      return;
    }

    this.addressService.updateAddress(this.address()!.id, this.addressForm.value)
      .pipe(
        tap(response => {
          this.toastr.success('Adrese veiksmīgi atjaunināta');
          this.router.navigate(['/profile/addresses']);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās atjaunināt adresi');
          return EMPTY;
        }),
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe();
  }
}
