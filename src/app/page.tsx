import { redirect } from 'next/navigation';
import { CustomerTable } from '@/components/CustomerTable';
import { Header } from '@/components/Header';
import { getSessionUser } from '@/lib/auth/session';
import { listCustomersFor } from '@/lib/data/repository';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const customers = listCustomersFor(user.id);

  return (
    <>
      <Header name={user.name} />
      <main className="page">
        <div className="page-head">
          <h1>Your clients</h1>
          <p>{customers.length} people are with you right now. Open a profile to review it, find matches and make introductions.</p>
        </div>
        {customers.length === 0 ? (
          <div className="empty">
            <h3>No clients assigned yet</h3>
            <p>New clients appear here once an admin assigns them to you.</p>
          </div>
        ) : (
          <CustomerTable customers={customers} userId={user.id} />
        )}
      </main>
    </>
  );
}
