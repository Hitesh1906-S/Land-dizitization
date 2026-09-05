import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  MapPin,
  CheckCircle2,
  ArrowRight,
  FileText,
  Lock,
  Search,
  FileCheck,
  Layers,
  Sparkles,
  Cpu,
  Compass,
  AlertTriangle,
  History,
  Check,
  Share2,
  ExternalLink,
  ChevronRight,
  Award,
  Zap,
  CheckCheck,
  Scan,
  RefreshCw,
  Copy,
  Eye,
  Radio
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Navbar } from '../components/layout/Navbar';
import { Badge } from '../components/common/Badge';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* =========================================================================
          HERO SECTION: High-impact gradient backdrop with glowing ambient aura
         ========================================================================= */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-12 sm:pt-20 pb-16 sm:pb-24">
        {/* Subtle decorative grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

        {/* Ambient Radial Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] hero-glow-blue rounded-full pointer-events-none blur-3xl opacity-60" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[450px] hero-glow-emerald rounded-full pointer-events-none blur-3xl opacity-40" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Mission Badge, Headline, Intro, Actions */}
            <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
              {/* Official Mission Badge with subtle pulse */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50/80 backdrop-blur-md text-blue-900 text-xs font-bold tracking-wide shadow-xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-semibold text-blue-900">National Land Record Modernization</span>
                <span className="text-slate-300">•</span>
                <span className="text-blue-700 font-medium">Smart India Hackathon</span>
              </div>

              {/* Dynamic Gradient Headline */}
              <h1 className="text-4xl sm:text-6xl font-black text-slate-900 font-display tracking-tight leading-[1.12]">
                Digitize, Validate & Protect Land Titles with{' '}
                <span className="gradient-text-blue">AI Precision.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                An end-to-end cadastral governance platform. Convert physical registry deeds with multi-lingual OCR, execute 5-tier mathematical rule checks, resolve spatial overlaps, and establish tamper-proof digital title certainty.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-1">
                <Link to="/ocr-scanner">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 px-6"
                    leftIcon={<Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />}
                  >
                    ⚡ Test Live AI OCR Scanner
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="lg"
                    className="bg-govnavy-900 hover:bg-govnavy-950 text-white font-bold shadow-lg shadow-govnavy-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 px-6"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Citizen Portal Access
                  </Button>
                </Link>
                <Link to="/records">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold shadow-xs hover:-translate-y-0.5 transition-all duration-200"
                    leftIcon={<Search className="w-4 h-4 text-govblue-600" />}
                  >
                    Search Registry
                  </Button>
                </Link>
                <Link to="/map">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-blue-50/50 hover:bg-blue-100/50 text-blue-800 border-blue-200 font-semibold hover:-translate-y-0.5 transition-all duration-200"
                    leftIcon={<MapPin className="w-4 h-4 text-blue-600" />}
                  >
                    Cadastral GIS Map
                  </Button>
                </Link>
              </div>

              {/* Key Trust Telemetry Row */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200/80 max-w-lg mx-auto lg:mx-0 text-left">
                <div className="space-y-1">
                  <p className="text-2xl font-extrabold text-slate-900 font-display">100%</p>
                  <p className="text-xs text-slate-500 font-medium">Immutable Audit Trail</p>
                </div>
                <div className="space-y-1 border-l border-slate-200 pl-4">
                  <p className="text-2xl font-extrabold text-govblue-600 font-display">Hybrid</p>
                  <p className="text-xs text-slate-500 font-medium">Multi-Lingual OCR</p>
                </div>
                <div className="space-y-1 border-l border-slate-200 pl-4">
                  <p className="text-2xl font-extrabold text-emerald-600 font-display">GeoJSON</p>
                  <p className="text-xs text-slate-500 font-medium">Interactive Cadastre</p>
                </div>
              </div>
            </div>

            {/* Right Column: Holographic Glassmorphism Dossier Mockup */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Floating ambient glow under card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                
                <div className="relative rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl p-6 sm:p-7 space-y-5">
                  {/* Top Card Badge Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-govnavy-900 text-white flex items-center justify-center font-bold shadow-sm">
                        <Shield className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          AUTHENTICATED CADASTRAL DOSSIER
                        </span>
                        <h3 className="text-base font-bold text-slate-900">Khasra #102/4</h3>
                      </div>
                    </div>
                    <Badge variant="success" size="sm" withDot>
                      Verified Title
                    </Badge>
                  </div>

                  {/* Key Title Details Grid */}
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-medium">ULPIN Identifier:</span>
                      <span className="font-mono font-bold text-govblue-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        RJ-JP-2024-8841
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Primary Titleholder:</span>
                      <span className="font-bold text-slate-900">Harish Chandra S/O Late Ramji</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Jurisdiction:</span>
                      <span className="font-semibold text-slate-800">Rampur, Sanganer (Jaipur)</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Registered Land Area:</span>
                      <span className="font-bold text-slate-900">4,050 sq.m (≈ 1.60 Bigha)</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">SHA-256 Deed Hash:</span>
                      <span className="font-mono text-[11px] text-slate-500 truncate max-w-[170px]">
                        e3b0c44298fc1c149afbf4c8...
                      </span>
                    </div>
                  </div>

                  {/* 5-Point Validation Health Indicator */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <CheckCheck className="w-4 h-4 text-emerald-600" /> Validation Engine Score
                      </span>
                      <span className="font-mono font-extrabold text-sm text-emerald-700">100 / 100</span>
                    </div>
                    <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-600 h-1.5 rounded-full w-full" />
                    </div>
                    <p className="text-[10px] text-emerald-800 leading-tight">
                      ✓ Owner Match • ✓ Area Consistency • ✓ Zero Boundary Overlap • ✓ Deed Authentic
                    </p>
                  </div>

                  {/* Interactive Quick Links inside Card */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <Link to="/map" className="flex-1">
                      <Button size="sm" variant="outline" className="w-full text-xs font-semibold" leftIcon={<MapPin className="w-3.5 h-3.5 text-blue-600" />}>
                        Inspect GIS
                      </Button>
                    </Link>
                    <Link to="/records" className="flex-1">
                      <Button size="sm" variant="secondary" className="w-full text-xs font-semibold" leftIcon={<FileText className="w-3.5 h-3.5 text-slate-600" />}>
                        View Registry
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          LIVE CADASTRAL & OCR TELEMETRY TICKER: Real-world Activity Stream
         ========================================================================= */}
      <section className="bg-slate-900 text-slate-200 py-3.5 border-b border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="uppercase tracking-wider text-[11px] text-white">Live System Cadastral Stream</span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono">
              ONLINE
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 text-slate-300 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              <span>⚡ OCR Extracted Khasra 142/4/1 (Jaipur) • 99.2% Conf</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>🛡️ Officer Sanctioned Mutation #MUT-2024-819</span>
            </span>
            <span className="hidden lg:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>🗺️ GIS Parcel #315 Clashes: 0 Overlaps</span>
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE LIVE AI OCR SCANNER SHOWCASE: Real-Time Extraction
         ========================================================================= */}
      <section className="py-16 sm:py-20 bg-slate-950 text-white relative overflow-hidden border-b border-slate-800">
        <div className="absolute top-1/2 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-10 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                Featured AI Engine Demo
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
                Live Interactive Deed OCR & Entity Extractor
              </h2>
              <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                Switch between historical land registry deeds to see our neural vision engine extract Hindi and Devanagari legal attributes with bounding box accuracy.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/ocr-scanner">
                <Button variant="primary" size="md" className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30">
                  Open Full OCR Sandbox Studio
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive Document Showcase Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Scanned Document Visualizer with Interactive Highlighting */}
            <div className="lg:col-span-6 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Scan className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Live Scanned Deed Visualizer (Rajasthan Registry 1998)
                  </span>
                </div>
                <Badge variant="navy" size="sm">
                  99.2% OCR Confidence
                </Badge>
              </div>

              {/* Scanned Deed Box */}
              <div className="bg-[#fffdf7] text-slate-950 p-5 rounded-xl border border-amber-200/60 font-serif text-xs leading-relaxed relative shadow-inner">
                {/* Visual Header */}
                <div className="text-center border-b-2 border-slate-900/70 pb-2.5 mb-3 font-sans">
                  <div className="text-xs font-black uppercase text-slate-900">
                    कार्यालय उप-पंजीयक, सांगानेर (जयपुर) • पंजीकृत बैनामा विलेख
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                    DEED REF: RJ-JPR-1998-DEED-44812 | बही संख्या १, जिल्द संख्या ८९२
                  </div>
                </div>

                {/* Key Bounding Box Rows */}
                <div className="space-y-2">
                  <div className="p-2 rounded bg-blue-50/80 border border-blue-300 transition-colors">
                    <span className="font-sans font-bold text-[10px] text-blue-900 block">क्रेता / BUYER:</span>
                    <span className="font-semibold text-slate-900 text-xs">
                      श्री रमेश कुमार शर्मा सुपुत्र श्री हरिशंकर शर्मा
                    </span>
                  </div>

                  <div className="p-2 rounded bg-emerald-50/80 border border-emerald-300 transition-colors">
                    <span className="font-sans font-bold text-[10px] text-emerald-900 block">खसरा एवं उप-विभाजन / KHASRA NO:</span>
                    <span className="font-semibold text-slate-900 text-xs">
                      खसरा संख्या १४२/४/१ (नवीन उप-विभाजन 142/4/1-A)
                    </span>
                  </div>

                  <div className="p-2 rounded bg-amber-50/80 border border-amber-300 transition-colors">
                    <span className="font-sans font-bold text-[10px] text-amber-900 block">कुल रकबा / AREA MEASUREMENT:</span>
                    <span className="font-semibold text-slate-900 text-xs">
                      0.8500 हेक्टेयर (८,५०० वर्ग मीटर / ३.३६ बीघा पुख्ता)
                    </span>
                  </div>

                  <div className="p-2 rounded bg-indigo-50/80 border border-indigo-300 transition-colors">
                    <span className="font-sans font-bold text-[10px] text-indigo-900 block">स्थान व मौजा / JURISDICTION:</span>
                    <span className="font-semibold text-slate-900 text-xs">
                      ग्राम: रामपुर खुर्द (हड़बस्त १२८), तहसील: सांगानेर, जिला: जयपुर
                    </span>
                  </div>
                </div>

                {/* Seal */}
                <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-600 font-sans">
                  <span>दिनांक: १४ अप्रैल १९९८ (14-04-1998)</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    ✓ SUB-REGISTRAR AUTHENTICATED
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Extracted Data Key-Value Inspector */}
            <div className="lg:col-span-6 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Real-Time Extracted Attributes (JSON Schema)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  Latency: 184ms
                </span>
              </div>

              {/* Attributes List */}
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Owner</span>
                    <span className="font-bold text-white text-sm">Ramesh Kumar Sharma</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 font-mono text-xs px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                    99.2%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Khasra / Survey Number</span>
                    <span className="font-bold text-white text-sm">142/4/1 (Sub-Division 142/4/1-A)</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 font-mono text-xs px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                    99.8%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Calculated Area</span>
                    <span className="font-bold text-white text-sm">0.8500 Hectares (8,500 sq.m)</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 font-mono text-xs px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                    98.9%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jurisdiction</span>
                    <span className="font-bold text-white text-sm">Rampur Khurd, Sanganer (Jaipur)</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 font-mono text-xs px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                    99.7%
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-between">
                <Link to="/ocr-scanner" className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Try Live OCR with Custom Deeds & Jamabandi →
                </Link>
                <Link to="/citizen/digitize">
                  <Button size="sm" variant="primary" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                    Use in Application
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          KEY CAPABILITIES SHOWCASE: 6 Modern Glassmorphism Feature Cards
         ========================================================================= */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <Badge variant="navy" size="md">
              Enterprise Cadastral Architecture
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              A Complete Operating System for Land Administration
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Built with state-of-the-art security, artificial intelligence, geospatial precision, and deterministic legal validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1: Multi-Lingual OCR */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  AI OCR & Field Extraction
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Extracts 12+ structured attributes (Khasra, Khatauni, Owner, Area, Coordinates) from multi-lingual legacy deeds and scanned documents in Hindi & English.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                <span>Explore OCR Pipeline</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Feature 2: 5-Point Validation Engine */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-xs">
                  <CheckCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  5-Point Validation Engine
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Automated mathematical rule checks for titleholder share fractions (sum = 100%), area discrepancies, spatial boundary clashes, and jurisdiction validity.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>View Validation Rules</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Feature 3: Cadastral GIS & Leaflet Map */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-xs">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Interactive Cadastral GIS
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Vector GeoJSON parcel boundaries linked directly to legal land records with spatial filtering, validation color overlays, and instant side-panel dossier lookup.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                <span>Open GIS Cadastre</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Feature 4: Duplicate & Conflict Resolution */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-xs">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Duplicate & Clashing Detection
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Multi-vector similarity comparisons (Khasra, location, area, owner phonetics) to flag potential title clashes for authorized Revenue Officer adjudication.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
                <span>Learn Dispute Resolver</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Feature 5: Revenue Officer HITL Workbench */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-rose-300 transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-xs">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                  Revenue Officer HITL Console
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Real-time operational dashboard with pending queues, side-by-side OCR verification workstation, field correction tools, and statutory approval workflows.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center text-xs font-bold text-rose-600 group-hover:translate-x-1 transition-transform">
                <span>Access Officer Tools</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Feature 6: Immutable Audit Trail */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-cyan-300 transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300 shadow-xs">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                  Cryptographic Integrity & Audit
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Every mutation, validation, OCR correction, and approval generates a tamper-evident audit ledger with actor role, timestamp, client telemetry, and JSON diffs.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center text-xs font-bold text-cyan-600 group-hover:translate-x-1 transition-transform">
                <span>View Security Governance</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          WORKFLOW PIPELINE: Step-by-Step Interactive Cadastral Lifecycle
         ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Digital Governance Lifecycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              How Physical Deeds Become Certified Digital Titles
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 relative space-y-3 text-center sm:text-left">
              <div className="w-8 h-8 rounded-full bg-govnavy-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                01
              </div>
              <h4 className="text-sm font-bold text-slate-900">Deed Upload</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Citizen or registration clerk uploads scanned title deed. SHA-256 integrity checksum is generated.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 relative space-y-3 text-center sm:text-left">
              <div className="w-8 h-8 rounded-full bg-govblue-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                02
              </div>
              <h4 className="text-sm font-bold text-slate-900">AI OCR Extraction</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Neural vision models parse Khasra, Owner, Area, and Boundary coordinates with confidence scores.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 relative space-y-3 text-center sm:text-left">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                03
              </div>
              <h4 className="text-sm font-bold text-slate-900">Deterministic Validation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Rules engine executes share calculations, spatial topology checks, and duplicate clash detection.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-xl bg-emerald-50/80 border border-emerald-300 relative space-y-3 text-center sm:text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                04
              </div>
              <h4 className="text-sm font-bold text-emerald-950">Tehsildar Sanction</h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Revenue Officer audits flags, sanctions mutation, and publishes verified parcel to Cadastral GIS.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          CALL TO ACTION & FOOTER
         ========================================================================= */}
      <section className="bg-govnavy-950 text-white py-16 relative overflow-hidden">
        {/* Ambient glow in dark banner */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/15 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center space-y-6">
          <Badge variant="navy" size="md">
            National Land Records Modernization Mission
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
            Transform Land Administration with Transparent Certainty.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Experience the unified platform for citizens, survey cartographers, tehsildars, and district magistrates.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            <Link to="/register">
              <Button size="lg" variant="primary" className="bg-blue-600 hover:bg-blue-500 font-bold px-8 shadow-glow-blue">
                Create Free Citizen Account
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 font-semibold">
                Officer / Admin Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Official Government Footer */}
      <footer className="bg-govnavy-900 text-slate-400 text-xs py-8 border-t border-govnavy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-slate-200 font-bold">BhoomiSetu Platform</span>
            <span>• Government Land Record Digitization</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/records" className="hover:text-white transition-colors">Registry Search</Link>
            <Link to="/map" className="hover:text-white transition-colors">Cadastral GIS</Link>
            <Link to="/login" className="hover:text-white transition-colors">Secure Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
