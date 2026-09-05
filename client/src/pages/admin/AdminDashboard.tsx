import React from 'react';
import { StatCard } from '../../components/common/StatCard';
import { Users, Server, ShieldCheck, Activity, ScrollText, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">System Administrator Console</h1>
          <p className="text-sm text-slate-400 mt-1">
            Overall system health, user jurisdiction access, OCR engine throughput, and audit metrics
          </p>
        </div>
        <Link to="/admin/audit-logs">
          <Button size="md">
            <ScrollText className="w-4 h-4 mr-2" />
            Inspect Audit Logs
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Users" value="284" icon={Users} color="emerald" change="+12" changeType="positive" />
        <StatCard title="OCR Jobs Processed" value="1,842" icon={Cpu} color="blue" />
        <StatCard title="System Health" value="99.98%" icon={Activity} color="purple" />
        <StatCard title="Security Events" value="0 Flagged" icon={ShieldCheck} color="emerald" />
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white">Core Service Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-emerald-400 font-semibold">PostgreSQL & PostGIS Database</span>
            <p className="text-slate-300 mt-1">Status: Connected (Pool: 10/10)</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-emerald-400 font-semibold">Gemini 2.5 Flash Multimodal OCR</span>
            <p className="text-slate-300 mt-1">Status: Active & Ready</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-emerald-400 font-semibold">Tesseract Local Offline Fallback</span>
            <p className="text-slate-300 mt-1">Status: Installed (eng+hin)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
