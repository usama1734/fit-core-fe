export const MEMBER_PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
};

export function formatMemberPaymentStatus(status) {
  if (status === MEMBER_PAYMENT_STATUS.PAID) return 'Paid';
  if (status === MEMBER_PAYMENT_STATUS.UNPAID) return 'Unpaid';
  return status ?? '—';
}

export function memberPaymentStatusClass(status) {
  return status === MEMBER_PAYMENT_STATUS.PAID ? 'text-teal-400' : 'text-amber-400';
}
