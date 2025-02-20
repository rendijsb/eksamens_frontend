import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleEnum } from "../models/user.models";

export const authGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const user = authService.user();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  const allowedRoles = route.data['roles'] as Array<number>;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === RoleEnum.ADMIN) {
      router.navigate(['/admin/dashboard']);
    } else if (user.role === RoleEnum.MODERATOR) {
      router.navigate(['/admin/dashboard']);
    } else {
      router.navigate(['/']);
    }
    return false;
  }

  return true;
};
