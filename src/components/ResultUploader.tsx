import React, { useState, useRef } from 'react';
import { FileUp, CheckCircle, AlertTriangle, Loader2, FileText, ChevronRight, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parseGradeCard } from '../services/geminiService';
import { calculateSGPA, cn, GRADE_POINTS } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { GPAEntry, SubjectResult } from '../types';
import { OperationType, handleFirestoreError } from '../lib/errorHandlers';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

interface Props {
  onComplete?: () => void;
  allowedRoles?: string[];
}

export default function ResultUploader({ onComplete, allowedRoles }: Props) {
  const { profile, user } = useAuth();
  const { theme } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLimit, setPageLimit] = useState(1);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'reading' | 'extracting'>('idle');
  const [extractedStudents, setExtractedStudents] = useState<GPAEntry[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<GPAEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const selectedFile = files[0];
    
    // Strict Validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Invalid file type. Please upload a PDF or an Image.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setFile(selectedFile);
    setExtractedStudents([]);
    setSelectedStudent(null);
    
    if (profile?.role === 'student') {
      await processFile(selectedFile, 1);
    } else {
      setIsConfiguring(true);
    }
  };

  const processFile = async (currentFile: File, limit: number) => {
    setLoading(true);
    setLoadingState('reading');
    setIsConfiguring(false);
    
    try {
      const reader = new FileReader();
      
      reader.onerror = () => {
         toast.error("Hardware Error: Could not read the file from disk.");
         setLoading(false);
         setLoadingState('idle');
      };

      reader.onload = async () => {
        try {
          setLoadingState('extracting');
          const base64 = (reader.result as string).split(',')[1];
          const result = await parseGradeCard(base64, currentFile.type, limit);
          
          if (result.students && result.students.length > 0) {
            let processedStudents = result.students;

            // Student Privacy Filter
            if (profile?.role === 'student' && profile?.registrationNo) {
              const myRecord = processedStudents.find((s: any) => 
                s.registrationNo?.toLowerCase() === profile.registrationNo?.toLowerCase()
              );
              if (myRecord) {
                processedStudents = [myRecord];
              } else {
                throw new Error(`Data Mismatch: Registration # ${profile.registrationNo} not found in this document.`);
              }
            }

            const students: GPAEntry[] = processedStudents.map((data: any) => {
              const internalSgpa = calculateSGPA(data.subjects);
              const printedSgpa = data.summary?.sgpa || 0;
              const diff = Math.abs(internalSgpa - printedSgpa);
              const hasDiscrepancy = diff > 0.01;
              
              const totalCredits = data.subjects.reduce((acc: number, s: any) => acc + (s.credits || 0), 0);
              const totalEgp = data.summary?.totalEgp || 0;

              return {
                uid: user?.uid || '',
                studentName: data.studentName || 'Unknown Student',
                registrationNo: data.registrationNo || '',
                semester: data.semester || 'Unknown Semester',
                examination: data.examination || 'Regular',
                sgpa: printedSgpa,
                cgpa: data.summary?.cgpa || 0,
                totalEgp: totalEgp,
                totalMarks: data.summary?.totalMarks || 0,
                maxMarks: data.summary?.maxMarks || 0,
                percentage: data.summary?.percentage || 0,
                verificationStatus: hasDiscrepancy ? 'discrepancy' : 'verified',
                backlogStatus: data.subjects.some((s: any) => ['F', 'AB', 'I', 'U'].includes(s.grade.trim().toUpperCase())),
                subjects: data.subjects.map((s: any) => ({
                  ...s,
                  points: typeof s.points === 'number' ? s.points : (GRADE_POINTS[s.grade] || 0)
                })),
                timestamp: serverTimestamp(),
                fileName: currentFile.name,
                calculatedSgpa: internalSgpa,
                uploadedBy: user?.uid,
                uploadedByName: profile?.name || user?.displayName || 'System',
                analysis: {
                  expectedEgp: totalEgp,
                  expectedCredits: totalCredits,
                  discrepancies: hasDiscrepancy ? [`Calculated SGPA (${internalSgpa.toFixed(2)}) differs from Printed SGPA (${printedSgpa.toFixed(2)})`] : []
                }
              };
            });
            
            setExtractedStudents(students);
            if (students.length === 1) setSelectedStudent(students[0]);
          } else {
            throw new Error("No academic data found. Please ensure the document is clear and contains a tabulation register or grade card.");
          }
        } catch (err: any) {
          toast.error(err.message || 'AI Extraction failed');
        } finally {
          setLoading(false);
          setLoadingState('idle');
        }
      };

      reader.readAsDataURL(currentFile);
    } catch (error: any) {
      toast.error('Initialization failed: ' + error.message);
      setLoading(false);
      setLoadingState('idle');
    }
  };

  const handleSaveOne = async (entry: GPAEntry) => {
    if (!user) return;

    // Student Privacy Guard
    if (profile?.role === 'student' && profile?.registrationNo && entry.registrationNo !== profile.registrationNo) {
      toast.error("Access Denied: You can only vault your own academic records.");
      return;
    }

    const loadingToast = toast.loading(`Saving ${entry.studentName}...`);
    
    try {
      await addDoc(collection(db, 'gpa_history'), {
        ...entry,
        timestamp: serverTimestamp(),
        uid: user.uid
      });
      
      // Add Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        facultyId: user.uid,
        facultyName: profile?.name || user.displayName || 'System',
        action: 'Single Record Vaulted',
        description: `Verified audit for ${entry.studentName} (${entry.registrationNo})`,
        fileName: entry.fileName,
        timestamp: serverTimestamp()
      });
      
      toast.success(`${entry.registrationNo} Saved`, { id: loadingToast });
      setExtractedStudents(prev => prev.filter(s => s.registrationNo !== entry.registrationNo));
      if (selectedStudent?.registrationNo === entry.registrationNo) {
        setSelectedStudent(null);
      }
    } catch (err: any) {
      toast.error('Save failed', { id: loadingToast });
      handleFirestoreError(err, OperationType.CREATE, 'gpa_history');
    }
  };

  const handleSaveAll = async () => {
    if (!user || extractedStudents.length === 0) return;
    const loadingToast = toast.loading(`Vaulting ${extractedStudents.length} records...`);
    
    let success = 0;
    for (const entry of extractedStudents) {
      try {
        await addDoc(collection(db, 'gpa_history'), {
          ...entry,
          timestamp: serverTimestamp(),
          uid: user.uid
        });
        success++;
      } catch (err) {
        console.error(`Failed to save ${entry.studentName}`);
      }
    }

    if (success > 0) {
      await addDoc(collection(db, 'audit_logs'), {
        facultyId: user.uid,
        facultyName: profile?.name || user.displayName || 'System',
        action: 'Batch Vault Upload',
        description: `Successfully processed ${success} academic records in digital audit.`,
        fileName: file?.name || 'Batch Upload',
        timestamp: serverTimestamp()
      });
    }

    toast.success(`Vault Synced: ${success} records`, { id: loadingToast });
    setExtractedStudents([]);
    setSelectedStudent(null);
    if (onComplete) onComplete();
  };

  return (
    <div className={cn(
      "border rounded-2xl overflow-hidden shadow-2xl transition-all duration-500",
      theme === 'safe' ? "bg-white border-slate-200" : "bg-brand-surface border-white/10"
    )}>
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className={cn(
            "font-bold text-sm uppercase tracking-widest",
            theme === 'safe' ? "text-[#003d73]" : "text-white"
          )}>Digital Audit</h3>
          <p className={cn(
            "text-[10px] uppercase font-mono mt-1",
            theme === 'safe' ? "text-slate-400" : "text-white/30"
          )}>PDF / JPG / PNG Processor</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const input = fileInputRef.current as any;
              if (input) {
                input.webkitdirectory = false;
                input.click();
              }
            }}
            className={cn(
              "border px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              theme === 'safe' 
                ? "bg-slate-50 text-[#003d73] border-slate-200 hover:bg-slate-100" 
                : "bg-white/5 hover:bg-white/10 text-white border-white/10"
            )}
          >
            Select File
          </button>
          {profile?.role === 'mis' && (
            <button 
              onClick={() => {
                const input = fileInputRef.current as any;
                if (input) {
                  input.webkitdirectory = true;
                  input.click();
                }
              }}
              className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Batch Folder
            </button>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          accept=".pdf,image/*" 
          onChange={handleFileChange}
        />
      </div>

      <AnimatePresence mode="wait">
        {isConfiguring && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "p-12 flex flex-col items-center justify-center text-center",
              theme === 'safe' ? "bg-slate-50" : "bg-brand-primary/5"
            )}
          >
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mb-6",
              theme === 'safe' ? "bg-[#00a6bb]/10" : "bg-brand-primary/10"
            )}>
              <FileUp className={theme === 'safe' ? "text-[#00a6bb]" : "text-brand-primary"} size={32} />
            </div>
            <h4 className={cn(
              "text-lg font-serif italic mb-2",
              theme === 'safe' ? "text-slate-900" : "text-white"
            )}>Configure Extraction</h4>
            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
              <div className="p-3 mb-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[9px] text-amber-600 font-bold uppercase leading-relaxed">
                Note: For large Tabulation Registers, processing more than 10 pages in one batch may increase extraction time.
              </div>
              <div className="w-full text-left">
                <label className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-1",
                  theme === 'safe' ? "text-slate-400" : "text-white/40"
                )}>Pages to process</label>
                <div className="flex gap-2 mt-2">
                  {[1, 5, 10, 20].map(val => (
                    <button
                      key={val}
                      onClick={() => setPageLimit(val)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all border",
                        pageLimit === val 
                          ? (theme === 'safe' ? "bg-[#00a6bb] text-white border-[#00a6bb]" : "bg-brand-primary text-black border-brand-primary") 
                          : (theme === 'safe' ? "bg-white text-slate-400 border-slate-200 hover:border-[#00a6bb]/50" : "bg-white/5 text-white/40 border-white/10 hover:border-white/20")
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => file && processFile(file, pageLimit)}
                className={cn(
                  "w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest mt-4 shadow-lg",
                  theme === 'safe' ? "bg-black text-white" : "bg-brand-primary text-black shadow-brand-primary/20"
                )}
              >
                Start Multi-Page Audit
              </button>
              <button 
                onClick={() => {
                  setFile(null);
                  setIsConfiguring(false);
                }}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  theme === 'safe' ? "text-slate-400 hover:text-slate-900" : "text-white/20 hover:text-white"
                )}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "p-12 flex flex-col items-center justify-center text-center",
              theme === 'safe' ? "bg-slate-50/50" : "bg-black/20"
            )}
          >
            <div className="relative mb-6">
               <Loader2 className={cn("animate-spin", theme === 'safe' ? "text-[#00a6bb]" : "text-brand-primary")} size={48} />
               <motion.div 
                 animate={{ scale: [1, 1.2, 1] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className={cn(
                   "absolute inset-0 blur-xl rounded-full",
                   theme === 'safe' ? "bg-[#00a6bb]/10" : "bg-brand-primary/20"
                 )}
               />
            </div>
            
            <p className={cn(
              "text-sm font-bold uppercase tracking-widest",
              theme === 'safe' ? "text-slate-900" : "text-white"
            )}>
              {loadingState === 'reading' ? 'Digitizing Document' : 'Cross-Checking Integrity'}
            </p>
            <p className={cn(
              "text-[10px] mt-1 font-mono uppercase tracking-tighter italic",
              theme === 'safe' ? "text-slate-400" : "text-white/30"
            )}>
              {loadingState === 'reading' 
                ? 'Preparing source buffer for AI analysis...' 
                : 'Verifying granular subject points vs summary tables...'}
            </p>
            
            {loadingState === 'extracting' && (
              <div className={cn(
                "mt-6 w-48 h-1 rounded-full overflow-hidden",
                theme === 'safe' ? "bg-slate-200" : "bg-white/5"
              )}>
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className={cn("w-full h-full", theme === 'safe' ? "bg-[#00a6bb]" : "bg-brand-primary")}
                />
              </div>
            )}
          </motion.div>
        )}

        {extractedStudents.length > 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col lg:flex-row h-[500px]"
          >
            {/* Left: Student List */}
            {profile?.role !== 'student' && (
              <div className={cn(
                "w-full lg:w-1/3 border-r overflow-y-auto",
                theme === 'safe' ? "bg-slate-50 border-slate-200" : "bg-black/20 border-white/5"
              )}>
                <div className={cn(
                  "p-4 sticky top-0 z-10 border-b flex items-center justify-between",
                  theme === 'safe' ? "bg-white border-slate-200" : "bg-black/20 border-white/5"
                )}>
                  <h4 className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    theme === 'safe' ? "text-slate-400" : "text-white/40"
                  )}>Extracted Results ({extractedStudents.length})</h4>
                  <button 
                    onClick={handleSaveAll}
                    className={cn(
                      "text-[10px] font-bold hover:underline uppercase tracking-tighter",
                      theme === 'safe' ? "text-[#001D3D]" : "text-brand-primary"
                    )}
                  >
                    Save All
                  </button>
                </div>
                <div className={cn(
                  "divide-y",
                  theme === 'safe' ? "divide-slate-200" : "divide-white/5"
                )}>
                  {extractedStudents.map((student) => (
                    <button
                      key={student.registrationNo}
                      onClick={() => setSelectedStudent(student)}
                      className={cn(
                        "w-full p-4 text-left transition-all flex items-center justify-between",
                        selectedStudent?.registrationNo === student.registrationNo 
                          ? (theme === 'safe' ? "bg-white shadow-inner" : "bg-white/5") 
                          : (theme === 'safe' ? "hover:bg-white" : "hover:bg-white/[0.02]")
                      )}
                    >
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-[10px] font-bold font-mono",
                          theme === 'safe' ? "text-[#001D3D]" : "text-white"
                        )}>{student.registrationNo}</span>
                        <span className={cn(
                          "text-[11px] truncate max-w-[150px]",
                          theme === 'safe' ? "text-slate-500" : "text-white/40"
                        )}>{student.studentName}</span>
                      </div>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        student.verificationStatus === 'verified' ? (theme === 'safe' ? "bg-emerald-600" : "bg-brand-primary") : "bg-red-500 animate-pulse"
                      )} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Right: Analysis Panel */}
            <div className={cn(
              "flex-1 overflow-y-auto",
              theme === 'safe' ? "bg-white" : "bg-black/10"
            )}>
              {selectedStudent ? (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={cn(
                        "text-xl font-serif italic",
                        theme === 'safe' ? "text-[#001226]" : "text-white"
                      )}>{selectedStudent.studentName}</h3>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mt-1",
                        theme === 'safe' ? "text-slate-400" : "text-white/20"
                      )}>Verification Analysis</p>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2",
                      selectedStudent.verificationStatus === 'verified' 
                        ? (theme === 'safe' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-brand-primary/10 text-brand-primary border-brand-primary/20") 
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {selectedStudent.verificationStatus === 'verified' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                      {selectedStudent.verificationStatus}
                    </div>
                  </div>

                  {selectedStudent.analysis?.discrepancies.map((d, i) => (
                    <div key={i} className={cn(
                      "p-3 border rounded-xl text-[10px] font-bold flex items-center gap-2",
                      theme === 'safe' ? "bg-red-50 border-red-100 text-red-700" : "bg-red-500/5 border-red-500/20 text-red-500"
                    )}>
                       <AlertTriangle size={12} />
                       {d}
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn(
                      "p-4 border",
                      theme === 'safe' ? "bg-slate-50 border-slate-200 rounded-2xl" : "bg-white/5 border-white/10 rounded-2xl"
                    )}>
                      <p className={cn(
                        "text-[9px] uppercase font-bold tracking-widest mb-1",
                        theme === 'safe' ? "text-slate-400" : "text-white/20"
                      )}>Printed Result</p>
                      <div className="flex items-baseline gap-2">
                        <span className={cn(
                          "text-2xl font-serif italic",
                          theme === 'safe' ? "text-[#001226]" : "text-white"
                        )}>{selectedStudent.sgpa.toFixed(2)}</span>
                        <span className={cn(
                          "text-[10px]",
                          theme === 'safe' ? "text-slate-400" : "text-white/40"
                        )}>SGPA</span>
                      </div>
                    </div>
                    <div className={cn(
                      "p-4 border",
                      theme === 'safe' ? "bg-[#00a6bb]/5 border-[#00a6bb]/20 rounded-2xl" : "bg-brand-primary/5 border-brand-primary/20 rounded-2xl"
                    )}>
                      <p className={cn(
                        "text-[9px] uppercase font-bold tracking-widest mb-1",
                        theme === 'safe' ? "text-[#00a6bb]/40" : "text-white/20"
                      )}>Genie Recalc</p>
                      <div className="flex items-baseline gap-2">
                        <span className={cn(
                          "text-2xl font-serif italic",
                          theme === 'safe' ? "text-[#00a6bb]" : "text-brand-primary"
                        )}>{selectedStudent.calculatedSgpa?.toFixed(2)}</span>
                        <span className={cn(
                          "text-[10px]",
                          theme === 'safe' ? "text-[#00a6bb]/40" : "text-brand-primary/40"
                        )}>SGPA</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-1",
                      theme === 'safe' ? "text-slate-400" : "text-white/40"
                    )}>Subject Breakdown</h4>
                    <div className={cn(
                      "border rounded-2xl overflow-hidden",
                      theme === 'safe' ? "bg-slate-50 border-slate-200" : "bg-black/20 border-white/5"
                    )}>
                      <table className="w-full text-left">
                        <thead className={cn(
                          "text-[9px] font-bold uppercase tracking-widest italic border-b",
                          theme === 'safe' ? "bg-white border-slate-200 text-slate-400" : "bg-white/5 border-white/5 text-white/20"
                        )}>
                          <tr>
                            <th className="px-4 py-2">Code</th>
                            <th className="px-4 py-2">Subject</th>
                            <th className="px-4 py-2 text-center">Cr</th>
                            <th className="px-4 py-2 text-center">Gr</th>
                          </tr>
                        </thead>
                        <tbody className={cn(
                          "divide-y font-mono text-[10px]",
                          theme === 'safe' ? "divide-slate-200" : "divide-white/5"
                        )}>
                          {selectedStudent.subjects.map((s, i) => (
                            <tr key={i} className={theme === 'safe' ? "hover:bg-white" : "hover:bg-white/[0.02]"}>
                              <td className={theme === 'safe' ? "px-4 py-2 text-slate-500" : "px-4 py-2 text-white/40"}>{s.code}</td>
                              <td className={theme === 'safe' ? "px-4 py-2 text-[#001226] truncate max-w-[120px]" : "px-4 py-2 text-white truncate max-w-[120px]"}>{s.name}</td>
                              <td className={theme === 'safe' ? "px-4 py-2 text-center text-slate-500" : "px-4 py-2 text-center text-white/40"}>{s.credits}</td>
                              <td className={cn(
                                "px-4 py-2 text-center font-bold",
                                theme === 'safe' ? "text-[#00a6bb]" : "text-brand-primary"
                              )}>{s.grade}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button 
                      onClick={() => setSelectedStudent(null)}
                      className={cn(
                        "px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                        theme === 'safe' ? "text-slate-400 hover:text-slate-900" : "text-white/30 hover:text-white"
                      )}
                    >
                      Close Detail
                    </button>
                    <button 
                      onClick={() => handleSaveOne(selectedStudent)}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all font-sans",
                        theme === 'safe' ? "bg-[#001226] text-white hover:bg-black" : "bg-brand-primary text-black hover:opacity-90 shadow-lg shadow-brand-primary/20"
                      )}
                    >
                      Vault This Student
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all opacity-40",
                    theme === 'safe' ? "bg-slate-100 text-slate-400" : "bg-white/5 text-white"
                  )}>
                    <ChevronRight size={20} />
                  </div>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    theme === 'safe' ? "text-slate-900" : "text-white"
                  )}>Select a student</p>
                  <p className={cn(
                    "text-[10px] mt-1 uppercase italic",
                    theme === 'safe' ? "text-slate-400 font-bold" : "text-white/40"
                  )}>To view detailed calculation analysis</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {extractedStudents.length === 0 && !loading && !isConfiguring && (
          <div className="p-16 text-center">
            <div className={cn(
              "mx-auto w-16 h-16 rounded-3xl flex items-center justify-center mb-6 border shadow-inner transition-all",
              theme === 'safe' ? "bg-slate-50 text-slate-300 border-slate-100" : "bg-white/5 text-white/20 border-white/5"
            )}>
              <FileText size={32} />
            </div>
            <p className={cn(
              "text-xs font-bold uppercase tracking-[0.3em]",
              theme === 'safe' ? "text-slate-900" : "text-white"
            )}>No files uploaded yet</p>
            <p className={cn(
              "text-[10px] mt-3 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed",
              theme === 'safe' ? "text-slate-500" : "text-white/40"
            )}>
              Click the <span className={theme === 'safe' ? "text-[#005495] font-bold" : "text-brand-primary"}>"Select File"</span> button above to initiate digital audit.
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
