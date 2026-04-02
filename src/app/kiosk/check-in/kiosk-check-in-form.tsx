"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ArrowRight, User, Briefcase, Camera, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { submitCheckIn } from '@/app/actions';

export default function KioskCheckInForm({ hosts }: { hosts: { id: string, name: string }[] }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  // Multi-step form state
  const [formState, setFormState] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    company: '',
    host_id: '',
    purpose: '',
    nda_signed: false,
    photoBase64: ''
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Initialize camera when reaching Step 4
  useEffect(() => {
    if (step === 4) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [step]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setErrorMsg("Unable to access camera. Please skip or check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormState(prev => ({ ...prev, photoBase64: dataUrl }));
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setFormState(prev => ({ ...prev, photoBase64: '' }));
    startCamera();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const attemptNextStep = (e: React.FormEvent, currentStep: number) => {
    e.preventDefault();
    setErrorMsg("");

    // Manual Validation to prevent silent failures later
    if (currentStep === 1) {
      if (!formState.first_name || !formState.last_name || !formState.phone_number || !formState.company) {
        return setErrorMsg("Please fill in all required fields (First Name, Last Name, Phone, and Company) before continuing.");
      }
    }
    if (currentStep === 2) {
      if (!formState.host_id || !formState.purpose) {
        return setErrorMsg("Please select an employee and state your purpose of visit.");
      }
    }
    if (currentStep === 3) {
      if (!formState.nda_signed) {
        return setErrorMsg("You must agree to the Non-Disclosure Agreement before proceeding.");
      }
    }

    setStep(step + 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    setErrorMsg("");

    const payload = new FormData();
    payload.append("first_name", formState.first_name);
    payload.append("last_name", formState.last_name);
    payload.append("phone_number", formState.phone_number);
    payload.append("email", formState.email);
    payload.append("company", formState.company);
    payload.append("host_id", formState.host_id);
    payload.append("purpose", formState.purpose);
    if (formState.photoBase64) {
      payload.append("photoString", formState.photoBase64);
    }
    if (formState.nda_signed) {
      payload.append("nda_signed", "on");
    }

    const result = await submitCheckIn(null, payload);
    
    setLoading(false);
    
    if (result && result.error) {
      setErrorMsg(result.error);
      setStep(1); 
    } else {
      setStep(5); 
      setTimeout(() => router.push('/kiosk'), 5000);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0 }),
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-2xl mx-auto pb-20">
      
      {step < 5 && (
        <div className="w-full flex items-center justify-between mb-8">
          <Link href="/kiosk" className="inline-flex items-center text-[var(--text-muted)] hover:text-[var(--primary)] transition group font-medium text-lg">
            <ChevronLeft className="w-6 h-6 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back
          </Link>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${step >= i ? 'w-12 bg-[var(--primary)]' : 'w-4 bg-[var(--border)]'}`} />
            ))}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="w-full mb-4 p-4 bg-[var(--danger-bg)] border border-[var(--danger)] text-[var(--danger)] rounded-xl flex items-center gap-3 font-medium shadow-sm animate-fade-in">
          <AlertCircle size={24} />
          <p>{errorMsg}</p>
        </div>
      )}

      <div className="w-full relative glass-panel p-8 md:p-12 min-h-[500px] shadow-2xl flex flex-col">
        <form id="kiosk-form" onSubmit={(e) => { e.preventDefault() }} className="contents">
          <AnimatePresence mode="wait" custom={1}>
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <motion.div key="step1" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex-1 flex flex-col">
                <h2 className="text-3xl font-extrabold mb-2">Welcome! Let's get started.</h2>
                <p className="text-[var(--text-muted)] mb-8 text-lg">Please enter your basic information.</p>
                
                <div className="space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="input-group">
                      <label className="input-label text-base">First Name *</label>
                      <input type="text" name="first_name" required value={formState.first_name} onChange={handleChange} autoFocus className="input-field py-4 text-lg bg-white/60 focus:bg-white border-[var(--border)]" placeholder="Jane" />
                    </div>
                    <div className="input-group">
                      <label className="input-label text-base">Last Name *</label>
                      <input type="text" name="last_name" required value={formState.last_name} onChange={handleChange} className="input-field py-4 text-lg bg-white/60 focus:bg-white border-[var(--border)]" placeholder="Doe" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="input-group">
                      <label className="input-label text-base">Phone *</label>
                      <input type="tel" name="phone_number" required value={formState.phone_number} onChange={handleChange} className="input-field py-4 text-lg bg-white/60 focus:bg-white border-[var(--border)]" placeholder="+234" />
                    </div>
                    <div className="input-group">
                      <label className="input-label text-base">Email (Optional)</label>
                      <input type="email" name="email" value={formState.email} onChange={handleChange} className="input-field py-4 text-lg bg-white/60 focus:bg-white border-[var(--border)]" placeholder="" />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label text-base">Organization / Company *</label>
                    <input type="text" name="company" required value={formState.company} onChange={handleChange} className="input-field py-4 text-lg bg-white/60 focus:bg-white border-[var(--border)]" placeholder="" />
                  </div>
                </div>
                <button type="button" onClick={(e) => attemptNextStep(e, 1)} className="btn btn-primary w-full py-4 text-lg mt-8 shadow-lg">Continue <ArrowRight size={20} className="ml-2"/></button>
              </motion.div>
            )}

            {/* STEP 2: Visit Target */}
            {step === 2 && (
              <motion.div key="step2" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex-1 flex flex-col">
                <h2 className="text-3xl font-extrabold mb-2">Who are you visiting?</h2>
                <p className="text-[var(--text-muted)] mb-8 text-lg">Select your host and reason for visit.</p>
                
                <div className="space-y-6 flex-1">
                  <div className="input-group">
                    <label className="input-label text-base flex items-center gap-2"><User size={18}/> Host Name *</label>
                    {hosts.length === 0 && (
                       <p className="text-sm text-[var(--warning)] mb-2">No hosts configured! Admin needs to add employees.</p>
                    )}
                    <select name="host_id" required value={formState.host_id} onChange={handleChange} className="input-field py-4 text-lg bg-white/60 border-[var(--border)]">
                      <option value="" disabled>Select an employee</option>
                      {hosts.map(host => (
                        <option key={host.id} value={host.id}>{host.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label text-base flex items-center gap-2"><Briefcase size={18}/> Purpose of Visit *</label>
                    <select name="purpose" required value={formState.purpose} onChange={handleChange} className="input-field py-4 text-lg bg-white/60 appearance-none border-[var(--border)]">
                      <option value="" disabled>Select a reason</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Interview">Interview</option>
                      <option value="Delivery">Delivery / Vendor</option>
                      <option value="Personal">Personal</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <button type="button" onClick={() => setStep(1)} className="btn btn-outline py-4 w-1/3 text-lg">Back</button>
                  <button type="button" onClick={(e) => attemptNextStep(e, 2)} className="btn btn-primary py-4 w-2/3 text-lg shadow-lg">Continue <ArrowRight size={20} className="ml-2"/></button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: NDA */}
            {step === 3 && (
              <motion.div key="step3" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex-1 flex flex-col">
                <h2 className="text-3xl font-extrabold mb-2 flex items-center"><FileText className="mr-3 text-[var(--primary)] text-3xl"/> Non-Disclosure Agreement</h2>
                <p className="text-[var(--text-muted)] mb-4 text-lg">Please read and sign our visitor agreement.</p>
                
                <div className="flex-1 overflow-y-auto mb-6 p-6 border border-[var(--border)] rounded-xl bg-white/50 text-sm focus:outline-none focus:ring-2" tabIndex={0}>
                  <p className="font-bold mb-3 uppercase">Confidentiality and Non-Disclosure Agreement</p>
                  <p className="mb-3">This Non-Disclosure Agreement ("Agreement") is between the visiting party ("Visitor") and the host Organization ("Company").</p>
                  <p className="mb-3 text-[var(--text-muted)] leading-relaxed">
                    1. <strong>Confidential Information.</strong> The Visitor acknowledges that during the visit, they may be exposed to proprietary, confidential, or trade secret information. This includes but is not limited to: business models, software architecture, client lists, and internal communications.<br/><br/>
                    2. <strong>Non-Disclosure.</strong> The Visitor agrees not to disclose, duplicate, photograph, or record any Confidential Information without express written consent from the Company.<br/><br/>
                    3. <strong>Return of Materials.</strong> Upon request or at the termination of the visit, the Visitor must return all physical and digital materials provided by the Company.<br/><br/>
                    4. <strong>Governing Law.</strong> This Agreement shall be governed by and construed in accordance with the laws of the operating jurisdiction.
                  </p>
                  <p className="font-medium text-[var(--danger)]">By checking the box below, you acknowledge that you have read, understood, and agree to be bound by the terms of this Agreement.</p>
                </div>

                <div className={`mb-6 flex items-start gap-3 p-4 border rounded-lg transition-colors ${formState.nda_signed ? 'border-[var(--primary)]/50 bg-[var(--primary-light)]/20' : 'border-[var(--border)] bg-gray-50/50'}`}>
                  <div className="mt-1">
                    <input type="checkbox" id="nda" name="nda_signed" required checked={formState.nda_signed} onChange={handleChange} className="w-6 h-6 cursor-pointer accent-[var(--primary)] rounded shadow-inner" />
                  </div>
                  <label htmlFor="nda" className="cursor-pointer text-base font-medium select-none text-gray-800">
                    I explicitly agree to the terms and conditions outlined in this Non-Disclosure Agreement.
                  </label>
                </div>

                <div className="flex gap-4 mt-auto">
                  <button type="button" onClick={() => setStep(2)} className="btn btn-outline py-4 w-1/3 text-lg">Back</button>
                  <button type="button" onClick={(e) => attemptNextStep(e, 3)} className="btn btn-primary py-4 w-2/3 text-lg shadow-lg">Agree & Continue <ArrowRight size={20} className="ml-2"/></button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Photo */}
            {step === 4 && (
              <motion.div key="step4" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex-1 flex flex-col items-center justify-center">
                <h2 className="text-3xl font-extrabold mb-2 text-center">Smile for the camera!</h2>
                <p className="text-[var(--text-muted)] mb-8 text-lg text-center">Take a quick photo for your visitor badge, or skip this step.</p>
                
                <div className="flex-1 w-full flex flex-col items-center justify-center mb-8">
                  <div className="relative w-64 h-64 rounded-xl border-4 border-[var(--primary)] overflow-hidden shadow-2xl bg-black">
                    {!formState.photoBase64 ? (
                      <>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover shadow-inner scale-x-[-1]" />
                        {!cameraActive && (
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                             <Camera size={48} className="text-[var(--text-muted)]" />
                          </div>
                        )}
                      </>
                    ) : (
                      <img src={formState.photoBase64} alt="Captured preview" className="w-full h-full object-cover scale-x-[-1]" />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  
                  <div className="mt-6 h-12 flex items-center justify-center">
                    {!formState.photoBase64 ? (
                      <button type="button" onClick={takePhoto} disabled={!cameraActive} className="btn bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] rounded-full px-8 py-3 font-semibold shadow-lg transition transform hover:scale-105">
                        Capture Image
                      </button>
                    ) : (
                      <button type="button" onClick={retakePhoto} className="text-[var(--text-muted)] hover:text-[var(--primary)] font-medium underline px-4 py-2">
                        Retake Photo
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 mt-auto w-full">
                  <button type="button" onClick={() => handleComplete()} disabled={loading} className="btn py-4 w-1/3 text-lg border-2 border-gray-200 text-gray-500 hover:bg-gray-50 font-semibold shadow-sm transition">
                    Skip Photo
                  </button>
                  <button type="button" onClick={() => handleComplete()} disabled={loading} className="btn btn-primary py-4 w-2/3 text-lg shadow-lg flex items-center justify-center">
                    {loading ? <Loader2 className="animate-spin mr-2" size={24} /> : null}
                    {loading ? 'Processing...' : formState.photoBase64 ? 'Approve & Complete' : 'Complete Check-In'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Success */}
            {step === 5 && (
              <motion.div key="step5" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                  <CheckCircle className="w-28 h-28 text-[var(--success)] mb-6 mx-auto" />
                </motion.div>
                <h2 className="text-4xl font-black mb-4">You're all set!</h2>
                <p className="text-[var(--text-muted)] text-xl max-w-md mx-auto">Your host has been notified of your arrival and a visitor badge is safely being generated.</p>
                <div className="mt-12 text-[var(--success)] font-bold text-lg bg-[var(--success-bg)] px-8 py-4 rounded-full border border-[var(--success)]/20 shadow-sm animate-fade-in">
                  Please take a seat at reception.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
