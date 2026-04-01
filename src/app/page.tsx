import Link from "next/link";
import { MonitorSmartphone, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className={cn("layout-container", "flex-col", "items-center", "justify-center", "bg-[var(--bg-base)]")}>
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-light)]/40 to-[var(--bg-base)] z-0" />
      
      <div className="z-10 w-full max-w-4xl p-8 flex flex-col items-center">
        <div className="text-center mb-12 animate-fade-in">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[var(--primary)]/20 text-white font-bold text-3xl">
            V
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Visitor Management System</h1>
          <p className="text-xl text-[var(--text-muted)] max-w-xl mx-auto">Select a portal to dive in. The Kiosk is for arriving guests to seamlessly check-in, and the Dashboard is for your internal staff.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Link href="/kiosk" className="group">
            <div className="glass-panel p-8 text-center cursor-pointer border border-[var(--border)] hover:border-[var(--primary)]/50 hover:shadow-lg transition-all hover:-translate-y-1 bg-[var(--bg-surface)]/80 h-full flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--success-bg)] text-[var(--success)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <MonitorSmartphone size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-[var(--text-main)]">Launch Kiosk</h3>
                <p className="text-[var(--text-muted)] text-sm">Tablet-optimized guest check-in interface</p>
              </div>
            </div>
          </Link>

          <Link href="/admin" className="group">
            <div className="glass-panel p-8 text-center cursor-pointer border border-[var(--border)] hover:border-[var(--primary)]/50 hover:shadow-lg transition-all hover:-translate-y-1 bg-[var(--bg-surface)]/80 h-full flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-[var(--text-main)]">Admin Dashboard</h3>
                <p className="text-[var(--text-muted)] text-sm">Manage active visitors, logs, and settings</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
