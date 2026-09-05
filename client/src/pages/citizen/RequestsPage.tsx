import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table, Column } from '../../components/common/Table';
import { StatusBadge } from '../../components/common/Badge';
import { WorkflowStage, WorkflowType } from '@land-digitization/shared';
import { Button } from '../../components/common/Button';
import { PlusCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ApplicationRow {
  id: string;
  applicationNo: string;
  requestType: WorkflowType;
  stage: WorkflowStage;
  targetKhasra: string;
  village: string;
  submittedOn: string;
}

export const RequestsPage: React.FC = () => {
  const requests: ApplicationRow[] = [
    {
      id: '1',
      applicationNo: 'MUT-2026-928104',
      requestType: WorkflowType.SALE_MUTATION,
      stage: WorkflowStage.DOCUMENT_VERIFICATION,
      targetKhasra: '102/4',
      village: 'Rampur, Sanganer',
      submittedOn: '2026-09-02',
    },
    {
      id: '2',
      applicationNo: 'DIG-2026-119283',
      requestType: WorkflowType.DIGITIZATION_NEW,
      stage: WorkflowStage.FINAL_APPROVAL,
      targetKhasra: '88/2',
      village: 'Rampur, Sanganer',
      submittedOn: '2026-08-15',
    },
  ];

  const columns: Column<ApplicationRow>[] = [
    {
      key: 'applicationNo',
      header: 'Application No',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-govblue-800 bg-govblue-50 px-2 py-0.5 rounded border border-govblue-200">
          {item.applicationNo}
        </span>
      ),
    },
    {
      key: 'requestType',
      header: 'Application Type',
      render: (item) => <span className="font-semibold text-slate-900">{item.requestType.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'targetKhasra',
      header: 'Target Parcel',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-800">Khasra {item.targetKhasra}</p>
          <p className="text-[11px] text-slate-500">{item.village}</p>
        </div>
      ),
    },
    {
      key: 'submittedOn',
      header: 'Submission Date',
      render: (item) => <span className="text-slate-600">{item.submittedOn}</span>,
    },
    {
      key: 'stage',
      header: 'Current Status',
      render: (item) => <StatusBadge status={item.stage} />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: () => (
        <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
          Track
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Pipeline & Tracking"
        description="Monitor state progression of mutation orders, partition filings, and deed digitization requests."
        breadcrumbs={[
          { label: 'Citizen Portal', href: '/citizen/dashboard' },
          { label: 'Applications' },
        ]}
        actions={
          <Link to="/citizen/digitize">
            <Button size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              New Application
            </Button>
          </Link>
        }
      />

      <Table
        columns={columns}
        data={requests}
        keyExtractor={(item) => item.id}
      />
    </div>
  );
};
