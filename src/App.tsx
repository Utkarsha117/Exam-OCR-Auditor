import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="flex h-screen w-screen items-center justify-center bg-brand-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-brand-bg text-inherit font-sans selection:bg-brand-primary/20 selection:text-brand-primary transition-colors duration-300">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
            <Toaster 
              toastOptions={{
                style: {
                  background: 'var(--brand-surface)',
                  color: 'var(--brand-primary)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '12px',
                  borderRadius: '12px',
                  fontFamily: 'Inter, sans-serif'
                }
              }}
              position="top-right" 
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
