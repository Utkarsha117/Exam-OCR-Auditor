import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileUp, 
  History, 
  Users, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X, 
  Search,
  Bell,
  GraduationCap,
  Palette,
  Settings
} from 'lucide-react';
import StudentDashboard from '../components/StudentDashboard';
import TeacherDashboard from '../components/TeacherDashboard';
import MISDashboard from '../components/MISDashboard';
import ThemeToggle from '../components/ThemeToggle';
import ControlPanel from '../components/ControlPanel';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { profile, logout } = useAuth();
  const { theme } = useTheme();
  const isLight = ['light', 'safe', 'swiss', 'mono'].includes(theme);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [controlPanelOpen, setControlPanelOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const notifications = [
    { id: 1, title: 'Vault Access Granted', time: '2m ago', type: 'security' },
    { id: 2, title: 'Grade Extraction Success', time: '1h ago', type: 'system' },
    { id: 3, title: 'Discrepancy Audit Logged', time: '5h ago', type: 'alert' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['student', 'teacher', 'mis'] },
    { name: 'Student Records', icon: Users, path: '/students', roles: ['teacher', 'mis'] },
    { name: 'Reports', icon: ShieldCheck, path: '/reports', roles: ['mis'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(profile?.role || ''));

  return (
    <div className="flex h-screen bg-brand-bg text-inherit transition-colors duration-500">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/80 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 transition-transform duration-300 transform lg:translate-x-0 lg:static border-r duration-500",
        theme === 'cyber' ? "backdrop-blur-2xl bg-brand-nav/70 border-white/10 text-white/60" :
        isLight ? "bg-white border-slate-200 text-slate-700 shadow-sm" :
        theme === 'swiss' ? "bg-black border-r-4 border-black text-white" :
        "bg-brand-nav border-white/5 text-white/60",
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          <div className={cn(
            "flex h-24 items-center px-6 border-b transition-colors duration-500",
            isLight ? "border-slate-50 bg-white" : "border-white/5"
          )}>
            {isLight && theme === 'safe' ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#001D3D] rounded-xl flex items-center justify-center p-1.5 text-white shadow-lg">
                   <div className="flex flex-col items-center leading-[0.8]">
                      <span className="text-[7px] font-bold">GET</span>
                      <span className="text-[10px] font-black tracking-tighter">SAFE</span>
                      <span className="text-[7px] font-bold">ONLINE</span>
                   </div>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[12px] font-black text-[#001D3D] tracking-tight">ACADEMIC</span>
                  <span className="text-[12px] font-bold text-[#001D3D]/80 italic font-serif">HUB</span>
                </div>
              </div>
            ) : (
              <>
                <div className={cn(
                  "w-8 h-8 rounded flex items-center justify-center text-black font-bold mr-3 transition-all duration-300",
                  theme === 'cyber' ? "bg-brand-primary neon-border" : 
                  theme === 'swiss' ? "bg-white scale-110 -rotate-3" :
                  isLight ? "bg-slate-900 text-white" :
                  "bg-brand-primary"
                )}>G</div>
                <span className={cn(
                  "text-xl tracking-tighter uppercase font-black",
                  isLight ? "text-slate-900" : "text-white"
                )}>Academic <span className={cn(isLight && theme === 'safe' ? "text-[#001D3D]" : (isLight ? "text-slate-500" : "text-[#00a6bb]"))}>Hub</span></span>
              </>
            )}
          </div>

          <p className={cn(
            "px-6 mt-6 text-[10px] uppercase tracking-[0.2em] mb-2",
            isLight ? (theme === 'safe' ? "text-[#001D3D]/40" : "text-slate-400") : "text-white/30"
          )}>Control Panel</p>
          <nav className="flex-1 space-y-1 p-4">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 border",
                  location.pathname === item.path 
                    ? (isLight ? "bg-slate-50 text-slate-900 border-slate-200 shadow-sm" : "bg-brand-primary/10 text-brand-primary border-brand-primary/30")
                    : (isLight ? "border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-900" : "border-transparent text-white/40 hover:bg-white/5 hover:text-white")
                )}
              >
                <item.icon size={18} className="mr-3" />
                <span className="tracking-wide uppercase text-[11px] font-bold">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className={cn(
            "p-4 border-t",
            isLight ? "border-slate-50" : "border-white/5"
          )}>
            <div className="flex items-center p-2 mb-4">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3",
                isLight && theme === 'safe' ? "bg-[#001D3D]" : (isLight ? "bg-slate-900" : "bg-blue-600")
              )}>
                {profile?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-semibold truncate",
                  isLight ? "text-slate-900" : "text-white"
                )}>{profile?.name}</p>
                <p className={cn(
                  "text-[10px] uppercase tracking-wider",
                  isLight ? "text-slate-400" : "text-white/30"
                )}>{profile?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={cn(
                "flex w-full items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                isLight ? "text-slate-400 hover:bg-slate-50 hover:text-red-600" : "text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              <LogOut size={18} className="mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar */}
        <header className={cn(
          "h-16 border-b px-4 flex items-center justify-between lg:px-8 transition-colors duration-500",
          theme === 'cyber' ? "backdrop-blur-xl bg-brand-nav/60 border-white/5" :
          isLight ? "bg-white border-slate-200" :
          theme === 'swiss' ? "bg-white border-b-4 border-black" :
          "bg-brand-nav border-white/5"
        )}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={cn(
              "p-2 lg:hidden rounded-lg transition-colors",
              isLight ? "text-slate-400 hover:bg-slate-100" : "text-white/50 hover:bg-white/5"
            )}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center flex-1 max-w-sm ml-4 lg:ml-0">
            <div className={cn(
              "px-3 py-1 rounded-full border text-[13px] uppercase tracking-widest font-bold font-mono",
              isLight && theme === 'safe' ? "bg-slate-50 border-slate-200 text-[#003d73]" : (isLight ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-white/5 border-white/10 text-white/60")
            )}>
              {profile?.role === 'mis' ? 'MIS Faculty View' : profile?.role === 'teacher' ? 'Instructor Portal' : 'Student GPA Genie'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => setControlPanelOpen(true)}
              className={cn(
                "flex items-center gap-2 p-2 px-3 rounded-xl transition-all",
                isLight 
                  ? (isLight && theme === 'safe' ? "bg-[#003d73] text-white shadow-lg hover:bg-[#005495]" : "bg-slate-900 text-white shadow-lg hover:bg-slate-800") 
                  : "text-white/40 hover:bg-white/5"
              )}
            >
              <Settings size={20} />
              {isLight && <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Settings</span>}
            </button>
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={cn(
                  "p-2 rounded-full relative transition-all",
                  notificationsOpen 
                    ? (isLight ? "bg-slate-100 text-slate-900" : "bg-white/10 text-brand-primary")
                    : (isLight ? "text-slate-600 hover:bg-slate-100" : "text-white/40 hover:bg-white/5")
                )}
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-brand-primary rounded-full border-2 border-brand-nav"></span>
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-[60]" 
                      onClick={() => setNotificationsOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={cn(
                        "absolute right-0 mt-3 w-72 border rounded-2xl shadow-2xl z-[70] overflow-hidden",
                        isLight ? "bg-white border-slate-200" : "bg-brand-nav border-white/10"
                      )}
                    >
                      <div className={cn(
                        "p-4 border-b flex items-center justify-between",
                        isLight ? "bg-slate-50 border-slate-50" : "bg-white/5 border-white/5"
                      )}>
                        <h4 className={cn(
                          "text-[10px] font-bold uppercase tracking-[0.2em]",
                          isLight ? "text-slate-900" : "text-white"
                        )}>Operational Dispatch</h4>
                        <span className="text-[9px] text-brand-primary font-mono font-bold animate-pulse">Live Feed</span>
                      </div>
                      <div className={cn(
                        "max-h-[300px] overflow-y-auto",
                        isLight ? "divide-y divide-slate-50" : "divide-y divide-white/5"
                      )}>
                        {notifications.map((n) => (
                          <div key={n.id} className={cn(
                            "p-4 transition-colors cursor-pointer group",
                            isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.02]"
                          )}>
                            <div className="flex justify-between items-start mb-1">
                              <p className={cn(
                                "text-xs font-bold transition-colors",
                                isLight ? "text-slate-600 group-hover:text-slate-900" : "text-white/80 group-hover:text-white"
                              )}>{n.title}</p>
                              <span className={cn(
                                "text-[9px] font-mono italic",
                                isLight ? "text-slate-300" : "text-white/20"
                              )}>{n.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                n.type === 'alert' ? 'bg-red-500' : 
                                n.type === 'security' ? 'bg-[#00a6bb]' : 'bg-brand-primary'
                              )} />
                              <span className={cn(
                                "text-[8px] uppercase font-bold tracking-widest",
                                isLight ? "text-slate-300" : "text-white/30"
                              )}>{n.type} dispatch</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className={cn(
                        "w-full py-3 text-[9px] font-bold uppercase tracking-widest transition-all",
                        isLight ? "bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                      )}>
                        Clear Dispatch Logs
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className={cn(
              "h-8 w-[1px] mx-2 hidden sm:block",
              isLight ? "bg-slate-200" : "bg-white/5"
            )}></div>
            <div className={cn(
              "flex flex-col text-right hidden sm:flex",
              isLight ? "text-slate-900" : "text-white"
            )}>
              <span className="text-[11px] font-bold uppercase tracking-tight">{profile?.name}</span>
              <span className={cn(
                "text-[10px] uppercase font-bold tracking-widest leading-none",
                isLight ? "text-slate-400" : "text-white/30"
              )}>{profile?.role}</span>
            </div>
          </div>
        </header>

        {/* Viewport */}
        <main className={cn(
          "flex-1 overflow-y-auto p-4 lg:p-8 bg-brand-bg relative transition-colors duration-500",
          theme === 'cyber' && "cyber-grid",
          theme === 'safe' ? "text-[#001D3D]" : "text-inherit"
        )}>
          <Routes>
            <Route path="/" element={
              profile?.role === 'student' ? <StudentDashboard /> :
              profile?.role === 'teacher' ? <TeacherDashboard /> :
              <MISDashboard />
            } />
            <Route path="/students" element={<TeacherDashboard />} />
            <Route path="/reports" element={<MISDashboard />} />
          </Routes>
        </main>

        <AnimatePresence>
          {controlPanelOpen && (
            <ControlPanel 
              isOpen={controlPanelOpen} 
              onClose={() => setControlPanelOpen(false)} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
