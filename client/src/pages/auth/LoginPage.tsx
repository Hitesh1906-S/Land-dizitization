import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Alert } from '../../components/common/Alert';
import { Card } from '../../components/common/Card';
import { Shield, Mail, Lock, ArrowRight, UserCheck } from 'lucide-react';
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
      setError(
        err.response?.data?.error?.message ||
          'Authentication failed. Please check your email and password.'
      );
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Brand Link */}
      <div className="max-w-md w-full mx-auto text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-md bg-govnavy-900 text-white flex items-center justify-center shadow-gov-sm">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-govnavy-900 tracking-tight">
            Bhoomi<span className="text-govblue-600">Setu</span>
          </span>
        </Link>
        <p className="text-xs text-slate-500 font-medium">Government of India Digital Land Registry Service</p>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-6">
        <Card className="p-6 sm:p-8 bg-white border-slate-300 shadow-gov-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-1">
              Access your digitized land records, mutation requests, or official verification workspace.
            </p>
          </div>

          {error && (
            <div className="mb-5">
              <Alert variant="danger">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              isPassword
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button type="submit" size="lg" className="w-full mt-2" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-govblue-600" />
              Quick Fill Seed Credentials:
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials('citizen')}
                className="px-2 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-center border border-slate-200 transition-colors"
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('officer')}
                className="px-2 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-center border border-slate-200 transition-colors"
              >
                Revenue Officer
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="px-2 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-center border border-slate-200 transition-colors"
              >
                Administrator
              </button>
            </div>
          </div>
        </Card>

        <div className="mt-4 text-center text-xs text-slate-600">
          Do not have an account?{' '}
          <Link to="/register" className="text-govblue-600 font-semibold hover:underline">
            Register new citizen account
          </Link>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400">
        Protected by SHA-256 digital document verification & national security audit protocols.
      </div>
    </div>
  );
};
