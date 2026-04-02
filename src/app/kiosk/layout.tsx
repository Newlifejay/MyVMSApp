'use client';

import { ReactNode, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function KioskLayout({ children }: { children: ReactNode }) {
  const [orgData, setOrgData] = useState({ name: 'Visitor Center', logo: '' });

  useEffect(() => {
    const fetchOrg = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: dbUser } = await supabase.from('users').select('org_id').eq('id', user.id).single();
      if (dbUser?.org_id) {
        const { data: org } = await supabase.from('organizations').select('*').eq('id', dbUser.org_id).single();
        if (org) {
          setOrgData({ name: org.name || 'Visitor Center', logo: org.logo_url || '' });
          if (org.primary_color) {
            document.documentElement.style.setProperty('--primary', org.primary_color);
            document.documentElement.style.setProperty('--primary-hover', org.primary_color);
            document.documentElement.style.setProperty('--primary-light', org.primary_color + '20');
          }
        }
      }
    };
    fetchOrg();
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--bg-base)] overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-[var(--primary)]/10 to-transparent blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-[var(--primary-light)]/40 to-transparent blur-3xl z-0" />
      
      {/* Brand Watermark / Top Bar */}
      <div className="absolute top-0 w-full p-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-3 bg-white/40 p-2 pr-6 rounded-full shadow-sm backdrop-blur-sm border border-white/40">
          {orgData.logo ? (
            <img src={orgData.logo} alt="Logo" className="w-12 h-12 rounded-full object-contain bg-white p-1 border border-black/5 shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] shadow-md text-white flex items-center justify-center font-bold text-lg">
               {orgData.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-2xl font-black tracking-tight text-[var(--text-main)] drop-shadow-sm">{orgData.name}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl px-8 z-10 relative">
        {children}
      </main>
    </div>
  );
}
