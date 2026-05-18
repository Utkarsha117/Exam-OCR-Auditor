import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Search, 
  FileCheck, 
  Zap, 
  Shield, 
  Database,
  Layers,
  History,
  FileText,
  BarChart3,
  HelpCircle,
  Menu,
  X,
  Github,
  Mail,
  Linkedin,
  Cpu
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'GitHub', href: 'https://github.com', isExternal: true },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm py-3' : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
            <Cpu size={22} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Exam <span className="text-indigo-600">OCR Auditor</span></span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            link.isExternal ? (
              <a key={link.name} href={link.href} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                {link.name}
              </a>
            ) : (
              <Link key={link.name} to={link.href} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                {link.name}
              </Link>
            )
          ))}
          <Link 
            to="/login" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            Start Auditing
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2 text-slate-600" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-b border-slate-100 absolute top-full left-0 right-0 p-6 flex flex-col gap-4 shadow-xl"
        >
          {navLinks.map((link) => (
            <Link key={link.name} to={link.href} className="text-lg font-semibold text-slate-900" onClick={() => setIsOpen(false)}>
              {link.name}
            </Link>
          ))}
          <Link to="/login" className="bg-indigo-600 text-white py-3 rounded-xl font-bold text-center">
            Sign In
          </Link>
        </motion.div>
      )}
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-purple-50 rounded-full blur-[100px] opacity-60" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-8">
            <Zap size={14} fill="currentColor" /> Powered by Gemini Vision
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-8">
            Automate Exam Paper <br/>
            <span className="text-indigo-600">Verification with AI</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-12 max-w-3xl mx-auto">
            Upload answer sheets and get instant OCR-based analysis and audit reports. Our advanced AI detects mismatches, extracts marks, and verifies student data with over 99% accuracy.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/login" 
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2"
            >
              Upload Paper <ArrowRight size={20} />
            </Link>
            <button className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 px-10 py-4 rounded-2xl font-bold text-lg transition-all border border-slate-200 shadow-sm active:scale-95">
              View Sample Reports
            </button>
          </div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 relative px-4 lg:px-0"
        >
          <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 border border-slate-100 bg-slate-50 p-2">
            <div className="bg-white rounded-2xl overflow-hidden aspect-[16/9] flex flex-col">
              {/* Fake Browser Toolbar */}
              <div className="h-12 border-b border-slate-50 bg-slate-50/50 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                </div>
                <div className="ml-4 h-6 w-64 bg-slate-100 rounded-md" />
              </div>
              {/* Dashboard Content Mockup */}
              <div className="flex-1 p-8 flex gap-8">
                <div className="w-1/3 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 p-8">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                    <FileText size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-900">Drop answer sheet here</p>
                    <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="h-40 bg-slate-50 rounded-xl p-6 space-y-4">
                    <div className="h-6 w-1/3 bg-slate-200 rounded animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-slate-100 rounded" />
                      <div className="h-4 w-full bg-slate-100 rounded" />
                      <div className="h-4 w-3/4 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-indigo-50/50 rounded-xl border border-indigo-100 p-4">
                      <p className="text-[10px] uppercase font-bold text-indigo-500">Confidence Score</p>
                      <p className="text-2xl font-bold text-indigo-700 mt-1">98.4%</p>
                    </div>
                    <div className="h-24 bg-emerald-50/50 rounded-xl border border-emerald-100 p-4">
                      <p className="text-[10px] uppercase font-bold text-emerald-500">Validation Status</p>
                      <p className="text-2xl font-bold text-emerald-700 mt-1">Verified</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: any) => (
  <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <Icon size={28} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

const Features = () => {
  return (
    <section id="features" className="py-24 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-indigo-600 mb-4">Core Capabilities</h2>
          <h3 className="text-4xl font-black text-slate-900 tracking-tight">Why Choose Our Auditor?</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard 
            icon={Zap} 
            title="OCR Accuracy" 
            desc="High-precision text extraction capable of reading diverse handwriting styles and layouts." 
          />
          <FeatureCard 
            icon={Shield} 
            title="AI Validation" 
            desc="Smart verification logic that cross-references extracted data with school records automatically." 
          />
          <FeatureCard 
            icon={Layers} 
            title="Fast Processing" 
            desc="Analyze complex multiple-page documents in seconds using Gemini's multi-modal capabilities." 
          />
          <FeatureCard 
            icon={Database} 
            title="Secure Storage" 
            desc="Student records and audit history are encrypted and stored securely using Firebase." 
          />
        </div>
      </div>
    </section>
  );
};

const Steps = () => {
  const steps = [
    { title: "Upload", desc: "Drag and drop exam papers or bulk upload student folders." },
    { title: "Analyze", desc: "AI scans text, identifies student IDs, and captures marks." },
    { title: "Verify", desc: "System flags discrepancies or low-confidence recognition for review." },
    { title: "Report", desc: "Generate a comprehensive audit PDF with student-wise analysis." }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-indigo-600 mb-4">Streamlined Workflow</h2>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-8 leading-tight">Better auditing starts with a simple process</h3>
            <p className="text-lg text-slate-500 font-medium mb-10">
              We've redesigned the traditional exam auditing process into four automated steps, saving hours of manual data entry.
            </p>
            <div className="space-y-8">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-6">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">{step.title}</h4>
                    <p className="text-slate-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-100/50 rounded-full blur-[80px] -z-10" />
             <div className="grid grid-cols-2 gap-6">
               <div className="space-y-6 pt-12">
                 <div className=" aspect-[4/5] bg-slate-900 rounded-3xl p-6 flex flex-col justify-end text-white relative overflow-hidden group">
                   <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-lg backdrop-blur-md">
                     <FileCheck size={20} />
                   </div>
                   <p className="text-sm font-bold text-indigo-400 mb-1">AUDIT SUCCESS</p>
                   <p className="text-xl font-black">99.8% Accuracy Rate</p>
                 </div>
                 <div className=" aspect-square bg-indigo-600 rounded-3xl p-6 flex flex-col justify-between text-white">
                   <BarChart3 size={32} />
                   <p className="font-bold">Real-time Analytics Dashboard</p>
                 </div>
               </div>
               <div className="space-y-6">
                 <div className=" aspect-square bg-slate-100 rounded-3xl border border-slate-200 p-6 flex items-center justify-center">
                    <History size={48} className="text-slate-400" />
                 </div>
                 <div className=" aspect-[4/5] bg-indigo-50 rounded-3xl p-6 border border-indigo-100 flex flex-col justify-between">
                    <p className="text-indigo-600 font-black text-4xl">5k+</p>
                    <p className="font-bold text-slate-700">Papers Processed Daily</p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                <Cpu size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight">Exam Auditor</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              A modern auditing system built for academic institutions. Leverages Gemini AI for high-fidelity document analysis.
            </p>
            <div className="flex gap-4">
              <Github size={20} className="text-slate-500 hover:text-white cursor-pointer transition-colors" />
              <Linkedin size={20} className="text-slate-500 hover:text-white cursor-pointer transition-colors" />
              <Mail size={20} className="text-slate-500 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-extrabold text-white uppercase tracking-widest mb-8">Resources</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
              <li><a href="#" className="hover:text-white">Documentation</a></li>
              <li><a href="#" className="hover:text-white">User Guide</a></li>
              <li><a href="#" className="hover:text-white">API Reference</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-white uppercase tracking-widest mb-8">Platform</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white">Architecture</a></li>
              <li><a href="#" className="hover:text-white">Security Specs</a></li>
              <li><Link to="/login" className="hover:text-white">Cloud Login</Link></li>
              <li><a href="#" className="hover:text-white">Status Page</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-white uppercase tracking-widest mb-8">Newsletter</h4>
            <div className="bg-white/5 border border-white/10 p-2 rounded-2xl flex">
              <input type="email" placeholder="Email" className="bg-transparent border-none focus:ring-0 flex-1 px-3 text-sm" />
              <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                JOIN
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-500 italic">Built with React, Tailwind, Firebase & Gemini AI.</p>
          <div className="flex gap-8 text-xs font-bold text-slate-600">
            <a href="#" className="hover:text-white">PRIVACY</a>
            <a href="#" className="hover:text-white">TERMS</a>
            <a href="#" className="hover:text-white">COOKIES</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <Steps />
      <Footer />
    </div>
  );
}
