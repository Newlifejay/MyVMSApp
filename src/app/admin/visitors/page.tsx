import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PrintBadgeButton from './PrintBadgeButton';

export default async function VisitorsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: dbUser } = await supabase.from('users').select('org_id').eq('id', user.id).single();
  const { data: org } = await supabase.from('organizations').select('name, logo_url').eq('id', dbUser?.org_id).single();

  const { data: visitors } = await supabase
    .from('visitors')
    .select('*')
    .eq('org_id', dbUser?.org_id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Visitor Directory</h1>
        <p className="text-[var(--text-muted)] mt-1">A unified list of everyone who has ever visited this organization.</p>
      </div>
      
      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-base)] border-b border-[var(--border)] text-sm uppercase tracking-wider">
            <tr>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Name</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Email</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Phone</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Registered</th>
            </tr>
          </thead>
          <tbody>
            {!visitors?.length ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[var(--text-muted)]">
                  <div className="py-4">No visitors recorded yet. When a visitor checks in at the kiosk, their profile will appear here.</div>
                </td>
              </tr>
            ) : visitors.map(v => (
              <tr key={v.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-base)]/50 transition">
                <td className="p-4 font-medium flex items-center gap-3">
                  {v.photo_url ? (
                     <img src={v.photo_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-[var(--border)] shadow-sm" />
                  ) : (
                     <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-lg flex items-center justify-center font-bold">
                        {v.name.charAt(0).toUpperCase()}
                     </div>
                  )}
                  <div className="flex flex-col">
                    <span>{v.name}</span>
                    <span className="text-xs text-[var(--text-muted)] font-normal">{v.company || ''}</span>
                  </div>
                </td>
                <td className="p-4 text-[var(--text-muted)]">{v.email || '—'}</td>
                <td className="p-4">{v.phone || '—'}</td>
                <td className="p-4 text-[var(--text-muted)] flex items-center justify-between">
                   <span>{new Date(v.created_at).toLocaleDateString()}</span>
                   <PrintBadgeButton visitor={v} orgName={org?.name || 'VMS Provider'} orgLogo={org?.logo_url || ''} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
