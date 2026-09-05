import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Shield, MapPin, GitPullRequest, FileCheck, PlusCircle, Search, ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RecordStatus, WorkflowStage } from '@land-digitization/shared';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Official Page Header */}
      <PageHeader
        title={`Citizen Services Dashboard`}
        description={`Welcome, ${user?.fullName || 'Citizen'}. Review your verified cadastral holdings, track mutation applications, and digitize legacy deeds.`}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Citizen Portal' }]}
        badge={
          <Badge variant="navy" size="sm">
            Citizen Profile
          </Badge>
        }
        actions={
          <>
            <Link to="/citizen/digitize">
              <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Digitize Land Deed
              </Button>
            </Link>
            <Link to="/records">
              <Button size="sm" variant="secondary" leftIcon={<Search className="w-4 h-4" />}>
                Public Search
              </Button>
            </Link>
          </>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Verified Titles"
          value="1 Parcel"
          icon={Shield}
          color="green"
          badgeText="100% Verified"
        />
        <StatCard
          title="Total Registered Area"
          value="4,050 sq.m"
          description="1.00 Acre (Agricultural)"
          icon={MapPin}
          color="blue"
        />
        <StatCard
          title="Active Applications"
          value="1 Filing"
          icon={GitPullRequest}
          color="amber"
          description="Under Officer Audit"
        />
        <StatCard
          title="Digitized Certificates"
          value="2 Documents"
          icon={FileCheck}
          color="navy"
          description="SHA-256 Verified"
        />
      </div>

      {/* Main Content 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Registered Land Records */}
        <Card>
          <CardHeader>
            <CardTitle>My Land Holdings</CardTitle>
            <Link to="/citizen/my-records">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View Details
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-govblue-800 bg-govblue-50 px-2.5 py-0.5 rounded border border-govblue-200">
                  ULPIN: RJ-JP-2024-8841
                </span>
                <StatusBadge status={RecordStatus.VERIFIED} />
              </div>
              <p className="text-sm font-bold text-slate-900">Khasra No 102/4 • Rampur Village</p>
              <p className="text-xs text-slate-500 mt-0.5">Tehsil: Sanganer • District: Jaipur</p>
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Area: <strong className="text-slate-900">4,050 sq.m</strong></span>
                <span className="text-slate-600">Share: <strong className="text-slate-900">100%</strong></span>
                <Link to="/map" className="text-govblue-600 font-semibold hover:underline">
                  View GIS Map →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Application Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Application Pipeline</CardTitle>
            <Link to="/citizen/requests">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Track All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-slate-700">
                  MUT-2026-928104
                </span>
                <StatusBadge status={WorkflowStage.DOCUMENT_VERIFICATION} />
              </div>
              <p className="text-sm font-semibold text-slate-900">Sale Deed Title Transfer</p>
              <p className="text-xs text-slate-500 mt-0.5">Target: Khasra 102/4 • Rampur</p>
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-1">
                  <span>Current Stage: Document Verification</span>
                  <span>Step 2 of 4</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-govamber-600 h-1.5 rounded-full w-1/2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
