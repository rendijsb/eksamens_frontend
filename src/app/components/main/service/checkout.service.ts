import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiUrlService } from '../../../shared/services/api.service';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { environment } from '../../../../environments/environment';

export interface CheckoutDetails {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address_id?: number;
  billing_address_id?: number;
  shipping_address?: any;
  billing_address?: any;
  same_billing_address: boolean;
  payment_method: string;
  notes?: string;
  coupon_code?: string;
}

export interface PaymentProcessRequest {
  payment_intent_id: string;
  order_id: number;
}

export interface CheckoutResponse {
  success: boolean;
  order: any;
  payment: {
    client_secret: string;
    payment_intent_id: string;
  };
  message?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  order?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;

  async loadStripe(): Promise<Stripe | null> {
    if (!this.stripe) {
      this.stripe = await loadStripe(environment.stripePublishableKey);
    }
    return this.stripe;
  }

  async createPaymentElement(clientSecret: string, elementId: string): Promise<void> {
    if (!this.stripe) {
      await this.loadStripe();
    }

    if (!this.stripe) {
      throw new Error('Neizdevās ielādēt Stripe');
    }

    this.elements = this.stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#8B0000',
        }
      }
    });

    this.paymentElement = this.elements.create('payment');
    this.paymentElement.mount(`#${elementId}`);
  }

  async confirmPayment(returnUrl: string): Promise<{ error?: any }> {
    if (!this.stripe || !this.elements) {
      throw new Error('Stripe nav inicializēts');
    }

    const { error } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'if_required'
    });

    return { error };
  }

  initiateCheckout(checkoutDetails: CheckoutDetails): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(
      this.apiUrlService.getUrl('api/checkout/initiate'),
      checkoutDetails
    );
  }

  processPayment(paymentData: PaymentProcessRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(
      this.apiUrlService.getUrl('api/checkout/payment'),
      paymentData
    );
  }

  getPaymentStatus(paymentIntentId: string): Observable<any> {
    return this.http.get(
      this.apiUrlService.getUrl(`api/checkout/payment-status/${paymentIntentId}`)
    );
  }

  getElements(): StripeElements | null {
    return this.elements;
  }

  getStripe(): Stripe | null {
    return this.stripe;
  }
}
