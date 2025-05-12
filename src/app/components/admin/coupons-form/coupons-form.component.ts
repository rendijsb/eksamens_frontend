import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, switchMap, tap } from 'rxjs';
import { ButtonLoaderDirective } from '../../../shared/directives/button-loader/button-loader.directive';
import { ValidationErrorDirective } from '../../../shared/directives/validation-error/validation-error.directive';
import {CouponCreateRequest, CouponsService, CouponUpdateRequest} from "../../main/service/coupon.service";

@Component({
  selector: 'app-coupon-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonLoaderDirective,
    ValidationErrorDirective
  ],
  templateUrl: './coupons-form.component.html',
  styleUrls: ['../styles/admin-page-styles.scss']
})
export class CouponFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly couponsService = inject(CouponsService);
  private readonly toastr = inject(ToastrService);

  protected readonly isLoading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly isEditMode = signal<boolean>(false);
  protected readonly couponId = signal<number | null>(null);

  couponForm: FormGroup = this.fb.group({
    code: ['', [
      Validators.required,
      Validators.maxLength(50),
      Validators.pattern(/^[A-Z0-9_-]{3,}$/)
    ]],
    type: ['percentage', [Validators.required]],
    value: ['', [
      Validators.required,
      Validators.min(0),
      Validators.max(100)
    ]],
    min_order_amount: ['', [Validators.min(0)]],
    max_discount_amount: ['', [Validators.min(0)]],
    uses_per_user: ['', [Validators.min(1)]],
    total_uses: ['', [Validators.min(1)]],
    starts_at: ['', [Validators.required]],
    expires_at: ['', [Validators.required]],
    is_active: [true],
    description: ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    const couponId = this.route.snapshot.paramMap.get('couponId');

    if (couponId) {
      this.isEditMode.set(true);
      this.couponId.set(parseInt(couponId, 10));
      this.loadCoupon(this.couponId()!);
    } else {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      this.couponForm.patchValue({
        starts_at: tomorrow.toISOString().slice(0, 16),
        expires_at: nextWeek.toISOString().slice(0, 16)
      });
    }

    this.addCustomValidators();
  }

  loadCoupon(id: number): void {
    this.isLoading.set(true);

    this.couponsService.getCouponById(id)
      .pipe(
        tap(response => {
          const coupon = response.data;
          this.couponForm.patchValue({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            min_order_amount: coupon.min_order_amount || '',
            max_discount_amount: coupon.max_discount_amount || '',
            uses_per_user: coupon.uses_per_user || '',
            total_uses: coupon.total_uses || '',
            starts_at: this.formatDateForInput(coupon.starts_at),
            expires_at: this.formatDateForInput(coupon.expires_at),
            is_active: coupon.is_active,
            description: coupon.description || ''
          });
        }),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt kupona informāciju');
          this.router.navigate(['/admin/coupons']);
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  addCustomValidators(): void {
    this.couponForm.get('expires_at')?.addValidators((control) => {
      const startsAt = this.couponForm.get('starts_at')?.value;
      const expiresAt = control.value;

      if (startsAt && expiresAt && new Date(expiresAt) <= new Date(startsAt)) {
        return { dateOrder: true };
      }
      return null;
    });

    this.couponForm.get('type')?.valueChanges.subscribe(type => {
      const valueControl = this.couponForm.get('value');
      if (type === 'percentage') {
        valueControl?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      } else {
        valueControl?.setValidators([Validators.required, Validators.min(0)]);
      }
      valueControl?.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.couponForm.value;

    const couponData = {
      ...formValue,
      code: formValue.code.toUpperCase(),
      value: parseFloat(formValue.value),
      min_order_amount: formValue.min_order_amount ? parseFloat(formValue.min_order_amount) : undefined,
      max_discount_amount: formValue.max_discount_amount ? parseFloat(formValue.max_discount_amount) : undefined,
      uses_per_user: formValue.uses_per_user ? parseInt(formValue.uses_per_user, 10) : undefined,
      total_uses: formValue.total_uses ? parseInt(formValue.total_uses, 10) : undefined,
      starts_at: new Date(formValue.starts_at).toISOString(),
      expires_at: new Date(formValue.expires_at).toISOString()
    };

    const request = this.isEditMode()
      ? this.couponsService.updateCoupon(this.couponId()!, couponData as CouponUpdateRequest)
      : this.couponsService.createCoupon(couponData as CouponCreateRequest);

    request
      .pipe(
        tap(response => {
          const actionText = this.isEditMode() ? 'atjaunināts' : 'izveidots';
          this.toastr.success(`Kupons veiksmīgi ${actionText}`);
          this.router.navigate(['/admin/coupons']);
        }),
        catchError(error => {
          this.toastr.error(error.error?.message || 'Neizdevās saglabāt kuponu');
          return EMPTY;
        }),
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe();
  }

  formatDateForInput(dateString: string): string {
    return new Date(dateString).toISOString().slice(0, 16);
  }

  onTypeChange(type: string): void {
    const valueControl = this.couponForm.get('value');
    if (type === 'percentage') {
      if (valueControl && parseFloat(valueControl.value) > 100) {
        valueControl.setValue(100);
      }
    }
  }

  getValidationError(controlName: string): string | null {
    const control = this.couponForm.get(controlName);
    if (!control || !control.errors || !control.touched) {
      return null;
    }

    if (control.errors['required']) {
      return 'Šis lauks ir obligāts';
    }
    if (control.errors['min']) {
      return `Minimālā vērtība: ${control.errors['min'].min}`;
    }
    if (control.errors['max']) {
      return `Maksimālā vērtība: ${control.errors['max'].max}`;
    }
    if (control.errors['pattern']) {
      return 'Nepareizs formāts. Izmantojiet tikai lielos burtus, ciparus, _ un -';
    }
    if (control.errors['maxlength']) {
      return `Maksimālais garums: ${control.errors['maxlength'].requiredLength}`;
    }
    if (control.errors['dateOrder']) {
      return 'Beigu datums jābūt pēc sākuma datuma';
    }

    return null;
  }
}
