'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Plus, UserPlus, RefreshCw, Trash2, Mail, Briefcase } from 'lucide-react';
import { syncHostsFromMicrosoft365 } from '@/app/actions/notify';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const supabase = createClient();

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Explicit programmatic tenant scoping
    const { data: dbUser } = await supabase.from('users').select('org_id').eq('id', user.id).single();

    const { data, error } = await supabase
      .from('hosts')
      .select('*')
      .eq('org_id', dbUser?.org_id)
      .order('name');
      
    if (data) setEmployees(data);
    setLoading(false);
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: dbUser } = await supabase.from('users').select('org_id').eq('id', user?.id).single();
      
      const { error } = await supabase
        .from('hosts')
        .insert([{
          org_id: dbUser?.org_id,
          name,
          email,
          job_title: jobTitle
        }]);

      if (error) throw error;
      
      setShowForm(false);
      setName('');
      setEmail('');
      setJobTitle('');
      fetchEmployees();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add employee");
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this employee?')) return;
    await supabase.from('hosts').delete().eq('id', id);
    fetchEmployees();
  };

  const handleM365Sync = async () => {
    setSyncing(true);
    try {
      // Simulate calling Graph API via our mock action
      await syncHostsFromMicrosoft365('default_tenant');
      
      // Since it's a mock, it won't actually insert into DB, so we'll just wait
      await new Promise(r => setTimeout(r, 1500));
      alert('Mock Sync Complete: Note, since M365 tokens require live app registration, real data was not imported. Simulated success.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">Employee Directory</h1>
          <p className="text-[var(--text-muted)] mt-1">Manage staff eligible to receive visitor check-in notifications.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <button 
            onClick={handleM365Sync} 
            disabled={syncing}
            className="btn btn-outline flex items-center bg-white"
          >
            <RefreshCw size={16} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync M365 (AD)'}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center">
            {showForm ? 'Cancel' : <><Plus size={16} className="mr-2" /> Add Manually</>}
          </button>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-panel p-6 mb-8 overflow-hidden">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><UserPlus size={20} className="text-[var(--primary)]"/> Register New Employee</h2>
          {errorMsg && <div className="text-[var(--danger)] text-sm mb-4">{errorMsg}</div>}
          
          <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input type="text" required value={name} onChange={e=>setName(e.target.value)} className="input-field" placeholder="John Doe" />
            </div>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="input-field" placeholder="john@company.com" />
            </div>
            <div className="input-group">
              <label className="input-label">Job Title</label>
              <input type="text" required value={jobTitle} onChange={e=>setJobTitle(e.target.value)} className="input-field" placeholder="Manager" />
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary h-10 w-full mb-[2px]">
              {submitting ? 'Saving...' : 'Save Employee'}
            </button>
          </form>
        </motion.div>
      )}

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-muted)] animate-pulse">Loading directory...</div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-16 h-16 text-[var(--border)] mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No Employees Found</h3>
            <p className="text-[var(--text-muted)] mb-6">You need to add employees before visitors can select hosts at the Kiosk.</p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary">Add Your First Employee</button>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-base)] border-b border-[var(--border)]">
              <tr>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Employee Info</th>
                <th className="p-4 font-semibold text-[var(--text-muted)]">Job Title</th>
                <th className="p-4 font-semibold text-[var(--text-muted)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-base)] transition">
                  <td className="p-4">
                    <div className="font-medium text-lg">{emp.name}</div>
                    <div className="text-[var(--text-muted)] flex items-center text-sm mt-1 gap-1"><Mail size={12}/> {emp.email}</div>
                  </td>
                  <td className="p-4 ">{emp.job_title || '—'}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(emp.id)} className="text-[var(--danger)] hover:bg-[var(--danger-bg)] p-2 rounded-lg transition" title="Remove employee">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
