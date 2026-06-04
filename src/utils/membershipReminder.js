import { MEMBER_PAYMENT_STATUS } from '@utils/paymentStatus.js';

const EXPIRING_DAYS = 7;

export function getMembershipReminder(member) {
  if (!member) return null;

  const now = new Date();

  if (member.paymentStatus === MEMBER_PAYMENT_STATUS.UNPAID) {
    return {
      type: 'unpaid',
      message: 'Complete payment to activate your membership and check in at the gym.',
      cta: { to: '/plans', label: 'Browse plans & pay' },
    };
  }

  if (member.membershipEnd) {
    const end = new Date(member.membershipEnd);
    if (end < now) {
      return {
        type: 'expired',
        message: 'Your membership has expired. Renew to continue checking in.',
        cta: { to: '/plans', label: 'Renew membership' },
      };
    }
    const daysLeft = Math.ceil((end - now) / 86400000);
    if (daysLeft <= EXPIRING_DAYS) {
      return {
        type: 'expiring',
        message: `Your membership expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renew soon to avoid interruption.`,
        cta: { to: '/plans', label: 'Renew or upgrade' },
      };
    }
  }

  return null;
}
