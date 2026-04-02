'use client';

import { useState, useEffect } from 'react';
import { Save, UploadCloud, PaintBucket, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { updateOrganizationSettings } from '@/app/actions';

export default function SettingsPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const supabase = createClient();
  const router = useRouter();

  // Load organization setting
  useEffect(() => {
    async function loadOrg() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: dbUser } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single();
        
      if (dbUser?.org_id) {
        setOrgId(dbUser.org_id);
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', dbUser.org_id)
          .single();
          
        if (org) {
          setOrgName(org.name || '');
          setPrimaryColor(org.primary_color || '#4f46e5');
          setLogoUrl(org.logo_url || '');
        }
      }
    }
    loadOrg();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    
    setLoading(true);
    setSuccess(false);
    setErrorMsg("");
    
    try {
      let finalLogoUrl = logoUrl;
      
      // Upload logo if new one selected
      if (logoFile) {
        setUploadingLogo(true);
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${orgId}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) {
          throw new Error("Logo upload failed: " + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('company-logos')
          .getPublicUrl(filePath);
          
        finalLogoUrl = publicUrlData.publicUrl;
        setLogoUrl(finalLogoUrl);
        setUploadingLogo(false);
      }
      
      // Save settings via secure Server Action
      const result = await updateOrganizationSettings({
        name: orgName,
        primaryColor: primaryColor,
        logoUrl: finalLogoUrl
      });

      if (result.error) {
         throw new Error(result.error);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setLogoFile(null);
      // Removed router.refresh() since the Server Action triggers revalidatePath natively
      
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save settings");
      setUploadingLogo(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-[var(--text-muted)] mt-1">Manage your brand, logo, and preferences.</p>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-8">
        {errorMsg && (
          <div className="mb-6 p-4 bg-[var(--danger-bg)] text-[var(--danger-text)] rounded-lg text-sm font-medium">
            {errorMsg}
          </div>
        )}
        
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* General Settings */}
          <div className="border-b border-[var(--border)] pb-8">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-main)]">General Info</h2>
            <div className="max-w-md">
              <div className="input-group">
                <label className="input-label">Organization Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required 
                />
              </div>
            </div>
          </div>

          {/* Branding Settings */}
          <div className="border-b border-[var(--border)] pb-8">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-main)]">Branding</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Logo Upload */}
              <div>
                <label className="input-label mb-2 block">Company Logo</label>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-[var(--border)] px-6 py-6 hover:border-[var(--primary)] transition-colors bg-[var(--bg-surface)] relative overflow-hidden group">
                  
                  {logoUrl && !logoFile && (
                    <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-10 transition-opacity">
                      <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain p-4" />
                    </div>
                  )}

                  <div className="text-center relative z-10">
                    <UploadCloud className="mx-auto h-12 w-12 text-[var(--text-muted)]" aria-hidden="true" />
                    <div className="mt-4 flex text-sm leading-6 text-[var(--text-muted)] justify-center">
                      <label className="relative cursor-pointer rounded-md font-semibold text-[var(--primary)] focus-within:outline-none focus-within:ring-2 hover:text-[var(--primary-hover)]">
                        <span>{logoFile ? logoFile.name : 'Upload a file'}</span>
                        <input 
                          type="file" 
                          className="sr-only" 
                          accept="image/png, image/jpeg, image/gif"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setLogoFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-xs leading-5 mt-1">PNG, JPG, GIF max 5MB</p>
                  </div>
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="input-label mb-2 block flex items-center gap-2">
                  <PaintBucket size={16}/> Primary Color
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <div 
                    className="w-16 h-16 rounded-lg shadow-sm border border-[var(--border)]"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div className="flex-1">
                    <input 
                      type="color" 
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full h-10 border-0 p-0 rounded cursor-pointer" 
                    />
                    <div className="text-sm font-mono mt-1 text-[var(--text-muted)] uppercase">
                      {primaryColor}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-2">
            {success && (
              <span className="text-[var(--success)] font-medium text-sm animate-fade-in bg-[var(--success-bg)] px-4 py-2 rounded-lg">
                Settings saved successfully!
              </span>
            )}
            <button 
              type="submit" 
              className="btn btn-primary px-8"
              disabled={loading || !orgId}
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save size={18} className="mr-2" /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
