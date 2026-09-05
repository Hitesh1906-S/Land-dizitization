import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Alert } from '../../components/common/Alert';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  Shield,
  Mail,
  Lock,
  ArrowRight,
  UserCheck,
  Sparkles,
  CheckCircle2,
  LockKeyhole,
  FileText,
  MapPin,
  Cpu
} from 'lucide-react';
import { UserRole } from '@land-digitization/shared';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user, token } = response.data.data;
      login(token, user);

      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else if (user.role === UserRole.REVENUE_OFFICER) {
        navigate('/officer/dashboard', { replace: true });
      } else if (user.role === UserRole.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/citizen/dashboard', { replace: true });
      }
    } catch (err: any) {
      if (err.response?.data?.error) {
        const errObj = err.response.data.error;
        if (Array.isArray(errObj.details) && errObj.details.length > 0) {
          setError(errObj.details.map((d: any) => d.message).join(' | '));
        } else {
          setError(errObj.message || 'Authentication failed. Please check your email and password.');
        }
      } else if (err.message && err.message.includes('Network Error')) {
        setError('Cannot reach server. Please ensure the backend API server is running on port 5000.');
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (role: 'citizen' | 'officer' | 'admin') => {
    setError(null);
    if (role === 'citizen') {
      setEmail('citizen@example.com');
      setPassword('Password@123');
    } else if (role === 'officer') {
      setEmail('officer.jaipur@bhoomisetu.gov.in');
      setPassword('Password@123');
    } else {
      setEmail('admin@bhoomisetu.gov.in');
      setPassword('Password@123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Official Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 text-xs py-2 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-white">Government of India • Land Records Modernization Mission</span>
        </div>
        <Link to="/" className="text-blue-400 hover:text-white font-semibold transition-colors flex items-center gap-1">
          Back to Home
        </Link>
      </div>

      {/* Main Split Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full max-w-5xl">
          
          {/* Left Column: Authentic Government AI Artwork & Mission Showcase */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            {/* Header Brand */}
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-govnavy-900 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-900/30 border border-blue-500/40 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="font-black text-2xl text-white tracking-tight font-display">
                  Bhoomi<span className="text-blue-400">Setu</span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  National Digital Land Registry & Cadastre
                </div>
              </div>
            </Link>

            {/* Visual Card with Generated Government Artwork */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900/80 group">
              <div className="relative aspect-square sm:aspect-4/3 w-full overflow-hidden">
                <img
                  src="/images/gov_land_security_hero.jpg"
                  alt="Government Digital Land Registry & Cybersecurity Emblem"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Floating Seal Ribbon on Image */}
                <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-blue-500/30 flex items-center gap-2 shadow-lg">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    Certified AI Cadastral Platform
                  </span>
                </div>
              </div>

              {/* Text Highlights below image */}
              <div className="p-5 space-y-2 relative bg-slate-900/95 border-t border-slate-800">
                <h3 className="text-base font-bold text-white">
                  Deterministic Title Certainty & AI Multi-Lingual OCR
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Connecting digital cadastral parcel polygons to historical registered deeds in Devanagari and English with mathematical validation.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    100% Persistent Database
                  </span>
                  <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-blue-300">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    Deep OCR Vision
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Form */}
          <div className="lg:col-span-6 w-full">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-2xl font-black text-white font-display">Official Sign In</h2>
                  <Badge variant="navy" size="sm">
                    Secure Session
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Enter your credentials to access land dossiers, verification queues, or admin console.
                </p>
              </div>

              {error && (
                <Alert variant="danger">
                  <span>{error}</span>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="citizen@example.com or officer@bhoomisetu.gov.in"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Security Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-600/20 mt-2"
                  isLoading={isLoading}
                >
                  Authenticate & Sign In
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>

              {/* 1-Click Role Seed Login Fast-Switcher */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  1-Click Role Fast Credentials:
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDemoCredentials('citizen')}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-center transition-all hover:border-blue-500 flex flex-col items-center gap-1"
                  >
                    <span className="text-white font-bold">Citizen</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Ramesh S.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoCredentials('officer')}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-center transition-all hover:border-blue-500 flex flex-col items-center gap-1"
                  >
                    <span className="text-white font-bold">Officer</span>
                    <span className="text-[10px] text-blue-400 font-mono">Tehsildar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoCredentials('admin')}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-center transition-all hover:border-blue-500 flex flex-col items-center gap-1"
                  >
                    <span className="text-white font-bold">Admin</span>
                    <span className="text-[10px] text-amber-400 font-mono">DM Console</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 text-center text-xs text-slate-400">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-blue-400 font-bold hover:underline">
                  Register new citizen account
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Footer Ribbon */}
      <div className="bg-slate-900 text-slate-500 text-center text-[11px] py-3 border-t border-slate-800">
        BhoomiSetu National Digital Registry • Protected by SHA-256 digital document verification & biometric security.
      </div>
    </div>
  );
};
