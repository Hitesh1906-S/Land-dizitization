import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const MyRecordsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Registered Land Records</h1>
          <p className="text-sm text-slate-400 mt-1">Verified titles and digitized deeds under your ownership</p>
        </div>
        <Link to="/citizen/digitize">
          <Button size="sm">Digitize New Deed</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-emerald-400 font-semibold">
              ULPIN: RJ-JP-2024-8841
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified & Clear
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Khasra No: 102/4</h3>
            <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4 text-slate-500" />
              Rampur Village, Sanganer Tehsil, Jaipur District
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500">Khatauni Number:</span>
              <p className="font-semibold text-slate-200 mt-0.5">45-B</p>
            </div>
            <div>
              <span className="text-slate-500">Registered Area:</span>
              <p className="font-semibold text-slate-200 mt-0.5">4,050 sq.meters (1.0 Acre)</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">Ownership Share: 100%</span>
            <Link to="/map">
              <Button variant="outline" size="sm">
                View on Cadastral Map
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
