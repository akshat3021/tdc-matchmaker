import type { CustomerStatus } from '@/types';

const SLUG: Record<CustomerStatus, string> = {
  'New intake': 'new',
  'Profile verified': 'verified',
  'Actively matching': 'matching',
  'Match shared': 'shared',
  'Meeting planned': 'meeting',
  'On pause': 'paused',
};

export function StatusTag({ status }: { status: CustomerStatus }) {
  return (
    <span className={`status status-${SLUG[status]}`}>
      <i aria-hidden="true" />
      {status}
    </span>
  );
}
