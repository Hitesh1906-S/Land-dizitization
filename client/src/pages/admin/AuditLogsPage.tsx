import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table, Column } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { AuditAction, UserRole } from '@land-digitization/shared';
import { ScrollText, Shield } from 'lucide-react';

interface AuditRow {
  id: string;
  actor: string;
  role: UserRole;
  action: AuditAction;
  entityType: string;
  entityId: string;
  ip: string;
  time: string;
}

export const AuditLogsPage: React.FC = () => {
  const logs: AuditRow[] = [
    {
      id: 'LOG-1',
      actor: 'Raman Sharma (Tehsildar)',
      role: UserRole.REVENUE_OFFICER,
      action: AuditAction.APPROVE_MUTATION,
      entityType: 'MutationRequest',
      entityId: 'MUT-2026-928104',
      ip: '192.168.1.45',
      time: '2026-09-05 11:42:15',
    },
    {
      id: 'LOG-2',
      actor: 'Ram Kumar Sharma',
      role: UserRole.CITIZEN,
      action: AuditAction.CREATE,
      entityType: 'Document',
      entityId: 'DOC-8821',
      ip: '192.168.1.102',
      time: '2026-09-05 11:15:00',
    },
    {
      id: 'LOG-3',
      actor: 'Chief Land Administrator',
      role: UserRole.ADMIN,
      action: AuditAction.VERIFY,
      entityType: 'LandRecord',
      entityId: 'rec-1',
      ip: '10.0.0.1',
      time: '2026-09-05 09:30:00',
    },
  ];

  const columns: Column<AuditRow>[] = [
    {
      key: 'time',
      header: 'Timestamp',
      render: (item) => <span className="font-mono text-xs text-slate-600">{item.time}</span>,
    },
    {
      key: 'actor',
      header: 'Actor & Role',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.actor}</p>
          <span className="text-[10px] font-semibold text-govblue-700">{item.role}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action Taken',
      render: (item) => (
        <Badge variant="navy" size="sm">
          {item.action}
        </Badge>
      ),
    },
    {
      key: 'entity',
      header: 'Target Entity',
      render: (item) => (
        <span className="font-mono text-xs text-slate-800">
          {item.entityType}: <strong className="text-slate-900">{item.entityId}</strong>
        </span>
      ),
    },
    {
      key: 'ip',
      header: 'IP Address',
      render: (item) => <span className="font-mono text-xs text-slate-500">{item.ip}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Immutable Audit Trail Logs"
        description="Cryptographically recorded chronological transactions of all record creations, mutations, OCR extractions, and conflict resolutions."
        breadcrumbs={[
          { label: 'Admin Console', href: '/admin/dashboard' },
          { label: 'Audit Logs' },
        ]}
        badge={
          <Badge variant="success" size="sm">
            Audited & Tamper-Proof
          </Badge>
        }
      />

      <Table columns={columns} data={logs} keyExtractor={(item) => item.id} />
    </div>
  );
};
