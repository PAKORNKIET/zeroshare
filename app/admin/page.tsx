import Link from 'next/link';
import { requireAdmin } from '@/lib/require-admin';
import AdminClient from '@/components/AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await requireAdmin();

  if (!admin) {
    return (
      <div className="card">
        <h1 className="page-title">Admin</h1>
        <p className="sub">
          This area is restricted to administrators. If you believe this is a
          mistake, contact whoever manages this deployment.
        </p>
        <Link href="/login" className="btn primary">
          <svg className="icon">
            <use href="#i-users" />
          </svg>
          Log in
        </Link>
      </div>
    );
  }

  return <AdminClient />;
}