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
} from 'lucide-react';

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
    { name: 'Conflict Resolver', path: '/officer/conflicts', icon: AlertTriangle },
    { name: 'Mutation Approvals', path: '/citizen/requests', icon: GitPullRequest },
  ];

  const adminNav = [
    { name: 'Admin Console', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Audit Trail Logs', path: '/admin/audit-logs', icon: ScrollText },
  ];

  const generalNav = [
    { name: 'Registry Search', path: '/records', icon: Search },
    { name: 'Cadastral GIS Map', path: '/map', icon: MapPin },
  ];

  let roleNav = citizenNav;
  if (user.role === UserRole.REVENUE_OFFICER) roleNav = officerNav;
  if (user.role === UserRole.ADMIN) roleNav = adminNav;

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            {user.role.replace('_', ' ')} PORTAL
          </div>
          <nav className="space-y-1">
            {roleNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            EXPLORE
          </div>
          <nav className="space-y-1">
            {generalNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {user.jurisdictionDistrict && (
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-400">
          <p className="font-medium text-slate-300">Assigned Jurisdiction</p>
          <p className="mt-0.5">District: {user.jurisdictionDistrict}</p>
          {user.jurisdictionTehsil && <p>Tehsil: {user.jurisdictionTehsil}</p>}
        </div>
      )}
    </aside>
  );
};
