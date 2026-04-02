import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LogsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: dbUser } = await supabase.from('users').select('org_id').eq('id', user.id).single();

  const { data: visits } = await supabase
    .from('visits')
    .select(`
      id,
      purpose,
      check_in_time,
      check_out_time,
      status,
      visitors ( name, email, photo_url, company ),
      hosts ( name )
    `)
    .eq('org_id', dbUser?.org_id)
    .order('check_in_time', { ascending: false })
    .limit(100);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <p className="text-[var(--text-muted)] mt-1">Full historical log of all check-ins and check-outs across the facility.</p>
      </div>
      
      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left leading-relaxed">
          <thead className="bg-[var(--bg-base)] border-b border-[var(--border)] text-sm uppercase tracking-wider">
            <tr>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Visitor</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Host</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Purpose</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Check In</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Check Out</th>
              <th className="p-4 font-semibold text-[var(--text-muted)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {!visits?.length ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">
                  <div className="py-4">No activity logs recorded yet.</div>
                </td>
              </tr>
            ) : visits.map(visit => (
              <tr key={visit.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-base)]/50 transition">
                <td className="p-4 font-medium flex items-center gap-3">
                  {(visit.visitors as any)?.photo_url ? (
                     <img src={(visit.visitors as any).photo_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-[var(--border)] shadow-sm" />
                  ) : (
                     <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-lg flex items-center justify-center font-bold">
                        {((visit.visitors as any)?.name || 'U').charAt(0).toUpperCase()}
                     </div>
                  )}
                  <div className="flex flex-col">
                    <span>{(visit.visitors as any)?.name || 'Unknown'}</span>
                    <span className="text-xs text-[var(--text-muted)] font-normal">{(visit.visitors as any)?.company || ''}</span>
                  </div>
                </td>
                <td className="p-4 text-[var(--text-muted)]">{(visit.hosts as any)?.name || 'Walk-in'}</td>
                <td className="p-4 text-[var(--text-muted)] max-w-xs truncate" title={visit.purpose}>{visit.purpose}</td>
                <td className="p-4 text-[var(--text-muted)] whitespace-nowrap">
                  {new Date(visit.check_in_time).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                  })}
                </td>
                <td className="p-4 text-[var(--text-muted)] whitespace-nowrap">
                  {visit.check_out_time ? new Date(visit.check_out_time).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                  }) : '—'}
                </td>
                <td className="p-4">
                  <span className={`status-badge ${visit.status === 'active' ? 'status-success' : 'status-warning'}`}>
                    {visit.status === 'active' ? 'Checked In' : 'Completed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
