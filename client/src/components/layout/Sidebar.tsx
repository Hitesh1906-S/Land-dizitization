import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@land-digitization/shared';
import {
  LayoutDashboard,
  FileCheck,
  AlertTriangle,
  GitPullRequest,
  Users,
  ScrollText,
  FileUp,
  MapPin,
  FolderLock,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const citizenNav = [
    { name: 'My Dashboard', path: '/citizen/dashboard', icon: LayoutDashboard },
    { name: 'My Land Records', path: '/citizen/my-records', icon: FolderLock },
    { name: 'Digitize New Deed', path: '/citizen/digitize', icon: FileUp },
    { name: 'Track Applications', path: '/citizen/requests', icon: GitPullRequest },
  ];

  const officerNav = [
    { name: 'Officer Overview', path: '/officer/dashboard', icon: LayoutDashboard },
    { name: 'Verification Queue', path: '/officer/verification-queue', icon: FileCheck },
    { name: 'Rule Validation Hub', path: '/officer/validation', icon: ShieldCheck },
    { name: 'Conflict Resolver', path: '/officer/conflicts', icon: AlertTriangle },
    { name: 'Mutation Approvals', path: '/citizen/requests', icon: GitPullRequest },
  ];

  const adminNav = [
    { name: 'Admin Console', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Audit Trail Logs', path: '/admin/audit-logs', icon: ScrollText },
  ];

  const generalNav = [
    { name: 'AI OCR Scanner', path: '/ocr-scanner', icon: Sparkles },
    { name: 'Registry Search', path: '/records', icon: Search },
    { name: 'Cadastral GIS Map', path: '/map', icon: MapPin },
  ];

  let roleNav = citizenNav;
  if (user.role === UserRole.REVENUE_OFFICER) roleNav = officerNav;
  if (user.role === UserRole.ADMIN) roleNav = adminNav;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-6rem)] p-4 flex flex-col justify-between hidden md:flex flex-shrink-0">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {user.role.replace(/_/g, ' ')} PORTAL
            </span>
          </div>
          <nav className="space-y-1">
            {roleNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-govnavy-900 text-white shadow-gov-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PUBLIC REGISTRY
            </span>
          </div>
          <nav className="space-y-1">
            {generalNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-govnavy-900 text-white shadow-gov-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {user.jurisdictionDistrict && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-govblue-600" />
            <span>Assigned Jurisdiction</span>
          </div>
          <p className="text-[11px]">District: <span className="font-semibold text-slate-800">{user.jurisdictionDistrict}</span></p>
          {user.jurisdictionTehsil && (
            <p className="text-[11px]">Tehsil: <span className="font-semibold text-slate-800">{user.jurisdictionTehsil}</span></p>
          )}
        </div>
      )}
    </aside>
  );
};
