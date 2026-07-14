import { ROUTES } from '@constants/routes';
import type { UserInfo } from '@/types';

export type RoleName = 'ADMIN' | 'MANAGER' | 'RECEPTIONIST' | 'THERAPIST';

export const routeRoles: Partial<Record<string, RoleName[]>> = {
  [ROUTES.DASHBOARD]: ['ADMIN', 'MANAGER'],
  [ROUTES.CUSTOMERS]: ['ADMIN', 'MANAGER', 'RECEPTIONIST'],
  [ROUTES.EMPLOYEES]: ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'],
  [ROUTES.SERVICES]: ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'],
  [ROUTES.APPOINTMENTS]: ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'],
  [ROUTES.TREATMENT_PACKAGES]: ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'],
  [ROUTES.CUSTOMER_TREATMENTS]: ['ADMIN', 'MANAGER', 'RECEPTIONIST'],
  [ROUTES.PACKAGE_CONVERSIONS]: ['ADMIN', 'MANAGER', 'RECEPTIONIST'],
  [ROUTES.ORDERS]: ['ADMIN', 'MANAGER', 'RECEPTIONIST'],
  [ROUTES.PRODUCTS]: ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'],
  [ROUTES.CATEGORIES]: ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'],
  [ROUTES.PROMOTIONS]: ['ADMIN', 'MANAGER', 'RECEPTIONIST'],
  [ROUTES.SALARIES]: ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'],
  [ROUTES.REPORTS]: ['ADMIN', 'MANAGER'],
  [ROUTES.NOTIFICATIONS]: ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'THERAPIST'],
  [ROUTES.USERS]: ['ADMIN'],
  [ROUTES.ROLES]: ['ADMIN'],
  [ROUTES.PERMISSIONS]: ['ADMIN'],
  [ROUTES.SUBSCRIPTIONS]: ['ADMIN'],
};

export const getUserRoleNames = (user: UserInfo | null): string[] => {
  if (!user?.roles) return [];
  return user.roles
    .map((role) => (typeof role === 'string' ? role : role.name))
    .filter(Boolean)
    .map((role) => role.toUpperCase());
};

export const hasAnyRole = (user: UserInfo | null, allowedRoles?: readonly RoleName[]) => {
  if (!allowedRoles?.length) return true;
  const roleNames = getUserRoleNames(user);
  return allowedRoles.some((role) => roleNames.includes(role));
};

export const canAccessRoute = (user: UserInfo | null, path: string) => {
  return hasAnyRole(user, routeRoles[path]);
};

export const getFirstAccessibleRoute = (user: UserInfo | null) => {
  return Object.keys(routeRoles).find((path) => canAccessRoute(user, path)) ?? ROUTES.PROFILE;
};
