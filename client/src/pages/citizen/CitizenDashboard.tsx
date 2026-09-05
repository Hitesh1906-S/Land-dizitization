import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Shield, FileCheck, GitPullRequest, MapPin, ArrowUpRight, PlusCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome, {user?.fullName}</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your registered land parcels, track mutation workflows, and digitize legacy deeds.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/citizen/digitize">
            <Button size="md">
              <PlusCircle className="w-4 h-4 mr-2" />
              Digitize Deed
            </Button>
          </Link>
          <Link to="/records">
            <Button variant="secondary" size="md">
              <Search className="w-4 h-4 mr-2" />
              Search Registry
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Owned Parcels" value="2" icon={Shield} color="emerald" change="+1" changeType="positive" />
        <StatCard title="Total Land Area" value="3.4 Hectares" icon={MapPin} color="blue" />
        <StatCard title="Active Requests" value="1" icon={GitPullRequest} color="amber" />
        <StatCard title="Digitized Records" value="100%" icon={FileCheck} color="purple" />
      </div>

      {/* Quick Action Links & Active Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent Land Parcels</h2>
            <Link to="/citizen/my-records" className="text-xs text-emerald-400 hover:underline flex items-center">
              View All <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-400 font-semibold">ULPIN: RJ-JP-2024-8841</span>
                <p className="font-semibold text-white mt-0.5">Khasra No: 102/4 • Rampur Village</p>
                <p className="text-xs text-slate-400">Area: 4,050 sq.m (Agricultural)</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Verified
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Application Pipeline</h2>
            <Link to="/citizen/requests" className="text-xs text-emerald-400 hover:underline flex items-center">
              View All <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">MUT-2026-928104</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Document Verification
              </span>
            </div>
            <p className="text-sm font-medium text-slate-200">Sale Mutation Transfer for Khasra 102/4</p>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-amber-400 h-1.5 rounded-full w-2/5"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
