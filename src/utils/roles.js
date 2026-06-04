export const ROLES = {
  ADMIN: 'ADMIN',
  TRAINER: 'TRAINER',
  MEMBER: 'MEMBER',
};

export function canAccess(user, allowedRoles) {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}
