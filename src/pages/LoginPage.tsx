import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../lib/errorHandlers';
import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { GraduationCap, Mail, Lock, User, Phone, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

export default function LoginPage() {
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
        navigate('/');
      } else {
        if (!otpStep) {
          setOtpStep(true);
          setLoading(false);
          toast('Simulation Mode: Use development code 123456', { 
            icon: '📱',
            duration: 6000 
          });
          return;
        }

        if (otpValue !== '123456') {
          throw new Error('Invalid OTP. Use development code: 123456');
        }
        
        // Finalize registration
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: name });
        
        const profileData = {
          uid: user.uid,
          email,
          name,
          role,
          mobile,
          registrationNo: role === 'student' ? registrationNo : '',
          createdAt: new Date().toISOString()
        };
        
        try {
          await setDoc(doc(db, 'users', user.uid), profileData);
        } catch (err: any) {
          handleFirestoreError(err, OperationType.CREATE, 'users/' + user.uid);
        }
        toast.success('Account created successfully!');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "flex min-h-screen items-center justify-center p-4 transition-colors duration-500",
      theme === 'safe' ? "bg-brand-bg text-[#001226]" : "bg-slate-950 text-white"
    )}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full",
          theme === 'safe' ? "bg-[#00a6bb]/10" : "bg-brand-primary/10"
        )}></div>
        <div className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full",
          theme === 'safe' ? "bg-[#001D3D]/10" : "bg-blue-500/10"
        )}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "w-full max-w-md border rounded-3xl shadow-2xl overflow-hidden relative z-10 transition-all",
          theme === 'safe' ? "bg-white border-slate-300 shadow-slate-200" : "bg-slate-900 border-slate-800"
        )}
      >
        <div className="p-8">
          <div className="flex flex-col items-center mb-10">
            <div className={cn(
              "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl transition-all",
              theme === 'safe' ? "bg-[#001226] text-white" : "bg-brand-primary text-black"
            )}>
              <GraduationCap size={40} />
            </div>
            <h1 className={cn(
              "text-3xl font-black tracking-tighter uppercase mb-1",
              theme === 'safe' ? "text-[#001226]" : "text-white"
            )}>GPA Genie</h1>
            <p className={cn(
              "text-xs uppercase font-bold tracking-widest",
              theme === 'safe' ? "text-[#00a6bb]" : "text-slate-400"
            )}>Academic Verification System</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && !otpStep && (
              <>
                <div className="relative">
                  <User className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                    theme === 'safe' ? "text-[#001226]/40" : "text-slate-500"
                  )} size={18} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn(
                      "w-full rounded-xl py-3 pl-12 pr-4 focus:outline-none transition-all border-2",
                      theme === 'safe' 
                        ? "bg-slate-50 border-slate-100 focus:border-[#001226] text-[#001226]" 
                        : "bg-slate-800 border-slate-700 text-white focus:border-emerald-500"
                    )}
                  />
                </div>
                <div className="relative">
                  <Phone className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                    theme === 'safe' ? "text-[#001226]/40" : "text-slate-500"
                  )} size={18} />
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className={cn(
                      "w-full rounded-xl py-3 pl-12 pr-4 focus:outline-none transition-all border-2",
                      theme === 'safe' 
                        ? "bg-slate-50 border-slate-100 focus:border-[#001226] text-[#001226]" 
                        : "bg-slate-800 border-slate-700 text-white focus:border-emerald-500"
                    )}
                  />
                </div>
                {role === 'student' && (
                  <div className="relative">
                    <GraduationCap className={cn(
                      "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                      theme === 'safe' ? "text-[#001226]/40" : "text-slate-500"
                    )} size={18} />
                    <input
                      type="text"
                      placeholder="Registration Number"
                      required={role === 'student'}
                      value={registrationNo}
                      onChange={(e) => setRegistrationNo(e.target.value)}
                      className={cn(
                        "w-full rounded-xl py-3 pl-12 pr-4 focus:outline-none transition-all border-2",
                        theme === 'safe' 
                          ? "bg-slate-50 border-slate-100 focus:border-[#001226] text-[#001226]" 
                          : "bg-slate-800 border-slate-700 text-white focus:border-emerald-500"
                    )}
                    />
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 py-2">
                  {(['student', 'teacher', 'mis'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        "py-3 text-[10px] font-black uppercase tracking-tighter rounded-xl border-2 transition-all",
                        role === r 
                          ? (theme === 'safe' ? "bg-[#001226] border-[#001226] text-white" : "bg-emerald-500 border-emerald-500 text-black") 
                          : (theme === 'safe' ? "bg-white border-slate-200 text-slate-400 hover:border-[#001226]/30" : "bg-slate-800 border-slate-700 text-slate-400")
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </>
            )}

            {!otpStep ? (
              <>
                <div className="relative">
                  <Mail className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                    theme === 'safe' ? "text-[#001226]/40" : "text-slate-500"
                  )} size={18} />
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "w-full rounded-xl py-3 pl-12 pr-4 focus:outline-none transition-all border-2",
                      theme === 'safe' 
                        ? "bg-slate-50 border-slate-100 focus:border-[#001226] text-[#001226]" 
                        : "bg-slate-800 border-slate-700 text-white focus:border-emerald-500"
                    )}
                  />
                </div>
                <div className="relative">
                  <Lock className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                    theme === 'safe' ? "text-[#001226]/40" : "text-slate-500"
                  )} size={18} />
                  <input
                    type="password"
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "w-full rounded-xl py-3 pl-12 pr-4 focus:outline-none transition-all border-2",
                      theme === 'safe' 
                        ? "bg-slate-50 border-slate-100 focus:border-[#001226] text-[#001226]" 
                        : "bg-slate-800 border-slate-700 text-white focus:border-emerald-500"
                    )}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className={cn(
                  "p-4 rounded-xl border-2 transition-all",
                  theme === 'safe' ? "bg-emerald-50 border-emerald-100" : "bg-emerald-500/10 border-emerald-500/20"
                )}>
                  <p className={cn(
                    "text-sm text-center font-bold",
                    theme === 'safe' ? "text-emerald-700" : "text-emerald-400"
                  )}>Verification code sent to {mobile}</p>
                </div>
                <div className="relative">
                  <CheckCircle2 className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                    theme === 'safe' ? "text-[#001226]/40" : "text-slate-500"
                  )} size={18} />
                  <input
                    type="text"
                    placeholder="123456"
                    required
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    maxLength={6}
                    className={cn(
                      "w-full rounded-xl py-4 pl-12 pr-4 focus:outline-none transition-all border-2 text-center tracking-[0.5em] font-black text-2xl",
                      theme === 'safe' 
                        ? "bg-slate-50 border-slate-100 focus:border-[#001226] text-[#001226]" 
                        : "bg-slate-800 border-slate-700 text-white focus:border-emerald-500"
                    )}
                  />
                </div>
                <p className={cn(
                  "text-[10px] text-center uppercase tracking-widest font-black italic",
                  theme === 'safe' ? "text-[#001226]/30" : "text-slate-500"
                )}>
                  Simulation Environment
                </p>
              </div>
            )}

            <button
              disabled={loading}
              className={cn(
                "w-full py-4 rounded-xl font-black uppercase tracking-tighter shadow-xl focus:ring-4 transition-all flex items-center justify-center",
                theme === 'safe' 
                  ? "bg-[#001226] text-white hover:bg-black focus:ring-[#001226]/20" 
                  : "bg-brand-primary text-black hover:opacity-90 focus:ring-emerald-500/20"
              )}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              ) : (
                isLogin ? 'Sign In' : (otpStep ? 'Verify Identity' : 'Register Account')
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setOtpStep(false);
              }}
              className={cn(
                "text-xs uppercase font-black tracking-widest transition-colors",
                theme === 'safe' ? "text-[#001226]/40 hover:text-[#001226]" : "text-slate-400 hover:text-emerald-400"
              )}
            >
              {isLogin ? "Join the vault? Sign Up" : "Back to access? Sign In"}
            </button>
          </div>
        </div>
        
        <div className={cn(
          "p-5 text-center border-t transition-all",
          theme === 'safe' ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"
        )}>
          <p className={cn(
            "text-[9px] uppercase tracking-[0.3em] font-black flex items-center justify-center gap-3",
            theme === 'safe' ? "text-[#001226]/40" : "text-slate-600"
          )}>
            <ShieldCheck size={14} className={theme === 'safe' ? "text-[#00a6bb]" : "text-emerald-500"} />
            Advanced Academic Shield
          </p>
        </div>
      </motion.div>
    </div>
  );
}
