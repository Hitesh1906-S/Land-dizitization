import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, MapPin, CheckCircle2, ArrowRight, FileText, Lock, Search, FileCheck, Layers } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Navbar } from '../components/layout/Navbar';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-govblue-200 bg-govblue-50 text-govblue-900 text-xs font-semibold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-govblue-700" />
                Ministry of Rural Development & Land Resources
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Intelligent Land Record Digitization & Validation
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                National cadastral platform for transparent deed digitization, AI-powered multi-lingual OCR extraction, automated mathematical rule validation, and spatial overlap conflict resolution.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/register">
                  <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Citizen Portal Access
                  </Button>
                </Link>
                <Link to="/records">
                  <Button variant="secondary" size="lg" leftIcon={<Search className="w-4 h-4 text-slate-500" />}>
                    Search Land Registry
                  </Button>
                </Link>
                <Link to="/map">
                  <Button variant="outline" size="lg" leftIcon={<MapPin className="w-4 h-4 text-govblue-600" />}>
                    Cadastral GIS Map
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 max-w-lg text-xs">
                <div>
                  <p className="text-lg font-bold text-slate-900">100%</p>
                  <p className="text-slate-500 font-medium mt-0.5">Tamper-Proof Audit</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">Multi-Lingual</p>
                  <p className="text-slate-500 font-medium mt-0.5">OCR AI Extraction</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">Geo-Referenced</p>
                  <p className="text-slate-500 font-medium mt-0.5">Cadastral Parcels</p>
                </div>
              </div>
            </div>

            {/* Right Side Cadastral Summary Box */}
            <div className="lg:col-span-5">
              <Card className="p-6 border-slate-300 shadow-gov-md bg-white">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      SAMPLE DIGITAL RECORD
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">Khasra No 102/4</h3>
                  </div>
                  <Badge variant="success" withDot>
                    Verified Title
                  </Badge>
                </div>

                <div className="py-4 space-y-3 text-xs border-b border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ULPIN Code:</span>
                    <span className="font-mono font-bold text-govblue-700">RJ-JP-2024-8841</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jurisdiction:</span>
                    <span className="font-semibold text-slate-800">Rampur, Sanganer (Jaipur)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registered Area:</span>
                    <span className="font-semibold text-slate-800">4,050 sq.meters (1.0 Acre)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SHA-256 Checksum:</span>
                    <span className="font-mono text-[11px] text-slate-600 truncate max-w-[170px]">
                      4f8b91a27e3d09c8...
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-govgreen-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Spatial Boundary Match
                  </span>
                  <Link to="/map">
                    <Button variant="secondary" size="sm">
                      Inspect
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core System Pillars */}
      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-slate-900">National Land Record Digital Infrastructure</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
            Designed for high security, accessibility, multi-tier officer audits, and seamless public service delivery
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="w-10 h-10 rounded-md bg-govnavy-50 text-govnavy-900 border border-govnavy-200 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">1. AI Multimodal OCR Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automated ingestion of legacy Jamabandi, 7/12 extracts, and sale deeds with bilingual key-value extraction, confidence scores, and tamper-proof SHA-256 hashing.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-md bg-govgreen-50 text-govgreen-800 border border-govgreen-200 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">2. Multi-Tier Rule Validation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Syntactic surveyor checks, owner share arithmetic sum verification (100%), deed-to-GIS area deviation testing, and automatic spatial boundary overlap detection.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-md bg-govblue-50 text-govblue-800 border border-govblue-200 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">3. Role-Based Governance</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Distinct jurisdictional workspaces for Citizens, Revenue Officers, and Administrators with immutable audit logs and complete mutation lifecycle tracking.
            </p>
          </Card>
        </div>
      </section>

      {/* Official Footer */}
      <footer className="bg-govnavy-950 text-slate-400 text-xs py-8 border-t border-govnavy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-sm">BhoomiSetu — Digital Land Governance Portal</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Developed for Smart India Hackathon • Department of Land Resources
            </p>
          </div>
          <div className="flex gap-6 text-[11px]">
            <Link to="/records" className="hover:text-white transition-colors">
              Land Records Directory
            </Link>
            <Link to="/map" className="hover:text-white transition-colors">
              Cadastral Map
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Staff Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
