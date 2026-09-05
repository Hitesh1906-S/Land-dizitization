import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Alert } from '../../components/common/Alert';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  Shield,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  LockKeyhole,
  MapPin,
  Building,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { UserRole } from '@land-digitization/shared';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CITIZEN);
  const [district, setDistrict] = useState('Jaipur');
  const [tehsil, setTehsil] = useState('Sanganer');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/register', {
        fullName,
        email,
        password,
        phone,
        role,
        jurisdictionDistrict: role === UserRole.REVENUE_OFFICER ? district : undefined,
        jurisdictionTehsil: role === UserRole.REVENUE_OFFICER ? tehsil : undefined,
      });

      const { user, token } = response.data.data;
      login(token, user);

      if (user.role === UserRole.REVENUE_OFFICER) {
        navigate('/officer/dashboard');
      } else if (user.role === UserRole.ADMIN) {
        navigate('/admin/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err: any) {
      if (err.response?.data?.error) {
        const errObj = err.response.data.error;
        if (Array.isArray(errObj.details) && errObj.details.length > 0) {
          setError(errObj.details.map((d: any) => d.message).join(' | '));
        } else {
          setError(errObj.message || 'Registration failed. Please check your details.');
        }
      } else if (err.message && err.message.includes('Network Error')) {
        setError('Cannot reach server. Please ensure the backend API server is running on port 5000.');
      } else {
        setError(err.message || 'Failed to create account. Please verify input fields.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Official Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 text-xs py-2 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-white">Digital India Land Records Modernization Mission</span>
        </div>
        <Link to="/" className="text-blue-400 hover:text-white font-semibold transition-colors flex items-center gap-1">
          Back to Home
        </Link>
      </div>

      {/* Main Split Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full max-w-5xl">
          
          {/* Left Column: Government Land Passport Visual & Highlights */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6 order-2 lg:order-1">
            {/* Header Brand */}
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-govnavy-900 to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-900/30 border border-emerald-500/40 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="font-black text-2xl text-white tracking-tight font-display">
                  Bhoomi<span className="text-emerald-400">Setu</span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Citizen Registration & Digital Land Passport
                </div>
              </div>
            </Link>

            {/* Visual Card with Generated Government Artwork */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900/80 group">
              <div className="relative aspect-square sm:aspect-4/3 w-full overflow-hidden">
                <img
                  src="/images/gov_citizen_registration_hero.jpg"
                  alt="Government Digital Land Passport & Smart Title Card"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Floating Seal Ribbon on Image */}
                <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-2 shadow-lg">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    National ULPIN Land Passport
                  </span>
                </div>
              </div>

              {/* Text Highlights below image */}
              <div className="p-5 space-y-2 relative bg-slate-900/95 border-t border-slate-800">
                <h3 className="text-base font-bold text-white">
                  Instant Access to Certified Land Records & RoR 7/12
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Register to digitize paper sale deeds with AI OCR, file online mutation applications, and receive digitally signed certified copies of Record of Rights.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Bcrypt & JWT Auth
                  </span>
                  <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Real Prisma DB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="lg:col-span-6 w-full order-1 lg:order-2">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-2xl font-black text-white font-display">Create Official Account</h2>
                  <Badge variant="success" size="sm">
                    New Registration
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Fill in your details to create an official authenticated account on BhoomiSetu.
                </p>
              </div>

              {error && (
                <Alert variant="danger">
                  <span>{error}</span>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                {/* Role Selector Tabs */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Account Category / Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole(UserRole.CITIZEN)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        role === UserRole.CITIZEN
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Citizen / Landowner
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole(UserRole.REVENUE_OFFICER)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        role === UserRole.REVENUE_OFFICER
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Revenue Officer / Tehsildar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar Sharma"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Officer Jurisdiction Sub-Fields */}
                {role === UserRole.REVENUE_OFFICER && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/40 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                        District
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full py-1.5 px-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Jaipur">Jaipur</option>
                        <option value="Jodhpur">Jodhpur</option>
                        <option value="Ajmer">Ajmer</option>
                        <option value="Kota">Kota</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                        Tehsil
                      </label>
                      <select
                        value={tehsil}
                        onChange={(e) => setTehsil(e.target.value)}
                        className="w-full py-1.5 px-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Sanganer">Sanganer</option>
                        <option value="Amer">Amer</option>
                        <option value="Chaksu">Chaksu</option>
                        <option value="Bassi">Bassi</option>
                      </select>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 mt-2"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4 shrink-0" />}
                >
                  Complete Registration
                </Button>
              </form>

              <div className="pt-2 text-center text-xs text-slate-400">
                Already registered?{' '}
                <Link to="/login" className="text-emerald-400 font-bold hover:underline">
                  Sign in to existing account
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Footer Ribbon */}
      <div className="bg-slate-900 text-slate-500 text-center text-[11px] py-3 border-t border-slate-800">
        BhoomiSetu National Digital Land Registry • Government of India Land Records Modernization.
      </div>
    </div>
  );
};
