import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Dialog } from '../../components/common/Dialog';
import {
  Users,
  ShieldCheck,
  Activity,
  ScrollText,
  FileText,
  Layers,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  UserPlus,
  Edit,
  Power,
  CheckCircle2,
  AlertCircle,
  Key,
  Shield,
  UserCheck,
  Eye,
  Filter,
  ArrowRight,
  Database,
} from 'lucide-react';
import {
  adminService,
  AdminUserItem,
  AdminRoleItem,
  AdminRecordItem,
  AdminRequestItem,
  AdminValidationIssueItem,
  AdminAuditLogItem,
} from '../../services/adminService';
import {
  AdminDashboardStatsDTO,
  ValidationMetricsDTO,
  UserRole,
  RecordStatus,
  RequestStage,
  AuditAction,
} from '@land-digitization/shared';

type AdminTab = 'users' | 'roles' | 'records' | 'requests' | 'validation' | 'audit';

export const AdminDashboard: React.FC = () => {
  // Stats
  const [stats, setStats] = useState<AdminDashboardStatsDTO>({
    totalUsers: 0,
    activeUsers: 0,
    totalOfficers: 0,
    totalCitizens: 0,
    totalAdmins: 0,
    totalRecords: 0,
    totalRequests: 0,
    pendingRequests: 0,
    unresolvedIssues: 0,
    totalAuditLogs: 0,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Tab Data States
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [rolesList, setRolesList] = useState<AdminRoleItem[]>([]);
  const [recordsList, setRecordsList] = useState<AdminRecordItem[]>([]);
  const [requestsList, setRequestsList] = useState<AdminRequestItem[]>([]);
  const [validationMetrics, setValidationMetrics] = useState<ValidationMetricsDTO | null>(null);
  const [validationIssuesList, setValidationIssuesList] = useState<AdminValidationIssueItem[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<AdminAuditLogItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Modals State
  // 1. Create User Modal
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.REVENUE_OFFICER);
  const [newUserDistrict, setNewUserDistrict] = useState('Jaipur');
  const [newUserTehsil, setNewUserTehsil] = useState('Sanganer');

  // 2. Edit User Modal
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>(UserRole.REVENUE_OFFICER);
  const [editUserDistrict, setEditUserDistrict] = useState('');
  const [editUserTehsil, setEditUserTehsil] = useState('');

  // 3. Edit Role Permissions Modal
  const [editingRole, setEditingRole] = useState<AdminRoleItem | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roleDescription, setRoleDescription] = useState('');

  // 4. Override Record Status Modal
  const [statusOverrideRecord, setStatusOverrideRecord] = useState<AdminRecordItem | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<RecordStatus>(RecordStatus.VERIFIED);
  const [overrideRemarks, setOverrideRemarks] = useState('');

  // 5. Assign Officer Modal
  const [assigningRequest, setAssigningRequest] = useState<AdminRequestItem | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [availableOfficers, setAvailableOfficers] = useState<AdminUserItem[]>([]);

  // 6. Audit Diff Viewer Modal
  const [viewingAuditLog, setViewingAuditLog] = useState<AdminAuditLogItem | null>(null);

  const [isActionProcessing, setIsActionProcessing] = useState(false);

  // Load Dashboard Stats
  const loadStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const data = await adminService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Load Active Tab Data
  const loadTabData = useCallback(async () => {
    try {
      setIsDataLoading(true);
      if (activeTab === 'users') {
        const res = await adminService.getUsers({
          role: roleFilter || undefined,
          search: searchQuery || undefined,
          page: currentPage,
          limit: 15,
        });
        setUsersList(res.users);
        setTotalPages(res.pagination?.totalPages || 1);
      } else if (activeTab === 'roles') {
        const roles = await adminService.getRoles();
        setRolesList(roles);
      } else if (activeTab === 'records') {
        const res = await adminService.getRecords({
          status: statusFilter || undefined,
          search: searchQuery || undefined,
          page: currentPage,
          limit: 15,
        });
        setRecordsList(res.records);
        setTotalPages(res.pagination?.totalPages || 1);
      } else if (activeTab === 'requests') {
        const res = await adminService.getRequests({
          stage: statusFilter || undefined,
          search: searchQuery || undefined,
          page: currentPage,
          limit: 15,
        });
        setRequestsList(res.requests);
        setTotalPages(res.pagination?.totalPages || 1);
      } else if (activeTab === 'validation') {
        const [metrics, issuesRes] = await Promise.all([
          adminService.getValidationMetrics(),
          adminService.getValidationIssues({ page: currentPage, limit: 15 }),
        ]);
        setValidationMetrics(metrics);
        setValidationIssuesList(issuesRes.issues);
        setTotalPages(issuesRes.pagination?.totalPages || 1);
      } else if (activeTab === 'audit') {
        const res = await adminService.getAuditLogs({
          search: searchQuery || undefined,
          page: currentPage,
          limit: 20,
        });
        setAuditLogsList(res.logs);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      console.error(`Failed to load admin tab data (${activeTab}):`, err);
    } finally {
      setIsDataLoading(false);
    }
  }, [activeTab, searchQuery, roleFilter, statusFilter, currentPage]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  const refreshAll = () => {
    loadStats();
    loadTabData();
    showNotification('info', 'Administrator console data refreshed.');
  };

  // User Actions
  const handleCreateUser = async () => {
    if (!newUserEmail.trim() || !newUserPassword || !newUserName.trim()) {
      showNotification('error', 'Email, password, and full name are required');
      return;
    }
    try {
      setIsActionProcessing(true);
      await adminService.createUser({
        email: newUserEmail.trim(),
        password: newUserPassword,
        fullName: newUserName.trim(),
        phone: newUserPhone.trim() || undefined,
        role: newUserRole,
        jurisdictionDistrict: newUserDistrict.trim() || undefined,
        jurisdictionTehsil: newUserTehsil.trim() || undefined,
      });
      showNotification('success', `User ${newUserEmail} created successfully.`);
      setIsCreateUserOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setNewUserPhone('');
      loadStats();
      loadTabData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to create user');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      setIsActionProcessing(true);
      await adminService.updateUser(editingUser.id, {
        fullName: editUserName.trim(),
        phone: editUserPhone.trim(),
        role: editUserRole,
        jurisdictionDistrict: editUserDistrict.trim(),
        jurisdictionTehsil: editUserTehsil.trim(),
      });
      showNotification('success', `User ${editingUser.email} updated.`);
      setEditingUser(null);
      loadTabData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to update user');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleToggleUserStatus = async (user: AdminUserItem) => {
    try {
      setIsActionProcessing(true);
      await adminService.toggleUserStatus(user.id);
      showNotification(
        'info',
        `User ${user.email} ${user.isActive ? 'suspended' : 'activated'}.`
      );
      loadStats();
      loadTabData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to toggle status');
    } finally {
      setIsActionProcessing(false);
    }
  };

  // Role Permissions Actions
  const handleSaveRolePermissions = async () => {
    if (!editingRole) return;
    try {
      setIsActionProcessing(true);
      await adminService.updateRolePermissions(
        editingRole.id,
        selectedPermissions,
        roleDescription
      );
      showNotification('success', `Permissions updated for role ${editingRole.name}.`);
      setEditingRole(null);
      loadTabData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to update role');
    } finally {
      setIsActionProcessing(false);
    }
  };

  // Record Status Override
  const handleConfirmStatusOverride = async () => {
    if (!statusOverrideRecord) return;
    try {
      setIsActionProcessing(true);
      await adminService.updateRecordStatus(
        statusOverrideRecord.id,
        overrideStatus,
        overrideRemarks
      );
      showNotification(
        'success',
        `Status of Khasra #${statusOverrideRecord.khasraNumber} updated to ${overrideStatus}.`
      );
      setStatusOverrideRecord(null);
      setOverrideRemarks('');
      loadStats();
      loadTabData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to override status');
    } finally {
      setIsActionProcessing(false);
    }
  };

  // Request Officer Assignment
  const handleOpenAssignModal = async (reqItem: AdminRequestItem) => {
    setAssigningRequest(reqItem);
    try {
      const res = await adminService.getUsers({ role: UserRole.REVENUE_OFFICER, limit: 100 });
      setAvailableOfficers(res.users);
      if (reqItem.assignedOfficer?.id) {
        setSelectedOfficerId(reqItem.assignedOfficer.id);
      } else if (res.users.length > 0) {
        setSelectedOfficerId(res.users[0].id);
      }
    } catch {
      // Ignore
    }
  };

  const handleConfirmAssignOfficer = async () => {
    if (!assigningRequest || !selectedOfficerId) return;
    try {
      setIsActionProcessing(true);
      await adminService.assignOfficer(assigningRequest.id, selectedOfficerId);
      showNotification('success', 'Officer successfully assigned to mutation request.');
      setAssigningRequest(null);
      loadTabData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to assign officer');
    } finally {
      setIsActionProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg shadow-gov-lg border flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            notification.type === 'success'
              ? 'bg-govgreen-50 border-govgreen-200 text-govgreen-900'
              : notification.type === 'error'
              ? 'bg-govred-50 border-govred-200 text-govred-900'
              : 'bg-govblue-50 border-govblue-200 text-govblue-900'
          }`}
        >
          {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-govgreen-600 shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-govred-600 shrink-0" />}
          {notification.type === 'info' && <Activity className="w-5 h-5 text-govblue-600 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="System Administration Console"
        description="National administrative governance hub: Manage users, role permissions, master land records, workflow requests, automated validation health, and tamper-proof audit trails."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'System Administration' }]}
        badge={
          <Badge variant="navy" size="sm">
            National Super Admin
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={refreshAll}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isStatsLoading || isDataLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh Console
            </Button>
          </div>
        }
      />

      {/* Top 6 Real Database Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Users"
          value={isStatsLoading ? '...' : stats.totalUsers.toLocaleString()}
          icon={Users}
          color="navy"
          description={`${stats.activeUsers} Active Accounts`}
        />
        <StatCard
          title="Revenue Officers"
          value={isStatsLoading ? '...' : stats.totalOfficers.toLocaleString()}
          icon={UserCheck}
          color="blue"
          description="Jurisdiction Leads"
        />
        <StatCard
          title="Master Records"
          value={isStatsLoading ? '...' : stats.totalRecords.toLocaleString()}
          icon={Database}
          color="green"
          description="Cadastral Registry"
        />
        <StatCard
          title="Workflow Requests"
          value={isStatsLoading ? '...' : stats.totalRequests.toLocaleString()}
          icon={Clock}
          color="amber"
          description={`${stats.pendingRequests} In Review`}
        />
        <StatCard
          title="Validation Issues"
          value={isStatsLoading ? '...' : stats.unresolvedIssues.toLocaleString()}
          icon={AlertTriangle}
          color="red"
          description="Registry Warnings"
        />
        <StatCard
          title="Audit Ledger"
          value={isStatsLoading ? '...' : stats.totalAuditLogs.toLocaleString()}
          icon={ScrollText}
          color="navy"
          description="Immutable Logs"
        />
      </div>

      {/* Admin Modules Hub */}
      <Card>
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('users');
                setCurrentPage(1);
                setSearchQuery('');
              }}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'border-govnavy-900 text-govnavy-900 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Users className="w-4 h-4 text-govblue-600" />
              <span>User Management</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono font-bold">
                {stats.totalUsers}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('roles');
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'roles'
                  ? 'border-govnavy-900 text-govnavy-900 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Shield className="w-4 h-4 text-govnavy-900" />
              <span>Role Permissions</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('records');
                setCurrentPage(1);
                setSearchQuery('');
              }}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'records'
                  ? 'border-govnavy-900 text-govnavy-900 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Database className="w-4 h-4 text-govgreen-600" />
              <span>Land-Record Oversight</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-green-100 text-green-800 font-mono font-bold">
                {stats.totalRecords}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('requests');
                setCurrentPage(1);
                setSearchQuery('');
              }}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'requests'
                  ? 'border-govnavy-900 text-govnavy-900 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Clock className="w-4 h-4 text-govamber-600" />
              <span>Request Governance</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono font-bold">
                {stats.totalRequests}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('validation');
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'validation'
                  ? 'border-govnavy-900 text-govnavy-900 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-govred-600" />
              <span>Validation Monitoring</span>
              {stats.unresolvedIssues > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-100 text-red-800 font-mono font-bold">
                  {stats.unresolvedIssues}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('audit');
                setCurrentPage(1);
                setSearchQuery('');
              }}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'audit'
                  ? 'border-govnavy-900 text-govnavy-900 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <ScrollText className="w-4 h-4 text-slate-600" />
              <span>Audit Trail Logs</span>
            </button>
          </div>
        </div>

        <CardContent className="p-6">
          {/* ================= 1. USER MANAGEMENT TAB ================= */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-1 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search users by name, email, district..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-govnavy-900"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-govnavy-900"
                  >
                    <option value="">All Roles</option>
                    <option value="REVENUE_OFFICER">Revenue Officer</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="CITIZEN">Citizen</option>
                  </select>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsCreateUserOpen(true)}
                  leftIcon={<UserPlus className="w-4 h-4" />}
                >
                  Create User
                </Button>
              </div>

              {isDataLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-govnavy-900 mb-2" />
                  <p className="text-sm font-medium">Loading user accounts...</p>
                </div>
              ) : usersList.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-700">No Users Found</p>
                  <p className="text-xs text-slate-500 mt-1">Adjust your search or filter parameters.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {usersList.map((usr) => (
                    <div
                      key={usr.id}
                      className="p-4 rounded-lg border border-slate-200 bg-white hover:border-govblue-300 hover:shadow-gov-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{usr.fullName}</span>
                          <Badge
                            variant={
                              usr.role === UserRole.ADMIN
                                ? 'navy'
                                : usr.role === UserRole.REVENUE_OFFICER
                                ? 'info'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {usr.role}
                          </Badge>
                          <Badge variant={usr.isActive ? 'success' : 'danger'} size="sm">
                            {usr.isActive ? 'Active' : 'Suspended'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-0.5">
                          <div>
                            <span className="text-slate-500">Email:</span>{' '}
                            <strong className="text-slate-800">{usr.email}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Jurisdiction:</span>{' '}
                            <strong className="text-slate-800">
                              {usr.jurisdictionDistrict || 'National'} {usr.jurisdictionTehsil ? `(${usr.jurisdictionTehsil})` : ''}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Activity:</span>{' '}
                            <strong className="text-slate-800 font-mono">
                              {usr.metrics.createdRecordsCount} Records • {usr.metrics.auditLogsCount} Logs
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingUser(usr);
                            setEditUserName(usr.fullName);
                            setEditUserPhone(usr.phone || '');
                            setEditUserRole(usr.role);
                            setEditUserDistrict(usr.jurisdictionDistrict || '');
                            setEditUserTehsil(usr.jurisdictionTehsil || '');
                          }}
                          leftIcon={<Edit className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant={usr.isActive ? 'danger' : 'secondary'}
                          onClick={() => handleToggleUserStatus(usr)}
                          disabled={isActionProcessing}
                          leftIcon={<Power className="w-3.5 h-3.5" />}
                        >
                          {usr.isActive ? 'Suspend' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= 2. ROLE MANAGEMENT TAB ================= */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-govnavy-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Role-Based Access Control (RBAC):</strong> Granular capability matrices defining authorized endpoints for Administrators, Revenue Officers (Tehsildars), and Citizens.
                </div>
              </div>

              {isDataLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-govnavy-900 mb-2" />
                  <p className="text-sm font-medium">Loading system roles...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rolesList.map((role) => (
                    <div
                      key={role.id}
                      className="p-5 rounded-lg border border-slate-200 bg-white hover:border-govblue-300 hover:shadow-gov-xs transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-base">{role.name}</span>
                          <Badge variant="navy" size="sm">
                            {role.usersCount} Users
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600">{role.description}</p>

                        <div>
                          <span className="text-xs font-bold text-slate-700 block mb-1.5">
                            Granted Permissions ({role.permissions?.length || 0})
                          </span>
                          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded border border-slate-200">
                            {role.permissions && role.permissions.length > 0 ? (
                              role.permissions.map((perm) => (
                                <span
                                  key={perm}
                                  className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700"
                                >
                                  {perm}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Default role capabilities</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingRole(role);
                            setSelectedPermissions(role.permissions || []);
                            setRoleDescription(role.description || '');
                          }}
                          leftIcon={<Key className="w-3.5 h-3.5" />}
                        >
                          Configure Permissions
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= 3. LAND RECORD OVERSIGHT TAB ================= */}
          {activeTab === 'records' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-1 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search Khasra, ULPIN, Owner, Village..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-govnavy-900"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-govnavy-900"
                  >
                    <option value="">All Statuses</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="PENDING_VERIFICATION">Pending</option>
                    <option value="DISPUTED">Disputed</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              {isDataLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-govnavy-900 mb-2" />
                  <p className="text-sm font-medium">Querying master land records...</p>
                </div>
              ) : recordsList.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Database className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-700">No Records Found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recordsList.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-lg border border-slate-200 bg-white hover:border-govblue-300 hover:shadow-gov-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-govnavy-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {rec.ulpin}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            Khasra #{rec.khasraNumber}
                          </span>
                          <Badge
                            variant={
                              rec.status === RecordStatus.VERIFIED
                                ? 'success'
                                : rec.status === RecordStatus.PENDING_VERIFICATION
                                ? 'warning'
                                : 'danger'
                            }
                            size="sm"
                          >
                            {rec.status}
                          </Badge>
                          {rec.latestValidation && (
                            <Badge
                              variant={rec.latestValidation.isValid ? 'success' : 'danger'}
                              size="sm"
                            >
                              Validation: {rec.latestValidation.score}%
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-0.5">
                          <div>
                            <span className="text-slate-500">Primary Owner:</span>{' '}
                            <strong className="text-slate-800">{rec.primaryOwner || 'N/A'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Location:</span>{' '}
                            <strong className="text-slate-800">
                              {rec.location?.village}, {rec.location?.district}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Area:</span>{' '}
                            <strong className="text-slate-800">
                              {rec.areaInSqMeters?.toLocaleString()} m² ({rec.landType})
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setStatusOverrideRecord(rec);
                            setOverrideStatus(rec.status);
                            setOverrideRemarks('');
                          }}
                          leftIcon={<Edit className="w-3.5 h-3.5" />}
                        >
                          Override Status
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= 4. REQUEST GOVERNANCE TAB ================= */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-1 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search application number, applicant name..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-govnavy-900"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-govnavy-900"
                  >
                    <option value="">All Stages</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {isDataLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-govnavy-900 mb-2" />
                  <p className="text-sm font-medium">Querying citizen requests...</p>
                </div>
              ) : requestsList.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-700">No Workflow Requests Found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requestsList.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-lg border border-slate-200 bg-white hover:border-govblue-300 hover:shadow-gov-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {req.applicationNumber}
                          </span>
                          <Badge variant="navy" size="sm">
                            {req.requestType}
                          </Badge>
                          <Badge
                            variant={
                              req.stage === RequestStage.VERIFIED
                                ? 'success'
                                : req.stage === RequestStage.REJECTED
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {req.stage}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-0.5">
                          <div>
                            <span className="text-slate-500">Applicant:</span>{' '}
                            <strong className="text-slate-800">{req.applicant?.fullName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Assigned Officer:</span>{' '}
                            <strong className="text-slate-800">
                              {req.assignedOfficer ? req.assignedOfficer.fullName : 'Unassigned'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Attached Deeds:</span>{' '}
                            <strong className="text-slate-800 font-mono">
                              {req.documentsCount} Files
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenAssignModal(req)}
                          leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                        >
                          {req.assignedOfficer ? 'Reassign' : 'Assign Officer'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= 5. VALIDATION MONITORING TAB ================= */}
          {activeTab === 'validation' && (
            <div className="space-y-5">
              {validationMetrics && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 text-xs block">Total Validations</span>
                    <span className="text-xl font-bold text-slate-900">{validationMetrics.totalValidations}</span>
                  </div>
                  <div className="p-4 bg-govgreen-50/50 border border-govgreen-200 rounded-lg">
                    <span className="text-govgreen-800 text-xs block">Pass Rate</span>
                    <span className="text-xl font-bold text-govgreen-900">{validationMetrics.passRatePercentage}%</span>
                  </div>
                  <div className="p-4 bg-govred-50/50 border border-govred-200 rounded-lg">
                    <span className="text-govred-800 text-xs block">Critical Issues</span>
                    <span className="text-xl font-bold text-govred-900">{validationMetrics.criticalIssuesCount}</span>
                  </div>
                  <div className="p-4 bg-govamber-50/50 border border-govamber-200 rounded-lg">
                    <span className="text-govamber-800 text-xs block">Warnings</span>
                    <span className="text-xl font-bold text-govamber-900">{validationMetrics.warningIssuesCount}</span>
                  </div>
                </div>
              )}

              {validationMetrics?.topTriggeredRules && validationMetrics.topTriggeredRules.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-2">Most Frequently Triggered Rule Codes</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {validationMetrics.topTriggeredRules.map((r) => (
                      <div key={r.ruleCode} className="p-2.5 bg-white border border-slate-200 rounded flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-800">{r.ruleCode}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-700">
                          {r.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Active Registry Validation Issues</h4>
                {validationIssuesList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No unresolved validation issues.</p>
                ) : (
                  validationIssuesList.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={issue.severity === 'CRITICAL' ? 'danger' : 'warning'} size="sm">
                            {issue.severity}
                          </Badge>
                          <span className="font-mono font-bold text-slate-800">{issue.ruleCode}</span>
                          <span className="font-bold text-slate-900">• {issue.title}</span>
                        </div>
                        <p className="text-slate-600">{issue.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================= 6. AUDIT TRAIL TAB ================= */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search logs by actor, action, entity..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-govnavy-900"
                  />
                </div>
              </div>

              {isDataLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-govnavy-900 mb-2" />
                  <p className="text-sm font-medium">Loading immutable audit logs...</p>
                </div>
              ) : auditLogsList.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <ScrollText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-700">No Audit Logs Found</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {auditLogsList.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
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
                          <span className="font-bold text-slate-800">{log.entityType}</span>
                          <span className="font-mono text-slate-500 text-[11px]">#{log.entityId.slice(0, 8)}</span>
                        </div>
                        <p className="text-slate-600">
                          By <strong className="text-slate-900">{log.actor.fullName}</strong> ({log.actor.roleName}) • IP: {log.ipAddress}
                        </p>
                        {log.snapshotDiff && (
                          <button
                            onClick={() => setViewingAuditLog(log)}
                            className="text-govblue-700 font-semibold hover:underline text-[11px] block mt-0.5"
                          >
                            Inspect Changes Payload
                          </button>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================= MODALS & DIALOGS ================= */}

      {/* 1. Create User Modal */}
      <Dialog
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        title="Create New System Account"
        description="Register a new officer, administrator, or citizen account with specific jurisdiction parameters."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsCreateUserOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateUser}
              disabled={isActionProcessing}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              {isActionProcessing ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="e.g. Ramesh Chandra Meena"
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="officer@bhoomisetu.gov.in"
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Temporary Password *</label>
            <input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Role *</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
              >
                <option value={UserRole.REVENUE_OFFICER}>Revenue Officer</option>
                <option value={UserRole.ADMIN}>Administrator</option>
                <option value={UserRole.CITIZEN}>Citizen</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jurisdiction District</label>
              <input
                type="text"
                value={newUserDistrict}
                onChange={(e) => setNewUserDistrict(e.target.value)}
                placeholder="Jaipur"
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jurisdiction Tehsil</label>
              <input
                type="text"
                value={newUserTehsil}
                onChange={(e) => setNewUserTehsil(e.target.value)}
                placeholder="Sanganer"
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* 2. Edit User Modal */}
      {editingUser && (
        <Dialog
          isOpen={true}
          onClose={() => setEditingUser(null)}
          title={`Edit User Account • ${editingUser.email}`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpdateUser}
                disabled={isActionProcessing}
              >
                Save Changes
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
                >
                  <option value={UserRole.REVENUE_OFFICER}>Revenue Officer</option>
                  <option value={UserRole.ADMIN}>Administrator</option>
                  <option value={UserRole.CITIZEN}>Citizen</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jurisdiction District</label>
                <input
                  type="text"
                  value={editUserDistrict}
                  onChange={(e) => setEditUserDistrict(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jurisdiction Tehsil</label>
                <input
                  type="text"
                  value={editUserTehsil}
                  onChange={(e) => setEditUserTehsil(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
                />
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* 3. Role Permissions Configuration Modal */}
      {editingRole && (
        <Dialog
          isOpen={true}
          onClose={() => setEditingRole(null)}
          title={`Configure Capabilities • Role: ${editingRole.name}`}
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingRole(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveRolePermissions}
                disabled={isActionProcessing}
              >
                Save Role Capabilities
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Role Description</label>
              <input
                type="text"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-2">Enabled Permissions</label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded border border-slate-200">
                {[
                  'RECORDS_CREATE',
                  'RECORDS_UPDATE',
                  'RECORDS_VERIFY',
                  'RECORDS_DELETE',
                  'DOCUMENTS_UPLOAD',
                  'DOCUMENTS_VIEW',
                  'OCR_TRIGGER',
                  'OCR_VERIFY',
                  'VALIDATION_RUN',
                  'VALIDATION_RESOLVE',
                  'CONFLICT_RESOLVE',
                  'WORKFLOW_ASSIGN',
                  'WORKFLOW_APPROVE',
                  'ADMIN_USERS_MANAGE',
                  'ADMIN_AUDIT_VIEW',
                ].map((perm) => {
                  const isChecked = selectedPermissions.includes(perm);
                  return (
                    <label
                      key={perm}
                      className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, perm]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
                          }
                        }}
                        className="rounded text-govnavy-900 focus:ring-govnavy-900"
                      />
                      <span className="font-mono">{perm}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* 4. Status Override Modal */}
      {statusOverrideRecord && (
        <Dialog
          isOpen={true}
          onClose={() => setStatusOverrideRecord(null)}
          title={`Administrative Status Override • Khasra #${statusOverrideRecord.khasraNumber}`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStatusOverrideRecord(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmStatusOverride}
                disabled={isActionProcessing}
              >
                Apply Override
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Status</label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value as RecordStatus)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
              >
                <option value={RecordStatus.VERIFIED}>VERIFIED (Sanctioned)</option>
                <option value={RecordStatus.PENDING_VERIFICATION}>PENDING_VERIFICATION</option>
                <option value={RecordStatus.DISPUTED}>DISPUTED (Flagged)</option>
                <option value={RecordStatus.DRAFT}>DRAFT</option>
                <option value={RecordStatus.ARCHIVED}>ARCHIVED</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Administrative Remarks</label>
              <textarea
                rows={3}
                value={overrideRemarks}
                onChange={(e) => setOverrideRemarks(e.target.value)}
                placeholder="Reason for executive status override..."
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
              />
            </div>
          </div>
        </Dialog>
      )}

      {/* 5. Assign Officer Modal */}
      {assigningRequest && (
        <Dialog
          isOpen={true}
          onClose={() => setAssigningRequest(null)}
          title={`Assign Officer • ${assigningRequest.applicationNumber}`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAssigningRequest(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAssignOfficer}
                disabled={isActionProcessing || !selectedOfficerId}
              >
                Confirm Assignment
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Revenue Officer</label>
              <select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-govnavy-900"
              >
                <option value="">Choose an officer...</option>
                {availableOfficers.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.fullName} ({off.jurisdictionDistrict || 'Jaipur'} - {off.jurisdictionTehsil || 'Sanganer'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Dialog>
      )}

      {/* 6. Audit Diff Viewer Modal */}
      {viewingAuditLog && (
        <Dialog
          isOpen={true}
          onClose={() => setViewingAuditLog(null)}
          title={`Audit Event Payload • ${viewingAuditLog.action}`}
          size="md"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setViewingAuditLog(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-100 rounded font-mono">
              <pre className="whitespace-pre-wrap break-all text-slate-800 text-[11px]">
                {JSON.stringify(viewingAuditLog.snapshotDiff, null, 2)}
              </pre>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
