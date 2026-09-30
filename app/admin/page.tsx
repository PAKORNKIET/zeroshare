import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/require-admin';
import AdminClient from '@/components/AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await requireAdmin();

  // Hide the admin area entirely from everyone else — it isn't linked
  // anywhere, and non-admins get a plain 404 rather than a hint it exists.
  if (!admin) notFound();

  return <AdminClient />;
}
