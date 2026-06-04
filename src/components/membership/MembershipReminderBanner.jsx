import { Link } from 'react-router-dom';
import { getMembershipReminder } from '@utils/membershipReminder.js';

const styles = {
  unpaid: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  expired: 'border-red-500/30 bg-red-500/10 text-red-100',
  expiring: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
};

export default function MembershipReminderBanner({ member }) {
  const reminder = getMembershipReminder(member);
  if (!reminder) return null;

  return (
    <div
      className={`mb-6 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${styles[reminder.type]}`}
    >
      <p className="text-sm">{reminder.message}</p>
      {reminder.cta && (
        <Link
          to={reminder.cta.to}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
        >
          {reminder.cta.label}
        </Link>
      )}
    </div>
  );
}
