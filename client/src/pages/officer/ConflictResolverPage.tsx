import React from 'react';
import { AlertTriangle, MapPin, CheckCircle, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const ConflictResolverPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Spatial & Title Conflict Workbench</h1>
        <p className="text-sm text-slate-400 mt-1">
          Investigate boundary encroachments, duplicate survey numbers, and ownership disputes
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-red-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-xs text-red-400 font-semibold">CONFLICT-ID: OVL-2026-0041</span>
              <h3 className="text-base font-bold text-white">Spatial Boundary Encroachment (502 m²)</h3>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            Open Investigation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 font-semibold">PARCEL A</span>
            <p className="text-sm font-bold text-white mt-1">Khasra 102/4 • Rampur</p>
            <p className="text-slate-400 mt-0.5">Claimed Area: 4,050 sq.m</p>
            <p className="text-slate-400">Owner: Ram Kumar Sharma</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400 font-semibold">PARCEL B</span>
            <p className="text-sm font-bold text-white mt-1">Khasra 102/5 • Rampur</p>
            <p className="text-slate-400 mt-0.5">Claimed Area: 3,200 sq.m</p>
            <p className="text-slate-400">Owner: Suresh Verma</p>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button variant="outline" size="sm">
            View Overlap on Cadastral Map
          </Button>
          <Button variant="primary" size="sm">
            Mark Resolved (Field Survey Approved)
          </Button>
        </div>
      </div>
    </div>
  );
};
