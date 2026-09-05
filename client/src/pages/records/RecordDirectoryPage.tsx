import React, { useState } from 'react';
import { Search, Filter, MapPin, Eye, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { RecordStatus } from '@land-digitization/shared';

export const RecordDirectoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const sampleRecords = [
    {
      id: 'rec-1',
      ulpin: 'RJ-JP-2024-8841',
      khasraNumber: '102/4',
      khatauniNumber: '45-B',
      district: 'Jaipur',
      tehsil: 'Sanganer',
      village: 'Rampur',
      areaInSqMeters: 4050,
      status: RecordStatus.VERIFIED,
      primaryOwner: 'Ram Kumar Sharma',
    },
    {
      id: 'rec-2',
      ulpin: 'RJ-JP-2024-8842',
      khasraNumber: '102/5',
      khatauniNumber: '45-C',
      district: 'Jaipur',
      tehsil: 'Sanganer',
      village: 'Rampur',
      areaInSqMeters: 3200,
      status: RecordStatus.DISPUTED,
      primaryOwner: 'Suresh Verma',
    },
    {
      id: 'rec-3',
      ulpin: 'RJ-JP-2024-9120',
      khasraNumber: '103/1',
      khatauniNumber: '48-A',
      district: 'Jaipur',
      tehsil: 'Sanganer',
      village: 'Rampur',
      areaInSqMeters: 5500,
      status: RecordStatus.PENDING_VERIFICATION,
      primaryOwner: 'Anita Devi',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Public Land Registry Directory</h1>
        <p className="text-sm text-slate-400 mt-1">
          Search and verify computerized land records, ULPIN codes, and ownership titles
        </p>
      </div>

      {/* Search Filter Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Khasra No, ULPIN, or Owner Name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white">
            <option>District: Jaipur</option>
          </select>
          <select className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white">
            <option>Tehsil: Sanganer</option>
          </select>
        </div>
      </div>

      {/* Record Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleRecords.map((record) => (
          <div key={record.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 glass-panel-hover">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                {record.ulpin}
              </span>
              <StatusBadge status={record.status} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Khasra {record.khasraNumber}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {record.village}, {record.tehsil}, {record.district}
              </p>
            </div>

            <div className="py-2 border-y border-slate-800/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Primary Owner:</span>
                <span className="font-semibold text-slate-200">{record.primaryOwner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Area:</span>
                <span className="font-semibold text-slate-200">{record.areaInSqMeters} sq.m</span>
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <Link to={`/records/${record.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
