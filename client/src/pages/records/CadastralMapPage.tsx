import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { StatusBadge } from '../../components/common/Badge';
import { LeafletParcelMap } from '../../components/maps/LeafletParcelMap';
import { RecordStatus } from '@land-digitization/shared';
import { Layers, Eye, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CadastralMapPage: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  const villageGeoJSON: any = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          recordId: 'rec-1',
          ulpin: 'RJ-JP-2024-8841',
          khasraNumber: '102/4',
          khatauniNumber: '45-B',
          district: 'Jaipur',
          village: 'Rampur',
          areaInSqMeters: 4050,
          status: RecordStatus.VERIFIED,
          primaryOwner: 'Ram Kumar Sharma',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [75.783, 26.911],
              [75.787, 26.911],
              [75.787, 26.915],
              [75.783, 26.915],
              [75.783, 26.911],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        properties: {
          recordId: 'rec-2',
          ulpin: 'RJ-JP-2024-8842',
          khasraNumber: '102/5',
          khatauniNumber: '45-C',
          district: 'Jaipur',
          village: 'Rampur',
          areaInSqMeters: 3200,
          status: RecordStatus.DISPUTED,
          primaryOwner: 'Suresh Verma',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [75.7865, 26.913],
              [75.791, 26.913],
              [75.791, 26.917],
              [75.7865, 26.917],
              [75.7865, 26.913],
            ],
          ],
        },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadastral GIS Map Viewer"
        description="Interactive cadastral map with geo-referenced parcel boundary polygons, spatial dispute overlays, and real-time inspector."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Cadastral GIS' }]}
        actions={
          <div className="w-64">
            <Select
              options={[
                { value: 'Rampur', label: 'Village: Rampur (Sanganer)' },
                { value: 'Amer', label: 'Village: Amer Rural' },
              ]}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Map Container */}
        <div className="lg:col-span-8 h-[560px] sm:h-[600px]">
          <LeafletParcelMap
            geojsonData={villageGeoJSON}
            center={[26.914, 75.787]}
            zoom={15}
            onParcelClick={(f) => setSelectedFeature(f.properties)}
            className="h-full w-full"
          />
        </div>

        {/* Right: Selected Parcel Inspector Box */}
        <div className="lg:col-span-4">
          <Card className="p-6 space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-govblue-700" />
                  <CardTitle>Parcel Inspector</CardTitle>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Click any polygon to view title records</p>
              </div>

              {selectedFeature ? (
                <div className="space-y-3.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ULPIN Code</span>
                    <p className="text-sm font-mono font-bold text-govblue-800 mt-0.5">
                      {selectedFeature.ulpin}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-500">Khasra:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedFeature.khasraNumber}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Khatauni:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{selectedFeature.khatauniNumber}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500">Primary Title Holder:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedFeature.primaryOwner}</p>
                  </div>

                  <div>
                    <span className="text-slate-500">Registered Area:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedFeature.areaInSqMeters} sq.m</p>
                  </div>

                  <div className="pt-1">
                    <span className="text-slate-500 block mb-1">Status:</span>
                    <StatusBadge status={selectedFeature.status} />
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 text-xs p-4">
                  <Layers className="w-10 h-10 mb-2 text-slate-300" />
                  <p className="text-slate-500">Click any parcel boundary on the map to inspect ownership titles and coordinates.</p>
                </div>
              )}
            </div>

            {selectedFeature && (
              <div className="pt-4 border-t border-slate-100">
                <Link to={`/records/${selectedFeature.recordId}`}>
                  <Button variant="primary" size="sm" className="w-full" leftIcon={<Eye className="w-4 h-4" />}>
                    Open Land Record
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
