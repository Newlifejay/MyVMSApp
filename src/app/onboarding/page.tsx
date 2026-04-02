'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function OnboardingPage() {
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmailPhrase, setCheckEmailPhrase] = useState(false);
  const [existingUser, setExistingUser] = useState<any>(null);
  const router = useRouter();

  // On mount, check if user is already authenticated
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setExistingUser(data.user);
    });
  }, []);

  const handleCreateTenantAndUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    
    // Check if they are already logged in to skip sign up
    let { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user) {
        if (authError?.message.includes('already registered')) {
           const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
           if (signInErr) {
              setError('Account already exists. Please use the correct password.');
              setLoading(false);
              return;
           }
        } else {
          setError(authError?.message || 'Failed to sign up.');
          setLoading(false);
          return;
        }
      }
      
      // Attempt to get user again
      const { data: sessionData } = await supabase.auth.getUser();
      user = sessionData.user;

      // If user exists but is not logged in / confirmed
      if (!user && authData?.user?.identities?.length !== 0) {
        setCheckEmailPhrase(true);
        setLoading(false);
        return;
      }
      
      if (!user) {
        setError('Authentication failed. Please verify your email first.');
        setLoading(false);
        return;
      }
    } else {
      user = existingUser || user; // Inherit the actively logged in user if they simply got looped back
    }

    // 2. Insert Organization manually with a client generated UUID
    const orgId = crypto.randomUUID();
    const { error: orgError } = await supabase
      .from('organizations')
      .insert([{ id: orgId, name: orgName }]);

    if (orgError) {
      if (orgError?.message.includes('Could not find the table') || orgError?.code === '42P01') {
        setError('Database tables are missing! Please run the supabase/schema.sql file in your Supabase SQL Editor.');
      } else {
        setError(orgError?.message || 'Failed to create organization. Ensure your SQL schema is applied.');
      }
      setLoading(false);
      return;
    }

    // 3. Update or Insert user record with org_id and admin role
    const { error: userUpsertError } = await supabase
      .from('users')
      .upsert({ id: user.id, org_id: orgId, role: 'admin' });

    // Pause briefly to ensure cookies propagate in the browser
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use Next router and then refresh server component payload
    router.push('/admin');
    router.refresh();
  };

  if (checkEmailPhrase) {
    return (
      <div className={cn("layout-container", "items-center", "justify-center", "bg-[var(--bg-base)]")}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel w-full max-w-lg p-10 relative z-10 text-center flex flex-col items-center">
          <CheckCircle2 className="w-16 h-16 text-[var(--success)] mb-4" />
          <h1 className="text-3xl font-bold mb-2">Check Your Email</h1>
          <p className="text-[var(--text-muted)] mb-8">
            We sent a secure confirmation link to <strong>{email}</strong>. 
            Please click that link to authenticate your account before setting up your workspace.
          </p>
          <button onClick={() => setCheckEmailPhrase(false)} className="btn btn-outline w-full py-3">
            I've confirmed my email
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("layout-container", "items-center", "justify-center", "bg-[var(--bg-base)]")}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel w-full max-w-lg p-10 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-[var(--primary-light)] rounded-full flex items-center justify-center mb-4 text-[var(--primary)] shadow-sm">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Setup Organization</h1>
          <p className="text-[var(--text-muted)]">Create your admin account & workspace</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-md bg-[var(--danger-bg)] text-[var(--danger-text)] text-sm border border-[var(--danger)]/20 leading-relaxed font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateTenantAndUser} className="space-y-4">
          <div className="input-group">
            <label className="input-label" htmlFor="orgName">Organization Name</label>
            <input 
              id="orgName"
              type="text" 
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="input-field"
              placeholder="e.g. Acme Corporation"
              required
            />
          </div>

          {!existingUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label" htmlFor="email">Your Admin Email</label>
                <input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="admin@acme.com"
                  required
                />
              </div>
              
              <div className="input-group">
                <label className="input-label" htmlFor="password">Password</label>
                <input 
                  id="password"
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary w-full h-12 text-base mt-6 text-white"
            disabled={loading || !orgName || (!existingUser && (!email || !password))}
          >
            {loading ? 'Creating Account & Workspace...' : 'Complete Setup'}
            {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
          </button>
        </form>
        
        {!existingUser && (
          <p className="mt-6 text-center text-sm text-[var(--text-muted)] relative z-50">
            Already have an account? <Link href="/login" className="text-[var(--primary)] hover:underline font-medium cursor-pointer">Log in</Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}
