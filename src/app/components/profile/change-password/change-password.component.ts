import {Component, inject, signal, WritableSignal} from '@angular/core';
import {catchError, EMPTY, finalize, tap} from "rxjs";
import {ChangePasswordRequest, ProfileService} from "../services/profile.service";
import {passwordMatchValidator} from "../../../shared/validators/password-match.validator";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {RegexPatterns} from "../../../shared/constants/regex.constants";
import {ToastrService} from "ngx-toastr";
import {ButtonLoaderDirective} from "../../../shared/directives/button-loader/button-loader.directive";
import {ValidationErrorDirective} from "../../../shared/directives/validation-error/validation-error.directive";

@Component({
  selector: 'app-change-password',
  imports: [
    ButtonLoaderDirective,
    ValidationErrorDirective,
    ReactiveFormsModule
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent {
  private readonly profileService = inject(ProfileService);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  protected readonly isLoading: WritableSignal<boolean> = signal(false);
  protected readonly isSubmitted: WritableSignal<boolean> = signal(false);

  passwordForm: FormGroup = this.fb.group({
    current_password: ['', Validators.required],
    new_password: ['', [
      Validators.required,
      Validators.pattern(RegexPatterns.PASSWORD_PATTERN)
    ]],
    new_password_confirmation: ['', Validators.required]
  }, {
    validators: [passwordMatchValidator]
  });

  resetForm(): void {
    this.passwordForm.reset();
    this.isSubmitted.set(false);
  }

  changePassword(): void {
    this.isSubmitted.set(true);

    if (this.passwordForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    const passwordData: ChangePasswordRequest = {
      current_password: this.passwordForm.get('current_password')?.value,
      new_password: this.passwordForm.get('new_password')?.value,
      new_password_confirmation: this.passwordForm.get('new_password_confirmation')?.value
    };

    this.profileService.changePassword(passwordData)
      .pipe(
        tap(response => {
          this.toastr.success('Parole veiksmīgi nomainīta');
          this.resetForm();
        }),
        catchError(error => {
          if (error.status === 422) {
            this.toastr.error('Pašreizējā parole ir nepareiza');
          } else {
            this.toastr.error('Neizdevās nomainīt paroli');
          }
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  meetsCriteria(criteria: string): boolean {
    const password = this.passwordForm.get('new_password')?.value;

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
