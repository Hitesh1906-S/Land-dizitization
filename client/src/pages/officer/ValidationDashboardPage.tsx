import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/api';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  Eye,
  ShieldCheck,
  FileText,
  ArrowRight,
  Filter,
  Sparkles,
} from 'lucide-react';

export const ValidationDashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'WARNINGS' | 'PASSED'>('ALL');
  const [auditingRecordId, setAuditingRecordId] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/records', { params: { limit: 25 } });
      const recordList = res.data?.data?.records || [];

      // Fetch latest validation status for each
      const enriched = await Promise.all(
        recordList.map(async (r: any) => {
          try {
            const vRes = await apiClient.get(`/validation/record/${r.id}`);
            return { ...r, validationReport: vRes.data?.data };
          } catch {
            return { ...r, validationReport: null };
          }
        })
      );

      setRecords(enriched);
    } catch (err: any) {
      console.error('Failed to fetch records for validation hub:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleRunAudit = async (recordId: string) => {
    try {
      setAuditingRecordId(recordId);
      const res = await apiClient.post('/validation/run', { landRecordId: recordId });
      showToast('Validation audit completed for record!', 'success');

      // Update in local state
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, validationReport: res.data?.data } : r))
      );
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Audit execution failed', 'danger');
    } finally {
      setAuditingRecordId(null);
    }
  };

  // Metrics
  const totalCount = records.length;
  const passedCount = records.filter((r) => r.validationReport?.status === 'PASSED').length;
  const warningCount = records.filter((r) => r.validationReport?.status === 'WARNINGS').length;
  const criticalCount = records.filter((r) => r.validationReport?.status === 'FAILED').length;

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.khasraNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ulpin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location?.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.owners?.[0]?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'CRITICAL') return r.validationReport?.status === 'FAILED';
    if (statusFilter === 'WARNINGS') return r.validationReport?.status === 'WARNINGS';
    if (statusFilter === 'PASSED') return r.validationReport?.status === 'PASSED';
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue Validation & Rule Integrity Hub"
        description="Automated statutory revenue rule evaluation, mathematical share checks, area deviation audits, and cross-document integrity ledger."
        breadcrumbs={[
          { label: 'Revenue Officer', href: '/officer/dashboard' },
          { label: 'Validation Hub' },
        ]}
        badge={
          <Badge variant="navy" size="sm">
            Deterministic Engine
          </Badge>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 text-center">
          <div className="text-xs text-slate-500 font-semibold">Active Records Audited</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 text-center">
          <div className="text-xs text-slate-500 font-semibold">Certified Clean (100/100)</div>
          <div className="text-2xl font-black text-govgreen-700 mt-1">{passedCount}</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 text-center">
          <div className="text-xs text-slate-500 font-semibold">Minor Warnings</div>
          <div className="text-2xl font-black text-govamber-600 mt-1">{warningCount}</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 text-center">
          <div className="text-xs text-slate-500 font-semibold">Critical Defects</div>
          <div className="text-2xl font-black text-govred-700 mt-1">{criticalCount}</div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-slate-50 border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Khasra, Owner, Village, ULPIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-govblue-600"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('CRITICAL')}
              className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1 ${
                statusFilter === 'CRITICAL'
                  ? 'bg-govred-600 text-white'
                  : 'bg-white text-govred-700 border border-slate-300 hover:bg-govred-50'
              }`}
            >
              <XCircle className="w-3 h-3" />
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setStatusFilter('WARNINGS')}
              className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1 ${
                statusFilter === 'WARNINGS'
                  ? 'bg-govamber-600 text-white'
                  : 'bg-white text-govamber-700 border border-slate-300 hover:bg-govamber-50'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Warnings ({warningCount})
            </button>
            <button
              onClick={() => setStatusFilter('PASSED')}
              className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1 ${
                statusFilter === 'PASSED'
                  ? 'bg-govgreen-700 text-white'
                  : 'bg-white text-govgreen-800 border border-slate-300 hover:bg-govgreen-50'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Clean ({passedCount})
            </button>
          </div>
        </div>
      </Card>

      {/* Records Table */}
      <Card className="p-0 overflow-hidden bg-white border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold text-left">
                <th className="py-3 px-4">Khasra / Title</th>
                <th className="py-3 px-4">Village & Jurisdiction</th>
                <th className="py-3 px-4">Primary Titleholder</th>
                <th className="py-3 px-4">Validation Score</th>
                <th className="py-3 px-4">Engine Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-govblue-600" />
                    Loading cadastral records and validation indices...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No land records match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const report = r.validationReport;
                  const isBusy = auditingRecordId === r.id;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">Khasra #{r.khasraNumber}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{r.ulpin}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {r.location?.village || 'Rampur'}, {r.location?.tehsil || 'Sanganer'}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {r.location?.district || 'Jaipur'}, {r.location?.state || 'Rajasthan'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">
                          {r.owners?.[0]?.fullName || 'Unassigned'}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {r.owners?.length || 0} Co-Owner(s)
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {report ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-black text-sm ${
                                report.overallScore >= 85
                                  ? 'text-govgreen-700'
                                  : report.overallScore >= 70
                                  ? 'text-govamber-700'
                                  : 'text-govred-700'
                              }`}
                            >
                              {report.overallScore}/100
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Pending Audit</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {report ? (
                          <Badge
                            variant={
                              report.status === 'PASSED'
                                ? 'success'
                                : report.status === 'WARNINGS'
                                ? 'warning'
                                : 'danger'
                            }
                            size="sm"
                          >
                            {report.status}
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            UNAUDITED
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRunAudit(r.id)}
                            disabled={isBusy}
                            className="px-2.5 py-1 text-[11px] font-semibold text-govblue-700 hover:bg-govblue-50 border border-govblue-200 rounded flex items-center gap-1"
                          >
                            <Sparkles className={`w-3 h-3 ${isBusy ? 'animate-spin' : ''}`} />
                            {isBusy ? 'Auditing...' : 'Run Audit'}
                          </button>

                          <Link
                            to={`/records/${r.id}`}
                            className="p-1 text-slate-500 hover:text-govblue-700 hover:bg-slate-100 rounded"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
