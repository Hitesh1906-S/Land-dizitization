import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { StatusBadge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { LandRecordDTO, RecordStatus, LandType } from '@land-digitization/shared';
import apiClient from '../../services/api';
import {
  Search,
  MapPin,
  Eye,
  Filter,
  RotateCcw,
  ArrowUpDown,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Layers,
  AlertCircle,
  ShieldCheck,
  User,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
} from 'lucide-react';

export const RecordDirectoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter States initialized from URL search params
  const [stateFilter, setStateFilter] = useState(searchParams.get('state') || '');
  const [districtFilter, setDistrictFilter] = useState(searchParams.get('district') || '');
  const [tehsilFilter, setTehsilFilter] = useState(searchParams.get('tehsil') || '');
  const [villageFilter, setVillageFilter] = useState(searchParams.get('village') || '');
  const [ownerFilter, setOwnerFilter] = useState(searchParams.get('owner') || '');
  const [khasraFilter, setKhasraFilter] = useState(searchParams.get('khasraNumber') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [landTypeFilter, setLandTypeFilter] = useState(searchParams.get('landType') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('sortOrder') as any) || 'desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const limit = 9;

  // Data & Request State
  const [records, setRecords] = useState<LandRecordDTO[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Advanced Filters Toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params: Record<string, any> = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    if (stateFilter.trim()) params.state = stateFilter.trim();
    if (districtFilter.trim()) params.district = districtFilter.trim();
    if (tehsilFilter.trim()) params.tehsil = tehsilFilter.trim();
    if (villageFilter.trim()) params.village = villageFilter.trim();
    if (ownerFilter.trim()) params.owner = ownerFilter.trim();
    if (khasraFilter.trim()) params.khasraNumber = khasraFilter.trim();
    if (statusFilter) params.status = statusFilter;
    if (landTypeFilter) params.landType = landTypeFilter;

    // Synchronize to URL params
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) cleanParams[k] = String(v);
    });
    setSearchParams(cleanParams, { replace: true });

    try {
      const response = await apiClient.get('/records', { params });
      setRecords(response.data.data || []);
      setTotalRecords(response.data.pagination?.total || 0);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to load land records. Please ensure backend server is running.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    stateFilter,
    districtFilter,
    tehsilFilter,
    villageFilter,
    ownerFilter,
    khasraFilter,
    statusFilter,
    landTypeFilter,
    sortBy,
    sortOrder,
    page,
    limit,
    setSearchParams,
  ]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const handleResetFilters = () => {
    setStateFilter('');
    setDistrictFilter('');
    setTehsilFilter('');
    setVillageFilter('');
    setOwnerFilter('');
    setKhasraFilter('');
    setStatusFilter('');
    setLandTypeFilter('');
    setSortBy('updatedAt');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Official Land Records Registry"
        description="Search, filter, and inspect verified computerized land title records, cadastral survey boundaries, and registered deeds across jurisdictions."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Land Registry Search' }]}
        actions={
          <Link to="/map">
            <Button variant="secondary" size="sm" leftIcon={<MapPin className="w-4 h-4 text-govblue-600" />}>
              Open Cadastral GIS Map
            </Button>
          </Link>
        }
      />

      {/* Main Search & Filter Form */}
      <Card className="p-5 bg-white border-slate-300 shadow-gov-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
            {/* Khasra / Survey Number Input */}
            <div className="sm:col-span-4">
              <Input
                label="Khasra / Survey Number"
                isSearch
                placeholder="e.g. 102/4 or 105"
                value={khasraFilter}
                onChange={(e) => {
                  setKhasraFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Owner Name Input */}
            <div className="sm:col-span-4">
              <Input
                label="Owner / Title Holder Name"
                placeholder="e.g. Ram Kumar Sharma"
                value={ownerFilter}
                onChange={(e) => {
                  setOwnerFilter(e.target.value);
                  setPage(1);
                }}
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
              />
            </div>

            {/* Village Input */}
            <div className="sm:col-span-4">
              <Input
                label="Village / Mauza"
                placeholder="e.g. Rampur or Amer"
                value={villageFilter}
                onChange={(e) => {
                  setVillageFilter(e.target.value);
                  setPage(1);
                }}
                leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
              />
            </div>
          </div>

          {/* Advanced / Secondary Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end pt-2 border-t border-slate-100">
            <div className="sm:col-span-3">
              <Select
                label="District"
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Districts' },
                  { value: 'Jaipur', label: 'Jaipur' },
                  { value: 'Jodhpur', label: 'Jodhpur' },
                  { value: 'Ajmer', label: 'Ajmer' },
                  { value: 'Kota', label: 'Kota' },
                ]}
              />
            </div>

            <div className="sm:col-span-3">
              <Select
                label="Tehsil"
                value={tehsilFilter}
                onChange={(e) => {
                  setTehsilFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Tehsils' },
                  { value: 'Sanganer', label: 'Sanganer' },
                  { value: 'Amer', label: 'Amer' },
                  { value: 'Chaksu', label: 'Chaksu' },
                  { value: 'Bassi', label: 'Bassi' },
                ]}
              />
            </div>

            <div className="sm:col-span-3">
              <Select
                label="Record Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: RecordStatus.VERIFIED, label: 'Verified Title' },
                  { value: RecordStatus.PENDING_VERIFICATION, label: 'Pending Verification' },
                  { value: RecordStatus.DISPUTED, label: 'Disputed / In Conflict' },
                  { value: RecordStatus.ARCHIVED, label: 'Archived' },
                ]}
              />
            </div>

            <div className="sm:col-span-3">
              <Select
                label="Sort Order"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as any);
                  setPage(1);
                }}
                options={[
                  { value: 'updatedAt-desc', label: 'Recently Updated' },
                  { value: 'createdAt-desc', label: 'Recently Digitized' },
                  { value: 'areaInSqMeters-desc', label: 'Area: Largest First' },
                  { value: 'areaInSqMeters-asc', label: 'Area: Smallest First' },
                  { value: 'khasraNumber-asc', label: 'Khasra Number (A-Z)' },
                ]}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500 font-medium">
              {isLoading ? (
                <span>Searching database records...</span>
              ) : (
                <span>
                  Found <strong className="text-slate-900 font-semibold">{totalRecords}</strong> matching land records
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Search className="w-4 h-4" />}>
                Apply Search
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Interactive Quick Filter Tags & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Quick Filter:
          </span>
          <button
            type="button"
            onClick={() => {
              handleResetFilters();
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              !statusFilter && !landTypeFilter && !districtFilter
                ? 'bg-govnavy-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Records
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter(RecordStatus.VERIFIED);
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              statusFilter === RecordStatus.VERIFIED
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            ✓ Verified Titles (सत्यापित)
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter(RecordStatus.PENDING_VERIFICATION);
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              statusFilter === RecordStatus.PENDING_VERIFICATION
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            ⏳ Pending Verification
          </button>
          <button
            type="button"
            onClick={() => {
              setLandTypeFilter(LandType.AGRICULTURAL);
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              landTypeFilter === LandType.AGRICULTURAL
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            🌾 Agricultural
          </button>
          <button
            type="button"
            onClick={() => {
              setDistrictFilter('Jaipur');
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              districtFilter === 'Jaipur'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            📍 Jaipur District
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
              viewMode === 'grid' ? 'bg-white text-govnavy-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Grid Cards View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden md:inline">Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
              viewMode === 'table' ? 'bg-white text-govnavy-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Table Rows View"
          >
            <TableIcon className="w-4 h-4" />
            <span className="hidden md:inline">Table</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger">
          <div className="flex items-center justify-between w-full">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={fetchRecords}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="p-5 bg-white rounded-lg border border-slate-200 animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 rounded w-28" />
                <div className="h-5 bg-slate-200 rounded w-16" />
              </div>
              <div className="h-5 bg-slate-200 rounded w-48" />
              <div className="h-20 bg-slate-100 rounded" />
              <div className="flex justify-end">
                <div className="h-8 bg-slate-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && records.length === 0 && (
        <Card className="p-12 text-center bg-white border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Matching Land Records Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No land record matched the applied filter criteria. Try adjusting the Khasra number, owner name, or clearing jurisdiction filters.
          </p>
          <div className="pt-2">
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Table View Mode */}
      {!isLoading && records.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">ULPIN / Khasra</th>
                <th className="py-3 px-4">Primary Title Holder</th>
                <th className="py-3 px-4">Jurisdiction (Village / Tehsil)</th>
                <th className="py-3 px-4">Area (m²)</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => {
                const primaryOwner =
                  record.owners?.find((o) => o.isPrimary)?.fullName ||
                  record.owners?.[0]?.fullName ||
                  'Unspecified';

                return (
                  <tr key={record.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-govnavy-900">
                      <div>Khasra {record.khasraNumber}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{record.ulpin}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {primaryOwner}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {record.location?.village}, {record.location?.tehsil}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {record.areaInSqMeters.toLocaleString('en-IN')} m²
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase">
                        {record.landType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link to={`/records/${record.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Inspect
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Records Grid View Mode */}
      {!isLoading && records.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {records.map((record) => {
            const primaryOwner =
              record.owners?.find((o) => o.isPrimary)?.fullName ||
              record.owners?.[0]?.fullName ||
              'Title Holder Unspecified';

            return (
              <Card
                key={record.id}
                className="p-5 bg-white border-slate-300 shadow-gov-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-govnavy-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      {record.ulpin}
                    </span>
                    <StatusBadge status={record.status} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Khasra No. {record.khasraNumber}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        {record.location?.village}, {record.location?.tehsil}, {record.location?.district}
                      </span>
                    </p>
                  </div>

                  {/* Property Attributes Matrix */}
                  <div className="py-2.5 bg-slate-50 rounded-md p-3 text-xs space-y-1.5 border border-slate-200/80">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Primary Owner:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[170px]" title={primaryOwner}>
                        {primaryOwner}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Khatauni Number:</span>
                      <span className="font-semibold text-slate-800">{record.khatauniNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Registered Area:</span>
                      <span className="font-semibold text-slate-800">
                        {record.areaInSqMeters.toLocaleString('en-IN')} sq.m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Land Category:</span>
                      <span className="font-medium text-govnavy-800 uppercase text-[11px]">
                        {record.landType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Updated: {new Date(record.updatedAt).toLocaleDateString('en-IN')}
                  </span>
                  <Link to={`/records/${record.id}`}>
                    <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5 text-govblue-600" />}>
                      View Dossier
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border border-slate-300 rounded-lg shadow-gov-sm">
          <div className="text-xs text-slate-600 font-medium">
            Showing <span className="font-bold text-slate-900">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-bold text-slate-900">{Math.min(page * limit, totalRecords)}</span> of{' '}
            <span className="font-bold text-slate-900">{totalRecords}</span> records
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsisBefore && <span className="px-1 text-slate-400">...</span>}
                      <button
                        type="button"
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded text-xs font-semibold transition-colors ${
                          page === p
                            ? 'bg-govnavy-900 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
