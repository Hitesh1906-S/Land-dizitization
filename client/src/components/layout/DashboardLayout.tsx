import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from './MobileDrawer';
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

export const DashboardLayout: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { user } = useAuth();

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

  let activeRoleNav = citizenNav;
  if (user?.role === UserRole.REVENUE_OFFICER) activeRoleNav = officerNav;
  if (user?.role === UserRole.ADMIN) activeRoleNav = adminNav;

  const drawerGroups = [
    {
      section: user ? `${user.role.replace(/_/g, ' ')} PORTAL` : 'SERVICES',
      items: activeRoleNav,
    },
    {
      section: 'PUBLIC REGISTRY',
      items: generalNav,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden">
      <Navbar onToggleMobileDrawer={() => setMobileDrawerOpen(true)} />

      {/* Mobile Slide-over Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        navigationItems={drawerGroups}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-full overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
