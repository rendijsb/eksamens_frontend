import {Component, inject, signal, WritableSignal} from '@angular/core';
import {AbstractControl, ReactiveFormsModule, UntypedFormBuilder, ValidationErrors, Validators} from "@angular/forms";
import {AuthService} from "../services/auth.service";
import {finalize} from "rxjs";
import {ButtonLoaderDirective} from "../../../shared/directives/button-loader/button-loader.directive";
import {ValidationErrorDirective} from "../../../shared/directives/validation-error/validation-error.directive";
import {RegexPatterns} from "../../../shared/constants/regex.constants";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonLoaderDirective,
    ValidationErrorDirective,
  ],
  templateUrl: './register.component.html',
  styleUrl: '../styles/auth.scss'
})
export class RegisterComponent {
  private readonly formBuilder: UntypedFormBuilder = inject(UntypedFormBuilder);
  private readonly authService: AuthService = inject(AuthService);

  protected isLoading: WritableSignal<boolean> = signal<boolean>(false);
  protected isSubmitted: WritableSignal<boolean> = signal<boolean>(false);

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('password_confirmation');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword?.errors) {
      const { passwordMismatch, ...errors } = confirmPassword.errors;
      confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
    }

    return null;
  }

  registerForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(RegexPatterns.NAME_PATTERN)]],
    email: ['', [Validators.required, Validators.pattern(RegexPatterns.EMAIL_PATTERN)]],
    phone: ['', [Validators.pattern(RegexPatterns.PHONE_PATTERN)]],
    password: ['', [Validators.required, Validators.pattern(RegexPatterns.PASSWORD_PATTERN)]],
    password_confirmation: ['', [Validators.required, Validators.pattern(RegexPatterns.PASSWORD_PATTERN)]]
  }, {
    validators: [this.passwordMatchValidator.bind(this)]
  });

  onSubmit() {
    this.isSubmitted.set(true);

    if (!this.registerForm.get('phone')?.value) {
      this.registerForm.get('phone')?.clearValidators();
      this.registerForm.get('phone')?.updateValueAndValidity();
    }

    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    this.authService.register(this.generatePayload())
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.isSubmitted.set(false);
        })
      )
      .subscribe();
  }

  generatePayload(): FormData {
    const data = new FormData();

    data.append('name', this.registerForm.get('name')?.value);
    data.append('email', this.registerForm.get('email')?.value);
    data.append('phone', this.registerForm.get('phone')?.value);
    data.append('password', this.registerForm.get('password')?.value);
    data.append('password_confirmation', this.registerForm.get('password_confirmation')?.value);

    return data;
  }
}
