import { Component, inject, signal, WritableSignal } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { RegexPatterns } from '../../../shared/constants/regex.constants';
import { ButtonLoaderDirective } from '../../../shared/directives/button-loader/button-loader.directive';
import { ValidationErrorDirective } from '../../../shared/directives/validation-error/validation-error.directive';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonLoaderDirective,
    ValidationErrorDirective
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../styles/auth.scss'
})
export class ForgotPasswordComponent {
  private readonly formBuilder = inject(UntypedFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  protected readonly isLoading: WritableSignal<boolean> = signal(false);
  protected readonly isSubmitted: WritableSignal<boolean> = signal(false);
  protected readonly emailSent: WritableSignal<boolean> = signal(false);

  forgotPasswordForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.pattern(RegexPatterns.EMAIL_PATTERN)]]
  });

  onSubmit() {
    this.isSubmitted.set(true);

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    const email = this.forgotPasswordForm.get('email')?.value;

    this.authService.forgotPassword(email)
      .pipe(
        tap(response => {
          this.emailSent.set(true);
          this.toastr.success(response.message);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās nosūtīt paroles atiestatīšanas e-pastu');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
          this.isSubmitted.set(false);
        })
      )
      .subscribe();
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
