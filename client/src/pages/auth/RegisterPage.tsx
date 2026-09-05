import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Alert } from '../../components/common/Alert';
import { Card } from '../../components/common/Card';
import { Shield, Mail, Lock, User, Phone } from 'lucide-react';
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
      setError(err.response?.data?.error?.message || 'Failed to create account. Please verify input fields.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full mx-auto text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-md bg-govnavy-900 text-white flex items-center justify-center shadow-gov-sm">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-govnavy-900 tracking-tight">
            Bhoomi<span className="text-govblue-600">Setu</span>
          </span>
        </Link>
        <p className="text-xs text-slate-500 font-medium">Digital India Land Records Mission</p>
      </div>

      <div className="max-w-lg w-full mx-auto my-4">
        <Card className="p-6 sm:p-8 bg-white border-slate-300 shadow-gov-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Create Official Account</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your role and provide verified legal credentials.
            </p>
          </div>

          {error && (
            <div className="mb-5">
              <Alert variant="danger">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Account Type / Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: UserRole.CITIZEN, label: 'Citizen' },
                  { id: UserRole.REVENUE_OFFICER, label: 'Revenue Officer' },
                  { id: UserRole.ADMIN, label: 'Administrator' },
                ].map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`py-2 px-3 text-xs font-semibold rounded-md border text-center transition-colors ${
                      role === r.id
                        ? 'bg-govnavy-900 text-white border-govnavy-900 shadow-gov-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Full Legal Name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rajesh Kumar Sharma"
              leftIcon={<User className="w-4 h-4" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                label="Mobile Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>

            <Input
              label="Password"
              isPassword
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              helperText="Minimum 8 characters with letters and numbers."
            />

            {role === UserRole.REVENUE_OFFICER && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Jurisdictional Assignment
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Assigned District"
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    required
                  />
                  <Input
                    label="Assigned Tehsil"
                    type="text"
                    value={tehsil}
                    onChange={(e) => setTehsil(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full mt-2" isLoading={isLoading}>
              Register Account
            </Button>
          </form>
        </Card>

        <div className="mt-4 text-center text-xs text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="text-govblue-600 font-semibold hover:underline">
            Sign in to existing account
          </Link>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400">
        All registered accounts are subjected to jurisdiction audit checks.
      </div>
    </div>
  );
};
