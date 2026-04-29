import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Palette, Bell, Shield, 
  Settings, Trash2, LogOut, Type, 
  Check, RotateCcw, Download, Info,
  Monitor, Moon, Sun, Smartphone,
  Zap, Globe, Database
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface ControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabId = 'profile' | 'appearance' | 'notifications' | 'security' | 'advanced';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'profile', label: 'User & Auth', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'advanced', label: 'Advanced', icon: Database },
];

const PRESET_ACCENTS = [
  { name: 'Emerald', color: '#10b981' },
  { name: 'Sky', color: '#0ea5e9' },
  { name: 'Indigo', color: '#6366f1' },
  { name: 'Rose', color: '#f43f5e' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Violet', color: '#8b5cf6' },
];

export default function ControlPanel({ isOpen, onClose }: ControlPanelProps) {
  const { theme } = useTheme();
  const isLight = ['light', 'safe', 'swiss', 'mono'].includes(theme);
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const { 
    setTheme, 
    fontSize, setFontSize, 
    compactMode, setCompactMode,
    accentColor, setAccentColor 
  } = useTheme();
  const { profile, logout } = useAuth();

  if (!isOpen) return null;

  const handleClearCache = () => {
    if (confirm('Clear all settings and cache? This will reset your theme and local preferences.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleExportData = () => {
    const data = {
      profile,
      settings: { theme, fontSize, compactMode, accentColor },
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic-portal-data-${new Date().getTime()}.json`;
    a.click();
    toast.success('Data exported successfully');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className={cn(
          "relative w-full max-w-4xl h-[80vh] rounded-[2rem] border shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-500",
          theme === 'safe' 
            ? "bg-white border-slate-200" 
            : theme === 'cyber' 
              ? "glass-card border-white/10" 
              : "bg-brand-surface border-white/5"
        )}
      >
        {/* Sidebar */}
        <div className={cn(
          "w-full md:w-64 border-r flex flex-col transition-colors duration-500",
          isLight ? "bg-slate-50 border-slate-100 shadow-sm" : "bg-brand-nav border-white/5"
        )}>
          <div className="p-6">
            <h2 className={cn(
              "text-sm font-bold uppercase tracking-[0.2em] mb-1",
              isLight ? (theme === 'safe' ? "text-[#003d73]" : "text-slate-900") : "text-white"
            )}>Control Panel</h2>
            <p className={cn(
              "text-[13px] font-mono uppercase tracking-widest",
              isLight ? "text-slate-400" : "text-white/30"
            )}>System Configuration</p>
          </div>
          
          <nav className="flex-1 p-3 space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
                    activeTab === tab.id 
                      ? (isLight ? (theme === 'safe' ? "bg-[#003d73] text-white shadow-lg" : "bg-slate-900 text-white shadow-lg") : "bg-brand-primary/10 text-brand-primary shadow-lg shadow-brand-primary/5" )
                      : (isLight ? "text-slate-400 hover:bg-slate-100 hover:text-slate-900 shadow-sm" : "text-white/40 hover:bg-white/5 hover:text-white")
                  )}
                >
                  <Icon size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="tab-indicator"
                      className={cn(
                        "ml-auto w-1 h-4 rounded-full",
                        isLight ? "bg-white" : "bg-brand-primary"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </nav>
          
          <div className="p-4 mt-auto border-t border-white/5">
            <button 
              onClick={logout}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isLight ? "text-red-500 hover:bg-red-50 shadow-sm" : "text-red-400 hover:bg-red-500/10"
              )}
            >
              <LogOut size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Logout Session</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          <button 
            onClick={onClose}
            className={cn(
              "absolute top-6 right-6 p-2 rounded-full transition-all",
              theme === 'safe' ? "text-slate-400 hover:text-slate-900 hover:bg-slate-100" : "text-white/20 hover:text-white hover:bg-white/5"
            )}
          >
            <X size={20} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <header>
                    <h3 className={cn(
                      "text-lg font-bold mb-1",
                      isLight ? (theme === 'safe' ? "text-[#001D3D]" : "text-slate-900") : "text-white"
                    )}>User Profile</h3>
                    <p className={cn(
                      "text-xs font-mono uppercase tracking-widest",
                      isLight ? "text-slate-400" : "text-white/40"
                    )}>Manage your identity and authentication</p>
                  </header>
                  
                  <div className={cn(
                    "flex items-center gap-6 p-6 border rounded-3xl",
                    isLight ? "bg-white border-slate-100 shadow-sm" : "bg-white/[0.02] border-white/5"
                  )}>
                    <div className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center border-4 relative group overflow-hidden",
                      isLight && theme === 'safe' ? "bg-[#003d73]/10 text-[#003d73] border-[#003d73]/5" : (isLight ? "bg-slate-100 text-slate-900 border-slate-200" : "bg-brand-primary/20 text-brand-primary border-brand-primary/10")
                    )}>
                      <span className="text-3xl font-black">{profile?.name?.charAt(0) || 'U'}</span>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                        <Palette size={20} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className={cn(
                        "font-bold",
                        isLight ? "text-slate-900" : "text-white"
                      )}>{profile?.name}</h4>
                      <p className={cn(
                        "text-xs font-mono mb-2",
                        isLight ? "text-slate-400" : "text-white/40"
                      )}>{profile?.registrationNo || profile?.role}</p>
                      <div className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded border text-[13px] font-bold uppercase tracking-widest",
                        isLight && theme === 'safe' ? "bg-[#003d73]/10 text-[#003d73] border-[#003d73]/20" : (isLight ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-brand-primary/10 text-brand-primary border-brand-primary/20")
                      )}>
                        {profile?.role} Verified
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={cn(
                      "p-4 border rounded-2xl transition-all",
                      isLight ? "bg-white border-slate-100 shadow-sm" : "bg-white/[0.02] border-white/5"
                    )}>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mb-3",
                        isLight ? "text-slate-400" : "text-white/20"
                      )}>Email Address</p>
                      <p className={cn(
                        "text-xs font-bold",
                        isLight ? "text-slate-900" : "text-white/80"
                      )}>{profile?.email || 'Not provided'}</p>
                    </div>
                    <div className={cn(
                      "p-4 border rounded-2xl transition-all",
                      isLight ? "bg-white border-slate-100 shadow-sm" : "bg-white/[0.02] border-white/5"
                    )}>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mb-3",
                        isLight ? "text-slate-400" : "text-white/20"
                      )}>Security Level</p>
                      <p className={cn(
                        "text-xs font-bold",
                        isLight && theme === 'safe' ? "text-[#003d73]" : (isLight ? "text-slate-900" : "text-brand-primary")
                      )}>Standard Role-Based</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button className={cn(
                      "w-full py-3 px-4 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl border transition-all text-center",
                      isLight ? "bg-white border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-400 shadow-sm" : "bg-white/5 hover:bg-white/10 text-white border-white/5"
                    )}>
                      Change Access Key
                    </button>
                    <button className={cn(
                      "w-full py-3 px-4 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl border transition-all text-center",
                      isLight ? "bg-red-50 border-red-100 text-red-500 hover:bg-red-100 shadow-sm" : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                    )}>
                      Revoke All Other Sessions
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-8">
                  <header>
                    <h3 className={cn(
                      "text-lg font-bold mb-1",
                      isLight ? (theme === 'safe' ? "text-[#003d73]" : "text-slate-900") : "text-white"
                    )}>Visual Settings</h3>
                    <p className={cn(
                      "text-xs font-mono uppercase tracking-widest",
                      isLight ? "text-slate-400" : "text-white/40"
                    )}>Personalize your workspace aesthetic</p>
                  </header>

                  <section>
                    <label className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.2em] block mb-4",
                      isLight ? "text-slate-400" : "text-white/20"
                    )}>Core Theme</label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { id: 'midnight', label: 'Midnight', color: '#050505' },
                        { id: 'dark', label: 'Blue Night', color: '#0f172a' },
                        { id: 'light', label: 'Paper', color: '#f8fafc' },
                        { id: 'emerald', label: 'Cyberpunq', color: '#020617' },
                        { id: 'rose', label: 'Rosé', color: '#09090b' },
                        { id: 'ocean', label: 'Deeps', color: '#081217' },
                        { id: 'cyber', label: 'Glass Vault', color: '#02040a' },
                        { id: 'safe', label: 'Safe Online', color: '#005495' },
                        { id: 'swiss', label: 'Swiss Grid', color: '#ff0000' },
                        { id: 'mono', label: 'Minimal Mono', color: '#ffffff' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id as any)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl border transition-all relative group overflow-hidden",
                            theme === t.id 
                              ? (isLight ? "bg-slate-900 border-slate-900 text-white" : "bg-brand-primary/10 border-brand-primary/50 text-white") 
                              : (isLight ? "bg-white border-slate-200 text-slate-400 hover:border-slate-900" : "bg-white/[0.02] border-white/5 text-white/40 hover:border-white/20")
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-full border",
                            isLight ? "border-slate-200" : "border-white/10"
                          )} style={{ backgroundColor: t.color }} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
                          {theme === t.id && <Check size={12} className={cn("ml-auto", isLight ? "text-white" : "text-brand-primary")} />}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <label className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.2em] block mb-4",
                      isLight ? "text-slate-400" : "text-white/20"
                    )}>Accent Blueprint</label>
                    <div className="flex flex-wrap gap-3">
                      {PRESET_ACCENTS.map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() => setAccentColor(preset.color)}
                          className={cn(
                            "w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center",
                            accentColor === preset.color ? (isLight ? "border-slate-900 scale-110" : "border-white scale-110") : "border-transparent hover:scale-105"
                          )}
                          style={{ backgroundColor: preset.color }}
                        >
                          {accentColor === preset.color && <Check size={16} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <section>
                      <label className={cn(
                        "text-[10px] font-bold uppercase tracking-[0.2em] block mb-4",
                        isLight ? "text-slate-400" : "text-white/20"
                      )}>Font Scaling</label>
                      <div className={cn(
                        "flex p-1 rounded-xl transition-all",
                        isLight ? "bg-slate-100 shadow-inner" : "bg-white/5"
                      )}>
                        {(['sm', 'base', 'lg'] as const).map((size) => (
                          <button
                            key={size}
                            onClick={() => setFontSize(size)}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-[13px] font-bold uppercase tracking-widest transition-all",
                              fontSize === size 
                                ? (isLight ? "bg-white text-slate-900 shadow-md" : "bg-brand-primary text-black shadow-lg") 
                                : (isLight ? "text-slate-400 hover:text-slate-600" : "text-white/40 hover:text-white")
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </section>
                    <section>
                      <label className={cn(
                        "text-[10px] font-bold uppercase tracking-[0.2em] block mb-4",
                        isLight ? "text-slate-400" : "text-white/20"
                      )}>Layout Density</label>
                      <button
                        onClick={() => setCompactMode(!compactMode)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                          compactMode 
                            ? (isLight ? "bg-slate-50 border-slate-300" : "bg-brand-primary/10 border-brand-primary/30") 
                            : (isLight ? "bg-white border-slate-100 hover:border-slate-300 shadow-sm" : "bg-white/5 border-white/5")
                        )}
                      >
                        <span className={cn(
                          "text-[13px] font-bold uppercase tracking-widest transition-colors",
                          isLight ? "text-slate-600" : "text-white/60"
                        )}>Compact Mode</span>
                        <div className={cn(
                          "w-10 h-5 rounded-full relative transition-all",
                          compactMode 
                            ? (isLight ? "bg-slate-900" : "bg-brand-primary") 
                            : (isLight ? "bg-slate-200" : "bg-white/10")
                        )}>
                          <motion.div
                            animate={{ x: compactMode ? 22 : 2 }}
                            className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                          />
                        </div>
                      </button>
                    </section>
                  </div>
                </div>
              )}
              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <header>
                    <h3 className={cn(
                      "text-lg font-bold mb-1",
                      isLight ? (theme === 'safe' ? "text-[#003d73]" : "text-slate-900") : "text-white"
                    )}>Notifications</h3>
                    <p className={cn(
                      "text-xs font-mono uppercase tracking-widest",
                      isLight ? "text-slate-400" : "text-white/40"
                    )}>Configure alerts and system updates</p>
                  </header>

                  <div className="space-y-4">
                    {[
                      { label: 'Toast Notifications', desc: 'Display popups for system actions', enabled: true },
                      { label: 'Audit Alerts', desc: 'Notify on new grade card uploads', enabled: true },
                      { label: 'Discrepancy Alerts', desc: 'Critical alerts for data mismatches', enabled: false },
                      { label: 'Sound Effects', desc: 'Play subtle audio on success/fail', enabled: false },
                    ].map((item, i) => (
                      <div key={i} className={cn(
                        "flex items-center justify-between p-4 border rounded-2xl group transition-all",
                        isLight ? "bg-white border-slate-100 shadow-sm" : "bg-white/[0.02] border-white/5"
                      )}>
                        <div>
                          <p className={cn(
                            "text-[13px] font-bold uppercase tracking-widest mb-1",
                            isLight ? "text-slate-900" : "text-white"
                          )}>{item.label}</p>
                          <p className={cn(
                            "text-[13px] font-mono tracking-tighter uppercase",
                            isLight ? "text-slate-400" : "text-white/30"
                          )}>{item.desc}</p>
                        </div>
                        <div className={cn(
                          "w-8 h-4 rounded-full relative transition-all",
                          isLight ? "bg-slate-100" : "bg-white/10"
                        )}>
                          <div className={cn(
                            "absolute top-1 w-2 h-2 rounded-full transition-all",
                            item.enabled 
                              ? (isLight ? (theme === 'safe' ? "bg-[#003d73] left-5" : "bg-slate-900 left-5") : "bg-brand-primary left-5") 
                              : (isLight ? "bg-slate-300 left-1" : "bg-white/20 left-1")
                          )} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={cn(
                    "p-6 border rounded-3xl flex gap-4 transition-all",
                    isLight ? "bg-amber-50 border-amber-100" : "bg-amber-500/5 border border-amber-500/20"
                  )}>
                    <Info size={20} className={isLight ? "text-amber-600" : "text-amber-400"} />
                    <div>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mb-1",
                        isLight ? "text-amber-700" : "text-amber-400"
                      )}>Beta Feature</p>
                      <p className={cn(
                        "text-[13px] leading-relaxed",
                        isLight ? "text-amber-600/80 font-medium" : "text-blue-200/40"
                      )}>Browser-level push notifications are currently being provisioned for direct faculty alerts.</p>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'security' && (
                <div className="space-y-8">
                  <header>
                    <h3 className={cn(
                      "text-lg font-bold mb-1",
                      isLight ? (theme === 'safe' ? "text-[#003d73]" : "text-slate-900") : "text-white"
                    )}>Security & Access</h3>
                    <p className={cn(
                      "text-xs font-mono uppercase tracking-widest",
                      isLight ? "text-slate-400" : "text-white/40"
                    )}>Enhanced protection for academic data</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={cn(
                      "p-6 border rounded-3xl relative overflow-hidden transition-all",
                      isLight && theme === 'safe' ? "bg-[#003d73]/5 border-[#003d73]/20" : (isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-brand-primary/20")
                    )}>
                      <Zap size={40} className={cn(
                        "absolute -bottom-4 -right-4 transition-colors",
                        isLight && theme === 'safe' ? "text-[#003d73]/10" : (isLight ? "text-slate-200" : "text-brand-primary/10")
                      )} />
                      <h4 className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mb-4",
                        isLight && theme === 'safe' ? "text-[#003d73]" : (isLight ? "text-slate-900" : "text-brand-primary")
                      )}>Two-Factor Auth</h4>
                      <p className={cn(
                        "text-xs mb-6",
                        isLight ? "text-slate-600 font-medium" : "text-white/60"
                      )}>Secure your record uploads with an additional verification layer.</p>
                      <button className={cn(
                        "w-full py-2 border rounded-lg text-[13px] font-bold uppercase tracking-widest transition-all",
                        isLight && theme === 'safe' 
                          ? "bg-[#003d73] text-white border-[#003d73] hover:opacity-90" 
                          : (isLight ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800" : "bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary hover:text-black")
                      )}>
                        Link Authenticator
                      </button>
                    </div>
                    <div className={cn(
                      "p-6 border rounded-3xl transition-all",
                      isLight ? "bg-white border-slate-100 shadow-sm" : "bg-white/[0.02] border-white/5"
                    )}>
                      <h4 className={cn(
                        "text-[13px] font-bold uppercase tracking-widest mb-4",
                        isLight ? "text-slate-400" : "text-white/40"
                      )}>Login History</h4>
                      <div className="space-y-3">
                        {[
                          { ip: '192.168.1.1', date: 'Just now', device: 'Chrome / MacOS' },
                          { ip: '10.0.0.45', date: '2h ago', device: 'Mobile App' },
                        ].map((log, i) => (
                          <div key={i} className="flex justify-between items-center text-[13px]">
                            <span className={cn(
                              "font-mono",
                              isLight ? "text-slate-400" : "text-white/30"
                            )}>{log.ip}</span>
                            <span className={cn(
                              "font-bold uppercase",
                              isLight ? "text-slate-600" : "text-white/60"
                            )}>{log.date}</span>
                          </div>
                        ))}
                      </div>
                      <button className={cn(
                        "w-full mt-6 text-[13px] font-bold uppercase tracking-[0.2em] hover:underline transition-all text-center",
                        isLight ? "text-slate-900" : "text-brand-primary"
                      )}>
                        View Detailed Audit Logs
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'advanced' && (
                <div className="space-y-8">
                  <header>
                    <h3 className={cn(
                      "text-lg font-bold mb-1",
                      isLight ? (theme === 'safe' ? "text-[#003d73]" : "text-slate-900") : "text-white"
                    )}>Developer Controls</h3>
                    <p className={cn(
                      "text-xs font-mono uppercase tracking-widest",
                      isLight ? "text-slate-400" : "text-white/40"
                    )}>Advanced system utilities and recovery</p>
                  </header>

                  <div className="space-y-4">
                    <div className={cn(
                      "p-6 border rounded-3xl flex items-center justify-between transition-all",
                      isLight ? "bg-white border-slate-100 shadow-sm" : "bg-white/[0.02] border-white/5"
                    )}>
                      <div>
                        <p className={cn(
                          "text-[13px] font-bold uppercase tracking-widest mb-1",
                          isLight ? "text-slate-900" : "text-white"
                        )}>Export Academic Dossier</p>
                        <p className={cn(
                          "text-[13px] font-mono tracking-tighter uppercase",
                          isLight ? "text-slate-400" : "text-white/30"
                        )}>Download all local records as JSON</p>
                      </div>
                      <button 
                        onClick={handleExportData}
                        className={cn(
                          "p-3 rounded-xl transition-all",
                          isLight ? "bg-slate-100 hover:bg-slate-200" : "bg-white/5 hover:bg-white/10"
                        )}
                      >
                        <Download size={18} className={isLight ? "text-slate-600" : "text-white/60"} />
                      </button>
                    </div>

                    <div className={cn(
                      "p-6 border rounded-3xl flex items-center justify-between transition-all",
                      isLight ? "bg-white border-slate-100 shadow-sm" : "bg-white/[0.02] border-white/5"
                    )}>
                      <div>
                        <p className={cn(
                          "text-[13px] font-bold uppercase tracking-widest mb-1",
                          isLight ? "text-slate-900" : "text-white"
                        )}>Clear Application Cache</p>
                        <p className={cn(
                          "text-[13px] font-mono tracking-tighter uppercase",
                          isLight ? "text-slate-400" : "text-white/30"
                        )}>Reset all preferences to factory defaults</p>
                      </div>
                      <button 
                        onClick={handleClearCache}
                        className={cn(
                          "p-3 rounded-xl transition-all",
                          isLight ? "bg-red-50 hover:bg-red-100" : "bg-red-500/10 hover:bg-red-500/20"
                        )}
                      >
                        <RotateCcw size={18} className="text-red-400" />
                      </button>
                    </div>

                    <div className={cn(
                      "p-6 border rounded-3xl font-mono text-[13px] whitespace-pre transition-all",
                      isLight ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-[#050505] border-white/5 text-white/20"
                    )}>
                      {`SYSTEM_STATUS: OK\nAPI_ENDPOINT: production_v3\nGATEWAY_LATENCY: 42ms\nACTIVE_MODELS: gemini-3-flash-preview\nLAST_SYNC: ${new Date().toLocaleTimeString()}`}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
