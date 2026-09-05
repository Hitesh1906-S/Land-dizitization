import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { StatusBadge } from '../../components/common/Badge';
import { RecordStatus } from '@land-digitization/shared';
import { Search, MapPin, Eye, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      <PageHeader
        title="Public Land Records Directory"
        description="Search and verify official computerized land records, cadastral survey numbers, and ownership titles across jurisdictions."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Land Registry' }]}
        actions={
          <Link to="/map">
            <Button variant="secondary" size="sm" leftIcon={<MapPin className="w-4 h-4 text-govblue-600" />}>
              Open Cadastral GIS
            </Button>
          </Link>
        }
      />

      {/* Search Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-6">
            <Input
              isSearch
              placeholder="Search by Khasra No, ULPIN, or Owner Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sm:col-span-3">
            <Select
              options={[
                { value: 'Jaipur', label: 'District: Jaipur' },
                { value: 'Jodhpur', label: 'District: Jodhpur' },
              ]}
            />
          </div>
          <div className="sm:col-span-3">
            <Select
              options={[
                { value: 'Sanganer', label: 'Tehsil: Sanganer' },
                { value: 'Amer', label: 'Tehsil: Amer' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Record Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleRecords.map((record) => (
          <Card key={record.id} className="p-5 space-y-3.5 gov-card-interactive">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-govblue-800 bg-govblue-50 px-2 py-0.5 rounded border border-govblue-200">
                {record.ulpin}
              </span>
              <StatusBadge status={record.status} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Khasra No: {record.khasraNumber}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {record.village}, {record.tehsil}, {record.district}
              </p>
            </div>

            <div className="py-2.5 bg-slate-50 rounded p-3 text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Primary Owner:</span>
                <span className="font-semibold text-slate-900">{record.primaryOwner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khatauni No:</span>
                <span className="font-semibold text-slate-900">{record.khatauniNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Area:</span>
                <span className="font-semibold text-slate-900">{record.areaInSqMeters} sq.m</span>
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <Link to={`/records/${record.id}`}>
                <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                  View Details
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
