import React, { useState } from 'react';
import { FileText, CheckCircle2, XCircle, Sparkles, Shield, Eye } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const VerificationQueuePage: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<any>({
    id: 'DOC-8821',
    fileName: 'Sale_Deed_Khasra_102_4.pdf',
    khasraNumber: '102/4',
    khatauniNumber: '45-B',
    district: 'Jaipur',
    village: 'Rampur',
    area: 4050,
    owners: 'Ram Kumar Sharma (100%)',
    confidenceScore: 94.5,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Officer Verification Queue</h1>
        <p className="text-sm text-slate-400 mt-1">
          Side-by-side OCR audit inspection and verification approvals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Document Scanned Image Mock / Preview */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Document Scan Preview
            </h3>
            <span className="text-xs font-mono text-slate-400">{selectedDoc.fileName}</span>
          </div>

          <div className="h-96 bg-slate-900/90 rounded-xl border border-slate-800 p-6 flex flex-col justify-center items-center text-center space-y-3">
            <FileText className="w-16 h-16 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">Scanned Jamabandi / Registered Deed</p>
            <p className="text-xs text-slate-500 font-mono">SHA-256: 4f8b91a27e3d09c8...</p>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-1.5" />
              Open Full Resolution PDF
            </Button>
          </div>
        </div>

        {/* Right Column: AI Extraction & Officer Decision */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Extracted Data Audit
            </h3>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Score: {selectedDoc.confidenceScore}%
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Khasra Number</label>
                <input
                  type="text"
                  defaultValue={selectedDoc.khasraNumber}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Khatauni Number</label>
                <input
                  type="text"
                  defaultValue={selectedDoc.khatauniNumber}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">District / Tehsil</label>
                <input
                  type="text"
                  defaultValue={`${selectedDoc.district} / Sanganer`}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Area (sq.meters)</label>
                <input
                  type="text"
                  defaultValue={selectedDoc.area}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Identified Owners</label>
              <input
                type="text"
                defaultValue={selectedDoc.owners}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <Button variant="danger" size="md">
              <XCircle className="w-4 h-4 mr-1.5" />
              Reject / Flag Anomaly
            </Button>
            <Button variant="primary" size="md">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Approve & Digitize Title
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
