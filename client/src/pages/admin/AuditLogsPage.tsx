import React from 'react';
import { AuditAction, UserRole } from '@land-digitization/shared';

export const AuditLogsPage: React.FC = () => {
  const logs = [
    {
      id: 'LOG-1',
      actor: 'Officer Raman Sharma',
      role: UserRole.REVENUE_OFFICER,
      action: AuditAction.APPROVE_MUTATION,
      entityType: 'MutationRequest',
      entityId: 'MUT-2026-928104',
      ip: '192.168.1.45',
      time: '2026-09-05T06:12:00Z',
    },
    {
      id: 'LOG-2',
      actor: 'Citizen Rajesh Verma',
      role: UserRole.CITIZEN,
      action: AuditAction.CREATE,
      entityType: 'Document',
      entityId: 'DOC-8821',
      ip: '192.168.1.102',
      time: '2026-09-05T05:45:00Z',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Immutable Audit Trail Logs</h1>
        <p className="text-sm text-slate-400 mt-1">
          Cryptographically auditable transaction logs of all administrative and title mutations
        </p>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor & Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40">
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {new Date(log.time).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">{log.actor}</p>
                    <span className="text-[10px] text-emerald-400">{log.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {log.entityType}: {log.entityId}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
