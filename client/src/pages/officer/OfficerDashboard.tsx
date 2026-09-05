import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { FileCheck, AlertTriangle, Layers, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue Officer Console</h1>
          <p className="text-sm text-slate-400 mt-1">
            Jurisdiction: <span className="text-emerald-400 font-semibold">{user?.jurisdictionDistrict || 'Jaipur'}</span> District (Tehsil: {user?.jurisdictionTehsil || 'Sanganer'})
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/officer/verification-queue">
            <Button size="md">
              <FileCheck className="w-4 h-4 mr-2" />
              Open Verification Queue
            </Button>
          </Link>
          <Link to="/officer/conflicts">
            <Button variant="secondary" size="md">
              <AlertTriangle className="w-4 h-4 mr-2 text-amber-400" />
              Resolve Conflicts
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Verifications" value="14" icon={Clock} color="amber" />
        <StatCard title="Flagged Overlaps" value="3" icon={AlertTriangle} color="red" />
        <StatCard title="Approved This Month" value="48" icon={FileCheck} color="emerald" change="+18%" changeType="positive" />
        <StatCard title="Jurisdiction Parcels" value="1,240" icon={Layers} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Urgent Documents in Queue</h2>
            <Link to="/officer/verification-queue" className="text-xs text-emerald-400 hover:underline flex items-center">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400">DOC-2026-09142</span>
                <p className="font-semibold text-white mt-0.5">Sale Deed Verification • Khasra 102/4</p>
                <p className="text-xs text-emerald-400">OCR AI Confidence: 94%</p>
              </div>
              <Link to="/officer/verification-queue">
                <Button variant="outline" size="sm">Review</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Spatial Overlap Flagged</h2>
            <Link to="/officer/conflicts" className="text-xs text-emerald-400 hover:underline flex items-center">
              Resolve <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-red-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Boundary Encroachment Detected
              </span>
              <span className="text-xs text-slate-400">Overlap: 12.4% (502 m²)</span>
            </div>
            <p className="text-sm font-medium text-slate-200">Khasra No 102/4 vs Khasra No 102/5</p>
            <p className="text-xs text-slate-400">Village: Rampur, Tehsil: Sanganer</p>
          </div>
        </div>
      </div>
    </div>
  );
};
