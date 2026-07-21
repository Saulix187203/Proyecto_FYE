import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as string[];
  if (!requiredRoles || requiredRoles.length === 0) return true;

  const user = auth.getUsuario();
  if (!user) return router.parseUrl('/login');

  const hasRole = requiredRoles.some(role => auth.hasRole(role));
  if (hasRole) return true;

  // Redirigir a la lista de casos si el usuario no tiene los roles requeridos
  return router.parseUrl('/casos');
};