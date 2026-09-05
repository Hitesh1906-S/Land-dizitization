import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@land-digitization/shared';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Shield } from 'lucide-react';

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

// Protected Route Guard with Role Verification & Loading State
export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-700">
        <div className="w-12 h-12 rounded-lg bg-govnavy-900 text-white flex items-center justify-center shadow-gov-md animate-pulse mb-4">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <div className="w-4 h-4 rounded-full border-2 border-govblue-600 border-t-transparent animate-spin" />
          <span>Verifying Government Session Credentials...</span>
        </div>
        <p className="text-xs text-slate-500 mt-1 font-medium">BhoomiSetu National Digital Land Registry</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's assigned dashboard based on real authenticated role
    if (user.role === UserRole.REVENUE_OFFICER) {
      return <Navigate to="/officer/dashboard" replace />;
    } else if (user.role === UserRole.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/citizen/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// Guest-only Route (Redirects authenticated users to their dashboard)
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (user) {
    if (user.role === UserRole.REVENUE_OFFICER) {
      return <Navigate to="/officer/dashboard" replace />;
    } else if (user.role === UserRole.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/citizen/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

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
