'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, LogOut, Users, FileText, MonitorSmartphone, Briefcase } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [orgData, setOrgData] = useState({ name: 'Admin Dashboard', logo: '' });

  useEffect(() => {
    const fetchOrg = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: dbUser } = await supabase.from('users').select('org_id').eq('id', user.id).single();
      if (dbUser?.org_id) {
        const { data: org } = await supabase.from('organizations').select('*').eq('id', dbUser.org_id).single();
        if (org) {
          setOrgData({ name: org.name || 'Admin', logo: org.logo_url || '' });
          if (org.primary_color) {
            document.documentElement.style.setProperty('--primary', org.primary_color);
          }
        }
      }
    };
    fetchOrg();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Visitors', href: '/admin/visitors', icon: Users },
    { name: 'Employees', href: '/admin/employees', icon: Briefcase },
    { name: 'Logs', href: '/admin/logs', icon: FileText },
    { name: 'Kiosk Launch', href: '/kiosk', icon: MonitorSmartphone, external: true },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="layout-container bg-[var(--bg-base)]">
      {/* Sidebar */}
      <aside className="sidebar shadow-lg shadow-[var(--shadow-glass)] border-r border-[var(--border)]">
        <div className="flex items-center gap-3 mb-10 px-2">
          {orgData.logo ? (
            <img src={orgData.logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold">
              {orgData.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xl font-bold tracking-tight text-[var(--text-main)] truncate" title={orgData.name}>
            {orgData.name}
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                target={item.external ? '_blank' : undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium",
                  isActive 
                    ? "bg-[var(--primary-light)] text-[var(--primary)]" 
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-base)] hover:text-[var(--text-main)]"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-[var(--primary)]" : "")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[var(--border)] pt-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left text-[var(--danger)] hover:bg-[var(--danger-bg)] transition font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
