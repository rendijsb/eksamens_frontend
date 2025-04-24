import { Component, OnInit, inject, signal, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CheckoutService, CheckoutDetails } from '../service/checkout.service';
import { Cart, CartService } from '../service/cart.service';
import { Address } from '../../../shared/models/address.models';
import { AddressService } from '../../../shared/services/address.service';
import { ButtonLoaderDirective } from '../../../shared/directives/button-loader/button-loader.directive';
import { ValidationErrorDirective } from '../../../shared/directives/validation-error/validation-error.directive';
import { catchError, finalize, forkJoin, EMPTY, tap } from 'rxjs';
import { AuthService } from "../../auth/services/auth.service";

enum CheckoutStep {
  DETAILS = 'details',
  PAYMENT = 'payment',
  CONFIRMATION = 'confirmation'
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonLoaderDirective,
    ValidationErrorDirective
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly cartService = inject(CartService);
  private readonly addressService = inject(AddressService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild('paymentElement') paymentElement?: ElementRef;

  protected readonly isLoading = signal<boolean>(false);
  protected readonly isProcessingPayment = signal<boolean>(false);
  protected readonly addresses = signal<Address[]>([]);
  protected readonly currentStep = signal<CheckoutStep>(CheckoutStep.DETAILS);
  protected readonly orderId = signal<number | null>(null);
  protected readonly paymentIntentId = signal<string | null>(null);
  protected readonly clientSecret = signal<string | null>(null);
  protected readonly cartData = signal<Cart | null>(null);
  protected readonly paymentError = signal<string | null>(null);
  protected readonly stripeReady = signal<boolean>(false);

  checkoutForm: FormGroup = this.fb.group({
    customer_details: this.fb.group({
      customer_name: ['', [Validators.required]],
      customer_email: ['', [Validators.required, Validators.email]],
      customer_phone: [''],
      notes: ['']
    }),
    address_details: this.fb.group({
      shipping_address_id: [''],
      billing_address_id: [''],
      same_billing_address: [true],
      notes: [''],

      shipping_address: this.fb.group({
        name: ['', [Validators.required]],
        phone: ['', [Validators.required]],
        street_address: ['', [Validators.required]],
        apartment: [''],
        city: ['', [Validators.required]],
        state: [''],
        postal_code: ['', [Validators.required]],
        country: ['', [Validators.required]]
      }),

      billing_address: this.fb.group({
        name: ['', [Validators.required]],
        phone: ['', [Validators.required]],
        street_address: ['', [Validators.required]],
        apartment: [''],
        city: ['', [Validators.required]],
        state: [''],
        postal_code: ['', [Validators.required]],
        country: ['', [Validators.required]]
      })
    }),
    payment_method: ['stripe']
  });

  readonly useExistingShippingAddress = computed(() =>
    !!this.checkoutForm.get('address_details.shipping_address_id')?.value
  );

  readonly useExistingBillingAddress = computed(() =>
    !!this.checkoutForm.get('address_details.billing_address_id')?.value
  );

  readonly useSameBillingAddress = computed(() =>
    this.checkoutForm.get('address_details.same_billing_address')?.value
  );

  readonly shouldShowBillingForm = computed(() =>
    !this.useSameBillingAddress() && !this.useExistingBillingAddress()
  );

  readonly checkoutSteps = CheckoutStep;

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.toastr.info('Lūdzu, ielogojietes, lai veiktu apmaksu');
      this.router.navigate(['/login']);
      return;
    }

