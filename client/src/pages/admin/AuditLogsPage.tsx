import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Dialog } from '../../components/common/Dialog';
import { Pagination } from '../../components/common/Pagination';
import { adminService, AdminAuditLogItem } from '../../services/adminService';
import { ScrollText, Shield, Search, RefreshCw, Eye, Filter } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Log for JSON payload inspection
  const [inspectingLog, setInspectingLog] = useState<AdminAuditLogItem | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminService.getAuditLogs({
        search: searchQuery || undefined,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        page,
        limit: 20,
      });
      setLogs(res.logs);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, actionFilter, entityFilter, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Immutable Audit Trail Logs"
        description="Cryptographically recorded chronological transactions of all record creations, mutations, OCR extractions, and conflict resolutions across the BhoomiSetu national registry."
        breadcrumbs={[
          { label: 'Admin Console', href: '/admin/dashboard' },
          { label: 'Audit Logs' },
        ]}
        badge={
          <Badge variant="success" size="sm">
            Audited & Tamper-Proof
          </Badge>
        }
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => loadLogs()}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh Logs
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-gov-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by actor name, email, entity ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-govnavy-900"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-govnavy-900"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="VERIFY">VERIFY</option>
            <option value="APPROVE_MUTATION">APPROVE_MUTATION</option>
            <option value="REJECT_MUTATION">REJECT_MUTATION</option>
            <option value="RESOLVE_CONFLICT">RESOLVE_CONFLICT</option>
            <option value="RUN_OCR">RUN_OCR</option>
          </select>

          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-govnavy-900"
          >
            <option value="">All Entities</option>
            <option value="LandRecord">LandRecord</option>
            <option value="Document">Document</option>
            <option value="User">User</option>
            <option value="ValidationIssue">ValidationIssue</option>
            <option value="DuplicateCandidate">DuplicateCandidate</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
          {totalCount} Total Ledger Entries
        </span>
      </div>

      {/* Table / List */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-500 bg-white rounded-lg border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-govnavy-900 mb-2" />
          <p className="text-sm font-medium">Querying immutable audit records from PostgreSQL...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
          <ScrollText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-semibold text-slate-700">No Audit Logs Found</p>
          <p className="text-xs text-slate-500 mt-1">Try clearing your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-gov-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor & Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{log.actor.fullName}</p>
                      <span className="text-[10px] text-govblue-700 font-semibold">{log.actor.roleName}</span>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          log.action.includes('VERIFY') || log.action.includes('APPROVE')
                            ? 'success'
                            : log.action.includes('REJECT')
                            ? 'danger'
                            : log.action.includes('RESOLVE')
                            ? 'navy'
                            : 'info'
                        }
                        size="sm"
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-800">{log.entityType}</span>
                      <span className="font-mono text-slate-500 text-[11px] block">#{log.entityId}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-500">{log.ipAddress}</td>
                    <td className="p-3 text-right">
                      {log.snapshotDiff ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setInspectingLog(log)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Diff Payload
                        </Button>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No Diff</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Snapshot Diff Modal */}
      {inspectingLog && (
        <Dialog
          isOpen={true}
          onClose={() => setInspectingLog(null)}
          title={`Audit Event Payload • ${inspectingLog.action}`}
          description={`Logged for ${inspectingLog.entityType} #${inspectingLog.entityId}`}
          size="md"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setInspectingLog(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono overflow-x-auto">
              <pre className="text-[11px] whitespace-pre-wrap break-all">
                {JSON.stringify(inspectingLog.snapshotDiff, null, 2)}
              </pre>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
