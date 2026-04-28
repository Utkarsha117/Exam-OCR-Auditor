import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/errorHandlers';
import { GPAEntry } from '../types';
import { Search, User, FileText, ChevronRight, Download, Filter } from 'lucide-react';
import { cn, getPointerColor } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';

export default function TeacherDashboard() {
  const { theme } = useTheme();
  const [records, setRecords] = useState<GPAEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<GPAEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'discrepancy'>('all');
  const [backlogFilter, setBacklogFilter] = useState<'all' | 'backlog' | 'clear'>('all');
  const [minSgpa, setMinSgpa] = useState<number>(0);

  useEffect(() => {
    const q = query(
      collection(db, 'gpa_history'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GPAEntry));
      setRecords(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gpa_history');
    });

    return unsubscribe;
  }, []);

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.semester.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || r.verificationStatus === statusFilter;
    
    const matchesBacklog = backlogFilter === 'all' || 
                          (backlogFilter === 'backlog' ? r.backlogStatus === true : r.backlogStatus === false);
    
    const matchesSgpa = r.sgpa >= minSgpa;

    return matchesSearch && matchesStatus && matchesBacklog && matchesSgpa;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={cn(
            "text-2xl font-black tracking-tight uppercase",
            theme === 'safe' ? "text-[#001D3D]" : "text-white"
          )}>Academic Oversight</h2>
          <p className={cn(
            "text-xs uppercase tracking-widest mt-1",
            theme === 'safe' ? "text-[#001D3D]/60" : "text-white/40"
          )}>Instructor portal for verified student performance analytics.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2",
              theme === 'safe' ? "text-[#001D3D]/30" : "text-white/30"
            )} size={16} />
            <input 
              type="text"
              placeholder="Search by student or sem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "rounded-lg py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-[#001D3D] w-full md:w-64 transition-all",
                theme === 'safe' ? "bg-white border-slate-300 text-[#001D3D] placeholder:text-[#001D3D]/30 shadow-sm" : "bg-white/5 border border-white/10 text-white placeholder:text-white/20"
              )}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2 rounded-lg transition-all border shadow-sm",
              showFilters 
                ? (theme === 'safe' ? "bg-[#003d73] border-[#003d73] text-white" : "bg-brand-primary/20 border-brand-primary text-brand-primary") 
                : (theme === 'safe' ? "bg-white border-slate-200 text-[#003d73]/40 hover:text-[#003d73]" : "bg-white/5 border-white/10 text-white/30 hover:text-white/60")
            )}
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-brand-surface border border-white/5 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 shadow-xl">
              <div>
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] block mb-3">Verification Status</label>
                <div className="flex gap-2">
                  {['all', 'verified', 'discrepancy'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status as any)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                        statusFilter === status 
                          ? "bg-brand-primary text-black border-brand-primary" 
                          : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] block mb-3">Academic Standing</label>
                <div className="flex gap-2">
                  {['all', 'clear', 'backlog'].map((standing) => (
                    <button
                      key={standing}
                      onClick={() => setBacklogFilter(standing as any)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                        backlogFilter === standing 
                          ? "bg-brand-primary text-black border-brand-primary" 
                          : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                      )}
                    >
                      {standing}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Minimum SGPA</label>
                  <span className="font-mono text-xs text-brand-primary font-bold">{minSgpa.toFixed(1)}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.1"
                  value={minSgpa}
                  onChange={(e) => setMinSgpa(parseFloat(e.target.value))}
                  className="w-full accent-brand-primary h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[8px] font-bold text-white/10">0.0</span>
                  <span className="text-[8px] font-bold text-white/10">10.0</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button 
                onClick={() => {
                  setStatusFilter('all');
                  setBacklogFilter('all');
                  setMinSgpa(0);
                  setSearchTerm('');
                }}
                className="text-[10px] font-bold text-white/20 hover:text-white uppercase tracking-widest transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main List */}
        <div className="lg:col-span-3 space-y-3">
          {filteredRecords.map((record) => (
            <motion.div
              layoutId={record.id}
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className={cn(
                "border rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between group duration-500",
                theme === 'safe' ? "bg-white/60 backdrop-blur-md border-slate-200 shadow-sm hover:shadow-md hover:border-[#001D3D]/40" : "bg-brand-surface border-white/5 hover:bg-white/[0.02]",
                selectedRecord?.id === record.id ? (theme === 'safe' ? "border-[#001D3D] ring-2 ring-[#001D3D]/10 bg-white" : "border-blue-500/50 ring-1 ring-blue-500/10") : ""
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  theme === 'safe' ? "bg-slate-50 text-[#001D3D]/30 group-hover:bg-[#001D3D]/10 group-hover:text-[#001D3D]" : "bg-white/5 text-white/20 group-hover:bg-blue-500/10 group-hover:text-blue-400"
                )}>
                  <User size={20} />
                </div>
                <div>
                  <h4 className={cn(
                    "font-bold leading-tight tracking-tight",
                    theme === 'safe' ? "text-[#001D3D]" : "text-white/90"
                  )}>{record.studentName}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.2em]",
                      theme === 'safe' ? "text-[#001D3D]/40" : "text-white/20"
                    )}>{record.semester}</span>
                    <span className={cn("h-1 w-1 rounded-full", theme === 'safe' ? "bg-slate-300" : "bg-white/10")}></span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.2em]",
                      theme === 'safe' ? "text-[#001D3D]/40" : "text-white/20"
                    )}>{record.examination}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className={cn(
                    "text-[9px] uppercase font-bold mb-1 tracking-widest",
                    theme === 'safe' ? "text-[#003d73]/30" : "text-white/20"
                  )}>SGPA</p>
                  <span className={cn(
                    "px-2 py-0.5 rounded border text-xs font-mono font-bold",
                      record.sgpa >= 9 ? (theme === 'safe' ? "bg-[#003d73]/10 text-[#003d73] border-[#003d73]/20" : "bg-brand-primary/10 text-brand-primary border-brand-primary/20") :
                    record.sgpa >= 8 ? (theme === 'safe' ? "bg-blue-500/5 text-blue-600 border-blue-500/10" : "bg-blue-500/10 text-blue-400 border-blue-500/20") :
                    (theme === 'safe' ? "bg-amber-500/5 text-amber-600 border-amber-500/10" : "bg-amber-500/10 text-amber-400 border-amber-500/20")
                  )}>
                    {record.sgpa.toFixed(2)}
                  </span>
                </div>
                <div className="text-right hidden sm:block">
                  <p className={cn(
                    "text-[9px] uppercase font-bold mb-1 tracking-widest",
                    theme === 'safe' ? "text-[#003d73]/30" : "text-white/20"
                  )}>CGPA</p>
                  <p className={cn(
                    "font-mono text-xs",
                    theme === 'safe' ? "text-[#003d73]/60" : "text-white/60"
                  )}>{record.cgpa.toFixed(2)}</p>
                </div>
                <ChevronRight className={cn(
                  "transition-colors",
                  theme === 'safe' ? "text-slate-200 group-hover:text-[#003d73]" : "text-white/10 group-hover:text-white/40"
                )} size={18} />
              </div>
            </motion.div>
          ))}

          {filteredRecords.length === 0 && (
            <div className="bg-brand-surface border border-dashed border-white/10 rounded-3xl p-12 text-center">
              <FileText className="mx-auto text-white/10 mb-4" size={40} />
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">No records matched audit filter</p>
            </div>
          )}
        </div>

        {/* Selected Record Detail Sidebar */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedRecord ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-brand-surface border border-white/10 rounded-3xl p-6 sticky top-8 shadow-2xl"
              >
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Course Audit</h3>
                  <p className="text-white/30 text-[10px] mt-1 font-mono uppercase tracking-tighter">Granular verification of {selectedRecord.studentName}</p>
                </div>

                <div className="space-y-3">
                  {selectedRecord.subjects.map((sub, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-white/20 uppercase truncate pr-2 tracking-tighter">{sub.code}</p>
                        <p className="text-[11px] font-semibold text-white/70 truncate max-w-[120px]">{sub.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-white/20">{sub.credits}Cr</span>
                        <div className="w-7 h-7 rounded bg-white/5 border border-white/5 flex items-center justify-center font-bold text-white/90 text-[10px] font-mono">
                          {sub.grade}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-white/20 tracking-widest uppercase">AUDIT RESULT</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border",
                      selectedRecord.verificationStatus === 'verified' ? "bg-brand-primary/5 text-brand-primary border-brand-primary/20" : "bg-red-500/5 text-red-500 border-red-500/20"
                    )}>
                      {selectedRecord.verificationStatus}
                    </span>
                  </div>
                  <button className="w-full bg-[#050505] text-white/60 hover:text-white border border-white/10 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-black transition-all">
                    <Download size={14} />
                    Export Dossier
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-brand-surface/50 border border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shadow-sm mb-4 text-white/10">
                  <FileText size={20} />
                </div>
                <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">Select a record for deep audit</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