    this.loadData();
    this.setupFormListeners();
  }

  ngAfterViewInit(): void {
    if (this.currentStep() === CheckoutStep.PAYMENT && this.clientSecret()) {
      this.initializeStripeElements();
    }
  }

  private loadData(): void {
    this.isLoading.set(true);

    forkJoin({
      cart: this.cartService.getCart(),
      addresses: this.addressService.getUserAddresses()
    }).pipe(
      tap(results => {
        if (!results.cart.data || !results.cart.data.items || results.cart.data.items.length === 0) {
          this.toastr.error('Jūsu grozs ir tukšs. Lūdzu, pievienojiet preces pirms apmaksas.');
          this.router.navigate(['/cart']);
          return;
        }

        this.cartData.set(results.cart.data);
        this.addresses.set(results.addresses.data);

        const user = this.authService.user();
        if (user) {
          this.checkoutForm.patchValue({
            customer_details: {
              customer_name: user.name,
              customer_email: user.email,
              customer_phone: user.phone || ''
            }
          });
        }
      }),
      catchError(error => {
        if (error.status === 401) {
          this.toastr.error('Jums ir jāielogojas');
        }
        this.router.navigate(['/cart']);
        return EMPTY;
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    ).subscribe();
  }

  private setupFormListeners(): void {
    this.checkoutForm.get('address_details.shipping_address_id')?.valueChanges.subscribe(value => {
      const shippingAddressForm = this.checkoutForm.get('address_details.shipping_address');

      if (value) {
        shippingAddressForm?.disable();
      } else {
        shippingAddressForm?.enable();
      }
    });

    this.checkoutForm.get('address_details.billing_address_id')?.valueChanges.subscribe(value => {
      const billingAddressForm = this.checkoutForm.get('address_details.billing_address');

      if (value) {
        billingAddressForm?.disable();
      } else {
        billingAddressForm?.enable();
      }
    });

    this.checkoutForm.get('address_details.same_billing_address')?.valueChanges.subscribe(sameAddress => {
      const billingGroup = this.checkoutForm.get('address_details.billing_address');
      const billingAddressId = this.checkoutForm.get('address_details.billing_address_id');

      if (sameAddress) {
        billingGroup?.disable();
        billingAddressId?.disable();
      } else {
        if (!billingAddressId?.value) {
          billingGroup?.enable();
        }
        billingAddressId?.enable();
      }
    });
  }

  goToStep(step: CheckoutStep): void {
    if (step === CheckoutStep.PAYMENT && this.currentStep() === CheckoutStep.DETAILS) {
      if (!this.cartData() || !this.cartData()?.items || this.cartData()?.items.length === 0) {
        this.toastr.error('Jūsu grozs ir tukšs. Lūdzu, pievienojiet preces pirms apmaksas.');
        this.router.navigate(['/cart']);
        return;
      }

      if (!this.validateDetailsStep()) {
        return;
      }
      this.initiatePayment();
    } else if (step === CheckoutStep.DETAILS && this.currentStep() === CheckoutStep.PAYMENT) {
      this.currentStep.set(step);
    } else {
      this.currentStep.set(step);
    }
  }

  validateDetailsStep(): boolean {
    const customerDetails = this.checkoutForm.get('customer_details');
    const addressDetails = this.checkoutForm.get('address_details');

    if (customerDetails?.invalid) {
      customerDetails.markAllAsTouched();
      this.toastr.error('Lūdzu, aizpildiet visus nepieciešamos klienta datus');
      return false;
    }

    const shippingAddressId = addressDetails?.get('shipping_address_id')?.value;
    if (!shippingAddressId) {
      const shippingAddress = addressDetails?.get('shipping_address');

      if (shippingAddress?.invalid) {
        shippingAddress.markAllAsTouched();
        this.toastr.error('Lūdzu, aizpildiet visus nepieciešamos piegādes datus');
        return false;
      }
    }

    const sameBillingAddress = addressDetails?.get('same_billing_address')?.value;
    if (!sameBillingAddress) {
      const billingAddressId = addressDetails?.get('billing_address_id')?.value;

      if (!billingAddressId) {
        const billingAddress = addressDetails?.get('billing_address');

        if (billingAddress?.invalid) {
          billingAddress.markAllAsTouched();
          this.toastr.error('Lūdzu, aizpildiet visus nepieciešamos norēķinu datus');
          return false;
        }
      }
    }

    return true;
  }

  initiatePayment(): void {
    if (!this.authService.isAuthenticated()) {
      this.toastr.info('Lūdzu, ielogojietes, lai veiktu apmaksu');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading.set(true);

    const checkoutDetails: CheckoutDetails = this.createCheckoutPayload();

    this.checkoutService.initiateCheckout(checkoutDetails).pipe(
      tap(response => {
        if (response.success) {
          this.orderId.set(response.order.id);
          this.paymentIntentId.set(response.payment.payment_intent_id);
          this.clientSecret.set(response.payment.client_secret);
          this.currentStep.set(CheckoutStep.PAYMENT);

          setTimeout(() => {
            this.initializeStripeElements();
          }, 0);
        } else {
          this.toastr.error('Neizdevās inicializēt maksājumu');
        }
      }),
      catchError(error => {
        this.toastr.error('Neizdevās inicializēt maksājumu');
        return EMPTY;
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    ).subscribe();
  }

  createCheckoutPayload(): CheckoutDetails {
    const formValue = this.checkoutForm.value;
    const customerDetails = formValue.customer_details;
    const addressDetails = formValue.address_details;

    const payload: CheckoutDetails = {
      customer_name: customerDetails.customer_name,
      customer_email: customerDetails.customer_email,
      customer_phone: customerDetails.customer_phone,
      same_billing_address: addressDetails.same_billing_address,
      payment_method: formValue.payment_method,
      notes: customerDetails.notes
    };

    if (addressDetails.shipping_address_id) {
      payload.shipping_address_id = addressDetails.shipping_address_id;

      const selectedAddress = this.getAddressById(parseInt(addressDetails.shipping_address_id, 10));
      if (selectedAddress) {
        payload.shipping_address = {
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          street_address: selectedAddress.street_address,
          apartment: selectedAddress.apartment || '',
          city: selectedAddress.city,
          state: selectedAddress.state || '',
          postal_code: selectedAddress.postal_code,
          country: selectedAddress.country
        };
      }
    } else {
      payload.shipping_address = addressDetails.shipping_address;
    }

    if (!addressDetails.same_billing_address) {
      if (addressDetails.billing_address_id) {
        payload.billing_address_id = addressDetails.billing_address_id;

        const selectedBillingAddress = this.getAddressById(parseInt(addressDetails.billing_address_id, 10));
        if (selectedBillingAddress) {
          payload.billing_address = {
            name: selectedBillingAddress.name,
            phone: selectedBillingAddress.phone,
            street_address: selectedBillingAddress.street_address,
            apartment: selectedBillingAddress.apartment || '',
            city: selectedBillingAddress.city,
            state: selectedBillingAddress.state || '',
            postal_code: selectedBillingAddress.postal_code,
            country: selectedBillingAddress.country
          };
        }
      } else {
        payload.billing_address = addressDetails.billing_address;
      }
    }

    return payload;
  }

  async initializeStripeElements(): Promise<void> {
    if (!this.clientSecret() || !this.paymentElement) {
      return;
    }

    try {
      await this.checkoutService.createPaymentElement(
        this.clientSecret()!,
        'payment-element'
      );
      this.stripeReady.set(true);
    } catch (error) {
      this.toastr.error('Neizdevās ielādēt maksājuma formu. Lūdzu, mēģiniet vēlreiz.');
    }
  }

  async processPayment(): Promise<void> {
    if (!this.orderId() || !this.paymentIntentId()) {
      this.toastr.error('Trūkst pasūtījuma informācijas');
      return;
    }

    this.isProcessingPayment.set(true);
    this.paymentError.set(null);

    try {
      const { error } = await this.checkoutService.confirmPayment(
        window.location.origin + '/checkout/confirmation'
      );

      if (error) {
        this.paymentError.set('Maksājums neizdevās');
        this.toastr.error('Maksājums neizdevās');
        this.isProcessingPayment.set(false);
        return;
      }

      this.checkoutService.processPayment({
        payment_intent_id: this.paymentIntentId()!,
        order_id: this.orderId()!
      }).pipe(
        tap(response => {
          if (response.success) {
            this.toastr.success('Maksājums veiksmīgs!');
            this.currentStep.set(CheckoutStep.CONFIRMATION);
          } else {
            this.paymentError.set('Maksājuma apstrāde neizdevās');
            this.toastr.error('Maksājuma apstrāde neizdevās');
          }
        }),
        catchError(error => {
          if (error.status === 401) {
            this.toastr.error('Sesija ir beigusies. Lūdzu, ielogojieties vēlreiz.');
            this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
          } else {
            this.paymentError.set('Neizdevās apstrādāt maksājumu');
            this.toastr.error('Neizdevās apstrādāt maksājumu');
          }
          return EMPTY;
        }),
        finalize(() => {
          this.isProcessingPayment.set(false);
        })
      ).subscribe();
    } catch (e) {
      this.paymentError.set('Radās neparedzēta kļūda');
      this.toastr.error('Radās neparedzēta kļūda');
      this.isProcessingPayment.set(false);
    }
  }

  getAddressById(id: number): Address | undefined {
    return this.addresses().find(address => address.id === id);
  }

  returnToShopping(): void {
    this.router.navigate(['/']);
  }

  viewOrder(): void {
    this.router.navigate(['/profile/orders', this.orderId()]);
  }
}
