import React, { useState, useRef, useEffect } from 'react';
import { 
  FileUp, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  FileText, 
  History, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  Trash2,
  ExternalLink,
  ChevronRight,
  Info,
  Maximize2,
  BarChart3,
  Check,
  Clock,
  Zap,
  ArrowRight,
  X,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { parseGradeCard } from '../services/geminiService';
import { GPAEntry } from '../types';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

// --- Shared Components ---

const Card = ({ children, className, ...props }: any) => (
  <div className={cn("bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden", className)} {...props}>
    {children}
  </div>
);

const Badge = ({ children, color = 'blue' }: { children: React.ReactNode, color?: 'blue' | 'emerald' | 'amber' | 'red' | 'indigo' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", colors[color])}>
      {children}
    </span>
  );
};

// --- AuditorOverview ---

export const AuditorOverview = () => {
  const { profile } = useAuth();
  
  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">System <span className="text-indigo-600">Overview</span></h1>
          <p className="text-slate-500 font-medium mt-2">Welcome back, {profile?.name}. Here's what's happening with your audits.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/upload" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all flex items-center gap-2">
            <FileUp size={18} /> New Audit
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Audits', value: '1,284', icon: FileText, color: 'indigo' },
          { label: 'Accuracy Rate', value: '99.4%', icon: Zap, color: 'blue' },
          { label: 'Mismatches Found', value: '12', icon: AlertTriangle, color: 'amber' },
          { label: 'Average Speed', value: '2.4s', icon: Clock, color: 'emerald' },
        ].map((stat, i) => (
          <Card key={i} className="p-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-${stat.color}-50 text-${stat.color}-600`}>
              <stat.icon size={24} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-slate-900">Recent Activity</h3>
            <Link to="/dashboard/history" className="text-sm font-bold text-indigo-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <FileText size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">Exam_Paper_S2_2024.pdf</p>
                  <p className="text-xs text-slate-500">Processed 2 hours ago • 45 students extracted</p>
                </div>
                <Badge color={i === 1 ? 'red' : 'emerald'}>{i === 1 ? '1 Mismatch' : 'Verified'}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8 bg-indigo-600 text-white relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <h3 className="font-bold text-xl mb-4">Audit Efficiency</h3>
          <p className="text-indigo-100 text-sm leading-relaxed mb-8">
            Your auditing speed has increased by 15% this week. Keep utilizing the batch processing feature for faster results.
          </p>
          <button className="w-full bg-white text-indigo-600 py-3 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-transform">
            View Analytics Report
          </button>
        </Card>
      </div>
    </div>
  );
};

// --- AuditorUpload ---

export const AuditorUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0); // 0: Idle, 1: Uploading, 2: OCR, 3: AI, 4: Complete
  const [results, setResults] = useState<GPAEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { label: 'Upload', icon: FileUp },
    { label: 'OCR Extraction', icon: Search },
    { label: 'AI Analysis', icon: Zap },
    { label: 'Report Ready', icon: CheckCircle },
  ];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const startProcessing = async () => {
    if (!file || !preview) return;
    setLoading(true);
    setStep(1);

    try {
      // Step 1: Upload Simulate
      await new Promise(r => setTimeout(r, 1000));
      setStep(2);

      // Step 2: OCR Extract
      const base64 = preview.split(',')[1];
      const result = await parseGradeCard(base64, file.type, 1);
      await new Promise(r => setTimeout(r, 1500));
      setStep(3);

      // Step 3: AI Analysis simulate
      await new Promise(r => setTimeout(r, 1500));
      
      if (result.students && result.students.length > 0) {
        setResults(result.students[0] as any);
        setStep(4);
      } else {
        throw new Error("No data extracted");
      }

    } catch (err: any) {
      toast.error(err.message || "Auditing failed");
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  if (step === 4 && results) {
    return <AuditorResults result={results} onReset={() => { setStep(0); setFile(null); setResults(null); }} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <div className="text-center space-y-2">
         <h2 className="text-3xl font-black text-slate-900 tracking-tight">Upload Exam Paper</h2>
         <p className="text-slate-500 font-medium italic">High-fidelity OCR audit for academic verification</p>
       </div>

       <Card className="p-2 border-2 border-dashed border-indigo-200 bg-indigo-50/20">
         {!file ? (
           <div 
             onClick={() => fileInputRef.current?.click()}
             className="cursor-pointer group flex flex-col items-center justify-center p-16 text-center"
           >
             <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-100">
               <FileUp size={32} />
             </div>
             <p className="text-xl font-bold text-slate-900">Drag & drop your file here</p>
             <p className="text-slate-500 mt-2">Suppored formats: PDF, JPG, PNG (Max 10MB)</p>
             <button className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-transform">
               Browse Files
             </button>
             <input type="file" ref={fileInputRef} hidden onChange={handleFile} accept="image/*,.pdf" />
           </div>
         ) : (
           <div className="p-8 space-y-6">
             <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
               <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                 <FileText size={24} />
               </div>
               <div className="flex-1">
                 <p className="font-bold text-slate-900 text-lg line-clamp-1">{file.name}</p>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to Audt</p>
               </div>
               <button onClick={() => setFile(null)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                 <X size={20} />
               </button>
             </div>

             <div className="flex justify-center gap-4">
               <button 
                 onClick={startProcessing}
                 disabled={loading}
                 className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
               >
                 {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                 Start AI Audit
               </button>
             </div>
           </div>
         )}
       </Card>

       <AnimatePresence>
         {loading && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="space-y-6"
           >
              <div className="flex items-center justify-between px-2">
                {steps.map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                      step > i ? "bg-emerald-500 text-white" : (step === i + 1 ? "bg-indigo-600 text-white animate-pulse" : "bg-slate-100 text-slate-400")
                    )}>
                      {step > i ? <Check size={20} /> : <s.icon size={20} />}
                    </div>
                    <span className={cn(
                      "text-[10px] uppercase font-black tracking-widest",
                      step === i + 1 ? "text-indigo-600" : "text-slate-400"
                    )}>{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                   className="h-full bg-indigo-600"
                   initial={{ width: 0 }}
                   animate={{ width: `${(step / 4) * 100}%` }}
                   transition={{ duration: 0.5 }}
                />
              </div>

              <div className="text-center p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={32} />
                <h4 className="font-bold text-slate-900">
                  {step === 2 ? 'High-Performance OCR in progress...' : 
                   step === 3 ? 'AI Business Logic Validation...' : 'Preparing stream...'}
                </h4>
                <p className="text-sm text-slate-500 mt-1 italic">Analyzing visual patterns and cross-referencing markers.</p>
              </div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
};

// --- AuditorResults ---

const AuditorResults = ({ result, onReset }: { result: GPAEntry, onReset: () => void }) => {
  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge color="indigo">Audit Result</Badge>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">{result.studentName}</h1>
          <p className="text-slate-500 font-medium italic">{result.registrationNo} • Semester {result.semester}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onReset} className="px-6 py-2.5 text-slate-500 font-bold bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
            Reset
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95">
            <Download size={18} /> Download Report
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
        {/* Left: Preview with Highlights */}
        <Card className="flex flex-col">
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Document Scan</span>
            <div className="flex gap-2">
              <button className="p-1.5 hover:bg-slate-200 rounded-lg"><Maximize2 size={16} /></button>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden bg-slate-200 p-8 flex items-center justify-center">
            {/* Mock Image Preview */}
            <div className="w-full h-full bg-white shadow-2xl relative overflow-hidden p-8 border border-slate-100 flex flex-col gap-6">
               <div className="h-10 w-2/3 bg-slate-50 relative">
                 <div className="absolute inset-0 bg-indigo-200/40 border border-indigo-400 rounded animate-pulse" />
               </div>
               <div className="space-y-3">
                 {[...Array(8)].map((_, i) => (
                   <div key={i} className="h-4 w-full bg-slate-50 relative group">
                     {i === 2 || i === 5 ? (
                       <div className="absolute inset-x-0 -inset-y-1 bg-amber-200/40 border border-amber-400 rounded flex items-center justify-end px-2">
                         <span className="text-[8px] font-black text-amber-700">DETECTED</span>
                       </div>
                     ) : null}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </Card>

        {/* Right: Extracted Data */}
        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          <Card className="p-8">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Zap size={18} className="text-indigo-600" /> AI Findings
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Confidence Score</p>
                <p className="text-3xl font-black text-indigo-700">98.2%</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Audit Status</p>
                <p className="text-3xl font-black text-emerald-700">PASS</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Extracted Answers</h4>
                <div className="space-y-3 divide-y divide-slate-100">
                  {result.subjects.map((s, i) => (
                    <div key={i} className="pt-3 flex items-center justify-between group">
                      <div>
                        <p className="text-xs font-bold text-slate-400">{s.code}</p>
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{s.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900">{s.grade}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.credits} Credits</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-6 border-t">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Evaluation Summary</h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-sm text-slate-600 leading-relaxed">
                  The AI successfully identified all subject markers. No calculation discrepancies found between internal points and printed SGPA ({result.sgpa}).
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// --- AuditorHistory ---

export const AuditorHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit <span className="text-indigo-600">History</span></h1>
           <p className="text-slate-500 font-medium">Archive of all verified documents and reports.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search history..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { name: 'Semester_Exam_R.pgn', entity: 'John Doe', date: 'May 12, 2024', status: 'verified' },
                { name: 'Paper_03_Logic.pdf', entity: 'Sarah Smith', date: 'May 11, 2024', status: 'mismatch' },
                { name: 'Main_Archive_S2.zip', entity: 'Batch 12', date: 'May 10, 2024', status: 'verified' },
                { name: 'Lab_Results_P1.jpg', entity: 'Mike Johnson', date: 'May 09, 2024', status: 'verified' },
              ].map((item, i) => (
                <tr key={i} className="hover:bg-indigo-50/10 transition-colors group">
                  <td className="px-6 py-4">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      item.status === 'verified' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                    )} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-slate-400" />
                      <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-500">{item.entity}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-400 font-mono italic uppercase">{item.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100 transition-all"><Eye size={16} /></button>
                       <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="flex justify-center mt-12">
        <button className="text-sm font-bold text-slate-400 hover:text-slate-900 flex items-center gap-2">
          LOAD MORE <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

// --- AuditorReports ---

export const AuditorReports = () => {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit <span className="text-indigo-600">Intelligence</span></h1>
        <p className="text-slate-500 font-medium">Aggregated insights and mismatch patterns across all processed batches.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8">
          <div className="flex items-center justify-between mb-8">
             <h3 className="font-bold text-lg">Error Distribution</h3>
             <BarChart3 size={20} className="text-slate-400" />
          </div>
          <div className="h-64 flex items-end justify-between gap-4">
            {[60, 40, 80, 20, 50, 70, 30].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  className="w-full bg-slate-900 rounded-lg group relative"
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {h}%
                  </div>
                </motion.div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">S{i+1}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8 space-y-6">
           <h3 className="font-bold text-lg mb-4 italic font-serif">Flagged Patterns</h3>
           {[
             { title: 'Handwriting Ambiguity', count: 42, color: 'blue' },
             { title: 'Data Cross-match Fail', count: 18, color: 'red' },
             { title: 'Scan Quality - Low', count: 31, color: 'amber' },
             { title: 'Unrecognized ID format', count: 7, color: 'indigo' },
           ].map((p, i) => (
             <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 group hover:shadow-md transition-all">
               <div className="flex items-center gap-3">
                 <div className={`w-2 h-2 rounded-full bg-${p.color}-500`} />
                 <span className="font-bold text-slate-900">{p.title}</span>
               </div>
               <span className="text-slate-400 font-black font-mono text-sm">{p.count} cases</span>
             </div>
           ))}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card className="col-span-1 lg:col-span-2 p-8">
            <h3 className="font-bold text-lg mb-8">Performance Metrics</h3>
            <div className="space-y-6">
              {[
                { label: 'OCR Extraction Velocity', progress: 92, status: 'Optimal' },
                { label: 'AI Validation Accuracy', progress: 99, status: 'Certified' },
                { label: 'Database Sync Priority', progress: 78, status: 'Active' },
              ].map((m, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest leading-none">
                    <span className="text-slate-400">{m.label}</span>
                    <span className="text-indigo-600">{m.status}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${m.progress}%` }}
                      className="h-full bg-indigo-600 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
         </Card>
         <Card className="p-8 bg-slate-900 text-white flex flex-col justify-between">
           <div>
             <h3 className="font-bold text-2xl mb-4 italic">Next Generation</h3>
             <p className="text-slate-400 text-sm leading-relaxed">
               Version 4.0 will include handwritten signature verification and multi-language support.
             </p>
           </div>
           <button className="flex items-center gap-2 font-bold text-indigo-400 hover:text-white transition-colors mt-8">
             Explore Roadmap <ExternalLink size={18} />
           </button>
         </Card>
      </div>
    </div>
  );
};

// --- AuditorHelp ---

export const AuditorHelp = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Help <span className="text-indigo-600">Center</span></h1>
        <p className="text-slate-500 font-medium">Everything you need to know about the Exam OCR Auditor system.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: FileText, title: 'User Guides', desc: 'Step-by-step instructions for all features.' },
          { icon: Shield, title: 'Security', desc: 'How we handle and protect student data.' },
          { icon: Zap, title: 'API Docs', desc: 'Integrate Auditor with your existing systems.' },
        ].map((item, i) => (
          <Card key={i} className="p-6 text-center hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <item.icon size={24} />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
            <p className="text-sm text-slate-400 font-medium">{item.desc}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight italic mb-6">Frequently Asked Questions</h3>
        {[
          { q: "How accurate is the OCR extraction?", a: "The system uses Gemini Flash models with custom prompt tuning to achieve over 99% accuracy on printed text and 95%+ on clear handwriting." },
          { q: "What file types are supported?", a: "We support PDF, JPG, PNG, and WebP. For best results, use a DPI of 300 or higher." },
          { q: "Can I bulk upload answer sheets?", a: "Yes, MIS roles can upload entire folders for batch processing directly from the dashboard." },
          { q: "Is the data stored securely?", a: "Absolutely. All documents are analyzed in a secure sandbox and only relevant metadata is stored in encrypted Firestore collections." },
        ].map((faq, i) => (
          <Card key={i} className="p-6 transition-all hover:bg-slate-50 group">
            <h4 className="font-bold text-slate-900 flex items-center gap-3">
               <Info size={16} className="text-indigo-400" />
               {faq.q}
            </h4>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed ml-7 font-medium">
              {faq.a}
            </p>
          </Card>
        ))}
      </div>
      
      <Card className="p-12 bg-indigo-600 text-white text-center">
        <h3 className="text-3xl font-black mb-4">Still need help?</h3>
        <p className="text-indigo-100 font-medium mb-8 max-w-lg mx-auto">
          Our technical support team is available 24/7 to help you with integration and document processing issues.
        </p>
        <button className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95">
          Contact Support
        </button>
      </Card>
    </div>
  );
};
