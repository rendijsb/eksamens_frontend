import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const noAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isAuthenticated()) {
    const user = authService.user();

    if (user) {
      switch (user.role) {
        case 1:
        case 2:
          router.navigate(['/admin/dashboard']);
          break;
        default:
          router.navigate(['/']);
          break;
      }
    } else {
      router.navigate(['/']);
    }

    return false;
  }

  return true;
};
