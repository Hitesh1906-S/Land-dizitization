import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Users, Server, ShieldCheck, Activity, ScrollText, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System Administration Console"
        description="Monitor system throughput, OCR extraction clusters, jurisdiction officer assignments, and tamper-proof audit trails."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Administrator Console' }]}
        badge={
          <Badge variant="navy" size="sm">
            National Admin Access
          </Badge>
        }
        actions={
          <Link to="/admin/audit-logs">
            <Button size="sm" variant="primary" leftIcon={<ScrollText className="w-4 h-4" />}>
              Audit Trail Logs
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active System Users"
          value="284 Users"
          icon={Users}
          color="navy"
          change="+12"
          changeType="positive"
        />
        <StatCard
          title="OCR Jobs Processed"
          value="1,842 Jobs"
          icon={Cpu}
          color="blue"
          description="Avg latency: 1.4s"
        />
        <StatCard
          title="System Availability"
          value="99.98%"
          icon={Activity}
          color="green"
          badgeText="Operational"
        />
        <StatCard
          title="Security Flags"
          value="0 Issues"
          icon={ShieldCheck}
          color="green"
          description="All checksums valid"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Core Service Integration Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">Database Engine</span>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
              <p className="text-slate-600">SQLite / PostgreSQL + PostGIS Spatial</p>
              <p className="text-[11px] text-slate-500 mt-1">Pool: 10 connections active</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">AI OCR Extraction Engine</span>
                <Badge variant="success" size="sm">Ready</Badge>
              </div>
              <p className="text-slate-600">Gemini 1.5/2.5 Flash Multimodal LLM</p>
              <p className="text-[11px] text-slate-500 mt-1">Bilingual English + Hindi support</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">Spatial Topology Engine</span>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
              <p className="text-slate-600">Turf.js & GeoJSON Cadastral Layer</p>
              <p className="text-[11px] text-slate-500 mt-1">Polygon intersection tolerance: 5m²</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
