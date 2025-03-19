import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {catchError, EMPTY, finalize, tap} from "rxjs";
import {User} from "../../auth/models/user.models";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {RegexPatterns} from "../../../shared/constants/regex.constants";
import {ToastrService} from "ngx-toastr";
import {AuthService} from "../../auth/services/auth.service";
import {ProfileService} from "../services/profile.service";
import {ValidationErrorDirective} from "../../../shared/directives/validation-error/validation-error.directive";
import {ButtonLoaderDirective} from "../../../shared/directives/button-loader/button-loader.directive";

@Component({
  selector: 'app-profile-edit',
  imports: [
    ReactiveFormsModule,
    ValidationErrorDirective,
    ButtonLoaderDirective
  ],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss'
})
export class ProfileEditComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  protected readonly isLoading: WritableSignal<boolean> = signal(false);
  protected readonly isSubmitted: WritableSignal<boolean> = signal(false);
  protected readonly user: WritableSignal<User | null> = signal(null);

  profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(RegexPatterns.NAME_PATTERN)]],
    email: ['', [Validators.required, Validators.pattern(RegexPatterns.EMAIL_PATTERN)]],
    phone: ['', [Validators.pattern(RegexPatterns.PHONE_PATTERN)]]
  });

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading.set(true);

    this.profileService.getUserProfile()
      .pipe(
        tap(response => {
          this.user.set(response.data);
          this.updateFormValues(response.data);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt profila informāciju');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  updateFormValues(user: User): void {
    this.profileForm.patchValue({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || ''
    });
  }

  resetForm(): void {
    if (this.user()) {
      this.updateFormValues(this.user()!);
    }
  }

  submitForm(): void {
    this.isSubmitted.set(true);

    if (this.profileForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    this.profileService.updateUserProfile(this.profileForm.value)
      .pipe(
        tap(response => {
          this.toastr.success('Profila informācija veiksmīgi atjaunināta');

          this.authService.updateUserData({
            name: this.profileForm.get('name')?.value,
            email: this.profileForm.get('email')?.value,
            phone: this.profileForm.get('phone')?.value
          });

          this.user.set(this.authService.user());
          this.isSubmitted.set(false);
        }),
        catchError(error => {
          if (error.status === 422 && error.error?.errors) {
            this.toastr.error('Šāds e-pasts jau eksistē');
          } else {
            this.toastr.error('Neizdevās atjaunināt profila informāciju');
          }
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }
}
