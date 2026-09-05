import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { LeafletParcelMap } from '../../components/maps/LeafletParcelMap';
import { RecordStatus, GeoJSONFeatureCollection } from '@land-digitization/shared';
import {
  Layers,
  Eye,
  MapPin,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Maximize2,
  Share2,
  Copy,
  ChevronRight,
  ShieldCheck,
  Building,
  User,
  Square,
  Sliders,
  X,
  Compass,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/api';

export const CadastralMapPage: React.FC = () => {
  const { showToast } = useToast();
  const [geojsonData, setGeojsonData] = useState<GeoJSONFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [validationFilter, setValidationFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [villageFilter, setVillageFilter] = useState<string>('ALL');
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const fetchParcels = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (validationFilter !== 'ALL') params.validationStatus = validationFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (villageFilter !== 'ALL') params.village = villageFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get('/gis/parcels', { params });
      const data = res.data?.data;
      setGeojsonData(data);

      // If a feature was previously selected, keep it synced
      if (selectedFeature && data?.features) {
        const updated = data.features.find(
          (f: any) =>
            f.id === selectedFeature.parcelId ||
            f.properties?.parcelId === selectedFeature.parcelId ||
            f.properties?.recordId === selectedFeature.recordId
        );
        if (updated) {
          setSelectedFeature(updated.properties);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch cadastral parcels GeoJSON:', err);
      showToast('Could not load GIS cadastral parcels from server', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, [validationFilter, statusFilter, villageFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchParcels();
  };

  const handleSelectFeature = (feature: any) => {
    setSelectedFeature(feature.properties || feature);
    setMobileSheetOpen(true);
  };

  const handleCopyCoords = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopiedCoords(true);
    showToast('Centroid coordinates copied to clipboard', 'info');
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Distinct village list from loaded features
  const villages = Array.from(
    new Set(
      (geojsonData?.features || [])
        .map((f: any) => f.properties?.village)
        .filter(Boolean)
    )
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cadastral GIS Map & Parcel Inspector"
        description="Interactive geospatial cadastral mapping engine connecting GeoJSON boundary polygons to official LandRecords with validation status and title auditing."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Cadastral GIS' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchParcels}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh Map
            </Button>
          </div>
        }
      />

      {/* Control / Filter Bar */}
      <Card>
        <CardContent className="p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Khasra, ULPIN, Owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-20 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[11px] font-semibold bg-govnavy-900 text-white rounded hover:bg-govnavy-800"
            >
              Search
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Validation Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Validation:</span>
              <select
                value={validationFilter}
                onChange={(e) => setValidationFilter(e.target.value)}
                className="text-xs font-semibold border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-govblue-500"
              >
                <option value="ALL">All Validation States</option>
                <option value="PASSED">Passed (Clean)</option>
                <option value="WARNINGS">Has Warnings</option>
                <option value="FAILED">Failed / Issues</option>
                <option value="UNVALIDATED">Unvalidated</option>
              </select>
            </div>

            {/* Registry Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-medium border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-govblue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value={RecordStatus.VERIFIED}>Verified</option>
                <option value={RecordStatus.PENDING_VERIFICATION}>Pending Verification</option>
                <option value={RecordStatus.DISPUTED}>Disputed</option>
                <option value={RecordStatus.DRAFT}>Draft</option>
              </select>
            </div>

            {/* Village Selector */}
            {villages.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span>Village:</span>
                <select
                  value={villageFilter}
                  onChange={(e) => setVillageFilter(e.target.value)}
                  className="text-xs font-medium border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-govblue-500"
                >
                  <option value="ALL">All Villages</option>
                  {villages.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Map & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative">
        {/* Map Container (Desktop: col-span-8, Mobile: full) */}
        <div className="lg:col-span-8 h-[540px] sm:h-[620px] relative">
          <LeafletParcelMap
            geojsonData={geojsonData}
            selectedParcelId={selectedFeature?.parcelId || selectedFeature?.recordId}
            onParcelClick={handleSelectFeature}
            className="h-full w-full"
          />

          {/* Quick stats floating badge */}
          <div className="hidden sm:flex absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-sm items-center gap-3">
            <div className="flex items-center gap-1 text-slate-700 font-semibold">
              <Layers className="w-3.5 h-3.5 text-govblue-600" />
              <span>{geojsonData?.features?.length || 0} Registered Parcels</span>
            </div>
            {selectedFeature && (
              <span className="font-mono text-govblue-700 font-bold border-l pl-3 border-slate-300">
                Active: Khasra {selectedFeature.khasraNumber}
              </span>
            )}
          </div>
        </div>

        {/* Desktop: Right Inspector Side Panel (lg:col-span-4) */}
        <div className="hidden lg:block lg:col-span-4">
          <Card className="h-full flex flex-col justify-between border-slate-200 shadow-sm">
            <div className="p-5 space-y-4 overflow-y-auto max-h-[540px]">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-govnavy-50 text-govnavy-800 flex items-center justify-center font-bold">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Parcel Inspector</CardTitle>
                    <p className="text-[11px] text-slate-500">Cadastral boundary & legal title audit</p>
                  </div>
                </div>

                {selectedFeature && (
                  <Badge
                    variant={
                      selectedFeature.validationStatus === 'PASSED'
                        ? 'success'
                        : selectedFeature.validationStatus === 'FAILED'
                        ? 'danger'
                        : selectedFeature.validationStatus === 'WARNINGS'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                    withDot
                  >
                    {selectedFeature.validationStatus || 'ACTIVE'}
                  </Badge>
                )}
              </div>

              {selectedFeature ? (
                <div className="space-y-3.5 text-xs">
                  {/* ULPIN Box */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Unique Land Parcel Identification (ULPIN)
                    </span>
                    <p className="text-sm font-mono font-bold text-govblue-900">
                      {selectedFeature.ulpin || 'PENDING_GENERATION'}
                    </p>
                  </div>

                  {/* Khasra / Khatauni Grid */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Khasra / Survey No:</span>
                      <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                        {selectedFeature.khasraNumber}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Khatauni No:</span>
                      <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                        {selectedFeature.khatauniNumber || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Primary Owner & Co-owners */}
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-govblue-600" /> Primary Titleholder:
                      </span>
                      <StatusBadge status={selectedFeature.status} />
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{selectedFeature.primaryOwner}</p>

                    {selectedFeature.owners && selectedFeature.owners.length > 1 && (
                      <div className="pt-1.5 border-t border-slate-200 mt-1 space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          All Titleholders ({selectedFeature.owners.length}):
                        </span>
                        {selectedFeature.owners.map((o: any) => (
                          <div key={o.id} className="flex justify-between text-[11px] text-slate-700">
                            <span>• {o.fullName}</span>
                            <span className="font-mono font-semibold">{(o.shareFraction * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Location Details */}
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-govred-600" /> Cadastral Jurisdiction:
                    </span>
                    <p className="text-slate-800 font-medium">{selectedFeature.locationName}</p>
                    {selectedFeature.location?.subDivision && (
                      <span className="text-[11px] text-slate-500 block">
                        Sub-Division: {selectedFeature.location.subDivision}
                      </span>
                    )}
                  </div>

                  {/* Area Details */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Registered Area:</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {Number(selectedFeature.areaInSqMeters).toLocaleString()} m²
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Hectares:</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {(Number(selectedFeature.areaInSqMeters) / 10000).toFixed(4)} ha
                      </p>
                    </div>
                  </div>

                  {/* Centroid Coordinates */}
                  {selectedFeature.centroidLat && selectedFeature.centroidLng && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-semibold">Centroid (Lat, Lng):</span>
                        <span className="font-mono text-slate-800 font-bold">
                          {selectedFeature.centroidLat.toFixed(5)}, {selectedFeature.centroidLng.toFixed(5)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCoords(selectedFeature.centroidLat, selectedFeature.centroidLng)}
                        className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                        title="Copy coordinates"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Validation Score Gauge */}
                  {selectedFeature.validationScore !== null && (
                    <div className="p-3 bg-govnavy-50/70 border border-govnavy-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-govnavy-800">
                          Automated Validation Score
                        </span>
                        <p className="text-xs text-slate-600">
                          {selectedFeature.criticalIssuesCount > 0
                            ? `${selectedFeature.criticalIssuesCount} critical issue(s) detected`
                            : 'Deterministic compliance verified'}
                        </p>
                      </div>
                      <span
                        className={`text-base font-extrabold font-mono ${
                          selectedFeature.validationScore >= 80
                            ? 'text-govgreen-700'
                            : selectedFeature.validationScore >= 50
                            ? 'text-govamber-700'
                            : 'text-govred-700'
                        }`}
                      >
                        {selectedFeature.validationScore}/100
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-center text-slate-400 text-xs p-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-700">No Parcel Selected</h4>
                  <p className="text-slate-500 max-w-xs">
                    Click any parcel polygon boundary on the map or search above to inspect title records, area, and coordinates.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Action Footer */}
            {selectedFeature && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                <Link to={`/records/${selectedFeature.recordId}`} className="w-full block">
                  <Button variant="primary" size="sm" className="w-full" leftIcon={<Eye className="w-4 h-4" />}>
                    Open Land Record Dossier
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Mobile: Interactive Bottom Sheet / Card */}
        {selectedFeature && mobileSheetOpen && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[500] p-4 bg-white/95 backdrop-blur-md rounded-t-2xl border-t border-slate-300 shadow-2xl space-y-3 max-h-[60vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedFeature.status} />
                <span className="font-mono text-xs font-bold text-slate-900">
                  Khasra {selectedFeature.khasraNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="text-slate-700">
                <span className="text-slate-400">Titleholder:</span> <b>{selectedFeature.primaryOwner}</b>
              </p>
              <p className="text-slate-700">
                <span className="text-slate-400">Location:</span> {selectedFeature.locationName}
              </p>
              <p className="text-slate-700">
                <span className="text-slate-400">Area:</span> {Number(selectedFeature.areaInSqMeters).toLocaleString()} sq.m
              </p>
              <p className="text-slate-700 font-mono text-[11px]">
                <span className="text-slate-400">ULPIN:</span> {selectedFeature.ulpin || 'N/A'}
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Link to={`/records/${selectedFeature.recordId}`} className="flex-1">
                <Button variant="primary" size="sm" className="w-full" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                  Open Full Record
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
