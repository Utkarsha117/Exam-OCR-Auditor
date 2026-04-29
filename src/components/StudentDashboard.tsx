import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, or, updateDoc } from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../lib/errorHandlers';
import { db } from '../lib/firebase';
import { GPAEntry } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Award, Clock, Trash2, FileDown, Download, X, BarChart3, PieChart as PieChartIcon, Search, ShieldCheck } from 'lucide-react';
import ResultUploader from './ResultUploader';
import { motion } from 'motion/react';
import { formatTimestamp, getPointerColor, cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const isLight = ['light', 'safe', 'swiss', 'mono'].includes(theme);
  const [history, setHistory] = useState<GPAEntry[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<GPAEntry | null>(null);
  const [semFilter, setSemFilter] = useState({ from: '', to: '' });

  useEffect(() => {
    if (!user) return;
    
    // Query records belongs to this UID OR this Registration No
    let q;
    const regNo = profile?.registrationNo;

    if (regNo) {
      q = query(
        collection(db, 'gpa_history'),
        or(
          where('uid', '==', user.uid),
          where('registrationNo', '==', regNo)
        ),
        orderBy('timestamp', 'desc')
      );
    } else {
      q = query(
        collection(db, 'gpa_history'),
        where('uid', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GPAEntry));
      setHistory(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gpa_history');
    });

    return unsubscribe;
  }, [user]);

  const uniqueSemesters = Array.from(new Set(history.map(h => h.semester))).sort();
  
  const filteredHistory = history.filter(h => {
    if (!semFilter.from && !semFilter.to) return true;
    const semIndex = uniqueSemesters.indexOf(h.semester);
    const fromIndex = semFilter.from ? uniqueSemesters.indexOf(semFilter.from) : 0;
    const toIndex = semFilter.to ? uniqueSemesters.indexOf(semFilter.to) : uniqueSemesters.length - 1;
    return semIndex >= Math.min(fromIndex, toIndex) && semIndex <= Math.max(fromIndex, toIndex);
  });

  const chartData = [...filteredHistory].reverse().map(item => ({
    name: item.semester,
    sgpa: item.sgpa,
    cgpa: item.cgpa
  }));

  const latest = filteredHistory[0] || history[0];
  const avgSgpa = filteredHistory.length > 0 
    ? (filteredHistory.reduce((acc, h) => acc + h.sgpa, 0) / filteredHistory.length).toFixed(2) 
    : '0.00';

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm('Delete this record?')) {
      try {
        await deleteDoc(doc(db, 'gpa_history', id));
        toast.success('Record deleted');
      } catch (err: any) {
        handleFirestoreError(err, OperationType.DELETE, 'gpa_history/' + id);
      }
    }
  };

  const exportPDF = () => {
    if (filteredHistory.length === 0) {
      toast.error('No records in selected range');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(5, 5, 5);
    doc.text("GPA Genie: Official Dossier", 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Official Academic Summary for ${profile?.name}`, 20, 32);
    doc.text(`Session: 2023-24 | Student GPA Genie`, 20, 37);

    let y = 55;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y - 5, 190, y - 5);
    
    doc.setFontSize(11);
    doc.setTextColor(0);
    filteredHistory.forEach((h) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${h.semester}`, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(`SGPA: ${h.sgpa.toFixed(2)} | CGPA: ${h.cgpa.toFixed(2)}`, 80, y);
      doc.text(`Status: ${h.verificationStatus.toUpperCase()}`, 150, y);
      y += 10;
    });

    doc.save(`${profile?.name}_Academic_Report.pdf`);
    toast.success('Custom PDF Generated');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        {theme === 'safe' ? (
          <div className="w-full space-y-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#001D3D] rounded-xl flex items-center justify-center p-2 text-white shadow-xl">
                   <div className="flex flex-col items-center leading-none">
                      <span className="text-[13px] font-bold">GET</span>
                      <span className="text-sm font-black">SAFE</span>
                      <span className="text-[13px] font-bold text-[#00a6bb]">ONLINE</span>
                   </div>
                </div>
                <div className="hidden lg:flex gap-6">
                  {['HOME', 'BLOG', 'NEWS', 'VIDEOS', 'GLOSSARY', 'CONTACT US'].map(item => (
                    <span key={item} className="text-[13px] font-extra-bold text-[#001D3D]/50 hover:text-[#001D3D] cursor-pointer transition-colors uppercase tracking-widest">{item}</span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-100">
                <button className="px-6 py-2 bg-[#d7f2f5] text-[#005495] rounded-full text-xs font-bold shadow-sm transition-all">Personal</button>
                <button className="px-6 py-2 text-slate-400 rounded-full text-xs font-bold hover:bg-slate-100 transition-all">Business</button>
              </div>

              <div className="flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 w-full md:w-64 max-w-xs focus-within:border-[#00a6bb] transition-all">
                 <input type="text" placeholder="Search for..." className="bg-transparent border-none focus:ring-0 text-sm w-full" />
                 <Search size={16} className="text-[#00a6bb]" />
              </div>
            </div>

            {/* Main Action Banner */}
            <div className="w-full bg-white p-12 lg:p-20 rounded-[3rem] overflow-hidden relative shadow-sm border border-slate-100">
              <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
                <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M0,1000 C300,800 400,200 1000,0 L1000,1000 Z" fill="#00a6bb" />
                </svg>
              </div>

              <div className="relative z-10">
                <nav className="flex gap-2 text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-10">
                  <span>HOME</span>
                  <span>›</span>
                </nav>

                <h1 className="text-6xl lg:text-8xl font-black tracking-tighter mb-12 text-[#001D3D]">
                  Student <br/> <span className="text-[#001D3D]">GPA Genie</span>
                </h1>
                
                <p className="text-lg font-bold text-[#001D3D]/40 mb-10 max-w-xl">Unified digital repository for academic excellence and verified records.</p>

                <div className="flex flex-col md:flex-row items-stretch bg-[#001D3D] rounded-3xl overflow-hidden shadow-2xl p-4 gap-4">
                  <div className="flex-1 flex items-center px-6 gap-4">
                    <span className="text-2xl font-bold text-white opacity-60">ID:</span>
                    <input 
                      type="text" 
                      placeholder="Enter your academic registration ID..." 
                      className="w-full bg-white rounded-full border-none focus:ring-0 text-slate-900 font-medium placeholder:text-slate-300 py-5 px-10 text-xl shadow-inner"
                    />
                  </div>
                  <button className="bg-black hover:bg-slate-900 text-white px-12 py-5 rounded-full font-bold text-lg transition-all active:scale-95 shadow-xl whitespace-nowrap">
                    Search Hub
                  </button>
                </div>
                
                <p className="mt-8 text-[13px] text-slate-400 tracking-tight leading-relaxed max-w-2xl">
                  * Clicking "Search Hub" will verify your academic records against the central registry. No information that can identify you personally is transferred, collected, or stored.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {theme === 'swiss' ? (
              <div className="w-full bg-white border-4 border-black p-10 mb-4 flex flex-col md:flex-row items-end justify-between shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                 <div className="max-w-xl">
                   <h1 className="text-7xl font-black uppercase tracking-tighter leading-[0.8] mb-4">
                     Data <br/> <span className="text-red-600">Archive</span>
                   </h1>
                   <p className="text-sm font-bold uppercase tracking-widest text-black/40">Student Id: {profile?.registrationNo || 'UNASSIGNED'}</p>
                 </div>
                 <div className="mt-8 md:mt-0 px-6 py-3 bg-red-600 text-white font-black uppercase italic text-2xl tracking-tighter -rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   GPA Genie 2023-24
                 </div>
              </div>
            ) : theme === 'mono' ? (
              <div className="w-full bg-white border border-slate-200 p-8 rounded-xl mb-4 font-mono shadow-sm">
                 <div className="flex items-center gap-2 text-[#005495] mb-2">
                   <ShieldCheck size={16} />
                   <span className="text-[13px] font-bold uppercase tracking-widest">Authenticated Session</span>
                 </div>
                 <h1 className="text-2xl font-bold text-slate-900 mb-1">{profile?.name}</h1>
                 <p className="text-xs text-slate-500 uppercase tracking-widest">{profile?.registrationNo ? `ID: ${profile.registrationNo}` : 'REGISTRATION PENDING'}</p>
                 <div className="mt-6 pt-6 border-t border-slate-100 flex gap-8">
                    <div>
                       <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Status</p>
                       <p className="text-xs font-bold text-emerald-600 uppercase">Synchronized</p>
                    </div>
                    <div>
                       <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Security</p>
                       <p className="text-xs font-bold text-slate-700 uppercase">Encrypted</p>
                    </div>
                 </div>
              </div>
            ) : (
              <div>
                <h2 className={cn(
                  "text-2xl font-black uppercase",
                  isLight ? "text-slate-900" : "text-white"
                )}>{profile?.name}</h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className={cn(
                    "text-[13px] uppercase tracking-widest font-mono",
                    isLight ? "text-slate-500" : "text-white/30"
                  )}>
                    Registration Number: <span className="text-brand-primary font-bold">{profile?.registrationNo || 'Not Set'}</span>
                  </span>
                  {!profile?.registrationNo && (
                    <button 
                      onClick={() => {
                        const reg = prompt('Enter your Registration Number:');
                        if (reg) {
                          import('firebase/firestore').then(({ doc, updateDoc }) => {
                            updateDoc(doc(db, 'users', user.uid), { registrationNo: reg })
                              .then(() => toast.success('Registration number updated'))
                              .catch(err => toast.error('Update failed'));
                          });
                        }
                      }}
                      className="text-[13px] font-bold text-brand-primary hover:underline uppercase tracking-widest"
                    >
                      [Set Now]
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className={cn(
            "p-6 rounded-2xl border transition-all duration-500",
            theme === 'cyber' ? "glass-card border-white/5" : 
            theme === 'safe' ? "bg-white border-slate-200 shadow-sm hover:shadow-md" :
            isLight ? "bg-white border-slate-100 shadow-sm" : "bg-brand-surface border-white/5 shadow-xl"
          )}
        >
          <p className={cn(
            "text-[13px] uppercase mb-1 tracking-widest leading-none flex items-center gap-2",
            isLight ? "text-slate-400" : "text-white/40"
          )}>
            <Award size={10} className="text-blue-400" />
            Current CGPA
          </p>
          <div className="flex items-baseline gap-2">
            <p className={cn(
              "text-4xl font-black tracking-tighter",
              isLight ? (theme === 'safe' ? "text-[#001D3D]" : "text-slate-900") : "text-blue-400"
            )}>{latest?.cgpa || '0.00'}</p>
            <span className="text-[13px] text-emerald-600 font-black uppercase tracking-tighter">↑ Top 15%</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className={cn(
            "p-6 rounded-2xl border transition-all duration-500",
            theme === 'cyber' ? "glass-card border-white/5" : 
            theme === 'safe' ? "bg-white border-slate-200 shadow-sm hover:shadow-md" :
            isLight ? "bg-white border-slate-100 shadow-sm" : "bg-brand-surface border-white/5 shadow-xl"
          )}
        >
          <p className={cn(
            "text-[13px] uppercase mb-1 tracking-widest leading-none flex items-center gap-2",
            isLight ? "text-slate-400" : "text-white/40"
          )}>
            <TrendingUp size={10} className="text-emerald-400" />
            Average SGPA
          </p>
          <p className={cn(
            "text-4xl font-black tracking-tighter",
            isLight ? (theme === 'safe' ? "text-[#001D3D]" : "text-slate-900") : "text-emerald-400"
          )}>{avgSgpa}</p>
          <p className={cn(
            "text-[13px] mt-2 font-bold uppercase tracking-widest",
            isLight ? "text-slate-400" : "text-white/20"
          )}>Verified across {history.length} semesters</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className={cn(
            "p-6 rounded-2xl border transition-all duration-500",
            theme === 'cyber' ? "glass-card border-white/5" : 
            theme === 'safe' ? "bg-white border-slate-200 shadow-sm hover:shadow-md" :
            isLight ? "bg-white border-slate-100 shadow-sm" : "bg-brand-surface border-white/5 shadow-xl"
          )}
        >
          <p className={cn(
            "text-[13px] uppercase mb-1 tracking-widest leading-none flex items-center gap-2",
            isLight ? "text-slate-400" : "text-white/40"
          )}>
            <Clock size={10} className={isLight ? "text-slate-300" : "text-white/40"} />
            Audit Records
          </p>
          <p className={cn(
            "text-4xl font-black tracking-tighter",
            isLight ? (theme === 'safe' ? "text-[#001D3D]" : "text-slate-900") : "text-white"
          )}>
            {history.filter(h => h.verificationStatus === 'verified').length} / {history.length}
          </p>
          <p className={cn(
            "text-[13px] mt-2 font-bold uppercase tracking-widest",
            isLight ? "text-slate-400" : "text-white/20"
          )}>Digital Audit Complete</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Analysis */}
        <div className={cn(
          "lg:col-span-2 p-6 rounded-3xl border shadow-sm overflow-hidden relative transition-all duration-500",
          theme === 'safe' ? "bg-white/60 backdrop-blur-xl border-slate-200/50" :
          theme === 'cyber' ? "glass-card border-white/5" : 
          isLight ? "bg-white border-slate-100 shadow-sm" : "bg-brand-surface border-white/5 shadow-xl"
        )}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] rounded-full"></div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 relative z-10 gap-4">
            <h3 className={cn(
              "text-lg font-black uppercase tracking-[0.1em]",
              isLight ? (theme === 'safe' ? "text-[#001D3D]" : "text-slate-900") : "text-brand-primary"
            )}>Academic Trend Analysis</h3>
            
            <div className="flex items-center gap-2">
              <select 
                value={semFilter.from}
                onChange={(e) => setSemFilter({ ...semFilter, from: e.target.value })}
                className={cn(
                  "border rounded-lg px-2 py-1 text-[13px] focus:outline-none transition-colors",
                  isLight ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-white/5 border-white/10 text-white/60"
                )}
              >
                <option value="">Start</option>
                {uniqueSemesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className={isLight ? "text-slate-400 text-[13px]" : "text-white/20 text-[13px]"}>to</span>
              <select 
                value={semFilter.to}
                onChange={(e) => setSemFilter({ ...semFilter, to: e.target.value })}
                className={cn(
                  "border rounded-lg px-2 py-1 text-[13px] focus:outline-none transition-colors",
                  isLight ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-white/5 border-white/10 text-white/60"
                )}
              >
                <option value="">End</option>
                {uniqueSemesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <button 
                onClick={exportPDF}
                className={cn(
                  "text-[10px] font-bold flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border",
                  isLight 
                    ? "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200" 
                    : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-white/5"
                )}
              >
                <Download size={14} />
                EXPORT
              </button>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSgpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme === 'safe' ? "#00a6bb" : "#10b981"} stopOpacity={isLight ? 0.1 : 0.2}/>
                    <stop offset="95%" stopColor={theme === 'safe' ? "#00a6bb" : "#10b981"} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCgpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={isLight ? 0.1 : 0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.03)"} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 13, fill: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', fontWeight: 700}} 
                />
                <YAxis 
                  domain={[0, 10]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 13, fill: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', fontWeight: 700}} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isLight ? '#ffffff' : '#0a0a0a', 
                    borderRadius: '12px', 
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }}
                  itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '13px', fontWeight: 'bold', paddingBottom: '10px' }}
                />
                <Area type="monotone" name="SGPA" dataKey="sgpa" stroke={theme === 'safe' ? "#00a6bb" : "#10b981"} fillOpacity={1} fill="url(#colorSgpa)" strokeWidth={2} dot={{ r: 3, fill: theme === 'safe' ? "#00a6bb" : "#10b981", strokeWidth: 1, stroke: isLight ? '#ffffff' : '#050505' }} />
                <Area type="monotone" name="CGPA" dataKey="cgpa" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCgpa)" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 1, stroke: isLight ? '#ffffff' : '#050505' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upload Container */}
        <div className="lg:col-span-1">
          <ResultUploader onComplete={() => setShowUploader(false)} />
        </div>
      </div>

      <motion.div layout className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div layout className={cn("space-y-6", selectedRecord ? "lg:col-span-3" : "lg:col-span-4")}>
          <div className={cn(
            "rounded-3xl border shadow-sm overflow-hidden transition-all duration-500",
            theme === 'safe' ? "bg-white/60 backdrop-blur-xl border-slate-200/50" :
            theme === 'cyber' ? "glass-card border-white/5" : 
            isLight ? "bg-white border-slate-100 shadow-sm" : "bg-brand-surface border-white/5 shadow-2xl"
          )}>
            <div className={cn(
              "p-6 border-b flex items-center justify-between",
              isLight ? "border-slate-100" : "border-white/5"
            )}>
              <h3 className={cn(
                "text-xs font-bold uppercase tracking-[0.2em]",
                isLight ? (theme === 'safe' ? "text-[#003d73]" : "text-slate-900") : "text-white"
              )}>Verified Academic Records</h3>
              <span className={cn(
                "text-[13px] uppercase italic font-mono tracking-tighter",
                isLight ? "text-slate-400" : "text-white/30"
              )}>{history.length} Entries found</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={cn(
                  "text-[13px] uppercase font-bold tracking-[0.1em]",
                  isLight ? "bg-slate-50 text-slate-400" : "bg-[#050505] text-white/30"
                )}>
                  <tr>
                    <th className="px-6 py-4">Semester</th>
                    <th className="px-6 py-4">SGPA</th>
                    <th className="px-6 py-4">CGPA</th>
                    <th className="px-6 py-4">Audit Status</th>
                    <th className="px-6 py-4">Date Verified</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className={cn(
                  "divide-y text-sm",
                  isLight ? "divide-slate-100" : "divide-white/5"
                )}>
                  {filteredHistory.map((h) => (
                    <tr 
                      key={h.id} 
                      onClick={() => setSelectedRecord(h)}
                      className={cn(
                        "transition-colors group cursor-pointer",
                        isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.02]",
                        selectedRecord?.id === h.id ? (isLight ? "bg-slate-50" : "bg-white/5") : ""
                      )}
                    >
                      <td className={cn(
                        "px-6 py-4 font-bold uppercase tracking-tight",
                        isLight ? "text-slate-900" : "text-white/80"
                      )}>{h.semester}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded border text-xs font-mono font-bold",
                          h.sgpa >= 9 ? (isLight && theme === 'safe' ? "bg-[#003d73]/10 text-[#003d73] border-[#003d73]/20" : "bg-brand-primary/10 text-brand-primary border-brand-primary/20") :
                          h.sgpa >= 8 ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          {h.sgpa.toFixed(2)}
                        </span>
                      </td>
                      <td className={cn(
                        "px-6 py-4 font-mono text-xs",
                        isLight ? "text-slate-500" : "text-white/60"
                      )}>{h.cgpa.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[13px] font-bold uppercase tracking-widest border",
                          h.verificationStatus === 'verified' ? (isLight && theme === 'safe' ? "bg-[#003d73]/5 text-[#003d73] border-[#003d73]/20" : "bg-brand-primary/5 text-brand-primary border-brand-primary/20") : "bg-red-500/5 text-red-500 border-red-500/20"
                        )}>
                          {h.verificationStatus === 'verified' ? 'System Verified' : 'Discrepancy'}
                        </div>
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-[13px] font-mono",
                        isLight ? "text-slate-400" : "text-white/30"
                      )}>{formatTimestamp(h.timestamp)}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(h.id);
                          }}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            isLight ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          )}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={6} className={cn(
                        "px-6 py-12 text-center",
                        isLight ? "text-slate-400" : "text-white/20"
                      )}>
                        No academic records found. Upload your first grade card to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Selected Record Analysis Sidebar */}
        {selectedRecord && (
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "rounded-3xl p-6 sticky top-8 shadow-2xl transition-all duration-500 border",
                theme === 'cyber' ? "glass-card border-brand-primary/20" : "bg-brand-surface border-brand-primary/10"
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={cn(
                    "text-base font-black uppercase tracking-[0.1em]",
                    isLight ? (theme === 'safe' ? "text-[#001D3D]" : "text-slate-900") : "text-brand-primary"
                  )}>Detailed Analysis</h3>
                  <p className={cn(
                    "text-[13px] mt-1 font-mono uppercase tracking-tighter",
                    isLight ? "text-slate-500" : "text-white/40"
                  )}>{selectedRecord.semester}</p>
                </div>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className={cn(
                    "p-1 rounded-lg transition-all",
                    isLight ? "text-slate-400 hover:text-slate-900 hover:bg-slate-100" : "text-white/20 hover:text-white hover:bg-white/5"
                  )}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Visual Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {(() => {
                  const grades = selectedRecord.subjects.map(s => s.grade);
                  const gradeCounts: Record<string, number> = {};
                  grades.forEach(g => { gradeCounts[g] = (gradeCounts[g] || 0) + 1; });
                  
                  const pieData = Object.entries(gradeCounts).map(([name, value]) => ({ name, value }));
                  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#6366f1', '#ec4899'];

                  return (
                    <>
                      <div className={cn(
                        "col-span-1 border rounded-2xl relative overflow-hidden",
                        isLight ? "bg-slate-50 border-slate-100" : "bg-white/[0.02] border-white/5"
                      )}>
                        <div className="h-20 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                innerRadius={15}
                                outerRadius={30}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={isLight ? "#ffffff" : "none"} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: isLight ? '#ffffff' : '#0a0a0a', 
                                  borderRadius: '8px', 
                                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)', 
                                  fontSize: '13px' 
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <p className={cn(
                          "text-[13px] text-center uppercase font-bold tracking-widest mt-1",
                          isLight ? "text-slate-400" : "text-white/20"
                        )}>Grade Spread</p>
                      </div>
                      <div className={cn(
                        "col-span-1 border rounded-2xl flex flex-col justify-center items-center",
                        isLight ? "bg-slate-50 border-slate-100" : "bg-white/[0.02] border-white/5"
                      )}>
                        <span className={cn(
                          "text-2xl font-black",
                          isLight ? (theme === 'safe' ? "text-[#005495]" : "text-slate-900") : "text-brand-primary"
                        )}>{selectedRecord.sgpa.toFixed(2)}</span>
                        <p className={cn(
                          "text-[13px] uppercase font-bold tracking-widest mt-1",
                          isLight ? "text-slate-400" : "text-white/20"
                        )}>Semester SGPA</p>
                      </div>

                      {/* Grade Legend */}
                      <div className="col-span-2 flex flex-wrap gap-2 justify-center mt-2">
                        {pieData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className={cn(
                              "text-[13px] font-bold uppercase tracking-tighter",
                              theme === 'safe' ? "text-slate-500" : "text-white/40"
                            )}>{entry.name}: {entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                <p className={cn(
                  "text-[13px] font-bold uppercase tracking-[0.2em] mb-2 px-1",
                  theme === 'safe' ? "text-slate-400" : "text-white/20"
                )}>Subject Performance</p>
                {selectedRecord.subjects.map((sub, i) => (
                  <div key={i} className={cn(
                    "p-3 border rounded-xl group transition-all",
                    theme === 'safe' ? "bg-slate-50 border-slate-100 hover:border-[#005495]/30" : "bg-white/[0.02] border-white/5 hover:border-brand-primary/20"
                  )}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "text-[13px] font-bold uppercase tracking-widest",
                        theme === 'safe' ? "text-slate-300" : "text-white/20"
                      )}>{sub.code}</span>
                      <span className={cn(
                        "text-[13px] font-mono font-bold",
                        theme === 'safe' ? "text-[#005495]" : "text-brand-primary"
                      )}>GP: {sub.points}</span>
                    </div>
                    <p className={cn(
                      "text-xs font-medium truncate",
                      theme === 'safe' ? "text-slate-800" : "text-white/70"
                    )}>{sub.name}</p>
                    
                    {/* Visual Point Bar */}
                    <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(sub.points / 10) * 100}%` }}
                         className={cn(
                           "h-full rounded-full",
                           sub.points >= 9 ? "bg-emerald-500" :
                           sub.points >= 8 ? "bg-blue-500" : "bg-amber-500"
                         )}
                       />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                       <span className={cn(
                         "text-[13px] font-bold uppercase tracking-tighter",
                         theme === 'safe' ? "text-slate-300" : "text-white/20"
                       )}>{sub.credits.toFixed(1)} Credits</span>
                       <div className={cn(
                         "px-1.5 py-0.5 rounded border text-[13px] font-bold font-mono",
                         theme === 'safe' ? "bg-slate-100 text-[#005495] border-[#005495]/20" : "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
                       )}>
                         {sub.grade}
                       </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl border transition-colors",
                      isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/5"
                    )}>
                      <p className={cn(
                        "text-[13px] uppercase font-bold tracking-widest mb-1",
                        isLight ? "text-slate-400" : "text-white/30"
                      )}>Total EGP</p>
                      <p className={cn(
                        "text-sm font-mono font-bold",
                        isLight ? "text-slate-900" : "text-white"
                      )}>{selectedRecord.summary?.totalEgp?.toFixed(2) || 'N/A'}</p>
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl border transition-colors",
                      isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/5"
                    )}>
                      <p className={cn(
                        "text-[13px] text-white/30 uppercase font-bold tracking-widest mb-1",
                        isLight ? "text-slate-400" : "text-white/30"
                      )}>Credits</p>
                      <p className={cn(
                        "text-sm font-mono font-bold",
                        isLight ? "text-slate-900" : "text-white"
                      )}>{selectedRecord.summary?.totalCredits || selectedRecord.subjects.reduce((sum, s) => sum + s.credits, 0)}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={exportPDF}
                    className={cn(
                      "w-full rounded-xl py-3 text-[13px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border",
                      isLight && theme === 'safe' 
                        ? "bg-[#003d73]/10 text-[#003d73] hover:bg-[#003d73] hover:text-white border-[#003d73]/20" 
                        : "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-black border-brand-primary/20"
                    )}
                  >
                    <FileDown size={14} />
                    Download Dossier
                  </button>
                </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
