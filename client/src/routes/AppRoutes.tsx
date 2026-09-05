import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@land-digitization/shared';
import { DashboardLayout } from '../components/layout/DashboardLayout';

// Pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { CitizenDashboard } from '../pages/citizen/CitizenDashboard';
import { MyRecordsPage } from '../pages/citizen/MyRecordsPage';
import { DigitizeWizardPage } from '../pages/citizen/DigitizeWizardPage';
import { RequestsPage } from '../pages/citizen/RequestsPage';
import { OfficerDashboard } from '../pages/officer/OfficerDashboard';
import { VerificationQueuePage } from '../pages/officer/VerificationQueuePage';
import { ConflictResolverPage } from '../pages/officer/ConflictResolverPage';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';
import { RecordDirectoryPage } from '../pages/records/RecordDirectoryPage';
import { RecordDetailPage } from '../pages/records/RecordDetailPage';
import { CadastralMapPage } from '../pages/records/CadastralMapPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-emerald-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated Dashboard Pages wrapped in DashboardLayout */}
      <Route element={<DashboardLayout />}>
        {/* Public/Shared Directory & Maps */}
        <Route path="/records" element={<RecordDirectoryPage />} />
        <Route path="/records/:id" element={<RecordDetailPage />} />
        <Route path="/map" element={<CadastralMapPage />} />

        {/* Citizen Portal Routes */}
        <Route
          path="/citizen/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.CITIZEN, UserRole.ADMIN]}>
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/my-records"
          element={
            <ProtectedRoute allowedRoles={[UserRole.CITIZEN, UserRole.ADMIN]}>
              <MyRecordsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/digitize"
          element={
            <ProtectedRoute allowedRoles={[UserRole.CITIZEN, UserRole.ADMIN]}>
              <DigitizeWizardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/requests"
          element={
            <ProtectedRoute>
              <RequestsPage />
            </ProtectedRoute>
          }
        />

        {/* Officer Portal Routes */}
        <Route
          path="/officer/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.REVENUE_OFFICER, UserRole.ADMIN]}>
              <OfficerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/verification-queue"
          element={
            <ProtectedRoute allowedRoles={[UserRole.REVENUE_OFFICER, UserRole.ADMIN]}>
              <VerificationQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/conflicts"
          element={
            <ProtectedRoute allowedRoles={[UserRole.REVENUE_OFFICER, UserRole.ADMIN]}>
              <ConflictResolverPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Portal Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.REVENUE_OFFICER]}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
