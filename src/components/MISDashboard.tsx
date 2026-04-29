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
  const isLight = ['light', 'safe', 'swiss', 'mono'].includes(theme);
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
    const loadingToast = toast.loading('Initiating GPA Genie Maintenance...');
    
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
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0a0a0a] border-white/10 shadow-xl"
        )}>
          <p className={cn(
            "text-[10px] uppercase mb-1 tracking-widest leading-none flex items-center gap-2",
            isLight ? "text-slate-400" : "text-white/40"
          )}>
            <Activity size={10} className="text-brand-primary" />
            Core Status
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className={cn(
              "relative flex items-center justify-center",
              isLight ? "w-4 h-4" : "w-2 h-2"
            )}>
              <div className={cn(
                "rounded-full bg-brand-primary animate-pulse",
                isLight ? "w-2.5 h-2.5" : "w-full h-full"
              )}></div>
              {isLight && (
                <div className="absolute inset-0 rounded-full border-2 border-brand-primary/20 animate-ping"></div>
              )}
            </div>
            <p className={cn(
              "text-xl font-black tracking-tighter uppercase",
              isLight ? (theme === 'safe' ? "text-[#001D3D]" : "text-slate-900") : "text-white"
            )}>Active Audit</p>
          </div>
        </div>

        <div className={cn(
          "border p-6 rounded-2xl transition-all duration-500",
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0a0a0a] border-white/10 shadow-xl"
        )}>
          <p className={cn(
            "text-[10px] uppercase mb-1 tracking-widest leading-none",
            isLight ? "text-slate-400" : "text-white/40"
          )}>
            Total Batch Audits
          </p>
          <div className="flex items-baseline gap-2">
            <p className={cn(
              "text-3xl font-black tracking-tighter",
              isLight ? (theme === 'safe' ? "text-[#001D3D]" : "text-slate-900") : "text-blue-400"
            )}>{logs.length}</p>
            {logs.length === 0 && <span className={cn(
              "text-[8px] animate-pulse uppercase",
              isLight ? "text-slate-300" : "text-white/20"
            )}>Syncing...</span>}
          </div>
          <p className={cn(
            "text-[10px] font-bold mt-2 uppercase tracking-tighter italic",
            isLight && theme === 'safe' ? "text-[#00a6bb]" : "text-brand-primary/50"
          )}>Secure Endpoint Active</p>
        </div>

        <div className={cn(
          "sm:col-span-2 p-6 rounded-2xl flex items-center justify-between border relative overflow-hidden group transition-all duration-500",
          isLight ? "bg-white border-slate-200 shadow-sm text-slate-900" : "bg-gradient-to-br from-indigo-950 to-brand-nav border-white/10 text-white shadow-xl"
        )}>
          <div className={cn(
            "absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-700",
            isLight ? "bg-slate-500/5" : "bg-indigo-500/10"
          )}></div>
          <div className="relative z-10">
            <h4 className="text-lg font-black tracking-tight uppercase">System Integrity Shield</h4>
            <p className={cn(
              "text-[10px] uppercase tracking-widest mt-1",
              isLight ? "text-slate-400" : "text-white/40"
            )}>Real-time encryption & RLS verification enabled</p>
          </div>
          <ShieldAlert size={48} className={cn(
            "relative z-10",
            isLight ? "text-slate-900/10" : "text-white/10"
          )} />
        </div>
      </div>

      <div className={cn(
        "flex gap-4 p-1 rounded-xl w-fit border transition-all duration-500",
        isLight ? "bg-slate-100 border-slate-200" : "bg-black/20 border-white/5"
      )}>
        <button 
          onClick={() => setActiveTab('audit')}
          className={cn(
            "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
            activeTab === 'audit' 
              ? (isLight ? "bg-white text-slate-900 shadow-md" : "bg-white/10 text-white shadow-lg") 
              : (isLight ? "text-slate-400 hover:text-slate-600" : "text-white/30 hover:text-white/60")
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
              ? (isLight ? "bg-white text-slate-900 shadow-md" : "bg-white/10 text-white shadow-lg") 
              : (isLight ? "text-slate-400 hover:text-slate-600" : "text-white/30 hover:text-white/60")
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
                      isLight ? (theme === 'safe' ? "text-[#003d73]" : "text-slate-900") : "text-white"
                    )}>Record Integrity</h3>
                    <p className={cn(
                      "text-[10px] mt-1 font-mono uppercase tracking-tighter",
                      isLight ? "text-slate-400" : "text-white/30"
                    )}>Granular Audit View</p>
                  </div>
                  <button onClick={() => setSelectedRecord(null)} className={cn(
                    "transition-colors",
                    isLight ? "text-slate-300 hover:text-slate-600" : "text-white/20 hover:text-white"
                  )}>
                    <Trash2 size={14} className="rotate-45" />
                  </button>
                </div>

                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedRecord.subjects.map((sub, i) => (
                    <div key={i} className={cn(
                      "flex items-center justify-between p-2 rounded-lg border",
                      isLight ? "bg-slate-50 border-slate-100" : "bg-white/5 border-white/5"
                    )}>
                      <div className="min-w-0">
                        <p className={cn(
                          "text-[8px] font-bold uppercase tracking-widest",
                          isLight ? "text-slate-400" : "text-white/20"
                        )}>{sub.code}</p>
                        <p className={cn(
                          "text-[10px] truncate max-w-[120px]",
                          isLight ? "text-slate-900 font-bold" : "text-white/60"
                        )}>{sub.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[9px] font-mono",
                          isLight ? "text-slate-300" : "text-white/20"
                        )}>{sub.credits}Cr</span>
                        <div className={cn(
                          "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono",
                          isLight && theme === 'safe' ? "bg-[#00a6bb]/10 text-[#00a6bb]" : "bg-brand-primary/10 text-brand-primary"
                        )}>
                          {sub.grade}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={cn(
                  "pt-4 border-t space-y-3",
                  isLight ? "border-slate-100" : "border-white/5"
                )}>
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                    <span className={isLight ? "text-slate-400" : "text-white/20"}>Audit Status</span>
                    <span className={cn(
                      selectedRecord.verificationStatus === 'verified' ? (isLight && theme === 'safe' ? "text-[#00a6bb]" : "text-brand-primary") : "text-amber-500"
                    )}>{selectedRecord.verificationStatus}</span>
                  </div>
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                    <span className={isLight ? "text-slate-400" : "text-white/20"}>Total EGP</span>
                    <span className={isLight ? "text-slate-900" : "text-white/60"}>{selectedRecord.summary?.totalEgp?.toFixed(2) || 'N/A'}</span>
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
                    isLight ? (theme === 'safe' ? "text-[#003d73]" : "text-slate-900") : "text-white"
                  )}>
                    <Database size={16} className={isLight ? "text-slate-300" : "text-white/40"} />
                    Audit Feed
                  </h3>
                  <div className="group relative">
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase italic border cursor-help",
                      isLight ? "bg-slate-50 text-slate-400 border-slate-100" : "bg-white/5 text-white/30 border-white/5"
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
                <div className={cn(
                  "rounded-3xl border shadow-2xl overflow-hidden h-full",
                  isLight ? "bg-white border-slate-200" : "bg-brand-surface border-white/10"
                )}>
                  <div className={cn(
                    "p-6 border-b flex items-center justify-between",
                    isLight ? "border-slate-50" : "border-white/5"
                  )}>
                    <div className="flex items-center gap-3">
                      <h3 className={cn(
                        "text-xs font-bold uppercase tracking-[0.2em]",
                        isLight ? "text-slate-900" : "text-white"
                      )}>Administrative Audit Logs</h3>
                      <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className={cn(
                        "text-[10px] uppercase font-bold tracking-[0.1em]",
                        isLight ? "bg-slate-50 text-slate-400" : "bg-[#050505] text-white/30"
                      )}>
                        <tr>
                          <th className="px-6 py-4">Timestamp</th>
                          <th className="px-6 py-4">Faculty</th>
                          <th className="px-6 py-4">Action</th>
                          <th className="px-6 py-4 text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody className={cn(
                        "divide-y text-sm",
                        isLight ? "divide-slate-50" : "divide-white/5"
                      )}>
                        {logs.map((log) => (
                          <tr key={log.id} className={cn(
                            "transition-colors",
                            isLight ? "hover:bg-slate-50/50" : "hover:bg-white/[0.02]"
                          )}>
                            <td className={cn(
                              "px-6 py-4 font-mono text-[10px]",
                              isLight ? "text-slate-400" : "text-white/20"
                            )}>{formatTimestamp(log.timestamp)}</td>
                            <td className={cn(
                              "px-6 py-4 font-black uppercase tracking-tight",
                              isLight ? "text-slate-900" : "text-white/70"
                            )}>{log.facultyName}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className={cn(
                                  "text-xs italic",
                                  isLight ? "text-slate-500" : "text-white/40"
                                )}>{log.action}</span>
                                {log.description && <span className={cn(
                                  "text-[9px] mt-0.5",
                                  isLight ? "text-slate-400" : "text-white/20"
                                )}>{log.description}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={cn(
                                "bg-brand-primary/5 border px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase",
                                isLight && theme === 'safe' ? "text-[#00a6bb] border-[#00a6bb]/20" : "text-brand-primary border-brand-primary/20"
                              )}>Saved</span>
                            </td>
                          </tr>
                        ))}
                        {logs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-20 text-center">
                              <p className={cn(
                                "text-[10px] uppercase font-bold tracking-[0.2em]",
                                isLight ? "text-slate-300" : "text-white/20"
                              )}>Initial Audit Sync in Progress...</p>
                              <p className={cn(
                                "text-[9px] mt-2 italic font-mono",
                                isLight ? "text-slate-200" : "text-white/10"
                              )}>Waiting for Administrative Logs</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
            ) : (
              <motion.div 
                key="management"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "rounded-3xl border shadow-2xl overflow-hidden h-full",
                  isLight ? "bg-white border-slate-200" : "bg-brand-surface border-white/10"
                )}
              >
                <div className={cn(
                  "p-6 border-b flex items-center justify-between",
                  isLight ? "border-slate-50" : "border-white/5"
                )}>
                  <div className="flex items-center gap-3">
                    <h3 className={cn(
                      "text-xs font-bold uppercase tracking-[0.2em]",
                      isLight ? "text-slate-900" : "text-white"
                    )}>Master GPA History</h3>
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className={cn(
                      "text-[10px] uppercase font-bold tracking-[0.1em]",
                      isLight ? "bg-slate-50 text-slate-400" : "bg-[#050505] text-white/30"
                    )}>
                      <tr>
                        <th className="px-6 py-4">Identity</th>
                        <th className="px-6 py-4">Verification</th>
                        <th className="px-6 py-4">Academic Specs</th>
                        <th className="px-6 py-4">Calculation</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={cn(
                      "divide-y text-sm",
                      isLight ? "divide-slate-50" : "divide-white/5"
                    )}>
                      {records.map((record) => (
                        <tr 
                          key={record.id} 
                          onClick={() => setSelectedRecord(record)}
                          className={cn(
                            "group transition-colors cursor-pointer",
                            isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.02]",
                            selectedRecord?.id === record.id ? (isLight ? "bg-slate-50" : "bg-white/5") : ""
                          )}
                        >
                          <td className="px-6 py-4">
                            <p className={cn(
                              "font-bold text-xs",
                              isLight ? "text-slate-900" : "text-white"
                            )}>{record.studentName}</p>
                            <p className={cn(
                              "text-[10px] font-mono",
                              isLight ? "text-slate-400" : "text-white/30"
                            )}>{record.registrationNo || 'No Reg ID'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border",
                              record.verificationStatus === 'verified' ? (isLight && theme === 'safe' ? "bg-[#00a6bb]/5 text-[#00a6bb] border-[#00a6bb]/10" : "bg-brand-primary/5 text-brand-primary border-brand-primary/10") : "bg-red-500/5 text-red-500 border-red-500/10"
                            )}>
                              {record.verificationStatus || 'unverified'}
                            </div>
                            <p className={cn(
                              "text-[8px] mt-1 italic",
                              isLight ? "text-slate-300" : "text-white/20"
                            )}>by {record.uploadedByName || 'System'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className={cn(
                              "text-[10px] font-bold uppercase",
                              isLight ? "text-slate-600" : "text-white/60"
                            )}>{record.semester}</p>
                            <p className={cn(
                              "text-[9px] uppercase font-mono",
                              isLight ? "text-slate-400" : "text-white/20"
                            )}>{record.examination}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className={cn(
                                "font-bold font-mono text-xs",
                                isLight && theme === 'safe' ? "text-[#00a6bb]" : "text-brand-primary"
                              )}>SGPA: {record.sgpa?.toFixed(2)}</span>
                              <span className={cn(
                                "font-mono text-[9px]",
                                isLight ? "text-slate-300" : "text-white/20"
                              )}>CGPA: {record.cgpa?.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRecord(record.id);
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
