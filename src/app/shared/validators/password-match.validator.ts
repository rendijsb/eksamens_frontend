import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('password_confirmation');

  if (!password || !confirmPassword) {
    return null;
  }

  if (password.value === '' || confirmPassword.value === '') {
    return null;
  }

  if (password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }

  if (confirmPassword.errors) {
    const { passwordMismatch, ...otherErrors } = confirmPassword.errors;
    confirmPassword.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
  }

  return null;
};
