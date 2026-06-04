export function formatCurrency(amount, currency = 'USD') {
  const n = Number(amount ?? 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function formatDateShort(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export function fullName(user) {
  if (!user) return '—';
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
}
