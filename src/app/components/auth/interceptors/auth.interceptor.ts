import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);

  const credentialsReq = req.clone({
    withCredentials: true
  });

  return next(credentialsReq).pipe(
    catchError(error => {
      if (error.status === 401) {
        localStorage.removeItem('user_data');
        toastr.error('Sesija ir beigusies. Lūdzu, ielogojieties vēlreiz.');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
