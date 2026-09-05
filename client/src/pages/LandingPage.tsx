import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, MapPin, CheckCircle2, ArrowRight, FileText, Lock, Layers } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Navbar } from '../components/layout/Navbar';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Smart India Hackathon Initiative
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Intelligent Land Record <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Digitization & Validation
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed">
              Transform legacy paper records into verified, tamper-proof, and spatially geo-referenced cadastral parcels with AI-assisted OCR, mathematical rule engines, and automated conflict detection.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="shadow-emerald-900/50">
                  Get Started as Citizen
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/map">
                <Button variant="secondary" size="lg">
                  <MapPin className="w-5 h-5 mr-2 text-emerald-400" />
                  Explore Cadastral GIS
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars / Feature Grid */}
      <section className="py-16 border-t border-slate-900 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI-Powered OCR Extraction</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Ingest scanned Jamabandi and 7/12 extracts in vernacular scripts with automatic key-value parsing, confidence scoring, and cryptographic hashing.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multi-Tier Validation Engine</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Automated mathematical share sum verification, survey area tolerance tests, and spatial overlap collision detection.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Role-Based Mutation Workflows</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Transparent multi-stage mutation approval lifecycle for Citizens, Revenue Officers, and Administrators with full audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
