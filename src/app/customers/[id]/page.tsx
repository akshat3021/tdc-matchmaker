import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CustomerWorkspace } from '@/components/CustomerWorkspace';
import { Header } from '@/components/Header';
import { ProfileView } from '@/components/ProfileView';
import { getSessionUser } from '@/lib/auth/session';
import { getCustomerFor } from '@/lib/data/repository';

export const metadata: Metadata = { title: 'Client profile' };

export default async function CustomerPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  // Ownership check: another matchmaker's client is indistinguishable from a missing one.
  const customer = getCustomerFor(user.id, params.id);
  if (!customer) notFound();

  return (
    <>
      <Header name={user.name} />
      <main className="page">
        <CustomerWorkspace customer={customer} userId={user.id} profile={<ProfileView c={customer} />} />
      </main>
    </>
  );
}
