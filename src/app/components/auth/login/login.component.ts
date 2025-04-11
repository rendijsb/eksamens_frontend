import {Component, inject, signal, WritableSignal} from '@angular/core';
import {ReactiveFormsModule, UntypedFormBuilder, Validators} from "@angular/forms";
import {RegexPatterns} from "../../../shared/constants/regex.constants";
import {AuthService} from "../services/auth.service";
import {catchError, EMPTY, finalize, tap} from "rxjs";
import {ButtonLoaderDirective} from "../../../shared/directives/button-loader/button-loader.directive";
import {ValidationErrorDirective} from "../../../shared/directives/validation-error/validation-error.directive";
import {ToastrService} from "ngx-toastr";
import {RouterLink} from "@angular/router";
import {CartService} from "../../main/service/cart.service";

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    ButtonLoaderDirective,
    ValidationErrorDirective,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: '../styles/auth.scss'
})
export class LoginComponent {
  private readonly formBuilder: UntypedFormBuilder = inject(UntypedFormBuilder);
  private readonly authService: AuthService = inject(AuthService);
  private readonly toastr: ToastrService = inject(ToastrService);
  private readonly cartService: CartService = inject(CartService);

  protected readonly isLoading: WritableSignal<boolean> = signal<boolean>(false);
  protected readonly isSubmitted: WritableSignal<boolean> = signal<boolean>(false);
  protected readonly loginError: WritableSignal<boolean> = signal<boolean>(false);

  loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.pattern(RegexPatterns.EMAIL_PATTERN)]],
    password: ['', [Validators.required]]
  })

  submit() {
    this.isSubmitted.set(true);
    this.loginError.set(false);

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.generatePayload())
      .pipe(
        tap(response => {
          const user = response.data;
          this.toastr.success('Jūs esat veiksmīgi ienācis sistēmā');
          this.authService.handleSuccessfulLogin(user);
          this.cartService.migrateCart().pipe(
            catchError(() => {
              return EMPTY;
            }),
          ).subscribe();
        }),
        catchError(error => {
          this.loginError.set(true);
          this.toastr.error('Nepareizi ievadīti dati');
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

    data.append('email', this.loginForm.get('email')?.value);
    data.append('password', this.loginForm.get('password')?.value);

    return data;
  }
}
