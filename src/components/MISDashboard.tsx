import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/errorHandlers';
import { AuditLog, GPAEntry } from '../types';
import { ShieldAlert, Database, Activity, User, ChevronRight, Trash2, LayoutDashboard, History } from 'lucide-react';
import ResultUploader from './ResultUploader';
import { motion, AnimatePresence } from 'motion/react';
import { formatTimestamp, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

export default function MISDashboard() {
  const { theme } = useTheme();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [records, setRecords] = useState<GPAEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'audit' | 'management'>('audit');
  const [selectedRecord, setSelectedRecord] = useState<GPAEntry | null>(null);

  useEffect(() => {
    const qLogs = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
    const qRecords = query(collection(db, 'gpa_history'), orderBy('timestamp', 'desc'));

    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'audit_logs'));

    const unsubRecords = onSnapshot(qRecords, (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GPAEntry)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'gpa_history'));

    return () => { unsubLogs(); unsubRecords(); };
  }, []);

  const handleDeleteRecord = async (id: string | undefined) => {
    if (!id) return;
    
    // Using a toast for feedback since window.confirm can be blocked
    const loadingToast = toast.loading('Initiating Vault Purge...');
    
    try {
      await deleteDoc(doc(db, 'gpa_history', id));
      toast.success('Record purged permanently', { id: loadingToast });
    } catch (err: any) {
      console.error('Delete failed:', err);
      toast.error('Access Denied: Could not purge record', { id: loadingToast });
      handleFirestoreError(err, OperationType.DELETE, `gpa_history/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={cn(
          "border p-6 rounded-2xl transition-all duration-500",
          theme === 'safe' ? "bg-white/60 backdrop-blur-md border-slate-200/50 shadow-sm" : "bg-[#0a0a0a] border-white/10 shadow-xl"
        )}>
          <p className={cn(
            "text-[10px] uppercase mb-1 tracking-widest leading-none flex items-center gap-2",
            theme === 'safe' ? "text-slate-400" : "text-white/40"
          )}>
            <Activity size={10} className="text-brand-primary" />
            Core Status
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className={cn(
              "relative flex items-center justify-center",
              theme === 'safe' ? "w-4 h-4" : "w-2 h-2"
            )}>
              <div className={cn(
                "rounded-full bg-brand-primary animate-pulse",
                theme === 'safe' ? "w-2.5 h-2.5" : "w-full h-full"
              )}></div>
              {theme === 'safe' && (
                <div className="absolute inset-0 rounded-full border-2 border-brand-primary/20 animate-ping"></div>
              )}
            </div>
            <p className={cn(
              "text-xl font-black tracking-tighter uppercase",
              theme === 'safe' ? "text-[#001D3D]" : "text-white"
            )}>Active Audit</p>
          </div>
        </div>

        <div className={cn(
          "border p-6 rounded-2xl transition-all duration-500",
          theme === 'safe' ? "bg-white/60 backdrop-blur-md border-slate-200/50 shadow-sm" : "bg-[#0a0a0a] border-white/10 shadow-xl"
        )}>
          <p className={cn(
            "text-[10px] uppercase mb-1 tracking-widest leading-none",
            theme === 'safe' ? "text-slate-400" : "text-white/40"
          )}>
            Total Batch Audits
          </p>
          <div className="flex items-baseline gap-2">
            <p className={cn(
              "text-3xl font-black tracking-tighter",
              theme === 'safe' ? "text-[#001D3D]" : "text-blue-400"
            )}>{logs.length}</p>
            {logs.length === 0 && <span className={cn(
              "text-[8px] animate-pulse uppercase",
              theme === 'safe' ? "text-slate-300" : "text-white/20"
            )}>Syncing...</span>}
          </div>
          <p className={cn(
            "text-[10px] font-bold mt-2 uppercase tracking-tighter italic",
            theme === 'safe' ? "text-[#00a6bb]" : "text-brand-primary/50"
          )}>Secure Endpoint Active</p>
        </div>

        <div className={cn(
          "sm:col-span-2 p-6 rounded-2xl flex items-center justify-between border relative overflow-hidden group transition-all duration-500",
          theme === 'safe' ? "bg-white/70 backdrop-blur-md border-slate-200 shadow-sm text-[#001D3D]" : "bg-gradient-to-br from-indigo-950 to-brand-nav border-white/10 text-white shadow-xl"
        )}>
          <div className={cn(
            "absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-700",
            theme === 'safe' ? "bg-[#00a6bb]/10" : "bg-indigo-500/10"
          )}></div>
          <div className="relative z-10">
            <h4 className="text-lg font-black tracking-tight uppercase">System Integrity Shield</h4>
            <p className={cn(
              "text-[10px] uppercase tracking-widest mt-1",
              theme === 'safe' ? "text-slate-400" : "text-white/40"
            )}>Real-time encryption & RLS verification enabled</p>
          </div>
          <ShieldAlert size={48} className={cn(
            "relative z-10",
            theme === 'safe' ? "text-[#00a6bb]/20" : "text-white/10"
          )} />
        </div>
      </div>

      <div className={cn(
        "flex gap-4 p-1 rounded-xl w-fit border transition-all duration-500",
        theme === 'safe' ? "bg-slate-100 border-slate-200" : "bg-black/20 border-white/5"
      )}>
        <button 
          onClick={() => setActiveTab('audit')}
          className={cn(
            "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
            activeTab === 'audit' 
              ? (theme === 'safe' ? "bg-white text-[#003d73] shadow-md" : "bg-white/10 text-white shadow-lg") 
              : (theme === 'safe' ? "text-slate-400 hover:text-slate-600" : "text-white/30 hover:text-white/60")
          )}
        >
          <LayoutDashboard size={14} />
          Administrative Log
        </button>
        <button 
          onClick={() => setActiveTab('management')}
          className={cn(
            "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
            activeTab === 'management' 
              ? (theme === 'safe' ? "bg-white text-[#003d73] shadow-md" : "bg-white/10 text-white shadow-lg") 
              : (theme === 'safe' ? "text-slate-400 hover:text-slate-600" : "text-white/30 hover:text-white/60")
          )}
        >
          <History size={14} />
          History Management
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Section: Batch Upload or Selected Audit Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <AnimatePresence mode="wait">
            {selectedRecord && activeTab === 'management' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={cn(
                  "p-6 rounded-3xl border shadow-2xl relative overflow-hidden transition-all duration-500",
                  theme === 'safe' ? "bg-white border-slate-200" : "bg-brand-surface border-brand-primary/20"
                )}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={cn(
                      "text-xs font-bold uppercase tracking-[0.2em]",
                      theme === 'safe' ? "text-[#003d73]" : "text-white"
                    )}>Record Integrity</h3>
                    <p className={cn(
                      "text-[10px] mt-1 font-mono uppercase tracking-tighter",
                      theme === 'safe' ? "text-slate-400" : "text-white/30"
                    )}>Granular Audit View</p>
                  </div>
                  <button onClick={() => setSelectedRecord(null)} className={cn(
                    "transition-colors",
                    theme === 'safe' ? "text-slate-300 hover:text-slate-600" : "text-white/20 hover:text-white"
                  )}>
                    <Trash2 size={14} className="rotate-45" />
                  </button>
                </div>

                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedRecord.subjects.map((sub, i) => (
                    <div key={i} className={cn(
                      "flex items-center justify-between p-2 rounded-lg border",
                      theme === 'safe' ? "bg-slate-50 border-slate-100" : "bg-white/5 border-white/5"
                    )}>
                      <div className="min-w-0">
                        <p className={cn(
                          "text-[8px] font-bold uppercase tracking-widest",
                          theme === 'safe' ? "text-slate-400" : "text-white/20"
                        )}>{sub.code}</p>
                        <p className={cn(
                          "text-[10px] truncate max-w-[120px]",
                          theme === 'safe' ? "text-[#001D3D] font-bold" : "text-white/60"
                        )}>{sub.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[9px] font-mono",
                          theme === 'safe' ? "text-slate-300" : "text-white/20"
                        )}>{sub.credits}Cr</span>
                        <div className={cn(
                          "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono",
                          theme === 'safe' ? "bg-[#00a6bb]/10 text-[#00a6bb]" : "bg-brand-primary/10 text-brand-primary"
                        )}>
                          {sub.grade}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                    <span className={theme === 'safe' ? "text-[#001D3D]/30" : "text-white/20"}>Audit Status</span>
                    <span className={cn(
                      selectedRecord.verificationStatus === 'verified' ? "text-brand-primary" : "text-amber-500"
                    )}>{selectedRecord.verificationStatus}</span>
                  </div>
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                    <span className={theme === 'safe' ? "text-[#001D3D]/30" : "text-white/20"}>Total EGP</span>
                    <span className={theme === 'safe' ? "text-[#001D3D]/60" : "text-white/60"}>{selectedRecord.summary?.totalEgp?.toFixed(2) || 'N/A'}</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="uploader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "p-6 rounded-3xl border shadow-2xl relative overflow-hidden transition-all duration-500",
                  theme === 'safe' ? "bg-white border-slate-200" : "bg-brand-surface border-white/10"
                )}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className={cn(
                    "text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2",
                    theme === 'safe' ? "text-[#003d73]" : "text-white"
                  )}>
                    <Database size={16} className={theme === 'safe' ? "text-slate-300" : "text-white/40"} />
                    Audit Feed
                  </h3>
                  <div className="group relative">
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase italic border cursor-help",
                      theme === 'safe' ? "bg-slate-50 text-slate-400 border-slate-100" : "bg-white/5 text-white/30 border-white/5"
                    )}>Restricted</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black text-[8px] text-white/60 uppercase tracking-widest border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                      Authorized Personnel Only. Access involves PII processing.
                    </div>
                  </div>
                </div>
                <ResultUploader allowedRoles={['mis']} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Table Section */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'audit' ? (
              <motion.div 
                key="audit"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="bg-brand-surface rounded-3xl border border-white/10 shadow-2xl overflow-hidden h-full"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Administrative Audit Logs</h3>
                    <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#050505] text-[10px] uppercase font-bold text-white/30 tracking-[0.1em]">
                      <tr>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Faculty</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-white/20 font-mono text-[10px]">{formatTimestamp(log.timestamp)}</td>
                          <td className="px-6 py-4 font-black uppercase tracking-tight text-white/70">{log.facultyName}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-white/40 text-xs italic">{log.action}</span>
                              {log.description && <span className="text-white/20 text-[9px] mt-0.5">{log.description}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-brand-primary bg-brand-primary/5 border border-brand-primary/20 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase">Saved</span>
                          </td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-20 text-center">
                            <p className="text-white/20 text-[10px] uppercase font-bold tracking-[0.2em]">Initial Audit Sync in Progress...</p>
                            <p className="text-white/10 text-[9px] mt-2 italic font-mono">Waiting for Administrative Logs</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="management"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="bg-brand-surface rounded-3xl border border-white/10 shadow-2xl overflow-hidden h-full"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Master GPA History</h3>
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className={cn(
                      "text-[10px] uppercase font-bold tracking-[0.1em]",
                      theme === 'safe' ? "bg-slate-50 text-slate-400" : "bg-[#050505] text-white/30"
                    )}>
                      <tr>
                        <th className="px-6 py-4">Identity</th>
                        <th className="px-6 py-4">Verification</th>
                        <th className="px-6 py-4">Academic Specs</th>
                        <th className="px-6 py-4">Calculation</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {records.map((record) => (
                        <tr 
                          key={record.id} 
                          onClick={() => setSelectedRecord(record)}
                          className={cn(
                            "hover:bg-white/[0.02] group transition-colors cursor-pointer",
                            selectedRecord?.id === record.id ? "bg-white/5" : ""
                          )}
                        >
                          <td className="px-6 py-4">
                            <p className="text-white font-bold text-xs">{record.studentName}</p>
                            <p className="text-white/30 text-[10px] font-mono">{record.registrationNo || 'No Reg ID'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border",
                              record.verificationStatus === 'verified' ? "bg-brand-primary/5 text-brand-primary border-brand-primary/10" : "bg-amber-500/5 text-amber-500 border-amber-500/10"
                            )}>
                              {record.verificationStatus || 'unverified'}
                            </div>
                            <p className="text-white/20 text-[8px] mt-1 italic">by {record.uploadedByName || 'System'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-white/60 text-[10px] font-bold uppercase">{record.semester}</p>
                            <p className="text-white/20 text-[9px] uppercase font-mono">{record.examination}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-brand-primary font-bold font-mono text-xs">SGPA: {record.sgpa?.toFixed(2)}</span>
                              <span className="text-white/20 font-mono text-[9px]">CGPA: {record.cgpa?.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRecord(record.id);
                              }}
                              className="text-white/10 hover:text-red-500 transition-colors p-2"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
