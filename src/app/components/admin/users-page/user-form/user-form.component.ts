import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {RegexPatterns} from "../../../../shared/constants/regex.constants";
import {ActivatedRoute, Router} from "@angular/router";
import {ValidationErrorDirective} from "../../../../shared/directives/validation-error/validation-error.directive";
import {ButtonLoaderDirective} from "../../../../shared/directives/button-loader/button-loader.directive";
import {RoleEnum, User} from "../../../auth/models/user.models";
import {CommonModule} from "@angular/common";
import {AdminUserService} from "../services/admin-user.service";
import {catchError, EMPTY, finalize, tap} from "rxjs";
import {ToastrService} from "ngx-toastr";
import {passwordMatchValidator} from "../../../../shared/validators/password-match.validator";

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ValidationErrorDirective,
    ReactiveFormsModule,
    ButtonLoaderDirective
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminService: AdminUserService = inject(AdminUserService);
  private readonly toastr: ToastrService = inject(ToastrService);

  protected readonly isLoading: WritableSignal<boolean> = signal(false);
  protected readonly isSubmitted: WritableSignal<boolean> = signal(false);
  protected isEditing: WritableSignal<boolean> = signal<boolean>(false);
  protected showPasswordChange: WritableSignal<boolean> = signal<boolean>(false);
  protected readonly RoleEnum: typeof RoleEnum = RoleEnum;

  userForm = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(RegexPatterns.NAME_PATTERN)]],
    email: ['', [Validators.required, Validators.pattern(RegexPatterns.EMAIL_PATTERN)]],
    phone: ['', [Validators.pattern(RegexPatterns.PHONE_PATTERN)]],
    role: [1, Validators.required],
    password: [''],
    password_confirmation: ['']
  }, {
    validators: [passwordMatchValidator]
  });

  ngOnInit() {
    const userId = this.route.snapshot.params['id'];
    if (userId) {
      this.isEditing.set(true);
      this.getUserById(userId);
    } else {
      this.addPasswordValidation();
    }
  }

  private addPasswordValidation() {
    const passwordControls = ['password', 'password_confirmation'];
    passwordControls.forEach(control => {
      this.userForm.get(control)?.setValidators([
        Validators.required,
        Validators.pattern(RegexPatterns.PASSWORD_PATTERN)
      ]);
      this.userForm.get(control)?.updateValueAndValidity();
    });

    this.userForm.setValidators([passwordMatchValidator]);
    this.userForm.updateValueAndValidity();
  }

  private removePasswordValidation() {
    const passwordControls = ['password', 'password_confirmation'];
    passwordControls.forEach(control => {
      this.userForm.get(control)?.clearValidators();
      this.userForm.get(control)?.updateValueAndValidity();
    });

    this.userForm.clearValidators();
    this.userForm.updateValueAndValidity();
  }

  onTogglePasswordChange(): void {
    const currentValue = this.showPasswordChange();
    this.showPasswordChange.set(!currentValue);
    if (!currentValue) {
      this.addPasswordValidation();
    } else {
      this.removePasswordValidation();
      this.userForm.patchValue({
        password: '',
        password_confirmation: ''
      });
    }
  }

  getUserById(userId: number): void {
    this.adminService.getUserById(userId)
      .pipe(
        tap((response): void => {
          this.userForm.patchValue({
            name: response.data.name || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            role: response.data.role
          })
        })
      )
      .subscribe();
  }

  onSubmit(): void {
    this.isSubmitted.set(true);
    if (this.userForm.invalid) {
      return;
    }

    this.isLoading.set(true);

    if (!this.isEditing()) {
      this.adminService.createUser(this.generatePayload())
        .pipe(
          tap(() => {
            this.router.navigate(['/admin/users'])
            this.toastr.success('Lietotās ir veiksmīgi izveidots')
          }),
          catchError((error) => {
            if (error.status === 422 && error.error?.errors) {
              this.toastr.error('Lietotās ar šādu e-pastu jau eksistē');
            } else {
              this.toastr.error('Neizdevās izveidot lietotāju');
            }
            return EMPTY;
          }),
          finalize(() => {
            this.isSubmitted.set(false);
            this.isLoading.set(false);
          })
        )
        .subscribe();
    } else {
      const userId = this.route.snapshot.params['id'];

      this.adminService.editUser(this.generatePayload(), userId)
        .pipe(
          tap(() => {
            this.router.navigate(['/admin/users'])
            this.toastr.success('Lietotās ir veiksmīgi atjaunināts')
          }),
          catchError((error) => {
            if (error.status === 422 && error.error?.errors) {
              this.toastr.error('Lietotās ar šādu e-pastu jau eksistē');
            } else {
              this.toastr.error('Neizdevās atjaunot lietotāju');
            }
            return EMPTY;
          }),
          finalize(() => {
            this.isSubmitted.set(false);
            this.isLoading.set(false);
          })
        )
        .subscribe();
    }
  }

  generatePayload(): any {
    if (!this.isEditing()) {
      const payload = new FormData();
      payload.append('name', this.userForm.get('name')?.value || '');
      payload.append('email', this.userForm.get('email')?.value || '');
      payload.append('phone', this.userForm.get('phone')?.value || '');
      payload.append('role', this.userForm.get('role')?.value?.toString() || '3');
      payload.append('password', this.userForm.get('password')?.value || '');
      payload.append('password_confirmation', this.userForm.get('password_confirmation')?.value || '');
      return payload;
    } else {
      return {
        name: this.userForm.get('name')?.value,
        email: this.userForm.get('email')?.value,
        phone: this.userForm.get('phone')?.value,
        role: this.userForm.get('role')?.value,
        ...(this.showPasswordChange() && {
          password: this.userForm.get('password')?.value,
          password_confirmation: this.userForm.get('password_confirmation')?.value
        })
      };
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/users']);
  }
}
