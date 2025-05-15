import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { RegexPatterns } from '../../../shared/constants/regex.constants';
import { passwordMatchValidator } from '../../../shared/validators/password-match.validator';
import { ButtonLoaderDirective } from '../../../shared/directives/button-loader/button-loader.directive';
import { ValidationErrorDirective } from '../../../shared/directives/validation-error/validation-error.directive';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonLoaderDirective,
    ValidationErrorDirective
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: '../styles/auth.scss'
})
export class ResetPasswordComponent implements OnInit {
  private readonly formBuilder = inject(UntypedFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);

  protected readonly isLoading: WritableSignal<boolean> = signal(false);
  protected readonly isSubmitted: WritableSignal<boolean> = signal(false);
  protected readonly passwordReset: WritableSignal<boolean> = signal(false);
  protected readonly invalidToken: WritableSignal<boolean> = signal(false);

  private token: string = '';
  private email: string = '';

  resetPasswordForm = this.formBuilder.group({
    password: ['', [Validators.required, Validators.pattern(RegexPatterns.PASSWORD_PATTERN)]],
    password_confirmation: ['', [Validators.required]]
  }, {
    validators: [passwordMatchValidator]
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';

      if (!this.token || !this.email) {
        this.invalidToken.set(true);
        this.toastr.error('Nederīga paroles atiestatīšanas saite');
      }
    });
  }

  onSubmit() {
    this.isSubmitted.set(true);

    if (this.resetPasswordForm.invalid || this.invalidToken()) {
      return;
    }

    this.isLoading.set(true);

    const password = this.resetPasswordForm.get('password')?.value;
    const passwordConfirmation = this.resetPasswordForm.get('password_confirmation')?.value;

    this.authService.resetPassword(this.token, this.email, password, passwordConfirmation)
      .pipe(
        tap(response => {
          this.passwordReset.set(true);
          this.toastr.success(response.message);
        }),
        catchError(error => {
          if (error.status === 422) {
            this.toastr.error(error.error.message || 'Nederīgs tokens vai parole neatbilst prasībām');
          } else {
            this.toastr.error('Neizdevās atiestatīt paroli');
          }
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
          this.isSubmitted.set(false);
        })
      )
      .subscribe();
  }

  login() {
    this.router.navigate(['/login']);
  }

  meetsCriteria(criteria: string): boolean {
    const password = this.resetPasswordForm.get('password')?.value;

    if (!password) {
      return false;
    }

    switch (criteria) {
      case 'uppercase':
        return /[A-Z]/.test(password);
      case 'lowercase':
        return /[a-z]/.test(password);
      case 'number':
        return /[0-9]/.test(password);
      case 'special':
        return /[@$!%*?&]/.test(password);
      case 'length':
        return password.length >= 8;
      default:
        return false;
    }
  }
}
