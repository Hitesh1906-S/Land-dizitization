import React from 'react';
import { StatusBadge } from '../../components/common/Badge';
import { WorkflowStage, WorkflowType } from '@land-digitization/shared';
import { GitPullRequest, Calendar, FileText } from 'lucide-react';

export const RequestsPage: React.FC = () => {
  const requests = [
    {
      id: '1',
      applicationNo: 'MUT-2026-928104',
      requestType: WorkflowType.SALE_MUTATION,
      stage: WorkflowStage.DOCUMENT_VERIFICATION,
      createdAt: '2026-09-02T10:30:00Z',
      khasraNumber: '102/4',
    },
    {
      id: '2',
      applicationNo: 'DIG-2026-119283',
      requestType: WorkflowType.DIGITIZATION_NEW,
      stage: WorkflowStage.FINAL_APPROVAL,
      createdAt: '2026-08-15T09:12:00Z',
      khasraNumber: '88/2',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Application Pipeline & Tracking</h1>
        <p className="text-sm text-slate-400 mt-1">Track real-time status of your mutation and digitization filings</p>
      </div>

      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                  <GitPullRequest className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono text-xs font-semibold text-emerald-400">{req.applicationNo}</span>
                  <h3 className="text-base font-bold text-white">{req.requestType.replace('_', ' ')}</h3>
                </div>
              </div>
              <StatusBadge status={req.stage} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500">Target Parcel:</span>
                <p className="font-medium text-slate-200 mt-0.5">Khasra No {req.khasraNumber}</p>
              </div>
              <div>
                <span className="text-slate-500">Submitted On:</span>
                <p className="font-medium text-slate-200 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(req.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
