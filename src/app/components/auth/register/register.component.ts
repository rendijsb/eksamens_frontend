import {Component, inject, signal, WritableSignal} from '@angular/core';
import {ReactiveFormsModule, UntypedFormBuilder, Validators} from "@angular/forms";
import {AuthService} from "../services/auth.service";
import {catchError, EMPTY, finalize, tap} from "rxjs";
import {ButtonLoaderDirective} from "../../../shared/directives/button-loader/button-loader.directive";
import {ValidationErrorDirective} from "../../../shared/directives/validation-error/validation-error.directive";
import {RegexPatterns} from "../../../shared/constants/regex.constants";
import {passwordMatchValidator} from "../../../shared/validators/password-match.validator";
import {Router} from "@angular/router";
import {ToastrService} from "ngx-toastr";

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
  private readonly router: Router = inject(Router);
  private readonly toastr: ToastrService = inject(ToastrService);

  protected isLoading: WritableSignal<boolean> = signal<boolean>(false);
  protected isSubmitted: WritableSignal<boolean> = signal<boolean>(false);

  registerForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(RegexPatterns.NAME_PATTERN)]],
    email: ['', [Validators.required, Validators.pattern(RegexPatterns.EMAIL_PATTERN)]],
    phone: ['', [Validators.pattern(RegexPatterns.PHONE_PATTERN)]],
    password: ['', [Validators.required, Validators.pattern(RegexPatterns.PASSWORD_PATTERN)]],
    password_confirmation: ['', [Validators.required, Validators.pattern(RegexPatterns.PASSWORD_PATTERN)]]
  }, {
    validators: [passwordMatchValidator]
  });

  onSubmit() {
    this.isSubmitted.set(true);

    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    this.authService.register(this.generatePayload())
      .pipe(
        tap(() => {
          this.router.navigate(['/login']);
          this.toastr.success('Registration successful');
        }),
        catchError(() => {
          this.toastr.error('Registration failed');
          return EMPTY;
        }),
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
