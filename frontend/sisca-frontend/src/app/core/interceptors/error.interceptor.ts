import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      let msg = 'Ocurrió un error inesperado.';
      if (error.error?.message) msg = error.error.message;
      else if (error.message) msg = error.message;

      // Mostrar mensaje en consola o usar un servicio de notificaciones
      console.error('Error:', msg);

      if (error.status === 401) {
        auth.logout();
        router.navigate(['/login']);
        // Podrías mostrar un snackbar indicando sesión expirada
      }

      return throwError(() => error);
    })
  );
};