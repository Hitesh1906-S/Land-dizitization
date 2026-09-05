import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { useToast } from '../../context/ToastContext';
import { FileText, CheckCircle2, XCircle, Sparkles, Eye, ShieldCheck } from 'lucide-react';

export const VerificationQueuePage: React.FC = () => {
  const { showToast } = useToast();
  const [docData, setDocData] = useState({
    id: 'DOC-8821',
    fileName: 'Sale_Deed_Khasra_102_4.pdf',
    khasraNumber: '102/4',
    khatauniNumber: '45-B',
    district: 'Jaipur',
    tehsil: 'Sanganer',
    village: 'Rampur',
    area: '4050',
    owners: 'Ram Kumar Sharma (100% - S/O Mohan Lal)',
    confidenceScore: 94.5,
  });

  const handleApprove = () => {
    showToast(`Record for Khasra ${docData.khasraNumber} has been verified and digitized!`, 'success', 'Verification Approved');
  };

  const handleReject = () => {
    showToast(`Record flagged for discrepancy. Notification dispatched to applicant.`, 'warning', 'Discrepancy Flagged');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Officer Verification Queue"
        description="Compare original scanned deeds with AI-extracted metadata side-by-side, verify surveyor checksums, and approve digital title issuance."
        breadcrumbs={[
          { label: 'Revenue Officer', href: '/officer/dashboard' },
          { label: 'Verification Queue' },
        ]}
        badge={
          <Badge variant="warning" size="sm">
            Pending Audit
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Document Scan Viewer Box */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-govblue-700" />
                <h3 className="text-base font-bold text-slate-900">Original Document Scan</h3>
              </div>
              <span className="font-mono text-xs text-slate-500">{docData.fileName}</span>
            </div>

            <div className="h-96 bg-slate-50 rounded-lg border border-slate-200 p-6 flex flex-col justify-center items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Scanned Jamabandi / Sale Deed</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">SHA-256: 4f8b91a27e3d09c8...</p>
              </div>
              <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                Open Full Resolution PDF
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: AI Extraction & Officer Decision */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-govamber-600" />
                <h3 className="text-base font-bold text-slate-900">AI Extraction Field Audit</h3>
              </div>
              <Badge variant="success" withDot>
                Confidence: {docData.confidenceScore}%
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Khasra Number"
                  value={docData.khasraNumber}
                  onChange={(e) => setDocData({ ...docData, khasraNumber: e.target.value })}
                  required
                />
                <Input
                  label="Khatauni Number"
                  value={docData.khatauniNumber}
                  onChange={(e) => setDocData({ ...docData, khatauniNumber: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="District"
                  value={docData.district}
                  onChange={(e) => setDocData({ ...docData, district: e.target.value })}
                  required
                />
                <Input
                  label="Tehsil"
                  value={docData.tehsil}
                  onChange={(e) => setDocData({ ...docData, tehsil: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Village Name"
                  value={docData.village}
                  onChange={(e) => setDocData({ ...docData, village: e.target.value })}
                  required
                />
                <Input
                  label="Area (sq.meters)"
                  value={docData.area}
                  onChange={(e) => setDocData({ ...docData, area: e.target.value })}
                  type="number"
                  required
                />
              </div>

              <Input
                label="Identified Legal Owners & Shares"
                value={docData.owners}
                onChange={(e) => setDocData({ ...docData, owners: e.target.value })}
                required
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="danger" size="md" onClick={handleReject} leftIcon={<XCircle className="w-4 h-4" />}>
                Flag Discrepancy
              </Button>
              <Button variant="success" size="md" onClick={handleApprove} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                Approve & Digitize Title
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
